import React, { useState } from 'react';
import { Trash2, Plus, ChevronRight, Map, LayoutGrid, ShieldCheck, Edit2, TriangleAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RegionData, Quota, Position } from '../types';

export default function Settings({ state }: { state: ReturnType<typeof import('../useAppState').useAppState> }) {
  const { 
    facilityTypes, addFacilityType, deleteFacilityType, updateFacilityTypes,
    globalDefaultQuotas, addQuota, deleteQuota,
    positionsList, updatePositionsList,
    locations, updateLocations,
    staffEntries
  } = state;

  const [activeTab, setActiveTab] = useState<'types'|'quotas'|'locations'|'audit'|'designations'>('types');
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCat, setNewTypeCat] = useState<'Public Health' | 'Clinical'>('Public Health');
  const [editingType, setEditingType] = useState<string | null>(null);
  const [manageSubDept, setManageSubDept] = useState<string | null>(null);
  const [newSubDept, setNewSubDept] = useState('');

  const [isQuotaOpen, setIsQuotaOpen] = useState(false);
  const [qType, setQType] = useState(facilityTypes[0]?.name || '');
  const [qPos, setQPos] = useState('');
  const [qPosSearch, setQPosSearch] = useState('');
  const [qNewPos, setQNewPos] = useState('');
  const [qCount, setQCount] = useState(1);
  const [qCategory, setQCategory] = useState<'Public Health' | 'Clinical' | ''>('');
  const [editingQuotaId, setEditingQuotaId] = useState<number | null>(null);

  const [isPosOpen, setIsPosOpen] = useState(false);
  const [posEditOrig, setPosEditOrig] = useState<string | null>(null);
  const [posEditVal, setPosEditVal] = useState('');
  const [posEditCat, setPosEditCat] = useState<'Public Health' | 'Clinical' | ''>('');
  const [posEditRank, setPosEditRank] = useState(99);

  const [filterType, setFilterType] = useState(facilityTypes[0]?.name || '');

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{ step: 1 | 2, message: string, action: () => void } | null>(null);

  const safeDelete = (action: () => void, message: string) => {
    setDeleteConfirm({ step: 1, message, action });
  };

  // Position Audit Logic
  const getAuditData = () => {
    const quotaPositions = new Set(globalDefaultQuotas.map(q => q.position));
    const staffPositionsRaw = staffEntries.map(s => s.position).filter(Boolean);
    const staffPositions = new Set(staffPositionsRaw);
    const listPositions = new Set(positionsList.map(p => p.name));

    const missingInQuota = Array.from(staffPositions).filter(p => !quotaPositions.has(p));
    const missingInList = Array.from(staffPositions).filter(p => !listPositions.has(p));
    
    const overlaps: { pos1: string, pos2: string, reason: string }[] = [];
    const allKnown = Array.from(new Set([...quotaPositions, ...staffPositions, ...listPositions])) as string[];
    
    for (let i = 0; i < allKnown.length; i++) {
      for (let j = i + 1; j < allKnown.length; j++) {
        const p1 = allKnown[i];
        const p2 = allKnown[j];
        
        if (p1.length > 3 && p2.length > 3) {
          const s1 = p1.replace(/^(ကုသ|ပက) - /, '').trim();
          const s2 = p2.replace(/^(ကုသ|ပက) - /, '').trim();
          
          if (s1 === s2 && p1 !== p2) {
            overlaps.push({ pos1: p1, pos2: p2, reason: 'Duplicate name with different prefixes' });
          } else if (p1.toLowerCase() === p2.toLowerCase() && p1 !== p2) {
            overlaps.push({ pos1: p1, pos2: p2, reason: 'Case sensitivity mismatch' });
          }
        }
      }
    }

    return { missingInQuota, missingInList, overlaps, totalStaff: staffEntries.length };
  };

  const audit = getAuditData();
  
  const savePos = async () => {
    const base = posEditVal.trim();
    if (!base) return;
    
    if (!posEditCat) {
      alert('Please select a category');
      return;
    }

    const finalName = base;

    if (posEditOrig) {
       // Renaming existing
       const newList = positionsList.map(p => p.name === posEditOrig ? { name: finalName, rank: posEditRank, category: posEditCat } : p);
       updatePositionsList(newList);

       // Optional: Rename in Quotas and Staff
       if (finalName !== posEditOrig) {
          const affectedQuotas = globalDefaultQuotas.filter(q => q.position === posEditOrig);
          for (const q of affectedQuotas) {
             await addQuota({ ...q, position: finalName });
          }
          
          const affectedStaff = staffEntries.filter(s => s.position === posEditOrig);
          for (const s of affectedStaff) {
             await state.updateStaff({ ...s, position: finalName });
          }
       }
    } else {
       // Adding new
       if (positionsList.find(p => p.name === finalName)) {
         alert('This position already exists!');
         return;
       }
       updatePositionsList([...positionsList, { name: finalName, rank: posEditRank, category: posEditCat }]);
    }
    
    setIsPosOpen(false);
    setPosEditOrig(null);
  }

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
    const base = newTypeName.trim();
    if (base) {
      if (editingType) {
        const newList = facilityTypes.map(t => t.name === editingType ? { name: base, category: newTypeCat } : t);
        updateFacilityTypes(newList);

        // Also update subdepartments map if the name changed
        if (base !== editingType && state.subdepartmentsMap[editingType]) {
          const newMap = { ...state.subdepartmentsMap };
          newMap[base] = newMap[editingType];
          delete newMap[editingType];
          state.updateSubdepartmentsMap(newMap);
        }
      } else {
        if (!facilityTypes.find(f => f.name === base)) {
          updateFacilityTypes([...facilityTypes, { name: base, category: newTypeCat }]);
        }
        
        const valLower = base.toLowerCase();
        let defaultSubDepts: string[] = [];
        if (valLower.includes('hospital')) {
          defaultSubDepts = ['Maternity', 'Pediatrics', 'Emergency'];
        }

        if (defaultSubDepts.length > 0) {
          const finalSubDepts = defaultSubDepts.map(d => `${base} - ${d}`);
          
          const expandedFacTypes = [...facilityTypes, { name: base, category: newTypeCat }];
          finalSubDepts.forEach(t => {
            if (!expandedFacTypes.find(f => f.name === t)) {
              expandedFacTypes.push({ name: t, category: newTypeCat });
            }
          });
          updateFacilityTypes(expandedFacTypes);
          
          const currentMap = state.subdepartmentsMap;
          state.updateSubdepartmentsMap({ ...currentMap, [base]: finalSubDepts });
        }
      }

      setIsTypeOpen(false);
      setNewTypeName('');
      setEditingType(null);
    }
  }

  const saveNewQuota = () => {
    let basePos = qPos === 'ADD_NEW' ? qNewPos.trim() : qPos;
    if (basePos) {
      if (!qCategory) {
        alert('Please select Clinical or Public Health category');
        return;
      }
      
      // Check for overlap/duplicate
      const isDuplicate = globalDefaultQuotas.some(q => 
        q.type === qType && 
        q.position === basePos && 
        q.id !== editingQuotaId
      );
      
      if (isDuplicate) {
        alert(`Overlap detected: This position '${basePos}' already exists for ${qType}`);
        return;
      }

      addQuota({
        id: editingQuotaId || Date.now(),
        type: qType,
        position: basePos,
        max: qCount,
        isNewPosition: qPos === 'ADD_NEW' && !editingQuotaId,
        newPosName: qPos === 'ADD_NEW' ? basePos : undefined,
        newPosCat: qPos === 'ADD_NEW' ? qCategory : undefined
      });
      setIsQuotaOpen(false);
      setEditingQuotaId(null);
    }
  }

  const openEditQuota = (q: Quota) => {
    setEditingQuotaId(q.id);
    setQType(q.type);
    setQCount(q.max);
    setQPosSearch('');
    
    // Try to extract category and base position
    if (q.position.startsWith('ကုသ - ') || q.position.startsWith('ပက - ')) {
      const isPublic = q.position.startsWith('ပက - ');
      setQCategory(isPublic ? 'Public Health' : 'Clinical');
      const base = q.position.replace(/^(ကုသ|ပက) - /, '');
      if (positionsList.find(p => p.name === q.position)) {
        setQPos(q.position);
      } else if (positionsList.find(p => p.name === base)) {
        setQPos(base);
      } else {
        setQPos('ADD_NEW');
        setQNewPos(base);
      }
    } else {
      const posObj = positionsList.find(p => p.name === q.position);
      setQCategory(posObj?.category || '');
      setQPos(q.position);
    }
    
    setIsQuotaOpen(true);
  }

  const tabs = [
    { id: 'types', label: 'Facility Types', icon: LayoutGrid },
    { id: 'quotas', label: 'Default Quotas', icon: ShieldCheck },
    { id: 'designations', label: 'Designations', icon: LayoutGrid },
    { id: 'locations', label: 'Geography', icon: Map },
    { id: 'audit', label: 'Health Audit', icon: ShieldCheck },
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
              if (tab.id === 'quotas') setFilterType(facilityTypes[0]?.name || '');
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
                      <h3 className="text-xl font-black text-slate-800 font-display">Facility Types Directory</h3>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Classification Categories</p>
                    </div>
                  </div>
                  <button onClick={() => { setNewTypeCat('Public Health'); setNewTypeName(''); setEditingType(null); setIsTypeOpen(true); }} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[13px] font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                    <Plus className="w-4 h-4" /> Add Type
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Public Health Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                       <h4 className="text-sm font-black text-slate-700 font-display">ပက ကဏ္ဍ (Public Health)</h4>
                       <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">{facilityTypes.filter(t => t.category === 'Public Health').length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {facilityTypes.filter(t => t.category === 'Public Health').sort((a,b) => a.name.localeCompare(b.name)).map((t) => {
                        const subs = state.subdepartmentsMap[t.name] || [];
                        return (
                          <div key={t.name} className="group flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-2xl hover:border-emerald-200 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">{t.name}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => {
                                  setEditingType(t.name);
                                  setNewTypeName(t.name);
                                  setNewTypeCat(t.category);
                                  setIsTypeOpen(true);
                                }} className="p-1 text-slate-300 hover:text-emerald-500 transition-all">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setManageSubDept(t.name)} className="px-2 py-1 bg-slate-50 text-slate-400 hover:text-emerald-600 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border border-slate-100">
                                  Sub-depts ({subs.length})
                                </button>
                                <button onClick={() => safeDelete(()=>deleteFacilityType(t.name), `ဌာနအမျိုးအစား '${t.name}' ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?`)} className="p-1 text-slate-300 hover:text-red-500 transition-all">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Clinical Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                       <span className="w-2 h-2 bg-blue-500 rounded-full" />
                       <h4 className="text-sm font-black text-slate-700 font-display">ကုသ ကဏ္ဍ (Clinical)</h4>
                       <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{facilityTypes.filter(t => t.category === 'Clinical').length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {facilityTypes.filter(t => t.category === 'Clinical').sort((a,b) => a.name.localeCompare(b.name)).map((t) => {
                        const subs = state.subdepartmentsMap[t.name] || [];
                        return (
                          <div key={t.name} className="group flex flex-col gap-2 p-3 bg-white border border-slate-200 rounded-2xl hover:border-blue-200 transition-all">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">{t.name}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => {
                                  setEditingType(t.name);
                                  setNewTypeName(t.name);
                                  setNewTypeCat(t.category);
                                  setIsTypeOpen(true);
                                }} className="p-1 text-slate-300 hover:text-blue-500 transition-all">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setManageSubDept(t.name)} className="px-2 py-1 bg-slate-50 text-slate-400 hover:text-blue-600 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border border-slate-100">
                                  Sub-depts ({subs.length})
                                </button>
                                <button onClick={() => safeDelete(()=>deleteFacilityType(t.name), `ဌာနအမျိုးအစား '${t.name}' ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?`)} className="p-1 text-slate-300 hover:text-red-500 transition-all">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

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
                      {facilityTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                    <button onClick={() => { setQType(filterType); setQPos(''); setQPosSearch(''); setQNewPos(''); setQCategory(''); setEditingQuotaId(null); setIsQuotaOpen(true); }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-[13px] font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap">
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
                            <td className="px-8 py-4 text-right flex justify-end gap-2">
                               <button onClick={() => openEditQuota(q)} className="p-2 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                  <Edit2 className="w-4.5 h-4.5" />
                               </button>
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
          {activeTab === 'designations' && (
            <div className="glass-card rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-800 font-display">Designation Directory</h3>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Master Position List</p>
                    </div>
                  </div>
                  <button onClick={() => { setPosEditOrig(null); setPosEditVal(''); setPosEditCat(''); setPosEditRank(99); setIsPosOpen(true); }} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[13px] font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95">
                    <Plus className="w-4 h-4" /> Add Designation
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                       <h4 className="text-sm font-black text-slate-700 font-display">ပက ကဏ္ဍ (Public Health)</h4>
                       <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">{positionsList.filter(p => p.name.startsWith('ပက - ')).length}</span>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-2 space-y-1 max-h-[500px] overflow-y-auto custom-scroll">
                       {positionsList.filter(p => p.name.startsWith('ပက - ')).sort((a,b) => a.rank - b.rank || a.name.localeCompare(b.name)).map(p => (
                         <div key={p.name} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-3">
                               <div className="w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                 {p.rank}
                               </div>
                               <span className="text-xs font-bold text-slate-700">{p.name.replace('ပက - ', '')}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => {
                                 setPosEditOrig(p.name);
                                 setPosEditVal(p.name.replace('ပက - ', ''));
                                 setPosEditCat('ပက');
                                 setPosEditRank(p.rank);
                                 setIsPosOpen(true);
                               }} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                                 <Edit2 className="w-3.5 h-3.5" />
                               </button>
                               <button onClick={() => safeDelete(() => {
                                 const newList = positionsList.filter(item => item.name !== p.name);
                                 updatePositionsList(newList);
                               }, `ရာထူး '${p.name}' ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?`)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                       <span className="w-2 h-2 bg-blue-500 rounded-full" />
                       <h4 className="text-sm font-black text-slate-700 font-display">ကုသ ကဏ္ဍ (Clinical)</h4>
                       <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{positionsList.filter(p => p.name.startsWith('ကုသ - ')).length}</span>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-2 space-y-1 max-h-[500px] overflow-y-auto custom-scroll">
                       {positionsList.filter(p => p.name.startsWith('ကုသ - ')).sort((a,b) => a.rank - b.rank || a.name.localeCompare(b.name)).map(p => (
                         <div key={p.name} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all group">
                            <div className="flex items-center gap-3">
                               <div className="w-6 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                 {p.rank}
                               </div>
                               <span className="text-xs font-bold text-slate-700">{p.name.replace('ကုသ - ', '')}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => {
                                 setPosEditOrig(p.name);
                                 setPosEditVal(p.name.replace('ကုသ - ', ''));
                                 setPosEditCat('ကုသ');
                                 setPosEditRank(p.rank);
                                 setIsPosOpen(true);
                               }} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg">
                                 <Edit2 className="w-3.5 h-3.5" />
                               </button>
                               <button onClick={() => safeDelete(() => {
                                 const newList = positionsList.filter(item => item.name !== p.name);
                                 updatePositionsList(newList);
                               }, `ရာထူး '${p.name}' ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?`)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>

                  {positionsList.filter(p => !p.name.startsWith('ပက - ') && !p.name.startsWith('ကုသ - ')).length > 0 && (
                  <div className="md:col-span-2 space-y-4 mt-8">
                    <div className="flex items-center gap-3 px-2">
                       <span className="w-2 h-2 bg-slate-400 rounded-full" />
                       <h4 className="text-sm font-black text-slate-700 font-display">အခြား (Uncategorized / Legacy)</h4>
                       <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{positionsList.filter(p => !p.name.startsWith('ပက - ') && !p.name.startsWith('ကုသ - ')).length}</span>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 flex flex-wrap gap-2">
                       {positionsList.filter(p => !p.name.startsWith('ပက - ') && !p.name.startsWith('ကုသ - ')).sort((a,b) => a.rank - b.rank || a.name.localeCompare(b.name)).map(p => (
                         <div key={p.name} className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200 rounded-[1rem] shadow-sm hover:border-slate-300 transition-all group">
                            <div className="flex items-center gap-2">
                               <span className="text-[9px] font-black text-slate-300 uppercase">Rank {p.rank}</span>
                               <span className="text-xs font-bold text-slate-600">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => {
                                 setPosEditOrig(p.name);
                                 setPosEditVal(p.name);
                                 setPosEditCat('');
                                 setPosEditRank(p.rank);
                                 setIsPosOpen(true);
                               }} className="text-slate-300 hover:text-blue-500 p-1">
                                 <Edit2 className="w-3.5 h-3.5" />
                               </button>
                               <button onClick={() => safeDelete(() => {
                                 const newList = positionsList.filter(item => item.name !== p.name);
                                 updatePositionsList(newList);
                               }, `ရာထူး '${p.name}' ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?`)} className="text-slate-300 hover:text-red-500 p-1">
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                            </div>
                         </div>
                       ))}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">Standardize these by adding prefixes to fix data integrity issues.</p>
                  </div>
                  )}
               </div>
            </div>
          )}
          {activeTab === 'audit' && (
            <div className="space-y-8">
              <div className="glass-card rounded-[2rem] border border-slate-200/60 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 font-display">Data Health Audit</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Inconsistency & Overlap Detection</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                        <TriangleAlert className="w-4 h-4 text-orange-500" />
                        Position Name Overlaps
                      </h4>
                      <div className="space-y-2">
                        {audit.overlaps.length === 0 ? (
                          <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-dashed border-slate-200">No major naming overlaps detected.</p>
                        ) : (
                          audit.overlaps.map((o, idx) => (
                            <div key={idx} className="p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                              <p className="text-xs font-bold text-orange-800 mb-1">{o.reason}</p>
                              <div className="flex items-center gap-2 text-[11px] font-medium text-orange-600">
                                <span className="bg-white px-2 py-0.5 rounded border border-orange-200">{o.pos1}</span>
                                <ChevronRight className="w-3 h-3" />
                                <span className="bg-white px-2 py-0.5 rounded border border-orange-200">{o.pos2}</span>
                                <button 
                                  onClick={async () => {
                                    const isP1Prefixed = o.pos1.startsWith('ကုသ') || o.pos1.startsWith('ပက');
                                    const isP2Prefixed = o.pos2.startsWith('ကုသ') || o.pos2.startsWith('ပက');
                                    
                                    if (isP1Prefixed && !isP2Prefixed) {
                                      // Merge pos2 into pos1
                                      if (confirm(`'${o.pos2}' အချက်အလက်အားလုံးကို '${o.pos1}' သို့ ပြောင်းလဲပေါင်းစပ်မည်မှာ သေချာပါသလား?`)) {
                                        setPosEditOrig(o.pos2);
                                        setPosEditVal(o.pos1.replace(/^(ကုသ|ပက) - /, ''));
                                        setPosEditCat(o.pos1.startsWith('ကုသ') ? 'ကုသ' : 'ပက');
                                        
                                        const finalName = o.pos1;
                                        const oldName = o.pos2;
                                        
                                        const updatedList = (positionsList as any[]).map(p => {
                                          const name = typeof p === 'string' ? p : p.name;
                                          if (name === oldName) return typeof p === 'string' ? finalName : { ...p, name: finalName };
                                          return p;
                                        });
                                        const uniqueArr = [];
                                        const seenSet = new Set();
                                        for (const item of updatedList) {
                                          const name = typeof item === 'string' ? item : item.name;
                                          if (!seenSet.has(name)) {
                                            uniqueArr.push(item);
                                            seenSet.add(name);
                                          }
                                        }
                                        updatePositionsList(uniqueArr as any);

                                        const affectedQuotas = globalDefaultQuotas.filter(q => q.position === oldName);
                                        for (const q of affectedQuotas) {
                                          await addQuota({ ...q, position: finalName });
                                        }
                                        
                                        const affectedStaff = staffEntries.filter(s => s.position === oldName);
                                        for (const s of affectedStaff) {
                                          await state.updateStaff({ ...s, position: finalName });
                                        }
                                      }
                                    } else if (isP2Prefixed && !isP1Prefixed) {
                                      // Merge pos1 into pos2
                                      if (confirm(`'${o.pos1}' အချက်အလက်အားလုံးကို '${o.pos2}' သို့ ပြောင်းလဲပေါင်းစပ်မည်မှာ သေချာပါသလား?`)) {
                                        const finalName = o.pos2;
                                        const oldName = o.pos1;
                                        
                                        const updatedList = (positionsList as any[]).map(p => {
                                          const name = typeof p === 'string' ? p : p.name;
                                          if (name === oldName) return typeof p === 'string' ? finalName : { ...p, name: finalName };
                                          return p;
                                        });
                                        const uniqueArrFinal = [];
                                        const seenSetFinal = new Set();
                                        for (const item of updatedList) {
                                          const name = typeof item === 'string' ? item : item.name;
                                          if (!seenSetFinal.has(name)) {
                                            uniqueArrFinal.push(item);
                                            seenSetFinal.add(name);
                                          }
                                        }
                                        updatePositionsList(uniqueArrFinal as any);

                                        const affectedQuotas = globalDefaultQuotas.filter(q => q.position === oldName);
                                        for (const q of affectedQuotas) {
                                          await addQuota({ ...q, position: finalName });
                                        }
                                        
                                        const affectedStaff = staffEntries.filter(s => s.position === oldName);
                                        for (const s of affectedStaff) {
                                          await state.updateStaff({ ...s, position: finalName });
                                        }
                                      }
                                    }
                                  }}
                                  className="ml-auto px-4 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-orange-700 transition shadow-sm active:scale-95"
                                >
                                  Standardize & Fix
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                        <TriangleAlert className="w-4 h-4 text-red-500" />
                        Unmapped Staff Positions
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mb-3">Positions assigned to staff but missing from policy quotas</p>
                      <div className="flex flex-wrap gap-2">
                        {audit.missingInQuota.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">None. All staff match defined quotas.</p>
                        ) : (
                          audit.missingInQuota.map(p => (
                            <span key={p} className="px-3 py-1 bg-red-50 text-red-600 text-[11px] font-black rounded-lg border border-red-100 uppercase tracking-tighter">
                              {p}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <ShieldCheck className="w-32 h-32" />
                    </div>
                    <h4 className="text-lg font-black font-display mb-4">Risk Assessment</h4>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                          <span className="text-[10px] font-bold">01</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-bold">
                          Naming Overlaps (like <span className="text-white">Head Nurse</span> vs <span className="text-white">ပက - Head Nurse</span>) split your reporting. 
                          Personnel under the unprefixed name won't be counted towards the prefixed quota.
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                          <span className="text-[10px] font-bold">02</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-bold">
                          Unmapped positions cause "Shadow Vacancies". You might have staff working, but the system shows a 100% vacancy rate because the names don't match exactly.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-white/10">
                       <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">Recommendation</p>
                       <p className="text-xs text-slate-200 font-bold leading-relaxed">
                         Standardize position names by using the prefixes consistently across both Quotas and Staff recruitment. 
                         Rename older staff positions to match the current policy nomenclature to restore reporting integrity.
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* MODALS */}
      {isTypeOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-black text-slate-800 mb-6 font-display">{editingType ? 'Edit Facility Type' : 'Add Facility Type'}</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Category</label>
                <div className="flex gap-2">
                  {[
                    { id: 'Clinical', label: 'Clinical' },
                    { id: 'Public Health', label: 'Public Health' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewTypeCat(cat.id as any)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${newTypeCat === cat.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-200'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Type Name</label>
                <input value={newTypeName} onChange={e=>setNewTypeName(e.target.value)} type="text" placeholder="e.g. Hospital" className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-emerald-500 transition-all" />
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={()=>{setIsTypeOpen(false); setEditingType(null); }} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
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
                     {facilityTypes.filter(t => t.name !== manageSubDept && !(state.subdepartmentsMap[manageSubDept]||[]).includes(t.name)).map(t => (
                       <option key={t.name} value={t.name}>{t.name}</option>
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

      {isPosOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-slate-800 font-display">{posEditOrig ? 'Edit Designation' : 'New Designation'}</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Category</label>
                <div className="flex gap-2">
                  {[
                    { id: 'Clinical', label: 'Clinical' },
                    { id: 'Public Health', label: 'Public Health' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPosEditCat(cat.id as any)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${posEditCat === cat.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-blue-200'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Position Name</label>
                <input 
                  value={posEditVal} 
                  onChange={e=>setPosEditVal(e.target.value)} 
                  type="text" 
                  placeholder="e.g. Senior Nurse" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-blue-500 transition-all font-display" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Ranking (Priority)</label>
                <input 
                  value={posEditRank} 
                  onChange={e=>setPosEditRank(parseInt(e.target.value)||0)} 
                  type="number" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:border-blue-500 transition-all font-mono" 
                />
                <p className="text-[9px] text-slate-400 font-bold px-1 italic">Lower numbers appear first (e.g. 1 = Senior Most)</p>
              </div>

              {posEditOrig && (
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3">
                   <TriangleAlert className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                   <p className="text-[10px] font-bold text-orange-700 leading-relaxed uppercase">
                     Renaming will update match all existing staff & quotas automatically.
                   </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={()=>setIsPosOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
              <button 
                onClick={savePos} 
                disabled={!posEditVal.trim()}
                className="bg-slate-900 text-white px-7 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all"
              >
                {posEditOrig ? 'Update Registry' : 'Add to Registry'}
              </button>
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
              <h3 className="text-xl font-black text-slate-800 font-display">{editingQuotaId ? 'Edit Quota' : 'New Policy Quota'}</h3>
            </div>
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">FOR: {qType}</p>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Position Category</label>
                <div className="flex gap-2">
                  {['ကုသ', 'ပက'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setQCategory(cat as any)}
                      className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${qCategory === cat ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Position</label>
                
                <div className="relative group/search mb-2">
                  <input
                    type="text"
                    placeholder="Search position..."
                    value={qPosSearch}
                    onChange={(e) => setQPosSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all placeholder:text-slate-400"
                  />
                  <ShieldCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/search:text-emerald-500 transition-colors" />
                </div>

                <select value={qPos} onChange={e=>setQPos(e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all">
                  <option value="">Select Position...</option>
                  {positionsList
                    .filter(p => !qPosSearch || p.name.toLowerCase().includes(qPosSearch.toLowerCase()))
                    .map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
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
