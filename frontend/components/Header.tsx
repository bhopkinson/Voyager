import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white/70 backdrop-blur border-b border-slate-200">
      <div className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight text-slate-800">Voyager</Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/places/new"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            + Add Place
          </Link>
        </nav>
      </div>
    </header>
  );
}
