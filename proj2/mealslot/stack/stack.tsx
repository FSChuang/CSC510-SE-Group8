"use client";

import { StackProvider } from "@stackframe/stack";
import { client } from "./client";

export function Stack({ children }: { children: React.ReactNode }) {
  return <StackProvider app={client}>{children}</StackProvider>;
}
