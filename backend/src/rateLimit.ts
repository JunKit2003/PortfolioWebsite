import { rateLimit } from "express-rate-limit"

export function limiter(windowMs: number, limit: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: "rate_limited" })
    },
  })
}
