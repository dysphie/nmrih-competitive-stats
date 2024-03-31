import 'dotenv/config'
import { expect, test } from 'vitest'
import app from '../server'
import supertest from 'supertest'
import { createTables, dropAll } from '../queries'
const request = supertest(app)

// TODO: Continue coverage

await dropAll()
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
  }).set('Authentication', adminToken)

  const mutator2 = await request.post('/mutators').send({
    name: 'Test Mutator 2',
    points_multiplier: '2.0',
    cvars: [
      { name: 'cvar1', value: '2' },
      { name: 'cvar2', value: '2' }
    ]
  }).set('Authentication', adminToken)

  expect(mutator1.status).toBe(200)
  expect(mutator1.body.id).toBe(1)
  expect(mutator2.status).toBe(200)
  expect(mutator2.body.id).toBe(2)
})

test('register tiers', async () => {
  const tier1 = await request.post('/tiers').send({
    name: 'Test Tier 1',
    points: 1
  }).set('Authentication', adminToken)

  const tier2 = await request.post('/tiers').send({
    name: 'Test Tier 2',
    points: 2
  }).set('Authentication', adminToken)

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
  }).set('Authentication', adminToken)

  const player2 = await request.post('/players').send({
    name: 'Test Player 2',
    steam: '9223372036854775807'
  }).set('Authentication', adminToken)

  expect(player1.status).toBe(200)
  expect(player1.body.id).toBe(1)
  expect(player2.status).toBe(200)
  expect(player2.body.id).toBe(2)
})

test('get players', async () => {
  const players = await request.get('/players')
  expect(players.status).toBe(200)
  expect(players.body.length).toBe(2)
})

test('get players by name', async () => {
  const players = await request.get('/players?name=Player 1')
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
    tier: 1
  }).set('Authentication', adminToken)

  const map2 = await request.post('/maps').send({
    name: 'Test Map 2',
    file: 'nmo_test2',
    tier: 2
  }).set('Authentication', adminToken)

  expect(map1.status).toBe(200)
  expect(map1.body.id).toBe(1)
  expect(map2.status).toBe(200)
  expect(map2.body.id).toBe(2)
})

test('get maps', async () => {
  const map = await request.get('/maps')
  expect(map.status).toBe(200)
  expect(map.body.length).toBe(2)
})

test('get map by name', async () => {
  const map = await request.get('/maps?name=Map 1')
  expect(map.status).toBe(200)
  expect(map.body.length).toBe(1)
  expect(map.body[0].name).toBe('Test Map 1')
})

test('get map by id', async () => {
  const map = await request.get('/maps/1')
  expect(map.status).toBe(200)
  expect(map.body.name).toBe('Test Map 1')
  expect(map.body.file).toBe('nmo_test1')
  expect(map.body.tier_id).toBe(1)
})

test('register round', async () => {
  const rounds = await request.post('/rounds').send({
    map: 1
  }).set('Authentication', adminToken)

  expect(rounds.status).toBe(200)
  expect(rounds.body.id).toBe(1)
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
  }).set('Authentication', adminToken)

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
