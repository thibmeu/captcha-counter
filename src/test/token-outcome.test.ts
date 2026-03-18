import { describe, it, expect } from "vitest";
import { tokenOutcome } from "../content/main-world";

describe("tokenOutcome", () => {
  it("returns null when token is unchanged", () => {
    expect(tokenOutcome("abc", "abc")).toBeNull();
    expect(tokenOutcome("", "")).toBeNull();
  });

  it("returns success when a token appears (empty → non-empty)", () => {
    expect(tokenOutcome("", "some-token")).toBe("success");
  });

  it("returns failure when a token is cleared (non-empty → empty)", () => {
    expect(tokenOutcome("some-token", "")).toBe("failure");
  });

  it("returns null when token rotates (non-empty → different non-empty)", () => {
    // Token rotation after a re-challenge — no duplicate event should fire
    expect(tokenOutcome("old-token", "new-token")).toBeNull();
  });
});
