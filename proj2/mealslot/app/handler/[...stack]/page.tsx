// src/app/handler/[...stack]/page.tsx
import { StackHandler } from "@stackframe/stack";
import { server } from "../../../stack/server";


export default function Handler(props: unknown) {
  return <StackHandler fullPage app={server} routeProps={props} />;
}

