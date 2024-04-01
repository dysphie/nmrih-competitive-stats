import 'dotenv/config'
import { expect, test } from 'vitest'
import app from '../server'
import supertest from 'supertest'
import { createTables, dropAllTables } from '../queries'
const request = supertest(app)

// TODO: Continue coverage

await dropAllTables()
await createTables()

const adminToken = process.env.ADMIN_AUTH_TOKEN

test('register mutator', async () => {
  const mutator1 = await request.post('/mutators').send({
    name: 'Test Mutator 1',
    points_multiplier: '1.0',
    cvars: [
      { name: 'cvar1', value: '1' },
      { name: 'cvar2', value: '1' }
    ]
  }).set('authorization', adminToken)

  const mutator2 = await request.post('/mutators').send({
    name: 'Test Mutator 2',
    points_multiplier: '2.0',
    cvars: [
      { name: 'cvar1', value: '2' },
      { name: 'cvar2', value: '2' }
    ]
  }).set('authorization', adminToken)

  expect(mutator1.status).toBe(200)
  expect(mutator1.body.id).toBe(1)
  expect(mutator2.status).toBe(200)
  expect(mutator2.body.id).toBe(2)
})

test('get mutators', async () => {
  const mutators = await request.get('/mutators')

  expect(mutators.status).toBe(200)
  expect(mutators.body.length).toBe(2)
})

test('get mutators by id', async () => {
  const map = await request.get('/mutators/1')

  expect(map.status).toBe(200)
  expect(map.body.id).toBe(1)
  expect(map.body.name).toBe('Test Mutator 1')
})

test('register tiers', async () => {
  const tier1 = await request.post('/tiers').send({
    name: 'Test Tier 1',
    points: 1
  }).set('authorization', adminToken)

  const tier2 = await request.post('/tiers').send({
    name: 'Test Tier 2',
    points: 2
  }).set('authorization', adminToken)

  expect(tier1.status).toBe(200)
  expect(tier1.body.id).toBe(1)
  expect(tier2.status).toBe(200)
  expect(tier2.body.id).toBe(2)
})

test('get tiers', async () => {
  const tiers = await request.get('/tiers')

  expect(tiers.status).toBe(200)
  expect(tiers.body.length).toBe(2)
  expect(tiers.body[0].name).toBe('Test Tier 1')
  expect(tiers.body[0].points).toBe(1)
})

test('register players', async () => {
  const player1 = await request.post('/players').send({
    name: 'Test Player 1',
    steam: '9223372036854775806'
  }).set('authorization', adminToken)

  const player2 = await request.post('/players').send({
    name: 'Test Player 2',
    steam: '9223372036854775807'
  }).set('authorization', adminToken)

  expect(player1.status).toBe(200)
  expect(player1.body.id).toBe(1)
  expect(player2.status).toBe(200)
  expect(player2.body.id).toBe(2)
})

test('get players by name', async () => {
  const players = await request.get('/players?q=Player 1')

  expect(players.status).toBe(200)
  expect(players.body.length).toBe(1)
  expect(players.body[0].name).toBe('Test Player 1')
})

test('get player by id', async () => {
  const player = await request.get('/players/1')

  expect(player.status).toBe(200)
  expect(player.body.name).toBe('Test Player 1')
  expect(player.body.steam_id).toBe('9223372036854775806')
})

test('register maps', async () => {
  const map1 = await request.post('/maps').send({
    name: 'Test Map 1',
    file: 'nmo_test1',
    tier: 1,
    mutators: [1, 2]
  }).set('authorization', adminToken)

  const map2 = await request.post('/maps').send({
    name: 'Test Map 2',
    file: 'nmo_test2',
    tier: 2,
    mutators: [1, 2]
  }).set('authorization', adminToken)

  expect(map1.status).toBe(200)
  expect(map1.body.id).toBe(1)
  expect(map2.status).toBe(200)
  expect(map2.body.id).toBe(2)
})

test('get maps', async () => {
  const maps = await request.get('/maps')
  expect(maps.status).toBe(200)
  expect(maps.body.length).toBe(2)
})

test('get map by name', async () => {
  const maps = await request.get('/maps?q=Map 1')
  expect(maps.status).toBe(200)
  expect(maps.body.length).toBe(1)
  expect(maps.body[0].name).toBe('Test Map 1')
})

test('get map by id', async () => {
  const map = await request.get('/maps/1')
  expect(map.status).toBe(200)
  expect(map.body.name).toBe('Test Map 1')
  expect(map.body.file).toBe('nmo_test1')
  expect(map.body.tier_id).toBe(1)
  expect(map.body.mutators.length).toBe(2)
})

test('update map', async () => {
  const res = await request.put('/maps/2').send({
    name: 'Updated Map',
    tier: 1
  }).set('authorization', adminToken)
  expect(res.status).toBe(204)
})

test('delete map', async () => {
  const res = await request.delete('/maps/2').set('authorization', adminToken)
  expect(res.status).toBe(204)
})

test('register round', async () => {
  const rounds = await request.post('/rounds').send({
    map: 1,
    mutators: [1, 2]
  }).set('authorization', adminToken)

  expect(rounds.status).toBe(200)
  expect(rounds.body.id).toBe(1)
})

test('get round by id', async () => {
  const rounds = await request.get('/rounds/1')

  expect(rounds.status).toBe(200)
  expect(rounds.body.id).toBe(1)
  expect(rounds.body.mutators.length).toBe(2)
  expect(rounds.body.mutators[0].id).toBe(1)
  expect(rounds.body.mutators[1].id).toBe(2)
})

test('register performance', async () => {
  const performance = await request.post('/performances').send({
    player: 1,
    round: 1,
    end_reason: 'extracted',
    kills: 10,
    deaths: 2,
    damage_taken: 500,
    extraction_time: 300,
    presence: 100.0,
    exp_earned: 1000
  }).set('authorization', adminToken)

  expect(performance.status).toBe(200)
  expect(performance.body.id).toBe(1)
})

test('get performance by id', async () => {
  const performance = await request.get('/performances/1')

  expect(performance.status).toBe(200)
  expect(performance.body.player_id).toBe(1)
  expect(performance.body.round_id).toBe(1)
  expect(performance.body.end_reason).toBe('extracted')
  expect(performance.body.kills).toBe(10)
  expect(performance.body.deaths).toBe(2)
  expect(performance.body.damage_taken).toBe(500)
  expect(performance.body.extraction_time).toBe(300)
  expect(performance.body.presence).toBe(100.0)
  expect(performance.body.exp_earned).toBe(1000)
})

test('get leaderboard (exp)', async () => {
  const lb = await request.get('/leaderboards/exp')
  expect(lb.status).toBe(200)
  expect(lb.body.length).toBe(1)
})

test('get leaderboard (kills)', async () => {
  const lb = await request.get('/leaderboards/kills')
  expect(lb.status).toBe(200)
  expect(lb.body.length).toBe(1)
})

test('get leaderboard (kdr)', async () => {
  const lb = await request.get('/leaderboards/kdr')
  expect(lb.status).toBe(200)
  expect(lb.body.length).toBe(1)
})

test('register kills', async () => {
  const kills = {
    performance: 1,
    kills: [
      { player: 1, npc_type: 2, hitgroup: 3, weapon: 1 },
      { player: 1, npc_type: 2, hitgroup: 3, weapon: 1 },
      { player: 1, npc_type: 2, hitgroup: 3, weapon: 2 }
    ]
  }

  const response = await request.post('/kills').send(kills).set('authorization', adminToken)

  expect(response.status).toBe(200)
})

test('get kills', async () => {
  const kills = await request.get('/players/1/kills').set('Content-Type', 'application/json')

  expect(kills.status).toBe(200)
  expect(kills.body.length).toBe(2)
  expect(kills.body[0].weapon).toBe(1)
  expect(kills.body[0].kill_count).toBe('2') // todo: do we rly want bigint support here?
  expect(kills.body[1].weapon).toBe(2)
  expect(kills.body[1].kill_count).toBe('1')
})
