import { describe, it, expect } from "vitest";

// Mirror the workflow stage progression logic used in proposal pages
const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ["shortlisted", "rejected"],
  shortlisted: ["accepted", "rejected"],
  accepted: ["content_in_progress"],
  content_in_progress: ["submitted_content"],
  submitted_content: ["under_review"],
  under_review: ["approved", "revision_requested"],
  revision_requested: ["content_in_progress"],
  approved: ["payment_pending"],
  payment_pending: ["payment_released"],
  payment_released: [],
  rejected: [],
  rejected_workflow: [],
};

function canTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

describe("workflow stage transitions", () => {
  it("submitted can move to shortlisted", () => {
    expect(canTransition("submitted", "shortlisted")).toBe(true);
  });
  it("submitted can be rejected", () => {
    expect(canTransition("submitted", "rejected")).toBe(true);
  });
  it("accepted moves to content_in_progress", () => {
    expect(canTransition("accepted", "content_in_progress")).toBe(true);
  });
  it("payment_released has no further transitions", () => {
    expect(canTransition("payment_released", "anything")).toBe(false);
  });
  it("cannot skip stages (submitted → approved)", () => {
    expect(canTransition("submitted", "approved")).toBe(false);
  });
  it("revision can restart content phase", () => {
    expect(canTransition("revision_requested", "content_in_progress")).toBe(true);
  });
});
