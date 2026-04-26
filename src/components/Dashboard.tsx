import React from 'react';
import { Building2, UserCheck, UsersRound, TriangleAlert, ArrowRight, User, UserX, UserMinus, Percent, HeartPulse, ShieldAlert, PieChart, MapPin, TrendingUp, AlertCircle, Clock, MoveUp, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import OrganizationChart from './OrganizationChart';
import { Facility } from '../types';

export default function Dashboard({ state }: { state: ReturnType<typeof import('../useAppState').useAppState> }) {
  const { facilities, staffEntries } = state;

  let overQuotaCount = 0;
  let attachedCount = 0;
  let totalVacantSlots = 0;
  let totalSystemQuota = 0;
  let nonFunctioningCount = 0;
  let subStandardInfraCount = 0;
  const vacanciesByPos: Record<string, number> = {};

  facilities.forEach(f => {
    if (f.status === 'Non-Functioning') nonFunctioningCount++;
    if (f.infrastructureStatus === 'Sub-standard') subStandardInfraCount++;

    (f.customQuotas || []).forEach(q => {
      totalSystemQuota += q.max;
      const occupied = staffEntries.filter(s => s.facilityId === f.id && s.position === q.position).length;
      if (q.max > 0 && occupied > q.max) overQuotaCount++;
      if (q.max > occupied) {
        const vacant = q.max - occupied;
        totalVacantSlots += vacant;
        vacanciesByPos[q.position] = (vacanciesByPos[q.position] || 0) + vacant;
      }
    });
  });

  const attachedStaff = staffEntries.filter(s => s.facilityId !== s.currentFacilityId || s.dutyStatus === "Attached");
  attachedCount = attachedStaff.length;

  const staffOnLeave = staffEntries.filter(s => s.activeStatus === 'Leave').length;
  const quotaFulfillment = totalSystemQuota > 0 ? Math.round((staffEntries.length / totalSystemQuota) * 100) : 0;

  const topVacancies = Object.entries(vacanciesByPos)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5);

  // 1. Vacancy Rate by Facility Type
  const quotaByFacType: Record<string, { quota: number, occupied: number }> = {};
  // 2. Top Shortage Locations
  const shortagesByLocation: Record<string, number> = {};
  // 3. Over-Quota/Surplus Details
  const overQuotaDetails: { facName: string, position: string, surplus: number }[] = [];

  facilities.forEach(f => {
    if (!quotaByFacType[f.type]) quotaByFacType[f.type] = { quota: 0, occupied: 0 };
    
    const loc = f.township ? `${f.township} (${f.state})` : f.state || 'Unknown Location';
    
    (f.customQuotas || []).forEach(q => {
      const occupied = staffEntries.filter(s => s.facilityId === f.id && s.position === q.position).length;
      quotaByFacType[f.type].quota += q.max;
      quotaByFacType[f.type].occupied += occupied;
      
      if (q.max > occupied) {
        shortagesByLocation[loc] = (shortagesByLocation[loc] || 0) + (q.max - occupied);
      }
      
      if (occupied > q.max) {
        overQuotaDetails.push({ facName: f.name, position: q.position, surplus: occupied - q.max });
      }
    });
  });

  const vacancyRatesByType = Object.entries(quotaByFacType).map(([type, stats]) => {
     const vac = Math.max(0, stats.quota - stats.occupied);
     const rate = stats.quota > 0 ? Math.round((vac / stats.quota) * 100) : 0;
     return { type, vacant: vac, rate };
  }).sort((a, b) => b.rate - a.rate).slice(0, 5);

  const topShortageLocations = Object.entries(shortagesByLocation)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5);

  const topSurpluses = overQuotaDetails
    .sort((a,b) => b.surplus - a.surplus)
    .slice(0, 5);

  // 4. Recent Activities
  const recentActivities = [
    ...facilities.map(f => ({ id: f.id, type: 'Facility', msg: `Added facility: ${f.name} (${f.type})`, time: new Date(f.id) })),
    ...staffEntries.map(s => {
       const fac = facilities.find(f => f.id === s.facilityId) || { name: s.externalFacilityName || 'Unknown' };
       return { id: s.id, type: 'Staff', msg: `Recruited ${s.position} at ${fac.name}`, time: new Date(s.id) };
    })
  ].filter(a => a.id > 10000000000).sort((a, b) => b.id - a.id).slice(0, 8);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const [selectedPositions, setSelectedPositions] = React.useState<string[]>([]);
  const [searchResults, setSearchResults] = React.useState<{ facility: Facility; position: string; vacant: number }[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isDesignationDropdownOpen, setIsDesignationDropdownOpen] = React.useState(false);

  const togglePosition = (pos: string) => {
    setSelectedPositions(prev => 
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  };

  const handleSearch = () => {
    const results: { facility: Facility; position: string; vacant: number }[] = [];
    facilities.forEach(f => {
      (f.customQuotas || []).forEach(q => {
        if (selectedPositions.includes(q.position)) {
          const occupied = staffEntries.filter(s => s.currentFacilityId === f.id && s.position === q.position).length;
          const vacant = q.max - occupied;
          if (vacant > 0) {
            results.push({ facility: f, position: q.position, vacant });
          }
        }
      });
    });
    setSearchResults(results.sort((a,b) => b.vacant - a.vacant));
    setIsSearching(true);
  };

  return (
    <div className="space-y-12">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <h2 className="text-4xl font-black text-slate-900 font-display tracking-tight leading-none">System Intelligence</h2>
        <p className="text-slate-500 text-[16px] mt-3 font-medium">စနစ်တစ်ခုလုံး၏ အချက်အလက်များကို တစ်နေရာတည်းတွင် ကြည့်ရှုခြင်း</p>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {/* Card 1: Active Facilities */}
        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50/50 rounded-full blur-3xl group-hover:bg-blue-100/60 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-blue-50/80 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1 leading-none">Facilities Overview</p>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-4xl font-black text-slate-900 font-display">{facilities.length}</h3>
            <span className="text-[11px] font-bold text-slate-300">UNITS</span>
          </div>
          {(nonFunctioningCount > 0 || subStandardInfraCount > 0) && (
             <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider mt-3">
               {nonFunctioningCount > 0 && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">{nonFunctioningCount} Non-functioning</span>}
               {subStandardInfraCount > 0 && <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded border border-orange-100">{subStandardInfraCount} Sub-standard</span>}
             </div>
          )}
        </motion.div>

        {/* Card 2: Quota Fulfillment */}
        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50/50 rounded-full blur-3xl group-hover:bg-emerald-100/60 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
            <Percent className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1 leading-none">Global Fulfillment</p>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-4xl font-black text-slate-900 font-display">{quotaFulfillment}%</h3>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 mb-2">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, quotaFulfillment)}%` }} />
          </div>
          <p className="text-xs text-slate-500 font-medium">{totalSystemQuota} Total System Slots</p>
        </motion.div>

        {/* Card 3: Global Personnel */}
        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50/50 rounded-full blur-3xl group-hover:bg-indigo-100/60 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
            <UserCheck className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1 leading-none">Global Personnel</p>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-4xl font-black text-slate-900 font-display">{staffEntries.length}</h3>
            <span className="text-[11px] font-bold text-slate-300">STAFF</span>
          </div>
          <div className="flex gap-2 text-[10px] uppercase font-bold tracking-wider mt-3">
             <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">{staffEntries.filter(s => s.activeStatus === 'Active' || !s.activeStatus).length} Active</span>
          </div>
        </motion.div>

        {/* Card 4: Total Vacancies */}
        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-yellow-50/50 rounded-full blur-3xl group-hover:bg-yellow-100/60 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-yellow-50/80 flex items-center justify-center text-yellow-600 mb-4 group-hover:scale-110 transition-transform">
            <UserX className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1 leading-none">Total Vacancies</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-yellow-600 font-display">{totalVacantSlots}</h3>
            <span className="text-[11px] font-bold text-slate-300">SLOTS</span>
          </div>
          {overQuotaCount > 0 && (
             <p className="mt-3 text-xs text-red-500 font-bold flex items-center gap-1"><TriangleAlert className="w-3 h-3" /> {overQuotaCount} facilities over quota</p>
          )}
        </motion.div>

        {/* Card 5: Attached Records */}
        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50/50 rounded-full blur-3xl group-hover:bg-purple-100/60 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-purple-50/80 flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
            <UsersRound className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1 leading-none">Attached Records</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-purple-600 font-display">{attachedCount}</h3>
            <span className="text-[11px] font-bold text-slate-300">TRANSFERS</span>
          </div>
        </motion.div>

        {/* Card 6: Staff On Leave */}
        <motion.div variants={item} className="glass-card p-6 rounded-[2rem] border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all group overflow-hidden relative">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50/50 rounded-full blur-3xl group-hover:bg-orange-100/60 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-orange-50/80 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
            <UserMinus className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1 leading-none">Staff On Leave</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-black text-orange-600 font-display">{staffOnLeave}</h3>
            <span className="text-[11px] font-bold text-slate-300">PERSONNEL</span>
          </div>
        </motion.div>
      </motion.div>

      {/* VACANCY FINDER SECTION */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-[2.5rem] border border-slate-200/60 p-8 shadow-sm bg-white/50"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
           <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
               <ShieldAlert className="w-7 h-7" />
             </div>
             <div>
               <h3 className="text-2xl font-black text-slate-900 font-display">လစ်လပ်ရာထူး ရှာဖွေရေး (Vacancy Finder)</h3>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Search for vacant positions across the system</p>
             </div>
           </div>
           <button 
             onClick={handleSearch}
             disabled={selectedPositions.length === 0}
             className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
           >
             ရှာဖွေမည် (Search)
           </button>
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Designations to check</span>
              <button onClick={() => setSelectedPositions([])} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Clear All</button>
           </div>
           
           <div className="relative">
             <button
               onClick={() => setIsDesignationDropdownOpen(!isDesignationDropdownOpen)}
               className="w-full flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:border-emerald-300 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
             >
               <span className="truncate">
                 {selectedPositions.length === 0 ? 'Select designations...' : `${selectedPositions.length} designation(s) selected`}
               </span>
               <ChevronDown className="w-4 h-4 text-slate-400" />
             </button>

             {isDesignationDropdownOpen && (
               <>
                 <div className="fixed inset-0 z-10" onClick={() => setIsDesignationDropdownOpen(false)} />
                 <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-80 overflow-y-auto p-2">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                     {[...(state.positionsList || [])].sort((a,b) => ((a.rank ?? 99) - (b.rank ?? 99)) || a.name.localeCompare(b.name)).map(pos => (
                       <button
                         key={pos.name}
                         onClick={() => togglePosition(pos.name)}
                         className={`w-full px-3 py-2.5 rounded-lg text-[12px] font-bold transition-all text-left flex items-center gap-2 ${selectedPositions.includes(pos.name) ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'}`}
                       >
                         <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedPositions.includes(pos.name) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300 bg-white'}`}>
                           {selectedPositions.includes(pos.name) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                         </div>
                         <span className="truncate">{pos.name}</span>
                       </button>
                     ))}
                   </div>
                 </div>
               </>
             )}
           </div>
        </div>

        {isSearching && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-12 bg-slate-50/50 rounded-[2rem] border border-slate-200/60 overflow-hidden"
          >
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Search Results ({searchResults.length})</h4>
              <span className="text-[10px] font-bold text-slate-400 italic">Showing all facilities with vacancies for selected roles</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Facility Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-center">Designation</th>
                    <th className="px-6 py-4 text-center">Vacancies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-display">
                  {searchResults.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic">No vacancies found for the selected positions.</td>
                    </tr>
                  ) : (
                    searchResults.map((res, i) => (
                      <tr key={`${res.facility.id}-${res.position}`} className="hover:bg-white transition-colors group">
                        <td className="px-6 py-5 font-black text-slate-800 text-sm">{res.facility.name}</td>
                        <td className="px-6 py-5">
                           <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-100 group-hover:bg-white">{res.facility.type}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs text-slate-500 font-bold flex items-center gap-1.5 leading-none">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {[res.facility.township, res.facility.state].filter(Boolean).join(', ')}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="text-xs font-black text-blue-600">{res.position}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-red-600 font-black shadow-sm group-hover:border-red-200">
                             {res.vacant}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-12 w-full"
      >
        <OrganizationChart facilities={facilities} staffEntries={staffEntries} subdepartmentsMap={state.subdepartmentsMap} />
      </motion.div>

      {/* NEW DASHBOARD WIDGETS */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12"
      >
        {/* Critical Vacancies Widget */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
           <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                <HeartPulse className="w-5 h-5" />
             </div>
             <div>
               <h3 className="text-sm font-black text-slate-900 font-display leading-tight">Critical Vacancies</h3>
               <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Highest Shortages</p>
             </div>
           </div>
           
           <div className="flex-1 flex flex-col gap-3">
             {topVacancies.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center space-y-2 py-4">
                   <ShieldAlert className="w-6 h-6 opacity-50" />
                   <p className="text-sm font-medium">No critical vacancies detected.</p>
                </div>
             ) : (
                topVacancies.map(([position, vacantCount], idx) => (
                  <div key={position} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-red-100 hover:bg-red-50 transition-colors">
                     <span className="font-bold text-slate-700 text-sm group-hover:text-red-700">{position}</span>
                     <div className="flex items-center gap-2">
                       <span className="text-xs text-slate-400 font-medium uppercase min-w-[60px] text-right">Short by</span>
                       <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-red-600 font-black shadow-sm group-hover:border-red-200">
                         {vacantCount}
                       </span>
                     </div>
                  </div>
                ))
             )}
           </div>
        </div>
        {/* Widget 1: Vacancy Rate by Facility Type */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
               <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-display leading-tight">Vacancy Rate</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">By Facility Type</p>
            </div>
          </div>
          <div className="flex-1 space-y-4">
             {vacancyRatesByType.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-4">No data available</div>
             ) : (
                vacancyRatesByType.map(item => (
                  <div key={item.type} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                       <span className="text-slate-700 truncate pr-2">{item.type}</span>
                       <span className="text-indigo-600">{item.rate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, item.rate)}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">{item.vacant} slots vacant</span>
                  </div>
                ))
             )}
          </div>
        </div>

        {/* Widget 2: Top Shortage Locations */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
               <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-display leading-tight">Top Shortages</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">By Location</p>
            </div>
          </div>
          <div className="flex-1 space-y-3">
             {topShortageLocations.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-4">No shortages found</div>
             ) : (
                topShortageLocations.map(([loc, count]) => (
                  <div key={loc} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                     <span className="text-xs font-bold text-slate-700 truncate pr-2">{loc}</span>
                     <span className="bg-orange-100 text-orange-700 text-xs font-black px-2 py-0.5 rounded-md min-w-[32px] text-center">
                       {count}
                     </span>
                  </div>
                ))
             )}
          </div>
        </div>

        {/* Widget 3: Over-Quota/Surplus Staff */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
               <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-display leading-tight">Surplus Staff</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Over Quota</p>
            </div>
          </div>
          <div className="flex-1 space-y-3">
             {topSurpluses.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-4">No surplus staff</div>
             ) : (
                topSurpluses.map((s, idx) => (
                  <div key={idx} className="flex flex-col p-3 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden group">
                     <div className="flex items-start justify-between z-10">
                       <span className="text-xs font-bold text-slate-700 truncate pr-2">{s.facName}</span>
                       <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-md">
                         +{s.surplus}
                       </span>
                     </div>
                     <span className="text-[10px] text-slate-500 font-medium mt-1 z-10">{s.position}</span>
                  </div>
                ))
             )}
          </div>
        </div>

        {/* Widget 4: Recent Activities */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col h-full lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500">
               <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 font-display leading-tight">Recent Activity</h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">System Logs</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] custom-scroll pr-1">
            <div className="space-y-4">
               {recentActivities.length === 0 ? (
                  <div className="text-center text-slate-400 text-xs py-4">No recent activity</div>
               ) : (
                  recentActivities.map((act, idx) => (
                    <div key={idx} className="flex gap-3 relative">
                      {idx !== recentActivities.length - 1 && (
                        <div className="absolute left-[7px] top-6 bottom-[-16px] w-[2px] bg-slate-100" />
                      )}
                      <div className="w-4 h-4 rounded-full bg-sky-100 border-2 border-white shadow-sm flex-shrink-0 mt-1" />
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-700 font-medium leading-snug break-words pr-2">{act.msg}</span>
                        <span className="text-[10px] text-slate-400 font-bold mt-1">
                           {act.time.toLocaleDateString()} {act.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
               )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-12 group"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-purple-500 rounded-full" />
            <h3 className="text-xl font-black text-slate-900 font-display">Attached Personnel Status</h3>
          </div>
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.1em]">Current Transfers</p>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-200/60 shadow-2xl shadow-slate-200/40 overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
              <tr>
                <th className="px-8 py-6">Position</th>
                <th className="px-8 py-6">Source (Origin)</th>
                <th className="px-8 py-6 text-center">Movement</th>
                <th className="px-8 py-6">Destination (Current)</th>
                <th className="px-8 py-6">Protocol/Reason</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {attachedStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center">
                     <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300">
                          <User className="w-6 h-6" />
                        </div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none">No active attachments</p>
                     </div>
                  </td>
                </tr>
              ) : (
                attachedStaff.map((s, idx) => {
                  const getFacility = (id: number, ext: string = '') => facilities.find(f => f.id === id) || { name: ext || 'EXT-OFFICE', type: '' };
                  const homeFac = getFacility(s.facilityId, s.externalFacilityName);
                  const currFac = getFacility(s.currentFacilityId);
                  
                  return (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + (idx * 0.05) }}
                      key={s.id} 
                      className="hover:bg-slate-50/50 transition-colors group/row"
                    >
                      <td className="px-8 py-5">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider group-hover/row:bg-purple-50 group-hover/row:text-purple-600 transition-colors border border-slate-200/50">
                          {s.position}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-slate-500 font-bold text-[13px]">{homeFac.name}</td>
                      <td className="px-8 py-5 text-center">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mx-auto text-purple-400 group-hover/row:scale-110 transition-transform">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </td>
                      <td className="px-8 py-5 text-purple-600 font-black text-[13px]">{currFac.name}</td>
                      <td className="px-8 py-5">
                        <div className="max-w-[200px]">
                           <p className="text-[11px] text-slate-400 font-medium italic line-clamp-2 leading-relaxed">
                            {s.reason || "Standard placement override"}
                           </p>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
