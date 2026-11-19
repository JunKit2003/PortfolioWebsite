import type { Sequelize } from "sequelize"

import type { Deps } from "../src/app.js"
import { createSequelize } from "../src/db.js"
import type { Mailer, MailMessage } from "../src/mailer.js"

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://portfolio:portfolio@localhost:54329/portfolio_test"

export const testConfig = { mailFrom: "Portfolio <from@example.test>", mailTo: "owner@example.test" }

export function fakeMailer(impl?: (msg: MailMessage) => Promise<void>) {
  const sent: MailMessage[] = []
  const mailer: Mailer = {
    send(msg) {
      sent.push(msg)
      return impl ? impl(msg) : Promise.resolve()
    },
  }
  return { mailer, sent }
}

let shared: Sequelize | undefined

export function testSequelize(): Sequelize {
  shared ??= createSequelize(TEST_DATABASE_URL)
  return shared
}

export function testDeps(overrides: Partial<Deps> = {}): Deps {
  return {
    sequelize: testSequelize(),
    mailer: fakeMailer().mailer,
    now: () => new Date(),
    mail: testConfig,
    ...overrides,
  }
}

export async function resetDb(): Promise<void> {
  const { runMigrations } = await import("../src/migrate.js")
  const sequelize = testSequelize()
  await runMigrations(sequelize)
  await sequelize.query("TRUNCATE contact_messages, visits")
}

export async function eventually(check: () => Promise<void>, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  for (;;) {
    try {
      await check()
      return
    } catch (err) {
      if (Date.now() > deadline) throw err
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
  }
}
