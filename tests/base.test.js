import { expect, test } from 'vitest'
import app from "../server"
import supertest from "supertest"
import { createTables, dropAll } from '../queries'
const request = supertest(app)

// TODO: Continue coverage

await dropAll()
await createTables()

test("register tier", async () => {
  const tier = await request.post("/tiers").send({
    name: 'Test Tier',
    points: 123
  })

  expect(tier.status).toBe(200)
  expect(tier.body.id).toBe(1)
})

test("get tiers", async () => {
  const tiers = await request.get("/tiers")
  expect(tiers.status).toBe(200)
  expect(tiers.body.length).toBe(1)
  expect(tiers.body[0].name).toBe('Test Tier')
  expect(tiers.body[0].points).toBe(123)
})

test("register player", async () => {
  const player = await request.post("/players").send({
    name: 'Test Player',
    steam: '9223372036854775807'
  })

  expect(player.status).toBe(200)
  expect(player.body.id).toBe(1)
})

test("get player", async () => {
  const tiers = await request.get("/players/1")
  expect(tiers.status).toBe(200)
  expect(tiers.body.name).toBe('Test Player')
  expect(tiers.body.steam_id).toBe('9223372036854775807')
})
