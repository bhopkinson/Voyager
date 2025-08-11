"use client";

import React from 'react';

export default function TagInput({
  value,
  onChange,
  placeholder = 'Add a tag...'
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/tags`, { cache: 'no-store' });
        const tags = await res.json();
        setSuggestions((tags || []).map((t: string) => (t || '').toLowerCase()).slice(0, 10));
      } catch {
        setSuggestions([]);
      }
    };
    load();
  }, []);

  React.useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function addTag(tag: string) {
    const t = (tag || '').trim().toLowerCase();
    if (!t) return;
    if (value.includes(t)) return;
    onChange([...value, t]);
    setInput('');
    setOpen(false);
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  const baseSuggestions = (suggestions || [])
    .filter((s) => !value.includes(s))
    .slice(0, 10);

  const filtered = (suggestions || [])
    .filter((s) => s.toLowerCase().includes(input.toLowerCase()))
    .filter((s) => !value.includes(s))
    .slice(0, 10);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex flex-wrap gap-2 rounded-md border border-slate-300 p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-xs">
            {t}
            <button type="button" onClick={() => removeTag(t)} className="text-blue-600 hover:text-blue-800">×</button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
            if (e.key === ',' ) { e.preventDefault(); addTag(input); }
            if (e.key === 'Backspace' && input === '' && value.length) {
              removeTag(value[value.length - 1]);
            }
          }}
          placeholder={placeholder}
          className="min-w-[160px] flex-1 outline-none"
        />
      </div>
      {open && (filtered.length > 0 || input.trim() || baseSuggestions.length > 0) && (
        <div className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow">
          {(input.trim() ? filtered : baseSuggestions).map((s) => (
            <button key={s} type="button" onClick={() => addTag(s)} className="block w-full text-left px-3 py-2 hover:bg-slate-50">
              {s}
            </button>
          ))}
          {input.trim() && !value.includes(input.trim().toLowerCase()) && !suggestions.includes(input.trim().toLowerCase()) && (
            <button type="button" onClick={() => addTag(input)} className="block w-full text-left px-3 py-2 hover:bg-slate-50">
              Create “{input.trim().toLowerCase()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
