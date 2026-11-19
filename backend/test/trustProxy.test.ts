import { afterAll, describe, expect, it } from "vitest"

import { createApp } from "../src/app.js"
import { testDeps, testSequelize } from "./helpers.js"

describe("trust proxy", () => {
  const app = createApp(testDeps())
  const trusts = app.get("trust proxy fn") as (addr: string, hop: number) => boolean
  afterAll(() => testSequelize().close())

  it("trusts the Docker bridge gateway that host nginx arrives through", () => {
    expect(trusts("172.18.0.1", 0)).toBe(true)
  })

  it("trusts loopback", () => {
    expect(trusts("127.0.0.1", 0)).toBe(true)
  })

  it("does not trust a public address", () => {
    expect(trusts("203.0.113.9", 0)).toBe(false)
  })
})
