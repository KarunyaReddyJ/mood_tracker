"use client"
import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import DataStore from '@/utils/DataStore'
import constants from '@/utils/constants'

// Helper functions
const calculateStats = (moods) => {
  const n = moods.length
  if (n === 0) return { avg: null, std: null, median: null }

  const sum = moods.reduce((a, b) => a + b, 0)
  const avg = sum / n

  const variance = moods.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / n
  const std = Math.sqrt(variance)

  const sorted = [...moods].sort((a, b) => a - b)
  const mid = Math.floor(n / 2)
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]

  return {
    avg: parseFloat(avg.toFixed(2)),
    std: parseFloat(std.toFixed(2)),
    median: parseFloat(median.toFixed(2))
  }
}

export default function MoodAnalytics() {
  const [hourlyStats, setHourlyStats] = useState([])
  const [dailyStats, setDailyStats] = useState([])
  const [topBins, setTopBins] = useState([])
  const [bottomBins, setBottomBins] = useState([])
  const [tagStatsList, setTagStatsList] = useState([])
  const [topTags, setTopTags] = useState([])
  const [bottomTags, setBottomTags] = useState([])
  const [moodStreak, setMoodStreak] = useState({ streak: 0, start: null, end: null });
  const [tagCoOccurrence, setTagCoOccurrence] = useState([]);
  const [moodChangeAfterTag, setMoodChangeAfterTag] = useState([]);
  const [entryCount, setEntryCount] = useState(0);
  const [moodHistogram, setMoodHistogram] = useState([]);
  const [tagPie, setTagPie] = useState([]);
  const [moodCategoryPie, setMoodCategoryPie] = useState([]);
  const [volatilityTable, setVolatilityTable] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [topTagBar, setTopTagBar] = useState([]);
  const [bottomTagBar, setBottomTagBar] = useState([]);
  const [streaksTable, setStreaksTable] = useState([]);
  const [topTagComboBar, setTopTagComboBar] = useState([]);
  const [topTagAndComboBar, setTopTagAndComboBar] = useState([]);
  const [bottomTagAndComboBar, setBottomTagAndComboBar] = useState([]);

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      const store = new DataStore(constants.backend)
      const dataRaw = await store.get('entries', '[]')
      const entries = JSON.parse(dataRaw || '[]')
      setEntryCount(entries.length);

      const moodByHour = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        moods: []
      }))

      const moodByDateMap = {}
      const tagMap = {}

      entries.forEach(entry => {
        const date = new Date(entry.time)
        const hour = date.getHours()
        const dateStr = date.toISOString().split("T")[0]
        const mood = entry.mood

        let tags = []
        if (typeof entry.tags === 'string') {
          tags = entry.tags.split(',').map(tag => tag.trim().toLowerCase())
        } else if (Array.isArray(entry.tags)) {
          tags = entry.tags.map(tag => tag.toLowerCase())
        }

        if (!isNaN(hour)) {
          moodByHour[hour].moods.push(mood)
        }

        if (!moodByDateMap[dateStr]) moodByDateMap[dateStr] = []
        moodByDateMap[dateStr].push(mood)

        tags.forEach(tag => {
          if (!tagMap[tag]) tagMap[tag] = []
          tagMap[tag].push(mood)
        })
      })

      // Hourly stats
      const statPerHour = moodByHour.map(({ hour, moods }) => {
        if (moods.length === 0) return { hour, min: null, max: null, avg: null }
        const { avg } = calculateStats(moods)
        return {
          hour,
          min: Math.min(...moods),
          max: Math.max(...moods),
          avg
        }
      })

      setHourlyStats(statPerHour)

      const validStats = statPerHour.filter(e => e.avg !== null)
      setTopBins([...validStats].sort((a, b) => b.avg - a.avg).slice(0, 3))
      setBottomBins([...validStats].sort((a, b) => a.avg - b.avg).slice(0, 3))

      // Daily stats
      const moodByDate = Object.entries(moodByDateMap).map(([date, moods]) => {
        const { avg, std, median } = calculateStats(moods)
        return {
          date,
          avg,
          std,
          median,
          min: Math.min(...moods),
          max: Math.max(...moods)
        }
      }).sort((a, b) => new Date(a.date) - new Date(b.date))

      setDailyStats(moodByDate)

      // Tag stats
      const tagStats = Object.entries(tagMap).map(([tag, moods]) => {
        const stats = calculateStats(moods)
        return {
          tag,
          count: moods.length,
          avgMood: stats.avg,
          stdDev: stats.std,
          median: stats.median
        }
      })

      setTagStatsList(tagStats.sort((a, b) => b.avgMood - a.avgMood))
      setTopTags([...tagStats].sort((a, b) => b.avgMood - a.avgMood).slice(0, 3))
      setBottomTags([...tagStats].sort((a, b) => a.avgMood - b.avgMood).slice(0, 3))

      // --- Mood Streaks ---
      // Find the longest streak of days with avg mood >= 7
      const sortedDates = Object.keys(moodByDateMap).sort();
      let streak = 0, maxStreak = 0, streakStart = null, streakEnd = null, tempStart = null;
      for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const moods = moodByDateMap[date];
        const avg = calculateStats(moods).avg;
        if (avg >= 7) {
          if (streak === 0) tempStart = date;
          streak++;
          if (streak > maxStreak) {
            maxStreak = streak;
            streakStart = tempStart;
            streakEnd = date;
          }
        } else {
          streak = 0;
        }
      }
      setMoodStreak({ streak: maxStreak, start: streakStart, end: streakEnd });
      // --- Tag Co-occurrence ---
      // Count pairs of tags that appear together
      const coOccurMap = {};
      entries.forEach(entry => {
        let tags = [];
        if (typeof entry.tags === 'string') {
          tags = entry.tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
        } else if (Array.isArray(entry.tags)) {
          tags = entry.tags.map(tag => tag.toLowerCase()).filter(Boolean);
        }
        tags.sort();
        for (let i = 0; i < tags.length; i++) {
          for (let j = i + 1; j < tags.length; j++) {
            const pair = `${tags[i]},${tags[j]}`;
            coOccurMap[pair] = (coOccurMap[pair] || 0) + 1;
          }
        }
      });
      const coOccurArr = Object.entries(coOccurMap)
        .map(([pair, count]) => ({ pair, count, percent: ((count / entries.length) * 100).toFixed(1) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // top 10 pairs
      setTagCoOccurrence(coOccurArr);
      // --- Mood Change After Tag ---
      // For each tag, calculate average mood change after using that tag
      const tagMoodChange = {};
      // Sort entries by time
      const sortedEntries = [...entries].sort((a, b) => new Date(a.time) - new Date(b.time));
      for (let i = 1; i < sortedEntries.length; i++) {
        let prevTags = [];
        if (typeof sortedEntries[i - 1].tags === 'string') {
          prevTags = sortedEntries[i - 1].tags.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
        } else if (Array.isArray(sortedEntries[i - 1].tags)) {
          prevTags = sortedEntries[i - 1].tags.map(tag => tag.toLowerCase()).filter(Boolean);
        }
        const moodChange = sortedEntries[i].mood - sortedEntries[i - 1].mood;
        prevTags.forEach(tag => {
          if (!tagMoodChange[tag]) tagMoodChange[tag] = [];
          tagMoodChange[tag].push(moodChange);
        });
      }
      const tagMoodChangeArr = Object.entries(tagMoodChange)
        .map(([tag, changes]) => ({
          tag,
          avgChange: (changes.reduce((a, b) => a + b, 0) / changes.length).toFixed(2),
          count: changes.length,
          percent: ((changes.length / entries.length) * 100).toFixed(1)
        }))
        .filter(e => e.count >= 2)
        .sort((a, b) => b.avgChange - a.avgChange)
        .slice(0, 10); // top 10 tags by mood change
      setMoodChangeAfterTag(tagMoodChangeArr);

      // --- Mood Distribution Histogram ---
      const moodCounts = Array(10).fill(0);
      entries.forEach(e => {
        if (e.mood >= 1 && e.mood <= 10) moodCounts[e.mood - 1]++;
      });
      setMoodHistogram(moodCounts.map((count, i) => ({ mood: i + 1, count })));
      // --- Tag Usage Pie ---
      const tagCountMap = {};
      entries.forEach(e => {
        let tags = [];
        if (typeof e.tags === 'string') tags = e.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        else if (Array.isArray(e.tags)) tags = e.tags.map(t => t.toLowerCase()).filter(Boolean);
        tags.forEach(tag => { tagCountMap[tag] = (tagCountMap[tag] || 0) + 1; });
      });
      const tagPieArr = Object.entries(tagCountMap).map(([tag, value]) => ({ name: tag, value }));
      setTagPie(tagPieArr);
      // --- Mood Category Pie ---
      let low = 0, med = 0, high = 0;
      entries.forEach(e => {
        if (e.mood <= 3) low++;
        else if (e.mood <= 7) med++;
        else high++;
      });
      setMoodCategoryPie([
        { name: 'Low (1-3)', value: low },
        { name: 'Medium (4-7)', value: med },
        { name: 'High (8-10)', value: high }
      ]);
      // --- Mood Volatility Table ---
      const volatilityArr = Object.entries(moodByDateMap).map(([date, moods]) => {
        const { std } = calculateStats(moods);
        return { date, std };
      }).sort((a, b) => b.std - a.std);
      setVolatilityTable(volatilityArr);
      // --- Heatmap Data (Hour x DayOfWeek) ---
      const heatmap = {};
      entries.forEach(e => {
        const d = new Date(e.time);
        const hour = d.getHours();
        const day = d.getDay(); // 0=Sun
        if (!heatmap[day]) heatmap[day] = {};
        if (!heatmap[day][hour]) heatmap[day][hour] = [];
        heatmap[day][hour].push(e.mood);
      });
      const heatmapArr = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const moods = (heatmap[day] && heatmap[day][hour]) ? heatmap[day][hour] : [];
          heatmapArr.push({ day, hour, avg: moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(2) : null });
        }
      }
      setHeatmapData(heatmapArr);
      // --- Top Positive/Negative Tags Bar ---
      setTopTagBar(tagStats.slice(0, 5).map(t => ({ tag: t.tag, avgMood: t.avgMood })));
      setBottomTagBar(tagStats.slice(-5).map(t => ({ tag: t.tag, avgMood: t.avgMood })));
      // --- Streaks Table ---
      // Find all positive (avg >= 7) and negative (avg <= 3) streaks
      let allStreaks = [], currStreak = null;
      for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        const moods = moodByDateMap[date];
        const avg = calculateStats(moods).avg;
        const type = avg >= 7 ? 'positive' : avg <= 3 ? 'negative' : null;
        if (type) {
          if (!currStreak) currStreak = { type, start: date, end: date, length: 1 };
          else if (currStreak.type === type) { currStreak.end = date; currStreak.length++; }
          else { allStreaks.push(currStreak); currStreak = { type, start: date, end: date, length: 1 }; }
        } else if (currStreak) { allStreaks.push(currStreak); currStreak = null; }
      }
      if (currStreak) allStreaks.push(currStreak);
      setStreaksTable(allStreaks);
      // --- Top Positive & Negative Tags & Combinations Bar ---
      // Collect all tag sets (single, duplet, triplet, etc.)
      const tagSetMap = {};
      entries.forEach(e => {
        let tags = [];
        if (typeof e.tags === 'string') tags = e.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        else if (Array.isArray(e.tags)) tags = e.tags.map(t => t.toLowerCase()).filter(Boolean);
        tags.sort();
        // All non-empty subsets (powerset, except empty set)
        const n = tags.length;
        for (let mask = 1; mask < (1 << n); mask++) {
          const subset = [];
          for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) subset.push(tags[i]);
          }
          if (subset.length > 0) {
            const key = subset.join(',');
            if (!tagSetMap[key]) tagSetMap[key] = [];
            tagSetMap[key].push(e.mood);
          }
        }
      });
      const tagSetArr = Object.entries(tagSetMap)
        .filter(([_, moods]) => moods.length >= 2)
        .map(([label, moods]) => ({
          label,
          avgMood: (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(2),
          count: moods.length
        }));
      const topCombinedArr = [...tagSetArr]
        .sort((a, b) => b.avgMood - a.avgMood)
        .slice(0, 5);
      const bottomCombinedArr = [...tagSetArr]
        .sort((a, b) => a.avgMood - b.avgMood)
        .slice(0, 5);
      setTopTagAndComboBar(topCombinedArr);
      setBottomTagAndComboBar(bottomCombinedArr);
    }

    fetchAndAnalyze()
  }, [])

  return (
    <div className="w-full max-w-5xl mx-auto mt-10 p-6 rounded-2xl shadow-lg bg-white">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">📊 Mood Analytics</h2>

      {/* ⏱️ Time-Based Analysis */}
      <h3 className="text-xl font-semibold text-gray-700 mb-2">⏱️ Mood by Hour</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-green-100 p-4 rounded-xl">
          <h4 className="text-lg font-bold text-green-700">🥇 Happiest Hours</h4>
          <ul className="mt-2 text-green-800">
            {topBins.map(bin => (
              <li key={bin.hour}>Hour {bin.hour}: Avg {bin.avg}</li>
            ))}
          </ul>
        </div>
        <div className="bg-red-100 p-4 rounded-xl">
          <h4 className="text-lg font-bold text-red-700">😞 Saddest Hours</h4>
          <ul className="mt-2 text-red-800">
            {bottomBins.map(bin => (
              <li key={bin.hour}>Hour {bin.hour}: Avg {bin.avg}</li>
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

      {/* 📅 Daily Mood Stats */}
      <h3 className="text-xl font-semibold text-gray-700 mt-10 mb-4">📅 Mood by Day</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dailyStats}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Line type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2} name="Avg Mood" />
          <Line type="monotone" dataKey="max" stroke="#10b981" strokeDasharray="5 5" name="Max Mood" />
          <Line type="monotone" dataKey="min" stroke="#f43f5e" strokeDasharray="4 4" name="Min Mood" />
        </LineChart>
      </ResponsiveContainer>

      {/* 🏷️ Tag Analytics */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">🏷️ Mood by Tag</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-yellow-100 p-4 rounded-xl">
            <h4 className="font-bold text-yellow-800">🔝 Happiest Tags</h4>
            <ul className="mt-2 text-yellow-900">
              {topTags.map(tag => (
                <li key={tag.tag}>
                  {tag.tag} — Avg: {tag.avgMood}, Median: {tag.median}, Std: {tag.stdDev}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-purple-100 p-4 rounded-xl">
            <h4 className="font-bold text-purple-800">🔻 Saddest Tags</h4>
            <ul className="mt-2 text-purple-900">
              {bottomTags.map(tag => (
                <li key={tag.tag}>
                  {tag.tag} — Avg: {tag.avgMood}, Median: {tag.median}, Std: {tag.stdDev}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-blue-100 p-4 rounded-xl md:col-span-2">
            <h4 className="font-bold text-blue-800 mb-2">📋 All Tags</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 text-blue-900">
              {tagStatsList.map(tag => (
                <li key={tag.tag}>
                  {tag.tag} — Avg: {tag.avgMood}, Std: {tag.stdDev}, Count: {tag.count}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* --- Mood Streaks --- */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-black mb-2">🔥 Longest Positive Mood Streak</h3>
        {moodStreak.streak > 0 ? (
          <div className="bg-green-50 p-4 rounded-xl text-black">
            <span className="font-bold">{moodStreak.streak} days</span> from <span className="font-mono">{moodStreak.start}</span> to <span className="font-mono">{moodStreak.end}</span> (avg mood ≥ 7)
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded-xl text-black">No positive mood streaks found.</div>
        )}
      </div>
      {/* --- Tag Co-occurrence --- */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-black mb-2">🔗 Tag Co-occurrence</h3>
        <div className="bg-blue-50 p-4 rounded-xl text-black">
          <ul className="list-disc ml-6">
            {tagCoOccurrence.length > 0 ? tagCoOccurrence.map(pair => (
              <li key={pair.pair}>
                <span className="font-mono">{pair.pair}</span> — <span className="font-bold">{pair.count}</span> times (<span className='font-bold'>{pair.percent}%</span> of entries)
              </li>
            )) : <li>No tag pairs found.</li>}
          </ul>
        </div>
      </div>
      {/* --- Mood Change After Tag --- */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-black mb-2">📈 Mood Change After Tag</h3>
        <div className="bg-purple-50 p-4 rounded-xl text-black">
          <ul className="list-disc ml-6">
            {moodChangeAfterTag.length > 0 ? moodChangeAfterTag.map(tag => (
              <li key={tag.tag}>
                <span className="font-mono">{tag.tag}</span> — Avg mood change: <span className="font-bold">{tag.avgChange}</span> (n={tag.count}, <span className='font-bold'>{tag.percent}%</span> of entries)
              </li>
            )) : <li>No tag mood change data found.</li>}
          </ul>
        </div>
      </div>
      {/* --- Mood Distribution Histogram --- */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-black mb-2">📊 Mood Distribution Histogram</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={moodHistogram}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mood" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* --- Tag Usage Pie --- */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-black mb-2">🏷️ Tag Usage Pie</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={tagPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${((value / entryCount) * 100).toFixed(1)}%)`}>
              {tagPie.map((entry, idx) => <Cell key={`cell-${idx}`} fill={["#6366f1", "#10b981", "#f43f5e", "#f59e42", "#a78bfa", "#fbbf24", "#34d399", "#f87171", "#60a5fa", "#f472b6"][idx % 10]} />)}
            </Pie>
            <Tooltip formatter={(value) => [`${value} (${((value / entryCount) * 100).toFixed(1)}%)`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* --- Mood Category Pie --- */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-black mb-2">😊 Mood Category Pie</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={moodCategoryPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${((value / entryCount) * 100).toFixed(1)}%)`}>
              {moodCategoryPie.map((entry, idx) => <Cell key={`cell-cat-${idx}`} fill={["#f43f5e", "#fbbf24", "#10b981"][idx % 3]} />)}
            </Pie>
            <Tooltip formatter={(value) => [`${value} (${((value / entryCount) * 100).toFixed(1)}%)`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* --- Mood Volatility Table --- */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-black mb-2">📉 Mood Volatility (Std Dev per Day)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Std Dev</th>
              </tr>
            </thead>
            <tbody>
              {volatilityTable.slice(0, 10).map(row => (
                <tr key={row.date}>
                  <td className="px-4 py-2 border text-black">{row.date}</td>
                  <td className="px-4 py-2 border text-black">{row.std}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* --- Heatmap: Mood by Hour and Day --- */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-black mb-2">🌡️ Mood Heatmap (Hour x Day of Week)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-2 py-1 border">Day/Hour</th>
                {[...Array(24).keys()].map(h => <th key={h} className="px-2 py-1 border">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...Array(7).keys()].map(day => (
                <tr key={day}>
                  <td className="px-2 py-1 border text-black font-bold">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}</td>
                  {[...Array(24).keys()].map(hour => {
                    const cell = heatmapData.find(d => d.day === day && d.hour === hour);
                    return <td key={hour} className="px-2 py-1 border text-black" style={{ background: cell && cell.avg ? `rgba(99,102,241,${cell.avg / 10})` : '#f3f4f6' }}>{cell && cell.avg ? cell.avg : '-'}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* --- Top Positive Tags & Combinations Bar --- */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-black mb-2">🏆 Top Positive Tags & Combinations</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={topTagAndComboBar} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 10]} />
            <YAxis dataKey="label" type="category" />
            <Tooltip formatter={(value, name, props) => name === 'avgMood' ? [`${value}`, 'Avg Mood'] : [`${value}`, 'Count']} />
            <Bar dataKey="avgMood" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-sm text-black mt-2">Single tags and tag combinations (min 2 occurrences), top 5 by average mood.</div>
      </div>
      {/* --- Top Negative Tags & Combinations Bar --- */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-black mb-2">😞 Top Negative Tags & Combinations</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={bottomTagAndComboBar} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 10]} />
            <YAxis dataKey="label" type="category" />
            <Tooltip formatter={(value, name, props) => name === 'avgMood' ? [`${value}`, 'Avg Mood'] : [`${value}`, 'Count']} />
            <Bar dataKey="avgMood" fill="#f43f5e" />
          </BarChart>
        </ResponsiveContainer>
        <div className="text-sm text-black mt-2">Single tags and tag combinations (min 2 occurrences), bottom 5 by average mood.</div>
      </div>
      {/* --- Streaks Table --- */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold text-black mb-2">📅 All Mood Streaks</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 border">Type</th>
                <th className="px-4 py-2 border">Start</th>
                <th className="px-4 py-2 border">End</th>
                <th className="px-4 py-2 border">Length (days)</th>
              </tr>
            </thead>
            <tbody>
              {streaksTable.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 border text-black">{row.type}</td>
                  <td className="px-4 py-2 border text-black">{row.start}</td>
                  <td className="px-4 py-2 border text-black">{row.end}</td>
                  <td className="px-4 py-2 border text-black">{row.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
