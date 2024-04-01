import pool from './database.js'

// TODO: make <resource>_id be returned as just <resource>

const dropAll = async () => {
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
        name VARCHAR(255) NOT NULL,
        points INT NOT NULL CHECK (points >= 0)
      );
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS map (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        tier_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tier_id) REFERENCES map_tier(id)
      );
    `)

    await db.execute(`
      CREATE TABLE IF NOT EXISTS mutator (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        points_multiplier DOUBLE NOT NULL
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

const getRounds = async (limit = 10, offset = 0, ascending = true, playerId = null, mapId = null) => {
  const conn = await pool.getConnection()
  let rounds, performances

  try {
    const queryParams = []
    let query = `
      SELECT 
        r.id, r.map_id, r.created_at, 
        m.file AS map_file, 
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
    queryParams.push(limit, offset)

    ;[rounds] = await conn.query(query, queryParams)

    if (rounds.length < 1) return {}

    const roundIds = rounds.map(r => r.id)
      ;[performances] = await conn.query(`
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
    `, [roundIds])
  } finally {
    conn.release()
  }

  const history = rounds.reduce((acc, round) => {
    acc.set(round.id, {
      id: round.id,
      created_at: round.created_at,
      map: { id: round.map_id, name: round.map_name, file: round.map_file },
      performances: []
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

const registerRound = async (mapId) => {
  const [round] = await pool.query('INSERT INTO round (map_id) VALUES (?);', [mapId])
  return round.insertId
}

const registerTier = async (name, points) => {
  const [tier] = await pool.query('INSERT INTO map_tier (name, points) VALUES (?, ?);', [name, points])
  return tier.insertId
}

const registerPlayer = async (steamId, name) => {
  const [player] = await pool.query('INSERT INTO player (steam_id, name) VALUES (?, ?)', [steamId, name])
  return player.insertId
}

const registerMap = async (file, name, tierId) => {
  const [map] = await pool.query('INSERT INTO map (file, name, tier_id) VALUES (?, ?, ?)', [file, name, tierId])
  return map.insertId
}

const registerPerformance = async (playerId, roundId, endReason, kills, deaths, damageTaken, extractionTime, presence, expEarned) => {
  const [performance] = await pool.query(`
    INSERT INTO performance 
    (player_id, round_id, end_reason, kills, deaths, damage_taken, extraction_time, presence, exp_earned) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [playerId, roundId, endReason, kills, deaths, damageTaken, extractionTime, presence, expEarned])

  return performance.insertId
}

const registerMutator = async (name, pointsMultiplier, cvars) => {
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
  const [mutators] = await pool.query('SELECT * FROM mutator')
  return mutators
}

const getMap = async (id) => {
  const [maps] = await pool.query('SELECT * FROM map WHERE id = ? LIMIT 1;', [id])
  return maps.length > 0 ? maps[0] : null
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
  let roundData, performances

  try {
    const query = `
      SELECT 
        r.id, r.map_id, r.created_at, 
        m.file AS map_file, 
        m.name AS map_name
      FROM 
        round AS r
      JOIN 
        map AS m ON r.map_id = m.id
      WHERE 
        r.id = ?
    `;

    // Execute the query
    [roundData] = await conn.query(query, [roundId])

    if (roundData.length < 1) return null; // Return null if round not found

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
    `, [roundId])
  } finally {
    conn.release()
  }

  const round = {
    id: roundData[0].id,
    created_at: roundData[0].created_at,
    map: {
      id: roundData[0].map_id,
      name: roundData[0].map_name,
      file: roundData[0].map_file
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
  dropAll,
  registerMap,
  registerMutator,
  getKills
}
