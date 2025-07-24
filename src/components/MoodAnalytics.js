"use client"
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import DataStore from '@/utils/DataStore'
import constants from '@/utils/constants'

export default function MoodAnalytics() {
  const [hourlyStats, setHourlyStats] = useState([])
  const [topBins, setTopBins] = useState([])
  const [bottomBins, setBottomBins] = useState([])

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      const store = new DataStore(constants.backend)
      const dataRaw = await store.get('entries', '[]')
      const entries = JSON.parse(dataRaw || '[]')

      const moodByHour = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        moods: []
      }))

      entries.forEach(entry => {
        const date = new Date(entry.time)
        const hour = date.getHours()
        if (!isNaN(hour)) {
          moodByHour[hour].moods.push(entry.mood)
        }
      })

      const statPerHour = moodByHour.map(({ hour, moods }) => {
        if (moods.length === 0) return { hour, min: null, max: null, avg: null }
        const sum = moods.reduce((a, b) => a + b, 0)
        return {
          hour,
          min: Math.min(...moods),
          max: Math.max(...moods),
          avg: parseFloat((sum / moods.length).toFixed(2)),
        }
      })

      setHourlyStats(statPerHour)

      // Top 3 happiest bins
      const validStats = statPerHour.filter(e => e.avg !== null)
      const sortedDesc = [...validStats].sort((a, b) => b.avg - a.avg)
      const sortedAsc = [...validStats].sort((a, b) => a.avg - b.avg)

      setTopBins(sortedDesc.slice(0, 3))
      setBottomBins(sortedAsc.slice(0, 3))
    }

    fetchAndAnalyze()
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 p-6  rounded-2xl shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">📊 Mood Stats by Hour</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded-xl">
          <h3 className="text-lg font-bold text-green-700">🥇 Happiest 3 Hours</h3>
          <ul className="mt-2 text-green-800">
            {topBins.map(bin => (
              <li key={bin.hour}>
                Hour {bin.hour}: Avg {bin.avg}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-red-100 p-4 rounded-xl">
          <h3 className="text-lg font-bold text-red-700">😞 Saddest 3 Hours</h3>
          <ul className="mt-2 text-red-800">
            {bottomBins.map(bin => (
              <li key={bin.hour}>
                Hour {bin.hour}: Avg {bin.avg}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={hourlyStats}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="hour" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Line type="monotone" dataKey="avg" stroke="#3b82f6" strokeWidth={2} name="Avg Mood" />
          <Line type="monotone" dataKey="max" stroke="#22c55e" strokeDasharray="5 5" name="Max Mood" />
          <Line type="monotone" dataKey="min" stroke="#ef4444" strokeDasharray="4 4" name="Min Mood" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
