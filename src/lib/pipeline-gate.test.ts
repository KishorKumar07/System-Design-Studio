import { describe, it, expect } from "vitest";

// TEMPORARY: deliberately failing test to prove the Jenkins pipeline stops at
// the Test stage and never deploys. Revert this commit after the check.
describe("pipeline gate", () => {
  it("fails on purpose so a broken build cannot reach production", () => {
    expect(1 + 1).toBe(3);
  });
});
