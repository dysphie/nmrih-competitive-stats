import pool from './database.js'
import { createTables } from './queries.js'

const NUM_MAP_TIERS = 8
const NUM_MAPS = 500
const NUM_PLAYERS = 10000
const NUM_ROUNDS = 5000
const NUM_MATCHES = 5000
const NUM_MODIFIERS = 5
const NUM_ROUND_MODIFIERS = 6000

// TODO: support new 'npc_kill' table

const randomNum = (min, max) => Math.random() * (max - min) + min
const randomChars = () => Math.random().toString(36).slice(2)

async function insertDummyData () {
  await createTables()

  const db = await pool.getConnection()
  try {
    await db.beginTransaction()

    console.log(`Inserting ${NUM_PLAYERS} players...`)
    for (let i = 0; i < NUM_PLAYERS; i++) {
      await db.execute(`
        INSERT INTO player (steam_id, name) 
        VALUES (?, ?)
    `, [100000000 + i, 'Player' + i])
    }

    // Insert dummy map tiers
    console.log(`Inserting ${NUM_MAP_TIERS} map tiers...`)
    for (let i = 0; i < NUM_MAP_TIERS; i++) {
      await db.execute(`
        INSERT INTO map_tier (name, points) 
        VALUES (?, ?)
    `, ['Tier ' + i, randomNum(10, 200)])
    }

    // Insert dummy maps
    console.log(`Inserting ${NUM_MAPS} maps...`)
    for (let i = 0; i < NUM_MAPS; i++) {
      const name = randomChars()
      await db.execute(`
        INSERT INTO map (file, name, tier_id) 
        VALUES (?, ?, ?)
        `, [`nmo_${name}`, name.toUpperCase(), randomNum(1, NUM_MAP_TIERS)])
    }

    // Insert dummy modifiers
    console.log(`Inserting ${NUM_MODIFIERS} modifiers...`)
    for (let i = 0; i < NUM_MODIFIERS; i++) {
      await db.execute(`
        INSERT INTO modifier (name, points_multiplier) 
        VALUES (?, ?)
    `, ['Modifier ' + i, Math.random() * 2])
    }

    // Insert dummy rounds
    console.log(`Inserting ${NUM_ROUNDS} rounds...`)
    for (let i = 0; i < NUM_ROUNDS; i++) {
      await db.execute(`
        INSERT INTO round (map_id)
        VALUES (?)
        `, [
        randomNum(1, NUM_MAPS)
      ])
    }

    // // Insert dummy matches
    console.log(`Inserting ${NUM_ROUNDS} performances...`)
    for (let j = 0; j < NUM_MATCHES; j++) {
      await db.execute(`
        INSERT INTO performance (player_id, round_id, kills, deaths, damage_taken, extraction_time, presence, exp_earned) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [randomNum(1, NUM_PLAYERS),
        randomNum(1, NUM_ROUNDS),
        randomNum(0, 2048),
        randomNum(0, 12),
        randomNum(0, 1000),
        randomNum(60.0, 7800.0),
        randomNum(0.0, 100.0),
        randomNum(5, 200)
      ])
    }

    // Insert dummy match modifiers
    for (let i = 0; i < NUM_ROUND_MODIFIERS; i++) {
      await db.execute(`
        INSERT IGNORE INTO round_modifier (round_id, modifier_id) 
        VALUES (?, ?)
        `, [randomNum(1, NUM_ROUNDS), randomNum(1, NUM_MODIFIERS)])
    }

    console.log('Committing..')
    await db.commit()
  } catch (error) {
    console.log('Error : ' + error)
    await db.rollback()
    throw error
  } finally {
    console.log('Done')
    db.release()
  }
}

// Call the function to insert dummy data
await insertDummyData()
