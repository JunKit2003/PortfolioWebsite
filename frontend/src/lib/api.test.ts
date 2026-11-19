import { afterEach, describe, expect, it, vi } from "vitest"

import { formatVisits, getVisitorId, recordVisit, sendContact, validateContact } from "./api"

const valid = { name: "Ada", email: "ada@example.com", message: "Hello, I'd like to chat about a role.", website: "" }

function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size
    },
  }
}

function stubFetch(status: number, body: unknown) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }))
  vi.stubGlobal("fetch", fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe("formatVisits", () => {
  it("uses the singular for one", () => expect(formatVisits(1)).toBe("1 visit"))
  it("formats thousands en-US", () => expect(formatVisits(4210)).toBe("4,210 visits"))
  it("handles zero", () => expect(formatVisits(0)).toBe("0 visits"))
})

describe("validateContact", () => {
  it("accepts valid input", () => expect(validateContact(valid)).toEqual({}))
  it("flags a blank name", () => expect(validateContact({ ...valid, name: "   " })).toEqual({ name: "Please enter your name." }))
  it("flags a bad email", () => expect(validateContact({ ...valid, email: "nope" })).toEqual({ email: "Please enter a valid email." }))
  it("flags a short message after trimming", () =>
    expect(validateContact({ ...valid, message: "  hi there " })).toEqual({ message: "Message must be at least 10 characters." }))
  it("flags an over-long message", () =>
    expect(validateContact({ ...valid, message: "x".repeat(5001) }).message).toBeDefined())
})

describe("sendContact", () => {
  it("posts JSON to /api/contact and returns ok on 202", async () => {
    const fetchFn = stubFetch(202, { ok: true })
    expect(await sendContact(valid)).toBe("ok")
    expect(fetchFn).toHaveBeenCalledWith("/api/contact", expect.objectContaining({ method: "POST" }))
  })
  it("maps 429 to rate_limited", async () => {
    stubFetch(429, { error: "rate_limited" })
    expect(await sendContact(valid)).toBe("rate_limited")
  })
  it("returns server field errors on 400", async () => {
    stubFetch(400, { error: "validation", fields: { email: "Please enter a valid email." } })
    expect(await sendContact(valid)).toEqual({ fields: { email: "Please enter a valid email." } })
  })
  it("maps a 500 to error", async () => {
    stubFetch(500, { error: "internal" })
    expect(await sendContact(valid)).toBe("error")
  })
  it("maps a network failure to error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))))
    expect(await sendContact(valid)).toBe("error")
  })
})

describe("getVisitorId", () => {
  it("creates an id once and reuses it", () => {
    const storage = memoryStorage()
    const first = getVisitorId(storage)
    expect(first).toMatch(/^[0-9a-f-]{36}$/)
    expect(getVisitorId(storage)).toBe(first)
  })
  it("replaces a corrupted stored id", () => {
    const storage = memoryStorage()
    storage.setItem("visitor-id", "garbage")
    expect(getVisitorId(storage)).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe("recordVisit", () => {
  it("returns the count from the API", async () => {
    stubFetch(200, { count: 42 })
    expect(await recordVisit(memoryStorage())).toBe(42)
  })
  it("returns null when the API fails", async () => {
    stubFetch(503, { status: "error" })
    expect(await recordVisit(memoryStorage())).toBeNull()
  })
  it("returns null when storage throws", async () => {
    stubFetch(200, { count: 1 })
    const broken = { getItem: () => { throw new Error("denied") } } as unknown as Storage
    expect(await recordVisit(broken)).toBeNull()
  })
})
