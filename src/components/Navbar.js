
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center shadow-md">
      <div className="text-xl font-bold">
        <Link href="/">MyApp</Link>
      </div>
      <div className="space-x-4">
        <Link href="/" className="hover:underline">Home</Link>
        <Link href="/analytics" className="hover:underline">Analytics</Link>
        <Link href="/contact" className="hover:underline">Contact</Link>
      </div>
    </nav>
  )
}
