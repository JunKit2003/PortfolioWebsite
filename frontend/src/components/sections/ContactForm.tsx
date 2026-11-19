import { ArrowUpRight, LoaderCircle } from "lucide-react"
import { type FormEvent, useId, useState } from "react"

import { type ContactField, type FieldErrors, LIMITS, sendContact, validateContact } from "@/lib/api"
import { cn } from "@/lib/utils"

type Status = "idle" | "sending" | "sent"

const GENERAL_ERROR = "Something went wrong. Please try again, or reach me on LinkedIn."
const RATE_LIMITED = "Too many messages. Please try again later."

const fieldClass =
  "w-full rounded-2xl border border-line-strong bg-transparent px-5 py-4 text-base text-fg placeholder:text-fg-faint outline-none transition-colors duration-300 focus:border-fg-muted focus-visible:ring-2 focus-visible:ring-a2/40 aria-[invalid=true]:border-red-400/70"

export function ContactForm() {
  const id = useId()
  const [values, setValues] = useState({ name: "", email: "", message: "", website: "" })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState("")
  const [status, setStatus] = useState<Status>("idle")

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    if (field !== "website" && errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === "sending") return
    setFormError("")
    const found = validateContact(values)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setStatus("sending")
    const result = await sendContact(values)
    if (result === "ok") {
      setStatus("sent")
      return
    }
    setStatus("idle")
    if (result === "rate_limited") setFormError(RATE_LIMITED)
    else if (result === "error") setFormError(GENERAL_ERROR)
    else setErrors(result.fields)
  }

  if (status === "sent") {
    return (
      <p aria-live="polite" className="mt-16 rounded-3xl border border-line bg-bg-elevated/40 p-8 text-xl text-fg md:text-2xl" role="status">
        Thanks, your message is on its way. I&apos;ll get back to you soon.
      </p>
    )
  }

  const field = (name: ContactField) => ({
    id: `${id}-${name}`,
    name,
    value: values[name],
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
    onChange: (event: { target: { value: string } }) => update(name, event.target.value),
  })

  const errorText = (name: ContactField) =>
    errors[name] ? (
      <p className="mt-2 text-sm text-red-400" id={`${id}-${name}-error`}>
        {errors[name]}
      </p>
    ) : null

  return (
    <form aria-label="Send a message" className="mt-16 grid gap-5 md:grid-cols-2" noValidate onSubmit={onSubmit}>
      <div>
        <label className="eyebrow mb-3 block" htmlFor={`${id}-name`}>
          Name
        </label>
        <input autoComplete="name" className={fieldClass} maxLength={LIMITS.name} type="text" {...field("name")} />
        {errorText("name")}
      </div>
      <div>
        <label className="eyebrow mb-3 block" htmlFor={`${id}-email`}>
          Email
        </label>
        <input autoComplete="email" className={fieldClass} inputMode="email" maxLength={LIMITS.email} type="email" {...field("email")} />
        {errorText("email")}
      </div>
      <div className="md:col-span-2">
        <label className="eyebrow mb-3 block" htmlFor={`${id}-message`}>
          Message
        </label>
        <textarea
          className={cn(fieldClass, "min-h-40 resize-y")}
          data-lenis-prevent
          maxLength={LIMITS.messageMax}
          rows={6}
          {...field("message")}
        />
        {errorText("message")}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it in. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input
          autoComplete="off"
          id={`${id}-website`}
          name="website"
          onChange={(event) => update("website", event.target.value)}
          tabIndex={-1}
          type="text"
          value={values.website}
        />
      </div>

      <div className="flex flex-col gap-4 md:col-span-2 md:flex-row md:items-center">
        <button className="ghost-btn justify-center disabled:cursor-wait disabled:opacity-60" disabled={status === "sending"} type="submit">
          {status === "sending" ? (
            <>
              Sending…
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin motion-reduce:animate-none" />
            </>
          ) : (
            <>
              Send message
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </>
          )}
        </button>
        <p aria-live="polite" className="text-sm text-red-400" role="alert">
          {formError}
        </p>
      </div>
    </form>
  )
}
