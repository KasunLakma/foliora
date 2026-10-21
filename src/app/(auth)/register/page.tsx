"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/modules/auth/actions";

export default function RegisterPage() {
    const [state, action, pending] = useActionState(registerAction, undefined);

    return (
        <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 p-6">
            <h1 className="text-2xl font-semibold">Create your Foliora account</h1>
            <form action={action} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1 text-sm">
                    Your name
                    <input name="name" required autoComplete="name" className="rounded border px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Email
                    <input name="email" type="email" required autoComplete="email" className="rounded border px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Password (at least 10 characters)
                    <input name="password" type="password" required minLength={10} autoComplete="new-password" className="rounded border px-3 py-2" />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Account type
                    <select name="accountType" defaultValue="INDIVIDUAL" className="rounded border px-3 py-2">
                        <option value="INDIVIDUAL">Individual (actor, model)</option>
                        <option value="AGENCY">Agency</option>
                    </select>
                </label>
                <label className="flex flex-col gap-1 text-sm">
                    Stage name or agency name
                    <input name="tenantName" required className="rounded border px-3 py-2" />
                </label>
                {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
                <button disabled={pending} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">
                    {pending ? "Creating..." : "Create account"}
                </button>
            </form>
            <p className="text-sm">
                Already registered? <Link href="/login" className="underline">Sign in</Link>
            </p>
        </main>
    );
}