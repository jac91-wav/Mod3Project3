"use client";

import { useRouter } from "next/navigation";
import { type SubmitEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // each button's value is its endpoint: /api/session logs in, /api/users signs up
  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const button = event.nativeEvent.submitter as HTMLButtonElement;
    const form = new FormData(event.currentTarget);

    const res = await fetch(button.value, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });

    if (res.ok) {
      router.replace("/");
      return;
    }

    const data = await res.json().catch(() => ({}));
    setError(data.error ?? "Enter a valid email and a password of 8 to 72 characters");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 font-sans text-slate-900">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-3xl font-bold tracking-tight">Taskboard Demo</h1>

        <label className="block text-sm text-slate-600">
          Email
          <input name="email" type="email" required autoComplete="email" className="field mt-1" />
        </label>

        <label className="block text-sm text-slate-600">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={72}
            autoComplete="current-password"
            className="field mt-1"
          />
        </label>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        <div className="flex gap-2">
          <button type="submit" value="/api/session" className="btn btn-primary">Log in</button>
          <button type="submit" value="/api/users" className="btn btn-secondary">Sign up</button>
        </div>
      </form>
    </div>
  );
}
