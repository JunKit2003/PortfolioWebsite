export type ObservabilityEnv = {
  PROD: boolean
  VITE_O2_SITE?: string
  VITE_O2_ORG?: string
  VITE_O2_CLIENT_TOKEN?: string
  VITE_APP_VERSION?: string
}

export type ObservabilityConfig = { site: string; org: string; clientToken: string; version: string }

type Level = "debug" | "info" | "warn" | "error"

export type Sdks = {
  rum: { init(opts: object): void }
  logs: { init(opts: object): void; logger: Record<Level, (msg: string, ctx?: object) => void> }
}

const SERVICE = "portfolio-web"
const ENVIRONMENT = "production"

/** Monitoring is on only in production builds with site, org and token all set. */
export function readObservabilityConfig(env: ObservabilityEnv): ObservabilityConfig | null {
  if (!env.PROD) return null
  const site = env.VITE_O2_SITE?.trim()
  const org = env.VITE_O2_ORG?.trim()
  const clientToken = env.VITE_O2_CLIENT_TOKEN?.trim()
  if (!site || !org || !clientToken) return null
  return { site, org, clientToken, version: env.VITE_APP_VERSION?.trim() || "dev" }
}

async function loadSdks(): Promise<Sdks> {
  const [rum, logs] = await Promise.all([import("@openobserve/browser-rum"), import("@openobserve/browser-logs")])
  return { rum: rum.openobserveRum, logs: logs.openobserveLogs } as unknown as Sdks
}

let sdks: Sdks | null = null
let started: Promise<boolean> | null = null

export function initObservability(
  env: ObservabilityEnv = import.meta.env,
  load: () => Promise<Sdks> = loadSdks,
): Promise<boolean> {
  if (started) return started
  started = (async () => {
    const config = readObservabilityConfig(env)
    if (!config) return false
    try {
      const loaded = await load()
      const shared = {
        clientToken: config.clientToken,
        site: config.site,
        organizationIdentifier: config.org,
        service: SERVICE,
        env: ENVIRONMENT,
        version: config.version,
        insecureHTTP: false,
        apiVersion: "v1",
      }
      loaded.rum.init({
        applicationId: "portfolio",
        ...shared,
        trackResources: true,
        trackLongTasks: true,
        trackUserInteractions: true,
        defaultPrivacyLevel: "mask-user-input",
        sessionSampleRate: 100,
        sessionReplaySampleRate: 0,
      })
      loaded.logs.init({ ...shared, forwardErrorsToLogs: true })
      sdks = loaded
      return true
    } catch {
      return false
    }
  })()
  return started
}

export function log(level: Level, message: string, context?: Record<string, unknown>): void {
  sdks?.logs.logger[level](message, context)
}

export function __resetObservabilityForTests(): void {
  sdks = null
  started = null
}
