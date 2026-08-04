"use server";

import { redirect } from "next/navigation";
import { createSession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  const expected = process.env.OWNER_PASSWORD;

  if (!expected || password !== expected) {
    return { error: "Incorrect password." };
  }

  await createSession();
  redirect("/dashboard");
}
