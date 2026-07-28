import { describe, it, expect } from "vitest";
import { createAppSchema } from "../validators";

describe("createAppSchema", () => {
  describe("name", () => {
    it("should reject empty name", () => {
      expect(createAppSchema.name("")).toBe("Name must be at least 2 characters");
    });

    it("should reject short name", () => {
      expect(createAppSchema.name("A")).toBe("Name must be at least 2 characters");
    });

    it("should accept valid name", () => {
      expect(createAppSchema.name("My App")).toBeNull();
    });

    it("should reject long name", () => {
      expect(createAppSchema.name("A".repeat(65))).toBe("Name must be at most 64 characters");
    });
  });

  describe("slug", () => {
    it("should reject empty slug", () => {
      expect(createAppSchema.slug("")).toBe("Slug is required");
    });

    it("should reject slug with uppercase", () => {
      expect(createAppSchema.slug("My-App")).toBe(
        "Slug must contain only lowercase letters, numbers, and hyphens",
      );
    });

    it("should reject slug with special characters", () => {
      expect(createAppSchema.slug("my app!")).toBe(
        "Slug must contain only lowercase letters, numbers, and hyphens",
      );
    });

    it("should accept valid slug", () => {
      expect(createAppSchema.slug("my-app-1")).toBeNull();
    });

    it("should reject too short slug", () => {
      expect(createAppSchema.slug("a")).toBe("Slug must be at least 2 characters");
    });
  });

  describe("domain", () => {
    it("should accept valid URL", () => {
      expect(createAppSchema.domain("https://example.com")).toBeNull();
    });

    it("should accept null", () => {
      expect(createAppSchema.domain(null)).toBeNull();
    });

    it("should accept undefined", () => {
      expect(createAppSchema.domain(undefined)).toBeNull();
    });

    it("should reject invalid URL", () => {
      expect(createAppSchema.domain("not-a-url")).toBe("Invalid URL");
    });
  });
});
