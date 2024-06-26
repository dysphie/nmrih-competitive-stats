import pool from './database.js'

// TODO: make <resource>_id be returned as just <resource>
// TODO: Review usage or missing usage of getConnection

const disableAllTiers = async () => {
  await pool.query('UPDATE map_tier SET enabled = FALSE')
}

const disableAllMutators = async () => {
  await pool.query('UPDATE mutator SET enabled = FALSE')
}

const disableAllMaps = async () => {
  await pool.query('UPDATE map SET enabled = FALSE')
}

const dropAllTables = async () => {
  const db = await pool.getConnection()
  try {
    await db.beginTransaction()

    // drop views
    await db.execute('DROP VIEW IF EXISTS leaderboard_kills')
    await db.execute('DROP VIEW IF EXISTS leaderboard_kdr')
    await db.execute('DROP VIEW IF EXISTS leaderboard_exp')

    // drop tables with dependencies first
    await db.execute('DROP TABLE IF EXISTS npc_kill')
    await db.execute('DROP TABLE IF EXISTS round_mutator')
    await db.execute('DROP TABLE IF EXISTS map_mutator')
    await db.execute('DROP TABLE IF EXISTS performance')
    await db.execute('DROP TABLE IF EXISTS round')

    // drop other tables
    await db.execute('DROP TABLE IF EXISTS mutator_cvar')
    await db.execute('DROP TABLE IF EXISTS mutator')
    await db.execute('DROP TABLE IF EXISTS map')
    await db.execute('DROP TABLE IF EXISTS map_tier')
    await db.execute('DROP TABLE IF EXISTS player')

    await db.commit()
  } catch (error) {
    await db.rollback()
    throw error
  } finally {
    db.release()
  }
}

const createTables = async () => {
  const db = await pool.getConnection()
  try {
    await db.beginTransaction()

    await db.execute(`
      CREATE TABLE IF NOT EXISTS player (
        id INT AUTO_INCREMENT PRIMARY KEY,
        steam_id BIGINT NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL
      )
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS map_tier (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        points INT NOT NULL CHECK (points >= 0),
        enabled BOOLEAN DEFAULT TRUE NOT NULL
      );
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS mutator (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        enabled BOOLEAN DEFAULT TRUE NOT NULL,
        points_multiplier DOUBLE NOT NULL
      );
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS map (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        tier_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tier_id) REFERENCES map_tier(id),
        enabled BOOLEAN DEFAULT TRUE NOT NULL
      );
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS mutator_cvar (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mutator_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        value VARCHAR(255) NOT NULL,
        FOREIGN KEY (mutator_id) REFERENCES mutator(id)
      );
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS round (
        id INT AUTO_INCREMENT PRIMARY KEY,
        map_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (map_id) REFERENCES map(id)
      );
    `)

    // TODO: review end_reason, disallow 'extracted' when extraction_time is null, etc
    await db.execute(`
      CREATE TABLE IF NOT EXISTS performance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        player_id INT NOT NULL,
        round_id INT NOT NULL,
        end_reason ENUM('extracted', 'disconnected', 'team_eliminated', 'extraction_missed'),
        kills INT NOT NULL DEFAULT 0,
        deaths INT NOT NULL DEFAULT 0,
        damage_taken INT NOT NULL DEFAULT 0,
        extraction_time DOUBLE,
        presence DOUBLE NOT NULL,
        exp_earned DOUBLE NOT NULL,
        FOREIGN KEY (round_id) REFERENCES round(id),
        FOREIGN KEY (player_id) REFERENCES player(id),
        UNIQUE (player_id, round_id)
      );
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS map_mutator (
        id INT AUTO_INCREMENT PRIMARY KEY,
        map_id INT NOT NULL,
        mutator_id INT NOT NULL,
        FOREIGN KEY (map_id) REFERENCES map(id),
        FOREIGN KEY (mutator_id) REFERENCES mutator(id),
        UNIQUE (map_id, mutator_id)
      );
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS round_mutator (
        id INT AUTO_INCREMENT PRIMARY KEY,
        round_id INT NOT NULL,
        mutator_id INT NOT NULL,
        FOREIGN KEY (round_id) REFERENCES round(id),
        FOREIGN KEY (mutator_id) REFERENCES mutator(id),
        UNIQUE (round_id, mutator_id)
      );
    `)

    // await db.execute(`
    //   CREATE TABLE IF NOT EXISTS badge (
    //     id INT AUTO_INCREMENT PRIMARY KEY,
    //     name VARCHAR(255) NOT NULL,
    //     points_required INT NOT NULL
    //   );
    // `)

    // todo: weapon_id as foreign ref
    await db.execute(`
      CREATE TABLE IF NOT EXISTS npc_kill (
        player_id INT NOT NULL,
        npc_type INT NOT NULL,
        hitgroup INT NOT NULL,
        weapon_id INT NOT NULL,
        performance_id INT NOT NULL,
        FOREIGN KEY (performance_id) REFERENCES performance(id),
        FOREIGN KEY (player_id) REFERENCES player(id)
      );
    `)

    await db.execute(`
      CREATE VIEW IF NOT EXISTS leaderboard_kills AS
      SELECT p.id AS player_id, p.name AS player_name, SUM(kills) AS total_kills,
        ROW_NUMBER() OVER (ORDER BY SUM(kills) DESC) AS rank
      FROM performance perf
      INNER JOIN player p ON perf.player_id = p.id
      GROUP BY perf.player_id
      ORDER BY total_kills DESC;
    `)

    await db.execute(`
      CREATE VIEW IF NOT EXISTS leaderboard_kdr AS
      SELECT p.id AS player_id, p.name AS player_name,
        IF(SUM(deaths) = 0, SUM(kills), SUM(kills) / SUM(deaths)) AS kd_ratio,
        ROW_NUMBER() OVER (ORDER BY IF(SUM(deaths) = 0, SUM(kills), SUM(kills) / SUM(deaths)) DESC) AS rank
      FROM performance perf
      INNER JOIN player p ON perf.player_id = p.id
      GROUP BY perf.player_id
      ORDER BY kd_ratio DESC;
    `)

    await db.execute(`
      CREATE VIEW IF NOT EXISTS leaderboard_exp AS
      SELECT p.id AS player_id, p.name AS player_name, SUM(exp_earned) AS total_exp,
        ROW_NUMBER() OVER (ORDER BY SUM(exp_earned) DESC) AS rank
      FROM performance perf
      INNER JOIN player p ON perf.player_id = p.id
      GROUP BY perf.player_id
      ORDER BY total_exp DESC;
    `)

    await db.commit()
  } catch (error) {
    await db.rollback()
    throw error
  } finally {
    db.release()
  }
}

// FIXME: this is missing the 'mutators' field returned by getRound
const getRounds = async (limit = 10, offset = 0, ascending = true, playerId = null, mapId = null) => {
  const conn = await pool.getConnection()
  let rounds, performances, mutators

  try {
    const queryParams = []
    let query = `
      SELECT 
        r.id, r.map_id, r.created_at, 
        m.name AS map_name
      FROM 
        round AS r
      JOIN 
        map AS m ON r.map_id = m.id
      JOIN
        performance AS p ON r.id = p.round_id`

    query += ' WHERE 1=1'

    if (playerId !== null) {
      query += ' AND p.player_id = ?'
      queryParams.push(playerId)
    }

    if (mapId !== null) {
      query += ' AND m.id = ?'
      queryParams.push(mapId)
    }

    query += ' ORDER BY r.created_at ' + (ascending ? 'ASC' : 'DESC')

    query += ' LIMIT ? OFFSET ?'
    queryParams.push(limit, offset);

    [rounds] = await conn.query(query, queryParams)

    if (rounds.length < 1) return {}

    const roundIds = rounds.map(r => r.id);

    [performances] = await conn.query(`
      SELECT 
        p.*, 
        pl.name AS player_name,
        pl.id AS player_id
      FROM 
        performance AS p
      JOIN 
        player AS pl ON p.player_id = pl.id
      WHERE
        p.round_id IN (?)
    `, [roundIds]);

    // Fetch mutators for each round
    [mutators] = await conn.query(`
      SELECT 
        rm.round_id,
        mu.id, 
        mu.name
      FROM 
        round_mutator AS rm
      JOIN 
        mutator AS mu ON rm.mutator_id = mu.id
      WHERE
        rm.round_id IN (?)
    `, [roundIds])
  } finally {
    conn.release()
  }

  const history = rounds.reduce((acc, round) => {
    acc.set(round.id, {
      id: round.id,
      created_at: round.created_at,
      map: { id: round.map_id, name: round.map_name },
      performances: [],
      mutators: []
    })
    return acc
  }, new Map())

  performances.forEach(performance => {
    const roundData = history.get(performance.round_id)
    if (!roundData) {
      console.error(`Got performance for uncollected round ID ${performance.round_id}`)
      return
    }
    roundData.performances.push({
      id: performance.id,
      kills: performance.kills,
      deaths: performance.deaths,
      end_reason: performance.end_reason,
      damage_taken: performance.damage_taken,
      extraction_time: performance.extraction_time,
      presence: performance.presence,
      player: { id: performance.player_id, name: performance.player_name }
    })
  })

  mutators.forEach(mutator => {
    const roundData = history.get(mutator.round_id)
    if (!roundData) {
      console.error(`Got mutator for uncollected round ID ${mutator.round_id}`)
      return
    }
    roundData.mutators.push({
      id: mutator.id,
      name: mutator.name
    })
  })

  return [...history.values()]
}

const searchPlayers = async (searchTerm) => {
  let query = 'SELECT id, name FROM player'
  const params = []

  if (searchTerm) {
    query += ' WHERE name LIKE ?'
    params.push(`%${searchTerm}%`)
  }

  query += ' LIMIT 50;'

  const [players] = await pool.query(query, params)
  return players
}

const getPlayer = async (id) => {
  const [players] = await pool.query('SELECT * FROM player WHERE id = ? LIMIT 1;', [id])
  return players.length > 0 ? players[0] : null
}

const registerRound = async (mapId, mutators) => {
  const db = await pool.getConnection()
  try {
    await db.beginTransaction()
    const [round] = await db.execute('INSERT INTO round (map_id) VALUES (?);', [mapId])
    const roundId = round.insertId

    // TODO: Consider ditching normalization here and storing mutator IDs as an array in round.
    // Enables quick search of rounds with identical mutators but compromises referential integrity

    for (const mutatorId of mutators) {
      await db.execute('INSERT INTO round_mutator (round_id, mutator_id) VALUES (?, ?)', [roundId, mutatorId])
    }

    await db.commit()
    return roundId
  } catch (error) {
    await db.rollback()
    throw error
  } finally {
    db.release()
  }
}

const registerTier = async (name, points) => {
  const [tier] = await pool.query('INSERT INTO map_tier (name, points) VALUES (?, ?);', [name, points])
  return tier.insertId
}

const registerPlayer = async (steamId, name) => {
  const [player] = await pool.query('INSERT INTO player (steam_id, name) VALUES (?, ?)', [steamId, name])
  return player.insertId
}

const registerMap = async (name, tierName, mutatorNames = []) => {
  const db = await pool.getConnection()

  try {
    await db.beginTransaction()

    const [tiers] = await db.execute(
      'SELECT id FROM map_tier WHERE name = ? LIMIT 1;',
      [tierName]
    )

    if (tiers.length < 1) throw new Error('Invalid tier ' + tierName)
    const tierId = tiers[0].id

    const [{ insertId: mapId }] = await db.execute(
      'INSERT INTO map (name, tier_id) VALUES (?, ?)',
      [name, tierId]
    )

    for (const mutatorName of mutatorNames) {
      const [[{ id: mutatorId }]] = await db.execute(
        'SELECT id FROM mutator WHERE name = ? LIMIT 1;',
        [mutatorName]
      )

      await db.execute(
        'INSERT INTO map_mutator (map_id, mutator_id) VALUES (?, ?)',
        [mapId, mutatorId]
      )
    }

    await db.commit()
    return mapId
  } catch (error) {
    await db.rollback()
    throw error
  } finally {
    db.release()
  }
}

const deleteMap = async (id) => {
  const db = await pool.getConnection()
  try {
    await db.beginTransaction()

    const [mutators] = await db.execute('DELETE FROM map_mutator WHERE map_id = ?', [id])
    const [maps] = await db.execute('DELETE FROM map WHERE id = ?', [id])

    const deletedRows = mutators.affectedRows + maps.affectedRows

    await db.commit()

    return deletedRows > 0
  } catch (error) {
    await db.rollback()
    throw error
  } finally {
    db.release()
  }
}

const updateMap = async (id, name, tierName) => {
  const db = await pool.getConnection()
  try {
    await db.beginTransaction()

    if (tierName) {
      const [tiers] = await db.execute('SELECT id FROM map_tier WHERE name = ? LIMIT 1;', [tierName])
      if (!tiers || tiers.length < 1) throw new Error('Invalid tier ' + tierName)
      const tierId = tiers[0].id
      await db.execute('UPDATE map SET tier_id = ? WHERE id = ?', [tierId, id])
    }

    if (name) {
      await db.execute('UPDATE map SET name = ? WHERE id = ?', [name, id])
    }

    await db.commit()
  } catch (error) {
    await db.rollback()
    throw error
  } finally {
    db.release()
  }
}

const registerPerformance = async (playerId, roundId, endReason, kills, deaths, damageTaken, extractionTime, presence, expEarned) => {
  const [performance] = await pool.query(`
    INSERT INTO performance 
    (player_id, round_id, end_reason, kills, deaths, damage_taken, extraction_time, presence, exp_earned) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [playerId, roundId, endReason, kills, deaths, damageTaken, extractionTime, presence, expEarned])

  return performance.insertId
}

const registerMutator = async (name, pointsMultiplier, cvars = [], supportedMaps = [], unsupportedMaps = []) => {
  const db = await pool.getConnection()
  try {
    await db.beginTransaction()
    const [mutator] = await db.execute('INSERT INTO mutator (name, points_multiplier) VALUES (?, ?)', [name, pointsMultiplier])
    const mutatorId = mutator.insertId

    for (const cvar of cvars) {
      await db.execute('INSERT INTO mutator_cvar (mutator_id, name, value) VALUES (?, ?, ?)', [mutatorId, cvar.name, cvar.value])
    }

    await db.commit()
    return mutatorId
  } catch (error) {
    await db.rollback()
    throw error
  } finally {
    db.release()
  }
}

const registerKills = async (performanceId, kills) => {
  const db = await pool.getConnection()
  try {
    await db.beginTransaction()

    for (const kill of kills) {
      await db.execute('INSERT INTO npc_kill (performance_id, player_id, npc_type, hitgroup, weapon_id) VALUES (?, ?, ?, ?, ?)', [performanceId, kill.player, kill.npc_type, kill.hitgroup, kill.weapon])
    }

    await db.commit()
  } catch (error) {
    await db.rollback()
    throw error
  } finally {
    db.release()
  }
}

const getKills = async (playerId) => {
  const [kills] = await pool.query(`
    SELECT weapon_id AS weapon, COUNT(*) AS kill_count 
      FROM npc_kill 
      WHERE player_id = ? 
      GROUP BY weapon_id 
      ORDER BY kill_count DESC`, [playerId])
  return kills
}

const getKillDeathRatio = async (playerId) => {
  const result = await pool.query(
    `SELECT SUM(kills) AS total_kills, SUM(deaths) AS total_deaths 
      FROM performance WHERE player_id = ?`,
    [playerId]
  )

  const totalKills = result[0].total_kills || 0
  const totalDeaths = result[0].total_deaths || 0
  return totalDeaths === 0 ? totalKills : totalKills / totalDeaths
}

const getTiers = async () => {
  const [rows] = await pool.query('SELECT * FROM map_tier')
  return rows
}

const getMutators = async () => {
  const [mutators] = await pool.query('SELECT id, name, points_multiplier FROM mutator;')
  return mutators
}

const getMap = async (id) => {
  const [maps] = await pool.query('SELECT * FROM map WHERE id = ? LIMIT 1;', [id])
  if (maps.length === 0) return null

  const map = maps[0]

  // fetch associated mutators
  const [mutators] = await pool.query(`
    SELECT m.id, m.name
    FROM map_mutator AS mm
    JOIN mutator AS m ON mm.mutator_id = m.id
    WHERE mm.map_id = ?
  `, [id])

  map.mutators = mutators

  return map
}

const getMutator = async (id) => {
  const [mutators] = await pool.query('SELECT * FROM mutator WHERE id = ? LIMIT 1;', [id])
  const result = mutators.length > 0 ? mutators[0] : null
  return result
}

const searchMaps = async (searchTerm) => {
  let query = 'SELECT * FROM map'
  const params = []

  if (searchTerm) {
    query += ' WHERE name LIKE ?'
    params.push(`%${searchTerm}%`) // TODO: review, safe?
  }

  query += ' LIMIT 50;'

  const [maps] = await pool.query(query, params)
  return maps
}

const getPerformance = async (id) => {
  const [performances] = await pool.query('SELECT * FROM performance WHERE id = ? LIMIT 1;', [id])
  return performances.length > 0 ? performances[0] : null
}

const searchPerformances = async (mutatorIds = []) => {
  const [performances] = await pool.query(`
    SELECT p.*
    FROM performance p
    JOIN round_mutator rm ON p.round_id = rm.round_id
    WHERE rm.mutator_id IN ?
    GROUP BY p.id
    HAVING COUNT(rm.mutator_id) = ?;
  `, [[mutatorIds], mutatorIds.length])

  return performances
}

const getLeaderboardAroundPlayer = async (type, playerId, radius) => {
  const [rank] = await pool.query('SELECT rank FROM ?? WHERE player_id = ?', ['leaderboard_' + type, playerId])

  const [leaderboard] = await pool.query(`
    SELECT *
    FROM ?
    WHERE rank BETWEEN ? - ? AND ? + ?
    ORDER BY rank;
  `, [type, rank.rank, radius, rank.rank, radius])

  return leaderboard
}

const getLeaderboard = async (type, limit, offset) => {
  const [leaderboard] = await pool.query('SELECT * FROM ?? LIMIT ? OFFSET ?', ['leaderboard_' + type, limit, offset])
  return leaderboard
}

const getRound = async (roundId) => {
  const conn = await pool.getConnection()
  let roundData, performances, mutators

  try {
    const query = `
      SELECT 
        r.id, r.map_id, r.created_at,
        m.name AS map_name
      FROM 
        round AS r
      JOIN 
        map AS m ON r.map_id = m.id
      WHERE 
        r.id = ?
    `;

    [roundData] = await conn.query(query, [roundId])

    if (roundData.length < 1) return null;

    // Fetch performances for the round
    [performances] = await conn.query(`
      SELECT 
        p.*, 
        pl.name AS player_name,
        pl.id AS player_id
      FROM 
        performance AS p
      JOIN 
        player AS pl ON p.player_id = pl.id
      WHERE
        p.round_id = ?
    `, [roundId]);

    // Fetch mutators for the round
    [mutators] = await conn.query(`
      SELECT 
        mu.id, 
        mu.name
      FROM 
        round_mutator AS rm
      JOIN 
        mutator AS mu ON rm.mutator_id = mu.id
      WHERE
        rm.round_id = ?
    `, [roundId])
  } finally {
    conn.release()
  }

  const round = {
    id: roundData[0].id,
    created_at: roundData[0].created_at,
    map: {
      id: roundData[0].map_id,
      name: roundData[0].map_name
    },
    performances: performances.map(performance => ({
      id: performance.id,
      kills: performance.kills,
      deaths: performance.deaths,
      end_reason: performance.end_reason,
      damage_taken: performance.damage_taken,
      extraction_time: performance.extraction_time,
      presence: performance.presence,
      player: {
        id: performance.player_id,
        name: performance.player_name
      }
    })),
    mutators: mutators.map(mutator => ({
      id: mutator.id,
      name: mutator.name
    }))
  }

  return round
}

export {
  createTables,
  registerRound,
  registerPlayer,
  registerPerformance,
  getKillDeathRatio,
  getTiers,
  getMutators,
  getMutator,
  searchMaps,
  getPerformance,
  getLeaderboard,
  getLeaderboardAroundPlayer,
  getRound,
  searchPlayers,
  getRounds,
  registerKills,
  registerTier,
  getPlayer,
  getMap,
  dropAllTables,
  registerMap,
  deleteMap,
  updateMap,
  registerMutator,
  disableAllTiers,
  disableAllMutators,
  disableAllMaps,
  getKills,
  searchPerformances
}
