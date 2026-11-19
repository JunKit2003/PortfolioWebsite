import { z } from "zod"

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().min(1),
  MAIL_TO: z.string().min(1),
})

export type Config = {
  port: number
  databaseUrl: string
  smtp: { host: string; port: number; secure: boolean; user?: string; pass?: string }
  mailFrom: string
  mailTo: string
}

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  // Treat empty strings as unset so `SMTP_USER=` in .env means "no auth".
  const cleaned = Object.fromEntries(Object.entries(env).filter(([, value]) => value !== ""))
  const result = envSchema.safeParse(cleaned)
  if (!result.success) {
    const keys = [...new Set(result.error.issues.map((issue) => String(issue.path[0])))]
    throw new Error(`Invalid or missing environment settings: ${keys.join(", ")}`)
  }
  const e = result.data
  return {
    port: e.PORT,
    databaseUrl: e.DATABASE_URL,
    smtp: { host: e.SMTP_HOST, port: e.SMTP_PORT, secure: e.SMTP_SECURE, user: e.SMTP_USER, pass: e.SMTP_PASS },
    mailFrom: e.MAIL_FROM,
    mailTo: e.MAIL_TO,
  }
}
