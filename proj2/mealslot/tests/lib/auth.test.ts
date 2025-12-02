import { describe, it, expect } from "vitest";
import { getMockUser } from "@/lib/auth";

describe("getMockUser", () => {
  it("returns a user with the expected fixed values", () => {
    const user = getMockUser();

    expect(user).toEqual({
      id: "user_mock_1",
      name: "Mock User",
      email: "mock@example.com",
    });
  });

  it("returns a valid UserIdentity shape", () => {
    const user = getMockUser();

    // basic shape checks
    expect(typeof user.id).toBe("string");
    expect(typeof user.name).toBe("string");
    expect(typeof user.email).toBe("string");
  });
});
