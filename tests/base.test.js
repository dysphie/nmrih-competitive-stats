import { expect, test } from 'vitest'
import app from '../server'
import supertest from 'supertest'
import { createTables, dropAll } from '../queries'
const request = supertest(app)

// TODO: Continue coverage

await dropAll()
await createTables()

test('register tier', async () => {
  const tier = await request.post('/tiers').send({
    name: 'Test Tier',
    points: 123
  })

  expect(tier.status).toBe(200)
  expect(tier.body.id).toBe(1)
})

test('get tiers', async () => {
  const tiers = await request.get('/tiers')
  expect(tiers.status).toBe(200)
  expect(tiers.body.length).toBe(1)
  expect(tiers.body[0].name).toBe('Test Tier')
  expect(tiers.body[0].points).toBe(123)
})

test('register player', async () => {
  const player = await request.post('/players').send({
    name: 'Test Player',
    steam: '9223372036854775807'
  })

  expect(player.status).toBe(200)
  expect(player.body.id).toBe(1)
})

test('search players', async () => {
  const players = await request.get('/players?name=Test')
  expect(players.status).toBe(200)
  expect(players.body.length).toBe(1)
  expect(players.body[0].name).toBe('Test Player')
})

test('get player', async () => {
  const player = await request.get('/players/1')
  expect(player.status).toBe(200)
  expect(player.body.name).toBe('Test Player')
  expect(player.body.steam_id).toBe('9223372036854775807')
})

test('register map', async () => {
  const map = await request.post('/maps').send({
    name: 'Test Map',
    file: 'nmo_test',
    tier: 1
  })

  expect(map.status).toBe(200)
  expect(map.body.id).toBe(1)
})

test('get map', async () => {
  const map = await request.get('/maps/1')
  expect(map.status).toBe(200)
  expect(map.body.name).toBe('Test Map')
  expect(map.body.file).toBe('nmo_test')
  expect(map.body.tier_id).toBe(1)
})

test('register round', async () => {
  const performance = await request.post('/rounds').send({
    map: 1
  })

  expect(performance.status).toBe(200)
  expect(performance.body.id).toBe(1)
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
  })

  expect(performance.status).toBe(200)
  expect(performance.body.id).toBe(1)
})

test('get performance', async () => {
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
