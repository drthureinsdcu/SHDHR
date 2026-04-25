import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Facility } from '../types';

export default function FacilitySelect({ 
  value, 
  onChange, 
  facilities, 
  excludeId, 
  placeholder = "ပင်မဌာန ရွေးချယ်ပါ..." 
}: { 
  value: number | undefined, 
  onChange: (val: number | undefined) => void, 
  facilities: Facility[], 
  excludeId?: number,
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const selectedFacility = facilities.find(f => f.id === value);
  const filtered = facilities
    .filter(f => f.id !== excludeId)
    .filter(f => !search || f.name.toLowerCase().includes(search.toLowerCase()) || f.type.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 100);

  return (
    <div className="relative w-full text-sm" ref={wrapperRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 hover:bg-slate-50 transition-colors"
      >
        <span className={selectedFacility ? "text-slate-800 font-medium truncate" : "text-slate-400"}>
          {selectedFacility ? `${selectedFacility.name} (${selectedFacility.type})` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400 ml-1 shrink-0" />
            <input 
               autoFocus
               type="text"
               value={search}
               onChange={e => setSearch(e.target.value)}
               placeholder="ရှာပါ..."
               className="w-full bg-transparent outline-none text-sm text-slate-700"
            />
          </div>
          <div className="max-h-60 overflow-y-auto custom-scroll p-1">
            <button
               type="button"
               onClick={() => { onChange(undefined); setIsOpen(false); setSearch(''); }}
               className="w-full text-left px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors italic"
            >
              (ပင်မဌာန မရှိပါ)
            </button>
            {filtered.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => { onChange(f.id); setIsOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex flex-col ${f.id === value ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                <span className="font-bold truncate">{f.name}</span>
                <span className="text-[10px] uppercase tracking-wide opacity-70">{f.type}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="p-3 text-center text-slate-500 text-xs text-muted-foreground">ရှာမတွေ့ပါ</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
