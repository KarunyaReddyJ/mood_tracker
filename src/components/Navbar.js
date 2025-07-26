"use client";
import Link from 'next/link'
import { useSession, signIn, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();
  return (
    <nav className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-md">
      <div className="text-xl font-bold">
        <Link href="/">MyApp</Link>
      </div>
      <div className="space-x-4 flex items-center">
        <Link href="/" className="hover:underline">Home</Link>
        <Link href="/analytics" className="hover:underline">Analytics</Link>
        <Link href="/contact" className="hover:underline">Contact</Link>
        {status === "authenticated" ? (
          <div className="flex items-center space-x-2 ml-4">
            {session.user?.image && (
              <img src={session.user.image} alt="Profile" className="w-8 h-8 rounded-full border-2 border-white" />
            )}
            <span className="font-medium">{session.user?.name}</span>
            <button
              onClick={() => signOut()}
              className="ml-2 px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn("google")}
            className="ml-4 px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
}
