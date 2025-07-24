"use client"

import DataStore from "../utils/DataStore";
import MoodEntryDisplay from "../components/MoodEntryDisplay"
import { useState, useEffect } from 'react'
import constants from "../utils/constants";
import { useMoodReminder } from "@/hooks/useMoodReminder";


export default function Home() {
  const [previousEntries, setPreviousEntries] = useState([]);
  useMoodReminder()
  useEffect(() => {
    const subscribeToPush = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready

        

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: 'BADv7bd3Bcm-zcq0g4MdBV2qIzPC8NvbQuv7HJc-SZ5RyCAswXr6YRCpAJOipyRNYEhcoKf1FfEwWnlfKKv2eHs'
        })

        console.log('Push subscription:', subscription)

        // Save to backend if needed
        await fetch('/api/save-subscription', {
          method: 'POST',
          body: JSON.stringify(subscription)
        })
      }
    }

    const fun = async () => {
      const store = new DataStore(constants.backend)
      const entries = await store.get('entries', '[]')
      const parsedEntries = JSON.parse(entries) || []
      if (parsedEntries.length < 5)
        setPreviousEntries(parsedEntries)
      else
        setPreviousEntries(parsedEntries.slice(-5))
    }
    fun()
    subscribeToPush()
    return () => {

    };
  }, []);

  return (
    <div>
      {
        previousEntries.map(entry => {
          return (<MoodEntryDisplay mood={entry['mood']} time={entry['time']} key={entry['time']} />)
        })
      }
    </div>
  );
}
