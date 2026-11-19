export type ContactInput = { name: string; email: string; message: string; website: string }
export type ContactField = "name" | "email" | "message"
export type FieldErrors = Partial<Record<ContactField, string>>
export type ContactResult = "ok" | "rate_limited" | "error" | { fields: FieldErrors }

export const LIMITS = { name: 100, email: 254, messageMin: 10, messageMax: 5000 } as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VISITOR_KEY = "visitor-id"

/** Mirrors the API's rules so most mistakes are caught before sending. */
export function validateContact(input: ContactInput): FieldErrors {
  const errors: FieldErrors = {}
  const name = input.name.trim()
  const email = input.email.trim()
  const message = input.message.trim()
  if (!name) errors.name = "Please enter your name."
  else if (name.length > LIMITS.name) errors.name = `Name must be ${LIMITS.name} characters or fewer.`
  if (!EMAIL_PATTERN.test(email) || email.length > LIMITS.email) errors.email = "Please enter a valid email."
  if (message.length < LIMITS.messageMin) errors.message = "Message must be at least 10 characters."
  else if (message.length > LIMITS.messageMax) errors.message = `Message must be ${LIMITS.messageMax} characters or fewer.`
  return errors
}

export async function sendContact(input: ContactInput): Promise<ContactResult> {
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (res.status === 202) return "ok"
    if (res.status === 429) return "rate_limited"
    if (res.status === 400) {
      const body = (await res.json().catch(() => null)) as { fields?: FieldErrors } | null
      if (body?.fields) return { fields: body.fields }
    }
    return "error"
  } catch {
    return "error"
  }
}

export function getVisitorId(storage: Storage): string {
  const existing = storage.getItem(VISITOR_KEY)
  if (existing && UUID_PATTERN.test(existing)) return existing
  const id = crypto.randomUUID()
  storage.setItem(VISITOR_KEY, id)
  return id
}

/** Records today's visit and returns the total, or null if anything goes wrong. */
export async function recordVisit(storage: Storage): Promise<number | null> {
  try {
    const res = await fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: getVisitorId(storage) }),
    })
    if (!res.ok) return null
    const body = (await res.json()) as { count?: unknown }
    return typeof body.count === "number" ? body.count : null
  } catch {
    return null
  }
}

export function formatVisits(count: number): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? "visit" : "visits"}`
}
