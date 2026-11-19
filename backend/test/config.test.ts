import { describe, expect, it } from "vitest"

import { loadConfig } from "../src/config.js"

const fullEnv = {
  DATABASE_URL: "postgres://u:p@db:5432/portfolio",
  SMTP_HOST: "smtp.example.test",
  SMTP_PORT: "587",
  MAIL_FROM: "Portfolio <from@example.test>",
  MAIL_TO: "owner@example.test",
}

describe("loadConfig", () => {
  it("returns typed config with defaults", () => {
    const config = loadConfig(fullEnv)
    expect(config.port).toBe(3000)
    expect(config.databaseUrl).toBe(fullEnv.DATABASE_URL)
    expect(config.smtp).toEqual({ host: "smtp.example.test", port: 587, secure: false, user: undefined, pass: undefined })
    expect(config.mailTo).toBe("owner@example.test")
  })

  it("parses SMTP_SECURE=true", () => {
    expect(loadConfig({ ...fullEnv, SMTP_SECURE: "true" }).smtp.secure).toBe(true)
  })

  it("names the missing setting", () => {
    const { SMTP_HOST: _omit, ...env } = fullEnv
    expect(() => loadConfig(env)).toThrow(/SMTP_HOST/)
  })

  it("names every missing setting", () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL.*SMTP_HOST.*SMTP_PORT.*MAIL_FROM.*MAIL_TO/s)
  })
})
