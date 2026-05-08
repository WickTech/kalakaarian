import { describe, it, expect } from "vitest";
import { isWorkEmail, emailDomain, emailWarning } from "./emailValidation";

describe("emailDomain", () => {
  it("extracts domain from valid email", () => {
    expect(emailDomain("priya@brand.com")).toBe("brand.com");
  });
  it("lowercases domain", () => {
    expect(emailDomain("user@Brand.COM")).toBe("brand.com");
  });
  it("returns empty string for no @", () => {
    expect(emailDomain("notanemail")).toBe("");
  });
});

describe("isWorkEmail", () => {
  it("rejects gmail", () => expect(isWorkEmail("user@gmail.com")).toBe(false));
  it("rejects yahoo.in", () => expect(isWorkEmail("user@yahoo.in")).toBe(false));
  it("rejects outlook", () => expect(isWorkEmail("user@outlook.com")).toBe(false));
  it("accepts brand domain", () => expect(isWorkEmail("priya@mybrand.com")).toBe(true));
  it("accepts co.in domain", () => expect(isWorkEmail("ops@company.co.in")).toBe(true));
  it("returns false for empty", () => expect(isWorkEmail("")).toBe(false));
});

describe("emailWarning", () => {
  it("returns null for empty string", () => expect(emailWarning("")).toBeNull());
  it("returns null for work email", () => expect(emailWarning("cmo@acmecorp.com")).toBeNull());
  it("returns warning string for gmail", () => {
    expect(emailWarning("user@gmail.com")).toContain("work/business email");
  });
});
