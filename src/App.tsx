/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LayoutDashboard, Building2, Users, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { useAppState } from './useAppState';
import Dashboard from './components/Dashboard';
import Facilities from './components/Facilities';
import StaffList from './components/StaffList';
import Settings from './components/Settings';

export default function App() {
  const state = useAppState();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'facilities' | 'staff' | 'settings'>('facilities');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!state.isLoaded) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const NavButton = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => {
          setActiveTab(id as any);
          setIsMobileMenuOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-sm font-medium text-left ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 font-semibold'
            : 'text-slate-600 hover:bg-slate-200/50'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
        {label}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#fcfcfc] text-slate-800 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-md text-white">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold">HR ပေါ်တယ်</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block w-full md:w-64 bg-slate-50 border-r border-slate-200 p-6 shrink-0 flex flex-col h-screen md:sticky top-0 z-10 overflow-y-auto`}>
        <div className="hidden md:flex items-center gap-3 mb-10">
          <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">HR ပေါ်တယ်</h1>
        </div>
        <nav className="space-y-1.5 flex-1">
          <NavButton id="dashboard" icon={LayoutDashboard} label="အကျဉ်းချုပ် (Dashboard)" />
          <NavButton id="facilities" icon={Building2} label="ဌာနနှင့် ဝန်ထမ်းခန့်ထားမှု" />
          <NavButton id="staff" icon={Users} label="ဝန်ထမ်းများ စာရင်း" />
          <NavButton id="settings" icon={SettingsIcon} label="စနစ် ဆက်တင်များ" />
        </nav>
        <div className="pt-6 mt-6 text-[11px] text-slate-400 text-center font-medium">
          Clean UI Version • React
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          {activeTab === 'dashboard' && <Dashboard state={state} />}
          {activeTab === 'facilities' && <Facilities state={state} />}
          {activeTab === 'staff' && <StaffList state={state} />}
          {activeTab === 'settings' && <Settings state={state} />}
        </div>
      </main>
    </div>
  );
}
