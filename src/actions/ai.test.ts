import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  isAiConfigured: vi.fn(),
  responsesCreate: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/openai", () => ({
  AI_MODEL: "test-model",
  isAiConfigured: mocks.isAiConfigured,
  getOpenAI: () => ({ responses: { create: mocks.responsesCreate } }),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  rateLimitMessage: () => "Too many attempts. Please try again in 5 minutes.",
}));

import { generateAutoTags, generateDescription } from "./ai";

const validInput = {
  type: "snippet",
  title: "useAuth hook",
  content: "export function useAuth() {}",
  existingTags: ["react"],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubEnv("ENFORCE_PRO_LIMITS", "true");
  mocks.auth.mockResolvedValue({ user: { id: "u1", isPro: true } });
  mocks.isAiConfigured.mockReturnValue(true);
  mocks.checkRateLimit.mockResolvedValue({ success: true, remaining: 19, reset: 0 });
  mocks.responsesCreate.mockResolvedValue({
    output_text: '{"tags": ["React", "hooks", "auth", "React"]}',
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("generateAutoTags", () => {
  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);

    expect(await generateAutoTags(validInput)).toEqual({
      success: false,
      error: "You must be signed in",
    });
    expect(mocks.responsesCreate).not.toHaveBeenCalled();
  });

  it("blocks free users when gating is on", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", isPro: false } });

    expect(await generateAutoTags(validInput)).toEqual({
      success: false,
      error: "AI tag suggestions are a Pro feature",
      upgrade: true,
    });
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
    expect(mocks.responsesCreate).not.toHaveBeenCalled();
  });

  it("allows free users when gating is off", async () => {
    vi.stubEnv("ENFORCE_PRO_LIMITS", "");
    mocks.auth.mockResolvedValue({ user: { id: "u1", isPro: false } });

    expect((await generateAutoTags(validInput)).success).toBe(true);
  });

  it("returns an error when OpenAI is not configured", async () => {
    mocks.isAiConfigured.mockReturnValue(false);

    const result = await generateAutoTags(validInput);
    expect(result.success).toBe(false);
    expect(mocks.responsesCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid input without using rate-limit quota", async () => {
    const result = await generateAutoTags({ ...validInput, title: "   " });

    expect(result).toEqual({ success: false, error: "Add a title first" });
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns the rate-limit message when the user is over the limit", async () => {
    mocks.checkRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: 0 });

    expect(await generateAutoTags(validInput)).toEqual({
      success: false,
      error: "Too many attempts. Please try again in 5 minutes.",
      rateLimited: true,
    });
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("ai", "u1");
    expect(mocks.responsesCreate).not.toHaveBeenCalled();
  });

  it("calls the Responses API in JSON mode with truncated content", async () => {
    await generateAutoTags({ ...validInput, content: "z".repeat(5000) });

    const request = mocks.responsesCreate.mock.calls[0][0];
    expect(request.model).toBe("test-model");
    expect(request.text).toEqual({ format: { type: "json_object" } });
    expect(request.input).toContain("JSON");
    expect(request.input).toContain("z".repeat(2000));
    expect(request.input).not.toContain("z".repeat(2001));
  });

  it("returns normalized tags without existing ones", async () => {
    expect(await generateAutoTags(validInput)).toEqual({
      success: true,
      data: { tags: ["hooks", "auth"] },
    });
  });

  it("accepts a bare array response", async () => {
    mocks.responsesCreate.mockResolvedValue({ output_text: '["Git", "CLI"]' });

    expect(await generateAutoTags(validInput)).toEqual({
      success: true,
      data: { tags: ["git", "cli"] },
    });
  });

  it("returns an error when the model gives no usable tags", async () => {
    mocks.responsesCreate.mockResolvedValue({ output_text: "" });

    expect(await generateAutoTags(validInput)).toEqual({
      success: false,
      error: "No tag suggestions found",
    });
  });

  it("returns a generic error when the API call fails", async () => {
    mocks.responsesCreate.mockRejectedValue(new Error("429 quota"));

    const result = await generateAutoTags(validInput);
    expect(result.success).toBe(false);
    expect(result.error).toBe("AI suggestions are unavailable right now. Please try again.");
  });
});

describe("generateDescription", () => {
  const descriptionInput = {
    type: "snippet",
    title: "useAuth hook",
    content: "export function useAuth() {}",
    language: "typescript",
    tags: ["react", " ", "auth "],
  };

  beforeEach(() => {
    mocks.responsesCreate.mockResolvedValue({
      output_text: ' "A React hook that returns the signed-in user." ',
    });
  });

  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);

    expect(await generateDescription(descriptionInput)).toEqual({
      success: false,
      error: "You must be signed in",
    });
    expect(mocks.responsesCreate).not.toHaveBeenCalled();
  });

  it("blocks free users when gating is on", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", isPro: false } });

    expect(await generateDescription(descriptionInput)).toEqual({
      success: false,
      error: "AI descriptions are a Pro feature",
      upgrade: true,
    });
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns an error when OpenAI is not configured", async () => {
    mocks.isAiConfigured.mockReturnValue(false);

    const result = await generateDescription(descriptionInput);
    expect(result.success).toBe(false);
    expect(mocks.responsesCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid input without using rate-limit quota", async () => {
    const result = await generateDescription({ ...descriptionInput, title: "" });

    expect(result).toEqual({ success: false, error: "Add a title first" });
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it("returns the rate-limit message when the user is over the limit", async () => {
    mocks.checkRateLimit.mockResolvedValue({ success: false, remaining: 0, reset: 0 });

    expect(await generateDescription(descriptionInput)).toEqual({
      success: false,
      error: "Too many attempts. Please try again in 5 minutes.",
      rateLimited: true,
    });
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("ai", "u1");
    expect(mocks.responsesCreate).not.toHaveBeenCalled();
  });

  it("sends the inputs as plain text and returns the cleaned description", async () => {
    expect(await generateDescription(descriptionInput)).toEqual({
      success: true,
      data: { description: "A React hook that returns the signed-in user." },
    });

    const request = mocks.responsesCreate.mock.calls[0][0];
    expect(request.model).toBe("test-model");
    expect(request.text).toBeUndefined();
    expect(request.store).toBe(false);
    expect(request.input).toContain("Title: useAuth hook");
    expect(request.input).toContain("Language: typescript");
    expect(request.input).toContain("Tags: react, auth\n");
    expect(request.input).toContain("export function useAuth() {}");
  });

  it("works with only a title", async () => {
    const result = await generateDescription({ type: "link", title: "Docs" });

    expect(result.success).toBe(true);
    expect(mocks.responsesCreate.mock.calls[0][0].input).toBe("Type: link\nTitle: Docs");
  });

  it("returns an error when the model gives an empty reply", async () => {
    mocks.responsesCreate.mockResolvedValue({ output_text: "  " });

    expect(await generateDescription(descriptionInput)).toEqual({
      success: false,
      error: "Could not generate a description",
    });
  });

  it("returns a generic error when the API call fails", async () => {
    mocks.responsesCreate.mockRejectedValue(new Error("429 quota"));

    expect(await generateDescription(descriptionInput)).toEqual({
      success: false,
      error: "AI suggestions are unavailable right now. Please try again.",
    });
  });
});
