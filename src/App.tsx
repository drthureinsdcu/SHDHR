/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { LayoutDashboard, Building2, Users, Settings as SettingsIcon, Menu, X, ChevronRight, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppState } from './useAppState';
import { translations } from './translations';
import Dashboard from './components/Dashboard';
import Facilities from './components/Facilities';
import StaffList from './components/StaffList';
import Settings from './components/Settings';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useRole } from './contexts/RoleContext';
import Login from './components/Login';

export default function App() {
  const state = useAppState();
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'facilities' | 'staff' | 'settings'>('facilities');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  if (!state.user && state.isLoaded) {
    return <Login />;
  }

  if (!state.isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium font-display animate-pulse">
           {state.language === 'en' ? 'Loading system...' : 'စနစ်အား လုပ်ဆောင်နေပါသည်...'}
        </p>
      </div>
    );
  }

  const NavButton = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => {
          setActiveTab(id as any);
          setIsMobileMenuOpen(false);
        }}
        title={!isSidebarExpanded ? label : undefined}
        className={`w-full flex items-center group py-3 rounded-xl transition-all duration-200 relative ${
          isActive ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-slate-500 hover:bg-slate-200/60 hover:text-slate-800'
        } ${isSidebarExpanded ? 'justify-between px-4' : 'justify-center px-0'}`}
      >
        <div className={`flex items-center ${isSidebarExpanded ? 'gap-3' : 'justify-center w-full'}`}>
          <Icon className={`w-5 h-5 transition-colors flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
          {isSidebarExpanded && (
            <span className={`text-[13px] font-semibold tracking-tight ${isActive ? 'text-white' : 'text-slate-600'} whitespace-nowrap`}>
              {label}
            </span>
          )}
        </div>
        {isActive && (
          <motion.div layoutId="nav-glow" className="absolute inset-0 bg-emerald-500/20 rounded-xl blur-md -z-10" />
        )}
        {isSidebarExpanded && (
          <ChevronRight className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
        )}
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FAFAFB] text-slate-800 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 glass-card border-b border-slate-200 fixed top-0 w-full z-40">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-emerald-200 shadow-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">HR Portal</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          {isMobileMenuOpen ? <X className="w-6 h-6 text-slate-800" /> : <Menu className="w-6 h-6 text-slate-800" />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
        fixed md:sticky top-0 left-0 ${isSidebarExpanded ? 'w-[280px] p-6' : 'w-[88px] p-4'} h-screen bg-white border-r border-slate-200/60 z-40 transition-all duration-300 ease-out flex flex-col
      `}>
        <button 
           onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
           className="hidden md:flex absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-colors z-50"
        >
           <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isSidebarExpanded ? 'rotate-180' : ''}`} />
        </button>

        <div className={`flex items-center ${isSidebarExpanded ? 'gap-3 mb-12' : 'justify-center mb-12'}`}>
          <div className="bg-emerald-600 p-2.5 rounded-xl text-white shadow-xl shadow-emerald-200/50 flex-shrink-0 animate-float">
            <Building2 className="w-6 h-6" />
          </div>
          {isSidebarExpanded && (
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display leading-none truncate">HR Portal</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1 truncate">Staffing Quota</p>
            </div>
          )}
        </div>

        <nav className="space-y-2 flex-1 scroll-smooth">
          {isSidebarExpanded ? (
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-4 ml-4">{translations[state.language].mainMenu}</p>
          ) : (
            <div className="h-4 mb-4 border-b border-transparent" />
          )}
          <NavButton id="dashboard" icon={LayoutDashboard} label={translations[state.language].dashboard} />
          <NavButton id="facilities" icon={Building2} label={translations[state.language].facilities} />
          <NavButton id="staff" icon={Users} label={translations[state.language].staffDirectory} />
          
          <div className="pt-6 mt-6 border-t border-slate-100">
            {role === 'admin' && (
              <>
                {isSidebarExpanded && <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-4 ml-4">{translations[state.language].system}</p>}
                <NavButton id="settings" icon={SettingsIcon} label={translations[state.language].settings} />
              </>
            )}
          </div>
        </nav>

        <div className="pt-6 mt-auto overflow-hidden">
          {isSidebarExpanded && (
            <div className="flex items-center gap-2 mb-4 px-2">
               <button 
                 onClick={() => state.setLanguage('en')} 
                 className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${state.language === 'en' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100'}`}
               >
                 English
               </button>
               <button 
                 onClick={() => state.setLanguage('my')} 
                 className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${state.language === 'my' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-100'}`}
               >
                 မြန်မာ
               </button>
            </div>
          )}
          {isSidebarExpanded ? (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 cursor-pointer" onClick={() => signOut(auth)} title="Sign out">
                 {state.user?.displayName?.charAt(0) || 'U'}
               </div>
               <div className="overflow-hidden">
                  <p className="text-[13px] font-bold text-slate-800 truncate">{state.user?.displayName || translations[state.language].adminUser}</p>
                  <p className="text-[11px] text-slate-500 truncate cursor-pointer hover:text-red-500 transition-colors" onClick={() => signOut(auth)}>Sign out</p>
               </div>
            </div>
          ) : (
            <div className="flex justify-center text-center">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 cursor-pointer" onClick={() => signOut(auth)} title="Sign out">
                 {state.user?.displayName?.charAt(0) || 'U'}
               </div>
            </div>
          )}
          {isSidebarExpanded && (
            <p className="text-[10px] text-slate-400 text-center font-bold tracking-widest mt-6 uppercase whitespace-nowrap">
              Healthcare System v1.2
            </p>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 lg:p-12 mt-16 md:mt-0 min-w-0 bg-slate-50/30">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && <Dashboard state={state} />}
              {activeTab === 'facilities' && <Facilities state={state} />}
              {activeTab === 'staff' && <StaffList state={state} />}
              {activeTab === 'settings' && (
                <ProtectedRoute 
                  allowedRoles={['admin']} 
                  onAccessDenied={() => setActiveTab('dashboard')}
                >
                  <Settings state={state} />
                </ProtectedRoute>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
