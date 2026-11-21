import OpenAI from "openai";

// gpt-5-nano is deprecated (shutdown 2026-12-11); set OPENAI_MODEL to override.
export const AI_MODEL = process.env.OPENAI_MODEL || "gpt-6-luna";

let client: OpenAI | null = null;

// Created on first use so the app runs without OpenAI configured. Users wait on a button,
// so fail fast instead of the SDK's 10-minute timeout and 2 retries.
export function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI is not configured");
  client ??= new OpenAI({ apiKey, timeout: 30_000, maxRetries: 1 });
  return client;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
