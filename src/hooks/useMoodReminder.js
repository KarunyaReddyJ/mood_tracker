"use client"
import { useEffect } from 'react'

export function useMoodReminder(intervalInMinutes = 1) {
  useEffect(() => {
    // Ask permission
    if (Notification.permission !== "granted") {
      Notification.requestPermission()
    }

    const notify = () => {
      if (Notification.permission === "granted") {
        new Notification("🧠 Time to log your mood!", {
          body: "Reflect and record how you're feeling right now 💭",
        //   icon: "/icon.png" // Optional
        })
      }
    }

    const interval = setInterval(notify, intervalInMinutes * 60 * 1000)

    // Optionally notify on page load
    notify()

    return () => clearInterval(interval)
  }, [intervalInMinutes])
}
