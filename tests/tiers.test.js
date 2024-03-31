import { expect, test } from 'vitest'
import app from "../server"
import supertest from "supertest"
const request = supertest(app)

// TODO: Continue coverage

test("register tier", async () => {
  const tier = await request.post("/tiers").send({
    name: 'Test Tier',
    points: 123
  })

  expect(tier.status).toBe(200)
  expect(tier.body.id).toBeGreaterThan(0)
})

test("get tiers", async () => {
  const tiers = await request.get("/tiers")
  expect(tiers.status).toBe(200)
})
