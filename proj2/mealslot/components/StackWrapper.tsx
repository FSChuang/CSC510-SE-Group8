"use client";

import { StackTheme } from "@stackframe/stack";
import React from 'react';

export default function StackWrapper() {
    return (
        <StackTheme>
            <div>
                <h2>Login / Signup</h2>
                <p>
                    Use the StackHandler routes at <code>/handler/sign-up</code> or <code>/handler/login</code>.
                </p>
            </div>
        </StackTheme>
    );
}
