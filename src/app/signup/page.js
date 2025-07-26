"use client";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl mb-4">Login</h1>
      <button
        onClick={() => signIn("google", { callbackUrl: "/" })}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Sign up with Google
      </button>
    </div>
  );
}