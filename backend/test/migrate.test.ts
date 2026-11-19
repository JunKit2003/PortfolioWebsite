import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { runMigrations } from "../src/migrate.js"
import { testSequelize } from "./helpers.js"

describe("runMigrations", () => {
  const sequelize = testSequelize()

  beforeAll(async () => {
    await sequelize.getQueryInterface().dropAllTables()
  })
  afterAll(() => sequelize.close())

  it("creates the tables and is idempotent", async () => {
    await runMigrations(sequelize)
    await runMigrations(sequelize)
    const tables = (await sequelize.getQueryInterface().showAllTables()).map(String)
    expect(tables).toEqual(expect.arrayContaining(["contact_messages", "visits", "SequelizeMeta"]))
    const [rows] = await sequelize.query('SELECT name FROM "SequelizeMeta" ORDER BY name')
    expect(rows).toEqual([{ name: "0001-create-contact-messages" }, { name: "0002-create-visits" }])
  })

  it("gives visits a composite primary key on visitor and date", async () => {
    const description = await sequelize.getQueryInterface().describeTable("visits")
    expect(description.visitor_id.primaryKey).toBe(true)
    expect(description.visit_date.primaryKey).toBe(true)
    expect(description.visit_date.type).toBe("DATE")
  })
})
