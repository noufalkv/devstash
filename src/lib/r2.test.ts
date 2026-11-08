import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("@aws-sdk/client-s3", () => {
  class S3Client {
    send = mocks.send;
  }
  class Command {
    constructor(public input: unknown) {}
  }
  class PutObjectCommand extends Command {}
  class DeleteObjectCommand extends Command {}
  class GetObjectCommand extends Command {}
  return { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand };
});

import {
  buildFileKey,
  deleteFromR2,
  getFromR2,
  isOwnedKey,
  uploadToR2,
} from "@/lib/r2";

beforeEach(() => {
  mocks.send.mockReset();
  vi.stubEnv("R2_ACCOUNT_ID", "acc");
  vi.stubEnv("R2_ACCESS_KEY_ID", "key");
  vi.stubEnv("R2_SECRET_ACCESS_KEY", "secret");
  vi.stubEnv("R2_BUCKET_NAME", "bucket");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("buildFileKey", () => {
  it("namespaces by user and sanitizes the name", () => {
    const key = buildFileKey("user-1", "my spec/../v2?.pdf");

    expect(key.startsWith("user-1/")).toBe(true);
    expect(key).toMatch(/^user-1\/[0-9a-f-]{36}-my_spec_.._v2_\.pdf$/);
  });

  it("generates a unique key each time", () => {
    expect(buildFileKey("u", "a.txt")).not.toBe(buildFileKey("u", "a.txt"));
  });
});

describe("isOwnedKey", () => {
  it("only accepts keys under the user's prefix", () => {
    expect(isOwnedKey("u1", "u1/abc-a.txt")).toBe(true);
    expect(isOwnedKey("u1", "u2/abc-a.txt")).toBe(false);
    expect(isOwnedKey("u1", "u10/abc-a.txt")).toBe(false);
  });

  it("rejects path traversal", () => {
    expect(isOwnedKey("u1", "u1/../u2/a.txt")).toBe(false);
  });
});

describe("uploadToR2 and deleteFromR2", () => {
  it("puts the object in the configured bucket", async () => {
    mocks.send.mockResolvedValue({});

    await uploadToR2("u1/a.png", Buffer.from("x"), "image/png");

    expect(mocks.send.mock.calls[0][0].input).toMatchObject({
      Bucket: "bucket",
      Key: "u1/a.png",
      ContentType: "image/png",
    });
  });

  it("deletes the object by key", async () => {
    mocks.send.mockResolvedValue({});

    await deleteFromR2("u1/a.png");

    expect(mocks.send.mock.calls[0][0].input).toEqual({
      Bucket: "bucket",
      Key: "u1/a.png",
    });
  });

  it("throws when R2 is not configured", async () => {
    vi.stubEnv("R2_BUCKET_NAME", "");

    await expect(deleteFromR2("u1/a.png")).rejects.toThrow("not configured");
    expect(mocks.send).not.toHaveBeenCalled();
  });
});

describe("getFromR2", () => {
  it("returns the stream with its metadata", async () => {
    const stream = new ReadableStream();
    mocks.send.mockResolvedValue({
      Body: { transformToWebStream: () => stream },
      ContentType: "image/png",
      ContentLength: 5,
    });

    expect(await getFromR2("u1/a.png")).toEqual({
      body: stream,
      contentType: "image/png",
      contentLength: 5,
    });
  });

  it("returns null when the object is missing", async () => {
    mocks.send.mockRejectedValue(Object.assign(new Error("gone"), { name: "NoSuchKey" }));

    expect(await getFromR2("u1/missing.png")).toBeNull();
  });

  it("returns null for an empty body and rethrows other errors", async () => {
    mocks.send.mockResolvedValueOnce({ Body: undefined });
    expect(await getFromR2("u1/a.png")).toBeNull();

    mocks.send.mockRejectedValueOnce(new Error("network"));
    await expect(getFromR2("u1/a.png")).rejects.toThrow("network");
  });
});
