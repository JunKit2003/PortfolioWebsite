import express, { type ErrorRequestHandler, type Express } from "express"
import helmet from "helmet"
import { pinoHttp } from "pino-http"
import type { Sequelize } from "sequelize"

import type { Mailer } from "./mailer.js"
import { contactRouter } from "./routes/contact.js"

export type Deps = {
  sequelize: Sequelize
  mailer: Mailer
  now: () => Date
  mail: { mailFrom: string; mailTo: string }
  logRequests?: boolean
}

export function createApp(deps: Deps): Express {
  const app = express()
  app.set("trust proxy", "loopback")
  app.disable("x-powered-by")
  app.use(helmet())
  if (deps.logRequests) app.use(pinoHttp())
  app.use(express.json({ limit: "16kb" }))

  app.get("/api/health", async (_req, res) => {
    try {
      await deps.sequelize.authenticate()
      res.json({ status: "ok" })
    } catch {
      res.status(503).json({ status: "error" })
    }
  })

  app.use("/api/contact", contactRouter(deps))

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "not_found" })
  })

  const onError: ErrorRequestHandler = (err, req, res, _next) => {
    if (err?.type === "entity.parse.failed") {
      res.status(400).json({ error: "invalid_json" })
      return
    }
    if (err?.type === "entity.too.large") {
      res.status(413).json({ error: "too_large" })
      return
    }
    req.log?.error({ err }, "unhandled error")
    if (!req.log) console.error(err)
    res.status(500).json({ error: "internal" })
  }
  app.use(onError)

  return app
}
