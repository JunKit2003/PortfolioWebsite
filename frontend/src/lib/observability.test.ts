import { beforeEach, describe, expect, it, vi } from "vitest"

import { __resetObservabilityForTests, initObservability, log, readObservabilityConfig, whenIdle } from "./observability"

const full = { PROD: true, VITE_O2_SITE: "o2.example.com", VITE_O2_ORG: "default", VITE_O2_CLIENT_TOKEN: "tok", VITE_APP_VERSION: "abc123" }

function fakeSdks() {
  return {
    rum: { init: vi.fn() },
    logs: { init: vi.fn(), logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() } },
  }
}

beforeEach(() => __resetObservabilityForTests())

describe("readObservabilityConfig", () => {
  it("is null when not PROD", () => {
    expect(readObservabilityConfig({ ...full, PROD: false })).toBeNull()
  })

  it.each(["VITE_O2_SITE", "VITE_O2_ORG", "VITE_O2_CLIENT_TOKEN"] as const)("is null when %s is missing", (key) => {
    expect(readObservabilityConfig({ ...full, [key]: undefined })).toBeNull()
  })

  it.each(["VITE_O2_SITE", "VITE_O2_ORG", "VITE_O2_CLIENT_TOKEN"] as const)("is null when %s is blank", (key) => {
    expect(readObservabilityConfig({ ...full, [key]: "   " })).toBeNull()
  })

  it("returns trimmed values", () => {
    expect(
      readObservabilityConfig({ PROD: true, VITE_O2_SITE: " s ", VITE_O2_ORG: " o ", VITE_O2_CLIENT_TOKEN: " t ", VITE_APP_VERSION: " v1 " }),
    ).toEqual({ site: "s", org: "o", clientToken: "t", version: "v1" })
  })

  it("defaults version to dev when blank", () => {
    expect(readObservabilityConfig({ ...full, VITE_APP_VERSION: "  " })?.version).toBe("dev")
    expect(readObservabilityConfig({ ...full, VITE_APP_VERSION: undefined })?.version).toBe("dev")
  })
})

describe("initObservability", () => {
  it("initialises RUM and logs with the exact options", async () => {
    const sdks = fakeSdks()
    await expect(initObservability(full, () => Promise.resolve(sdks))).resolves.toBe(true)
    expect(sdks.rum.init).toHaveBeenCalledTimes(1)
    expect(sdks.rum.init).toHaveBeenCalledWith({
      applicationId: "portfolio",
      service: "portfolio-web",
      env: "production",
      version: "abc123",
      site: "o2.example.com",
      organizationIdentifier: "default",
      clientToken: "tok",
      insecureHTTP: false,
      apiVersion: "v1",
      trackResources: true,
      trackLongTasks: true,
      trackUserInteractions: true,
      defaultPrivacyLevel: "mask-user-input",
      sessionSampleRate: 100,
      sessionReplaySampleRate: 0,
    })
    expect(sdks.logs.init).toHaveBeenCalledTimes(1)
    expect(sdks.logs.init).toHaveBeenCalledWith({
      clientToken: "tok",
      site: "o2.example.com",
      organizationIdentifier: "default",
      service: "portfolio-web",
      env: "production",
      version: "abc123",
      insecureHTTP: false,
      apiVersion: "v1",
      forwardErrorsToLogs: true,
    })
  })

  it("resolves false and never loads when not configured", async () => {
    const load = vi.fn()
    await expect(initObservability({ PROD: false }, load)).resolves.toBe(false)
    expect(load).not.toHaveBeenCalled()
  })

  it("resolves false when load rejects", async () => {
    await expect(initObservability(full, () => Promise.reject(new Error("net")))).resolves.toBe(false)
  })

  it("is idempotent", async () => {
    const sdks = fakeSdks()
    const load = vi.fn(() => Promise.resolve(sdks))
    const first = await initObservability(full, load)
    const second = await initObservability(full, load)
    expect(first).toBe(true)
    expect(second).toBe(true)
    expect(load).toHaveBeenCalledTimes(1)
    expect(sdks.rum.init).toHaveBeenCalledTimes(1)
  })
})

describe("log", () => {
  it("does nothing before init", () => {
    expect(() => log("error", "boom", { a: 1 })).not.toThrow()
  })

  it("forwards to the logger after init", async () => {
    const sdks = fakeSdks()
    await initObservability(full, () => Promise.resolve(sdks))
    log("error", "boom", { a: 1 })
    expect(sdks.logs.logger.error).toHaveBeenCalledWith("boom", { a: 1 })
  })
})

describe("whenIdle", () => {
  function fakeWin(readyState: DocumentReadyState, idle?: (cb: () => void, opts?: object) => number) {
    const listeners: Record<string, () => void> = {}
    const win = {
      addEventListener: vi.fn((type: string, cb: () => void) => {
        listeners[type] = cb
      }),
      requestIdleCallback: idle,
      document: { readyState },
    } as unknown as NonNullable<Parameters<typeof whenIdle>[1]>
    return { win, listeners }
  }

  it("waits for the load event, then for idle, when the page is not complete", () => {
    const idle = vi.fn((cb: () => void) => {
      cb()
      return 1
    })
    const { win, listeners } = fakeWin("loading", idle)
    const fn = vi.fn()
    whenIdle(fn, win)
    expect(fn).not.toHaveBeenCalled()
    expect(idle).not.toHaveBeenCalled()
    listeners.load()
    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 5000 })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("goes straight to idle when the page is already complete", () => {
    const idle = vi.fn((cb: () => void) => {
      cb()
      return 1
    })
    const { win } = fakeWin("complete", idle)
    const fn = vi.fn()
    whenIdle(fn, win)
    expect(win.addEventListener).not.toHaveBeenCalled()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("falls back to setTimeout when requestIdleCallback is missing", () => {
    vi.useFakeTimers()
    try {
      const { win } = fakeWin("complete")
      const fn = vi.fn()
      whenIdle(fn, win)
      expect(fn).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(fn).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })
})
