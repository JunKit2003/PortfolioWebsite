import { useEffect, useState } from "react"

import { formatVisits, recordVisit } from "@/lib/api"

// One request per page load, even when React StrictMode runs effects twice.
let pending: Promise<number | null> | undefined

function safeStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function VisitCounter({ className }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const storage = safeStorage()
    if (!storage) return
    pending ??= recordVisit(storage)
    let active = true
    void pending.then((value) => {
      if (active) setCount(value)
    })
    return () => {
      active = false
    }
  }, [])

  if (count === null) return null
  return <p className={className}>{formatVisits(count)}</p>
}
