import { StackServerApp } from "@stackframe/stack";
import { client } from "./client";

export const server = new StackServerApp({
  projectId: process.env.STACK_PROJECT_ID!,
  secretServerKey: process.env.STACK_SECRET_SERVER_KEY!,
  inheritsFrom: client,     // ⭐ REQUIRED NOW
});
