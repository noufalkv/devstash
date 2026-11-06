// Set SKIP_EMAIL_VERIFICATION="true" to turn email verification off (restart the server after changing it).
export function isEmailVerificationEnabled(): boolean {
  return process.env.SKIP_EMAIL_VERIFICATION !== "true";
}
