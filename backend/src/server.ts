import { pino } from "pino"

import { createApp } from "./app.js"
import { loadConfig } from "./config.js"
import { createSequelize } from "./db.js"
import { createSmtpMailer } from "./mailer.js"
import { runMigrations } from "./migrate.js"

const log = pino()

async function main() {
  let config
  try {
    config = loadConfig(process.env)
  } catch (err) {
    log.fatal((err as Error).message)
    process.exit(1)
  }

  const sequelize = createSequelize(config.databaseUrl)
  await runMigrations(sequelize)
  log.info("migrations up to date")

  const app = createApp({
    sequelize,
    mailer: createSmtpMailer(config.smtp),
    now: () => new Date(),
    mail: { mailFrom: config.mailFrom, mailTo: config.mailTo },
    logRequests: true,
  })

  const server = app.listen(config.port, () => log.info({ port: config.port }, "api listening"))

  const shutdown = () => {
    log.info("shutting down")
    server.close(() => {
      void sequelize.close().finally(() => process.exit(0))
    })
  }
  process.on("SIGTERM", shutdown)
  process.on("SIGINT", shutdown)
}

main().catch((err) => {
  log.fatal({ err }, "failed to start")
  process.exit(1)
})
