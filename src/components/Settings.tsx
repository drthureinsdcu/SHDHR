import React, { useState } from 'react';
import { Trash2, Plus, ChevronRight, Map, LayoutGrid, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RegionData } from '../types';

export default function Settings({ state }: { state: ReturnType<typeof import('../useAppState').useAppState> }) {
  const { 
    facilityTypes, addFacilityType, deleteFacilityType, 
    globalDefaultQuotas, addQuota, deleteQuota,
    positionsList,
    locations, updateLocations
  } = state;

  const [activeTab, setActiveTab] = useState<'types'|'quotas'|'locations'>('types');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [manageSubDept, setManageSubDept] = useState<string | null>(null);
  const [newSubDept, setNewSubDept] = useState('');

  const [isQuotaOpen, setIsQuotaOpen] = useState(false);
  const [qType, setQType] = useState(facilityTypes[0] || '');
  const [qPos, setQPos] = useState('');
  const [qNewPos, setQNewPos] = useState('');
  const [qCount, setQCount] = useState(1);

  const [filterType, setFilterType] = useState(facilityTypes[0] || '');

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{ step: 1 | 2, message: string, action: () => void } | null>(null);

  const safeDelete = (action: () => void, message: string) => {
    setDeleteConfirm({ step: 1, message, action });
  };

  // Locations state
  const [selReg, setSelReg] = useState('');
  const [selDist, setSelDist] = useState('');
  const [newRegInp, setNewRegInp] = useState('');
  const [newDistInp, setNewDistInp] = useState('');
  const [newTownInp, setNewTownInp] = useState('');

  const handleAddRegion = () => {
    const val = newRegInp.trim();
    if (!val) return;
    if (locations.find(r => r.name === val)) return alert('Region already exists!');
    updateLocations([...locations, { name: val, districts: [] }]);
    setNewRegInp('');
    setSelReg(val);
    setSelDist('');
  };

  const handleAddDistrict = () => {
    const val = newDistInp.trim();
    if (!val || !selReg) return;
    const locs = [...locations];
    const rIdx = locs.findIndex(r => r.name === selReg);
    if (rIdx === -1) return;
    if (locs[rIdx].districts.find(d => d.name === val)) return alert('District already exists!');
    locs[rIdx].districts.push({ name: val, townships: [] });
    updateLocations(locs);
    setNewDistInp('');
    setSelDist(val);
  };

  const handleAddTownship = () => {
    const val = newTownInp.trim();
    if (!val || !selReg || !selDist) return;
    const locs = [...locations];
    const rIdx = locs.findIndex(r => r.name === selReg);
    if (rIdx === -1) return;
    const dIdx = locs[rIdx].districts.findIndex(d => d.name === selDist);
    if (dIdx === -1) return;
    if (locs[rIdx].districts[dIdx].townships.includes(val)) return alert('Township already exists!');
    locs[rIdx].districts[dIdx].townships.push(val);
    updateLocations(locs);
    setNewTownInp('');
  };

  const saveFacType = () => {
    const newType = newTypeName.trim();
    if (newType) {
      addFacilityType(newType);
      
      const valLower = newType.toLowerCase();
      let defaultSubDepts: string[] = [];
      if (valLower.includes('hospital')) {
        defaultSubDepts = ['Maternity', 'Pediatrics', 'Emergency'];
      }

      if (defaultSubDepts.length > 0) {
        defaultSubDepts.forEach(t => {
          if (!facilityTypes.includes(t)) {
            addFacilityType(t);
          }
        });
        const currentMap = state.subdepartmentsMap;
        state.updateSubdepartmentsMap({ ...currentMap, [newType]: defaultSubDepts });
      }

      setIsTypeOpen(false);
      setNewTypeName('');
    }
  }

  const saveNewQuota = () => {
    let fp = qPos === 'ADD_NEW' ? qNewPos.trim() : qPos;
    if (fp) {
      addQuota({
        id: Date.now(),
        type: qType,
        position: fp,
        max: qCount,
        isNewPosition: qPos === 'ADD_NEW',
        newPosName: qNewPos.trim()
      });
      setIsQuotaOpen(false);
    }
  }

  const tabs = [
    { id: 'types', label: 'Facility Types', icon: LayoutGrid },
    { id: 'quotas', label: 'Default Quotas', icon: ShieldCheck },
    { id: 'locations', label: 'Geography', icon: Map },
  ] as const;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
        <div className="max-w-xl">
          <h2 className="text-3xl font-black text-slate-900 font-display leading-tight">System Settings</h2>
          <p className="text-slate-500 text-[15px] mt-2 font-medium">စနစ်အတွင်း အသုံးပြုမည့် အခြေခံအချက်အလက်များအား သတ်မှတ်ရန်</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if (tab.id === 'quotas') setFilterType(facilityTypes[0] || '');
            }}
            className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center gap-2.5 relative ${activeTab === tab.id ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {activeTab === tab.id && (
              <motion.div layoutId="settingTab" className="absolute inset-0 bg-white shadow-md shadow-emerald-500/10 rounded-xl border border-emerald-500/10" />
            )}
            <tab.icon className={`w-4 h-4 relative z-10 ${activeTab === tab.id ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'locations' && (
            <div className="glass-card rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                    <Map className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 font-display">Geography Management</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Regions, Districts & Townships</p>
                  </div>
               </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Regions Column */}
                <div className="flex flex-col bg-slate-50/50 border border-slate-200 rounded-[1.5rem] overflow-hidden h-[500px]">
                  <div className="bg-white p-4 border-b border-slate-200 font-black text-slate-900 text-[11px] uppercase tracking-widest">Region / State</div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scroll">
                    {locations.map(r => (
                      <button key={r.name} onClick={() => { setSelReg(r.name); setSelDist(''); }} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selReg === r.name ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent'}`}>
                        {r.name}
                        {selReg === r.name && <ChevronRight className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-white flex gap-2">
                    <input value={newRegInp} onChange={e=>setNewRegInp(e.target.value)} type="text" placeholder="Add Region..." className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-emerald-500" />
                    <button onClick={handleAddRegion} className="bg-emerald-600 text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-90"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Districts Column */}
                <div className="flex flex-col bg-slate-50/50 border border-slate-200 rounded-[1.5rem] overflow-hidden h-[500px]">
                  <div className="bg-white p-4 border-b border-slate-200 font-black text-slate-900 text-[11px] uppercase tracking-widest">District</div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scroll">
                    {!selReg ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-60">
                         <Map className="w-8 h-8 mb-2" />
                         <p className="text-[10px] font-bold uppercase tracking-widest">Select Region First</p>
                      </div>
                    ) : (() => {
                      const r = locations.find(x => x.name === selReg);
                      if (!r) return null;
                      return r.districts.map(d => (
                        <button key={d.name} onClick={() => setSelDist(d.name)} className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${selDist === d.name ? 'bg-white shadow-md text-emerald-600 border border-emerald-100' : 'text-slate-500 hover:bg-white hover:text-slate-800 border border-transparent'}`}>
                          {d.name}
                          {selDist === d.name && <ChevronRight className="w-4 h-4" />}
                        </button>
                      ));
                    })()}
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-white flex gap-2">
                    <input value={newDistInp} onChange={e=>setNewDistInp(e.target.value)} disabled={!selReg} type="text" placeholder="Add District..." className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-emerald-500 disabled:opacity-50" />
                    <button onClick={handleAddDistrict} disabled={!selReg} className="bg-emerald-600 text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-90 disabled:opacity-40"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Townships Column */}
                <div className="flex flex-col bg-slate-50/50 border border-slate-200 rounded-[1.5rem] overflow-hidden h-[500px]">
                  <div className="bg-white p-4 border-b border-slate-200 font-black text-slate-900 text-[11px] uppercase tracking-widest">Township</div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scroll">
                    {!selDist ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300 opacity-60">
                         <Map className="w-8 h-8 mb-2" />
                         <p className="text-[10px] font-bold uppercase tracking-widest">Select District First</p>
                      </div>
                    ) : (() => {
                      const r = locations.find(x => x.name === selReg);
                      if (!r) return null;
                      const d = r.districts.find(x => x.name === selDist);
                      if (!d) return null;
                      return d.townships.map(t => (
                        <div key={t} className="w-full text-left px-4 py-3 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-100 shadow-sm flex items-center justify-between group">
                          {t}
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="p-4 border-t border-slate-200 bg-white flex gap-2">
                    <input value={newTownInp} onChange={e=>setNewTownInp(e.target.value)} disabled={!selDist} type="text" placeholder="Add Township..." className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-emerald-500 disabled:opacity-50" />
                    <button onClick={handleAddTownship} disabled={!selDist} className="bg-emerald-600 text-white w-9 h-9 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-90 disabled:opacity-40"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'types' && (
            <div className="glass-card rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 font-display">Facility Types & Subdepartments</h3>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Classification Categories</p>
                    </div>
                  </div>
                  <button onClick={() => setIsTypeOpen(true)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[13px] font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                    <Plus className="w-4 h-4" /> Add Type
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {facilityTypes.map((t, idx) => {
                    const subs = state.subdepartmentsMap[t] || [];
                    return (
                    <div key={t} className="group flex flex-col gap-3 p-5 bg-slate-50/50 border border-slate-200/60 rounded-2xl hover:bg-white hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-700 font-display">{t}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setManageSubDept(t)} className="px-2.5 py-1 bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all border border-slate-200">
                            Sub-depts ({subs.length})
                          </button>
                          <button onClick={() => safeDelete(()=>deleteFacilityType(idx), `ဌာနအမျိုးအစား '${t}' ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?`)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </div>
                      {subs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                           {subs.map(sub => (
                             <span key={sub} className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200/60">
                               {sub}
                             </span>
                           ))}
                        </div>
                      )}
                    </div>
                  )})}
               </div>
            </div>
          )}

          {activeTab === 'quotas' && (
            <div className="glass-card rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
               <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 font-display">Default Quotas</h3>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Standard HR Baseline</p>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full xl:w-auto">
                    <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="flex-1 xl:w-64 p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[12px] font-bold outline-none focus:border-emerald-500 transition-all">
                      {facilityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={() => { setQType(filterType); setQPos(''); setQNewPos(''); setIsQuotaOpen(true); }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap">
                      <Plus className="w-4 h-4" /> New Limit
                    </button>
                  </div>
               </div>

               <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-white border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest font-black">
                      <tr>
                        <th className="px-8 py-4">Designation (Position)</th>
                        <th className="px-8 py-4 text-center">Baseline Max</th>
                        <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {globalDefaultQuotas.filter(q => q.type === filterType).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-8 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">No quotas defined for this category</td>
                        </tr>
                      ) : (
                        globalDefaultQuotas.filter(q => q.type === filterType).map(q => (
                          <tr key={q.id} className="hover:bg-white transition-colors group">
                            <td className="px-8 py-4 font-black text-slate-800 font-display">{q.position}</td>
                            <td className="px-8 py-4 text-center">
                               <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-600">{q.max}</span>
                            </td>
                            <td className="px-8 py-4 text-right">
                               <button onClick={()=>safeDelete(() => deleteQuota(q.id), `သတ်မှတ်ချက် '${q.position}' ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?`)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                  <Trash2 className="w-4.5 h-4.5" />
                               </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* MODALS */}
      {isTypeOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 font-display">Add Facility Type</h3>
            <div className="space-y-4">
              <input value={newTypeName} onChange={e=>setNewTypeName(e.target.value)} type="text" placeholder="e.g. Hospital" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-emerald-500 transition-all" />
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={()=>setIsTypeOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
              <button onClick={saveFacType} className="bg-slate-900 text-white px-7 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all">Save Category</button>
            </div>
          </div>
        </div>
      )}

      {manageSubDept && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]">
            <h3 className="text-xl font-black text-slate-800 mb-1 font-display">Manage Subdepartments</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">For {manageSubDept}</p>
            
            <div className="flex-1 overflow-y-auto mb-6 custom-scroll pr-2 space-y-2">
              {(state.subdepartmentsMap[manageSubDept] || []).length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-4">No subdepartments defined yet.</p>
              ) : (
                (state.subdepartmentsMap[manageSubDept] || []).map((sub, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group/sub">
                    <span className="font-bold text-slate-700 text-sm">{sub}</span>
                    <button onClick={() => {
                      const updated = (state.subdepartmentsMap[manageSubDept] || []).filter((_, i) => i !== idx);
                      state.updateSubdepartmentsMap({ ...state.subdepartmentsMap, [manageSubDept]: updated });
                    }} className="text-slate-300 hover:text-red-500 p-1 rounded-md opacity-0 group-hover/sub:opacity-100 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
               <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Add Existing Type as Subdepartment</label>
                 <div className="flex gap-2">
                   <select value={newSubDept} onChange={e=>setNewSubDept(e.target.value)} className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500">
                     <option value="">Select Facility Type...</option>
                     {facilityTypes.filter(t => t !== manageSubDept && !(state.subdepartmentsMap[manageSubDept]||[]).includes(t)).map(t => (
                       <option key={t} value={t}>{t}</option>
                     ))}
                   </select>
                   <button onClick={() => {
                     if (!newSubDept) return;
                     const current = state.subdepartmentsMap[manageSubDept] || [];
                     if (!current.includes(newSubDept)) {
                       state.updateSubdepartmentsMap({ ...state.subdepartmentsMap, [manageSubDept]: [...current, newSubDept] });
                     }
                     setNewSubDept('');
                   }} className="bg-emerald-100 text-emerald-700 w-11 rounded-xl flex items-center justify-center hover:bg-emerald-200 transition">
                     <Plus className="w-4 h-4" />
                   </button>
                 </div>
               </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={()=>setManageSubDept(null)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg hover:bg-slate-800 transition-all">Done</button>
            </div>
          </div>
        </div>
      )}

      {isQuotaOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-800 font-display">New Policy Quota</h3>
            </div>
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">FOR: {qType}</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Position</label>
                <select value={qPos} onChange={e=>setQPos(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all">
                  <option value="">Select Position...</option>
                  {positionsList.map(p => <option key={p} value={p}>{p}</option>)}
                  <option value="ADD_NEW">+ Create New Position</option>
                </select>
              </div>
              {qPos === 'ADD_NEW' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Position Name</label>
                  <input value={qNewPos} onChange={e=>setQNewPos(e.target.value)} type="text" placeholder="e.g. Senior Nurse" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Headcount Limit</label>
                <input value={qCount} onChange={e=>setQCount(parseInt(e.target.value)||0)} type="number" min="1" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={()=>setIsQuotaOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
              <button onClick={saveNewQuota} className="bg-emerald-600 text-white px-7 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all">Enable Quota</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl border border-red-100">
            {deleteConfirm.step === 1 ? (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-2 font-display">Confirm Deletion</h3>
                <p className="text-sm text-slate-600 mb-6">{deleteConfirm.message}</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                  <button onClick={() => setDeleteConfirm({ ...deleteConfirm, step: 2 })} className="bg-red-500 text-white px-6 py-2.5 rounded-xl text-[13px] font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100 active:scale-95">First Confirmation</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-black text-red-600 mb-2 font-display">Final Verification</h3>
                <p className="text-sm text-slate-700 mb-6 font-bold leading-relaxed">
                  သေချာပြီလား? ဤလုပ်ဆောင်ချက်ကို နောက်ပြန်ဆုတ်၍ မရပါ။<br/>
                  <span className="text-red-500 font-normal">Are you absolutely sure? This cannot be undone.</span>
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="px-5 py-2.5 text-[13px] font-bold text-slate-400 hover:text-slate-600 transition-colors">Retreat</button>
                  <button onClick={() => {
                    deleteConfirm.action();
                    setDeleteConfirm(null);
                  }} className="bg-red-600 text-white px-7 py-2.5 rounded-xl text-[13px] font-bold shadow-xl shadow-red-200 hover:bg-red-700 active:scale-95 transition-all">Yes, Delete Forever</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
