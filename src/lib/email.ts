/**
 * Sends a plain-text email through Resend (https://resend.com).
 * Without RESEND_API_KEY nothing is sent and false is returned, so the rest of the app still works.
 * Note: until a domain is verified in Resend, it only delivers to the Resend account owner's own address.
 */
export async function sendEmail(message: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const from = process.env.EMAIL_FROM || "Foliora <onboarding@resend.dev>";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        reply_to: message.replyTo,
      }),
    });
    if (!response.ok) console.warn("Email was not sent:", response.status, await response.text());
    return response.ok;
  } catch (error) {
    console.warn("Email was not sent:", error);
    return false;
  }
}
