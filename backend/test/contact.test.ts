import request from "supertest"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { createApp } from "../src/app.js"
import { initModels } from "../src/models.js"
import { eventually, fakeMailer, resetDb, testConfig, testDeps, testSequelize } from "./helpers.js"

const { ContactMessage } = initModels(testSequelize())

const valid = { name: "  Ada  ", email: "ada@example.com", message: "Hello, I'd like to chat about a role." }

describe("POST /api/contact", () => {
  beforeEach(resetDb)
  afterAll(() => testSequelize().close())

  it("accepts a valid message, stores it trimmed and emails it", async () => {
    const { mailer, sent } = fakeMailer()
    const res = await request(createApp(testDeps({ mailer }))).post("/api/contact").send(valid)

    expect(res.status).toBe(202)
    expect(res.body).toEqual({ ok: true })
    const rows = await ContactMessage.findAll()
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe("Ada")
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({
      to: testConfig.mailTo,
      from: testConfig.mailFrom,
      replyTo: "ada@example.com",
      subject: "Portfolio contact from Ada",
    })
    expect(sent[0].text).toContain(valid.message)
    await eventually(async () => {
      const row = await ContactMessage.findByPk(rows[0].id)
      expect(row?.emailSentAt).toBeInstanceOf(Date)
      expect(row?.emailError).toBeNull()
    })
  })

  it.each([
    ["name", { ...valid, name: "" }],
    ["name", { ...valid, name: "   " }],
    ["name", { ...valid, name: "x".repeat(101) }],
    ["email", { ...valid, email: "not-an-email" }],
    ["email", { ...valid, email: `${"a".repeat(250)}@example.com` }],
    ["message", { ...valid, message: "Hi" }],
    ["message", { ...valid, message: "          hi         " }],
    ["message", { ...valid, message: "x".repeat(5001) }],
  ])("rejects an invalid %s", async (field, body) => {
    const { mailer, sent } = fakeMailer()
    const res = await request(createApp(testDeps({ mailer }))).post("/api/contact").send(body)

    expect(res.status).toBe(400)
    expect(res.body.error).toBe("validation")
    expect(typeof res.body.fields[field]).toBe("string")
    expect(await ContactMessage.count()).toBe(0)
    expect(sent).toHaveLength(0)
  })

  it("rejects a non-string field instead of crashing", async () => {
    const res = await request(createApp(testDeps())).post("/api/contact").send({ ...valid, name: 42 })
    expect(res.status).toBe(400)
    expect(res.body.fields.name).toEqual(expect.any(String))
  })

  it("silently drops a submission with the honeypot filled in", async () => {
    const { mailer, sent } = fakeMailer()
    const res = await request(createApp(testDeps({ mailer })))
      .post("/api/contact")
      .send({ ...valid, website: "https://spam.example" })

    expect(res.status).toBe(202)
    expect(res.body).toEqual({ ok: true })
    expect(await ContactMessage.count()).toBe(0)
    expect(sent).toHaveLength(0)
  })

  it("keeps the message and records the error when email fails", async () => {
    const { mailer } = fakeMailer(() => Promise.reject(new Error("smtp down")))
    const res = await request(createApp(testDeps({ mailer }))).post("/api/contact").send(valid)

    expect(res.status).toBe(202)
    await eventually(async () => {
      const [row] = await ContactMessage.findAll()
      expect(row.emailError).toContain("smtp down")
      expect(row.emailSentAt).toBeNull()
    })
  })

  it("answers quickly even if the mail server hangs", async () => {
    const { mailer } = fakeMailer(() => new Promise<void>(() => {}))
    const started = Date.now()
    const res = await request(createApp(testDeps({ mailer }))).post("/api/contact").send(valid)

    expect(res.status).toBe(202)
    expect(Date.now() - started).toBeLessThan(1000)
  })

  it("rejects malformed JSON with 400", async () => {
    const res = await request(createApp(testDeps()))
      .post("/api/contact")
      .set("Content-Type", "application/json")
      .send("{oops")
    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: "invalid_json" })
  })

  it("limits each address to 5 messages per hour", async () => {
    const app = createApp(testDeps())
    for (let i = 0; i < 5; i++) {
      expect((await request(app).post("/api/contact").send(valid)).status).toBe(202)
    }
    const res = await request(app).post("/api/contact").send(valid)
    expect(res.status).toBe(429)
    expect(res.body).toEqual({ error: "rate_limited" })
  })

  it("counts the limit per client address taken from X-Forwarded-For", async () => {
    const app = createApp(testDeps())
    for (let i = 0; i < 5; i++) {
      await request(app).post("/api/contact").set("X-Forwarded-For", "203.0.113.1").send(valid)
    }
    expect((await request(app).post("/api/contact").set("X-Forwarded-For", "203.0.113.1").send(valid)).status).toBe(429)
    expect((await request(app).post("/api/contact").set("X-Forwarded-For", "203.0.113.2").send(valid)).status).toBe(202)
  })
})
