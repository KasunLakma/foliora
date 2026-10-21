"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/modules/auth/actions";

export default function LoginPage() {
    const [state, action, pending] = useActionState(loginAction, undefined);

    return (
        <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
            <h1 className="text-2xl font-semibold">Sign in to Foliora</h1>
            <form action={action} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm">
                    Email
                    <input name="email" type="email" required autoComplete="email" className="rounded border px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Password
                    <input name="password" type="password" required autoComplete="current-password" className="rounded border px-3 py-2" />
                </label>
                {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
                <button disabled={pending} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
                    {pending ? "Signing in..." : "Sign in"}
                </button>
            </form>
            <p className="text-sm">
                No account? <Link href="/register" className="underline">Create one</Link>
            </p>
        </main>
    );
}