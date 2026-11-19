import request from "supertest"
import { afterAll, describe, expect, it } from "vitest"

import { createApp } from "../src/app.js"
import { createSequelize } from "../src/db.js"
import { testDeps } from "./helpers.js"

describe("GET /api/health", () => {
  const unreachable = createSequelize("postgres://nobody:nothing@127.0.0.1:1/none")
  afterAll(() => unreachable.close())

  it("is ok when the database is reachable", async () => {
    const res = await request(createApp(testDeps())).get("/api/health")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: "ok" })
  })

  it("is 503 when the database is unreachable", async () => {
    const res = await request(createApp(testDeps({ sequelize: unreachable }))).get("/api/health")
    expect(res.status).toBe(503)
    expect(res.body).toEqual({ status: "error" })
  })

  it("returns JSON 404 for unknown API routes", async () => {
    const res = await request(createApp(testDeps())).get("/api/nope")
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: "not_found" })
  })
})
