// src/app/api/auth/route.ts
import { NextResponse } from "next/server";
import * as actions from "@/app/actions";

export async function POST(req: Request) {
    try {
        const body = await req.json(); // extract JSON payload
        const { action, email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 });
        }

        if (action === "login") {
            const result = await actions.login(email, password);
            if (!result) {
                return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
            }
            return NextResponse.json(result);
        } else if (action === "register") {
            const result = await actions.register(email, password);
            return NextResponse.json(result);
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }
    } catch (err) {
        console.error("Auth route error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
