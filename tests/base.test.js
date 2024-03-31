import { expect, test } from 'vitest'
import app from "../server"
import supertest from "supertest"
const request = supertest(app)

test("gets the test endpoint", async () => {
  const response = await request.get("/")
  expect(response.status).toBe(200)
})
