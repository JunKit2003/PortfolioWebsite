import { Router } from "express"
import { z } from "zod"

import type { Deps } from "../app.js"
import { initModels } from "../models.js"
import { limiter } from "../rateLimit.js"

const visitSchema = z.object({ visitorId: z.uuid() })

export function visitsRouter(deps: Deps): Router {
  const { Visit } = initModels(deps.sequelize)
  const router = Router()

  router.post("/", limiter(60 * 1000, 30), async (req, res, next) => {
    try {
      const parsed = visitSchema.safeParse(req.body ?? {})
      if (!parsed.success) {
        res.status(400).json({ error: "validation" })
        return
      }
      const visitDate = deps.now().toISOString().slice(0, 10) // UTC calendar day
      // ON CONFLICT DO NOTHING: a repeat visit the same day (even a concurrent one) is a no-op.
      await Visit.bulkCreate([{ visitorId: parsed.data.visitorId.toLowerCase(), visitDate }], {
        ignoreDuplicates: true,
      })
      res.json({ count: await Visit.count() })
    } catch (err) {
      next(err)
    }
  })

  router.get("/count", async (_req, res, next) => {
    try {
      res.json({ count: await Visit.count() })
    } catch (err) {
      next(err)
    }
  })

  return router
}
