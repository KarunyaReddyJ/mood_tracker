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
    const fun = async()=>{
      const store =new  DataStore(constants.backend)
      const entries =await store.get('entries','[]')
      const parsedEntries = JSON.parse(entries) || []
      if(parsedEntries.length<5)
        setPreviousEntries(parsedEntries)
      else
        setPreviousEntries(parsedEntries.slice(-5))
    }
    fun()
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
