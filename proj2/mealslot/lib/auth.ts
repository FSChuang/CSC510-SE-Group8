// Phase 1: MockAuth (no secrets needed). Later we can add Auth.js with Google.
// This file exports minimal identity surface for server-side seeding/tests.

export type UserIdentity = { id: string; name: string; email: string };

export function getMockUser(): UserIdentity {
  return { id: "user_mock_1", name: "Mock User", email: "mock@example.com" };
}
