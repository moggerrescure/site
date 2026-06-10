// __MAILER_V1__
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

const DRY_RUN = process.env.SMTP_DRY_RUN !== "0";
const HOST = process.env.SMTP_HOST || "smtp.yandex.ru";
const PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const USER = process.env.SMTP_USER || "";
const PASS = process.env.SMTP_PASS || "";
const FROM = process.env.SMTP_FROM || (USER ? `"Память" <${USER}>` : '"Память" <noreply@localhost>');
const LOG  = path.join(__dirname, "..", "logs", "mailer.log");

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: HOST, port: PORT, secure: PORT === 465,
    auth: USER && PASS ? { user: USER, pass: PASS } : undefined,
  });
  return transporter;
}

async function sendMail({ to, subject, html, text }) {
  const ts = new Date().toISOString();
  if (DRY_RUN) {
    const entry = `\n=== ${ts} | DRY_RUN | to=${to} | subject=${subject} ===\n${text || html}\n`;
    try { fs.appendFileSync(LOG, entry); } catch (e) { console.error("[mailer] log write failed:", e.message); }
    console.log(`[mailer] DRY_RUN -> ${to} | ${subject}`);
    return { ok: true, dryRun: true };
  }
  try {
    const info = await getTransporter().sendMail({ from: FROM, to, subject, html, text });
    fs.appendFileSync(LOG, `\n${ts} | OK | ${to} | ${subject} | msgId=${info.messageId}\n`);
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    fs.appendFileSync(LOG, `\n${ts} | ERR | ${to} | ${subject} | ${e.message}\n`);
    console.error("[mailer] send failed:", e.message);
    return { ok: false, error: e.message };
  }
}

module.exports = { sendMail };
