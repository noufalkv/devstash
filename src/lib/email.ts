import { Resend } from "resend";

const FROM_EMAIL = "Devstash <onboarding@resend.dev>";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const params = new URLSearchParams({ token, email });
  const link = `${baseUrl}/verify-email?${params.toString()}`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject: "Verify your Devstash email",
    html: `<p>Welcome to Devstash!</p><p><a href="${link}">Verify your email address</a></p><p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`,
  });

  return !error;
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const params = new URLSearchParams({ token, email });
  const link = `${baseUrl}/reset-password?${params.toString()}`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [email],
    subject: "Reset your Devstash password",
    html: `<p>We received a request to reset your Devstash password.</p><p><a href="${link}">Reset your password</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  });

  return !error;
}
