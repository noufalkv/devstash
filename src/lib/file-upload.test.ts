import { describe, expect, it } from "vitest";

import { formatFileSize, getExtension, resolveContentType, validateFile } from "@/lib/file-upload";

const MB = 1024 * 1024;

describe("validateFile", () => {
  it("accepts an allowed image", () => {
    expect(validateFile("image", { name: "a.PNG", size: 1000, type: "image/png" })).toBeNull();
  });

  it("rejects an image with a wrong MIME type or extension", () => {
    expect(validateFile("image", { name: "a.png", size: 1000, type: "text/plain" })).not.toBeNull();
    expect(validateFile("image", { name: "a.bmp", size: 1000, type: "image/bmp" })).not.toBeNull();
  });

  it("rejects an image over 5 MB but allows a 5 MB file type up to 10 MB", () => {
    expect(validateFile("image", { name: "a.png", size: 5 * MB + 1, type: "image/png" })).toMatch(/5\.0 MB/);
    expect(validateFile("file", { name: "a.pdf", size: 10 * MB, type: "application/pdf" })).toBeNull();
    expect(validateFile("file", { name: "a.pdf", size: 10 * MB + 1, type: "application/pdf" })).toMatch(/10\.0 MB/);
  });

  it("accepts files whose browser MIME type is empty or generic", () => {
    expect(validateFile("file", { name: "config.toml", size: 10, type: "" })).toBeNull();
    expect(validateFile("file", { name: "a.ini", size: 10, type: "application/octet-stream" })).toBeNull();
  });

  it("rejects disallowed file types and empty files", () => {
    expect(validateFile("file", { name: "run.exe", size: 10, type: "" })).not.toBeNull();
    expect(validateFile("file", { name: "a.pdf", size: 10, type: "image/png" })).not.toBeNull();
    expect(validateFile("file", { name: "a.txt", size: 0, type: "text/plain" })).toBe("The file is empty");
  });
});

describe("image MIME handling", () => {
  it("accepts image aliases and empty types for allowed extensions", () => {
    expect(validateFile("image", { name: "a.jpg", size: 10, type: "image/jpg" })).toBeNull();
    expect(validateFile("image", { name: "a.png", size: 10, type: "image/x-png" })).toBeNull();
    expect(validateFile("image", { name: "a.webp", size: 10, type: "" })).toBeNull();
  });

  it("names the mismatch when the type is wrong", () => {
    expect(validateFile("image", { name: "a.png", size: 10, type: "text/plain" })).toMatch(
      /does not match/,
    );
  });

  it("stores images under a canonical type", () => {
    expect(resolveContentType("image", { name: "a.JPG", type: "" })).toBe("image/jpeg");
    expect(resolveContentType("file", { name: "a.toml", type: "" })).toBe("application/octet-stream");
  });
});

describe("helpers", () => {
  it("reads the lowercase extension", () => {
    expect(getExtension("Archive.TAR.GZ")).toBe(".gz");
    expect(getExtension("README")).toBe("");
  });

  it("formats sizes", () => {
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(3 * MB)).toBe("3.0 MB");
  });
});
