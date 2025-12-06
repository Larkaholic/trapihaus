import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRateLimiter } from "@/lib/security/rateLimiter";

const limiter = createRateLimiter({ windowMs: 60_000, max: 10 }); // 10 req/min per IP

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

function getClientIp(req: NextRequest): string {
  const xfwd = req.headers.get("x-forwarded-for");
  if (xfwd) return xfwd.split(",")[0].trim();
  const xreal = req.headers.get("x-real-ip");
  if (xreal) return xreal.trim();
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return "unknown";
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const check = limiter(ip);
  if (!check.allowed) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": String(check.retryAfter) },
    });
  }

  const json = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { name, email, subject, message } = parsed.data;

  // Log the contact message (in production, send to email service or store in DB)
  console.log("Contact form submission:", {
    name,
    email,
    subject,
    message,
    ip,
    timestamp: new Date().toISOString(),
  });

  // TODO: Implement email notification using a service like:
  // - Resend (resend.com) - recommended for Next.js
  // - SendGrid
  // - AWS SES
  // - Nodemailer with SMTP

  return NextResponse.json({ 
    ok: true,
    message: "Message received. We'll get back to you shortly."
  });
}
