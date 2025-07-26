"use client";
import React from 'react'
import { SessionProvider } from 'next-auth/react'
import Navbar from './Navbar'
export default function NavComponent() {
    return (
        <div>
            <SessionProvider>
                <Navbar />
            </SessionProvider>
        </div>
    )
}