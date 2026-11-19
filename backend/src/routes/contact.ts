import { Router } from "express"
import { z } from "zod"

import type { Deps } from "../app.js"
import { initModels } from "../models.js"
import { limiter } from "../rateLimit.js"

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100, "Name must be 100 characters or fewer."),
  email: z.string().trim().max(254, "Please enter a valid email.").pipe(z.email("Please enter a valid email.")),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(5000, "Message must be 5000 characters or fewer."),
  website: z.unknown().optional(),
})

export function contactRouter(deps: Deps): Router {
  const { ContactMessage } = initModels(deps.sequelize)
  const router = Router()

  router.post("/", limiter(60 * 60 * 1000, 5), async (req, res, next) => {
    try {
      const parsed = contactSchema.safeParse(req.body ?? {})
      if (!parsed.success) {
        const fields: Record<string, string> = {}
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? "body")
          fields[key] ??= issue.message
        }
        res.status(400).json({ error: "validation", fields })
        return
      }

      const { name, email, message, website } = parsed.data
      // Honeypot: real visitors never see this field, bots fill it in. Pretend success.
      if (website !== undefined && website !== null && website !== "") {
        res.status(202).json({ ok: true })
        return
      }

      const row = await ContactMessage.create({ name, email, message })
      res.status(202).json({ ok: true })

      // Mail after responding so a slow or broken SMTP server never blocks the visitor.
      deps.mailer
        .send({
          to: deps.mail.mailTo,
          from: deps.mail.mailFrom,
          replyTo: email,
          subject: `Portfolio contact from ${name}`,
          text: `From: ${name} <${email}>\nSent: ${row.createdAt.toISOString()}\n\n${message}\n`,
        })
        .then(() => row.update({ emailSentAt: deps.now(), emailError: null }))
        .catch(async (err: unknown) => {
          const reason = err instanceof Error ? err.message : String(err)
          req.log?.error({ err, contactMessageId: row.id }, "contact email failed")
          await row.update({ emailError: reason.slice(0, 2000) }).catch(() => {})
        })
    } catch (err) {
      next(err)
    }
  })

  return router
}
