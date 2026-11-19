import { randomUUID } from "node:crypto"

import request from "supertest"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { createApp } from "../src/app.js"
import { resetDb, testDeps, testSequelize } from "./helpers.js"

function clock(iso: string) {
  let current = new Date(iso)
  return { now: () => current, set: (next: string) => (current = new Date(next)) }
}

describe("visits", () => {
  beforeEach(resetDb)
  afterAll(() => testSequelize().close())

  it("counts a first visit", async () => {
    const res = await request(createApp(testDeps())).post("/api/visits").send({ visitorId: randomUUID() })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ count: 1 })
  })

  it("counts the same visitor once per day", async () => {
    const app = createApp(testDeps())
    const visitorId = randomUUID()
    await request(app).post("/api/visits").send({ visitorId })
    const res = await request(app).post("/api/visits").send({ visitorId })
    expect(res.body).toEqual({ count: 1 })
  })

  it("counts different visitors separately", async () => {
    const app = createApp(testDeps())
    await request(app).post("/api/visits").send({ visitorId: randomUUID() })
    const res = await request(app).post("/api/visits").send({ visitorId: randomUUID() })
    expect(res.body).toEqual({ count: 2 })
  })

  it("handles concurrent pings from the same visitor", async () => {
    const app = createApp(testDeps())
    const visitorId = randomUUID()
    const results = await Promise.all(
      Array.from({ length: 5 }, () => request(app).post("/api/visits").send({ visitorId })),
    )
    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200, 200])
    expect((await request(app).get("/api/visits/count")).body).toEqual({ count: 1 })
  })

  it("counts the same visitor again on the next UTC day", async () => {
    const time = clock("2026-11-19T23:59:00Z")
    const app = createApp(testDeps({ now: time.now }))
    const visitorId = randomUUID()
    await request(app).post("/api/visits").send({ visitorId })
    time.set("2026-11-20T00:01:00Z")
    const res = await request(app).post("/api/visits").send({ visitorId })
    expect(res.body).toEqual({ count: 2 })
  })

  it("uses the UTC date, not the server's local date", async () => {
    // 07:59 in Malaysia on the 20th is still the 19th in UTC.
    const time = clock("2026-11-19T23:59:00Z")
    const app = createApp(testDeps({ now: time.now }))
    const visitorId = randomUUID()
    await request(app).post("/api/visits").send({ visitorId })
    time.set("2026-11-19T00:00:30Z")
    const res = await request(app).post("/api/visits").send({ visitorId })
    expect(res.body).toEqual({ count: 1 })
  })

  it.each([[{}], [{ visitorId: "abc" }], [{ visitorId: 123 }], [{ visitorId: null }]])(
    "rejects an invalid visitorId %j",
    async (body) => {
      const app = createApp(testDeps())
      const res = await request(app).post("/api/visits").send(body)
      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: "validation" })
      expect((await request(app).get("/api/visits/count")).body).toEqual({ count: 0 })
    },
  )

  it("returns the total without recording a visit", async () => {
    const app = createApp(testDeps())
    await request(app).post("/api/visits").send({ visitorId: randomUUID() })
    expect((await request(app).get("/api/visits/count")).body).toEqual({ count: 1 })
    expect((await request(app).get("/api/visits/count")).body).toEqual({ count: 1 })
  })

  it("limits pings to 30 per minute per address", async () => {
    const app = createApp(testDeps())
    for (let i = 0; i < 30; i++) {
      expect((await request(app).post("/api/visits").send({ visitorId: randomUUID() })).status).toBe(200)
    }
    const res = await request(app).post("/api/visits").send({ visitorId: randomUUID() })
    expect(res.status).toBe(429)
  })
})
