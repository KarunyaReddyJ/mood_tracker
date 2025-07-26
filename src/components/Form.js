"use client"

import { useState } from 'react'
import * as XLSX from 'xlsx'
import DataStore from '@/utils/DataStore'
import constants from '@/utils/constants'

export default function MoodForm({ onSubmit }) {
  const [mood, setMood] = useState('')
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      mood: parseInt(mood),
      tags: tags.split(',').map(tag => tag.trim().toLowerCase()),
      description,
      time: new Date().toISOString()
    }

    if (onSubmit) onSubmit(data)
    setSubmitted(true)

    setMood('')
    setTags('')
    setDescription('')
    setTimeout(() => setSubmitted(false), 2000)
  }

  const parseTags = (rawTags) => {
    console.log('raws',rawTags)
    if (typeof rawTags === 'string') {
      return rawTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    } else if (Array.isArray(rawTags)) {
      return rawTags.map(t => String(t).trim().toLowerCase()).filter(Boolean)
    }
    return []
  }

  const handleXLSXUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json(worksheet)

      const store = new DataStore(constants.backend)
      const existing = await store.get('entries', '[]')
      const parsed = JSON.parse(existing || '[]')

      const newEntries = json.map((row) => ({
        mood: parseInt(row.mood),
        tags: parseTags(row.tags),
        description: row.description || '',
        time: row.time || new Date().toISOString()
      }))

      const updated = [...parsed, ...newEntries]
      await store.set('entries', JSON.stringify(updated))

      console.log(`✅ ${newEntries.length} mood entries added`)
      alert(`✅ ${newEntries.length} entries uploaded successfully`)
    }

    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white rounded-2xl shadow-lg space-y-8 border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-800">Log Your Mood</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mood Score: <span className="font-bold text-blue-700">{mood || 5}</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={mood || 5}
            onChange={(e) => setMood(e.target.value)}
            className="w-full accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
          <input
            type="text"
            placeholder="e.g. coding, gym, food"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What did you do?</label>
          <textarea
            rows="4"
            placeholder="Brief description of what happened..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold"
        >
          Save Mood
        </button>

        {submitted && (
          <p className="text-green-600 font-medium text-center">Mood entry saved!</p>
        )}
      </form>

      <div className="border-t pt-6">
        <label className="block mb-2 font-medium text-gray-700">
          📄 Upload Excel File for Bulk Upload
        </label>
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleXLSXUpload}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-lg file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
        />
        <p className="text-xs text-gray-500 mt-1">
          Expected columns: <code>mood</code>, <code>tags</code>, <code>description</code>, (optional: <code>time</code>)
        </p>
      </div>
    </div>
  )
}
