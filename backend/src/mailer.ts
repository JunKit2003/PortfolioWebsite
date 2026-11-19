import nodemailer from "nodemailer"

import type { Config } from "./config.js"

export type MailMessage = { to: string; from: string; replyTo: string; subject: string; text: string }

export type Mailer = { send(msg: MailMessage): Promise<void> }

export function createSmtpMailer(smtp: Config["smtp"]): Mailer {
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  })
  return {
    async send(msg) {
      await transport.sendMail(msg)
    },
  }
}
