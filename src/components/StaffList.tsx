import React, { useState } from 'react';
import { FileText, Download, Trash2, Search, Filter, MapPin, User, ArrowRight, Plus, Eye, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Staff } from '../types';
import { useRole } from '../contexts/RoleContext';

export default function StaffList({ state }: { state: ReturnType<typeof import('../useAppState').useAppState> }) {
  const { role, allowedTownship } = useRole();
  const { staffEntries, facilities, deleteStaff, updateStaff } = state;

  const canEditStaff = (fId: number) => {
    if (role === 'admin') return true;
    if (role === 'manager') {
      if (!allowedTownship) return true;
      const f = facilities.find(x => x.id === fId);
      if (f && f.township === allowedTownship) return true;
    }
    return false;
  };

  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterTownship, setFilterTownship] = useState('');
  const [filterFac, setFilterFac] = useState('');
  const [filterPos, setFilterPos] = useState('');
  const [searchStaff, setSearchStaff] = useState('');
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  const [cvPreview, setCvPreview] = useState<{ name: string, dataUrl: string } | null>(null);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [eId, setEId] = useState<number | null>(null);
  const [eStaffName, setEStaffName] = useState('');
  const [eCurrFac, setECurrFac] = useState('');
  const [ePos, setEPos] = useState('');
  const [eDuty, setEDuty] = useState<'Present'|'Attached'>('Present');
  const [eIsExt, setEIsExt] = useState(false);
  const [eSourceFac, setESourceFac] = useState('');
  const [eExtName, setEExtName] = useState('');
  const [eReason, setEReason] = useState('');
  const [eActiveStatus, setEActiveStatus] = useState<'Active'|'Leave'|'Other'>('Active');
  const [eActiveReason, setEActiveReason] = useState('');
  const [eCv, setECv] = useState('');
  const [eCvData, setECvData] = useState('');

  const editableFacilities = facilities.filter(f => {
    if (role === 'admin') return true;
    if (role === 'manager' && !allowedTownship) return true;
    if (role === 'manager' && f.township === allowedTownship) return true;
    return false;
  });

  const openAddStaff = () => {
    setEId(null);
    setEStaffName('');
    setECurrFac('');
    setEPos('');
    setEDuty('Present');
    setEIsExt(false);
    setESourceFac('');
    setEExtName('');
    setEReason('');
    setEActiveStatus('Active');
    setEActiveReason('');
    setECv('');
    setECvData('');
    setIsEditorOpen(true);
  };

  const openEditStaff = (s: Staff) => {
    setEId(s.id);
    setEStaffName(s.name || '');
    setECurrFac(String(s.currentFacilityId));
    setEPos(s.position);
    setEDuty(s.dutyStatus);
    setEIsExt(s.facilityId === -1);
    setESourceFac(s.facilityId !== -1 && s.facilityId !== s.currentFacilityId ? String(s.facilityId) : '');
    setEExtName(s.externalFacilityName || '');
    setEReason(s.reason || '');
    setEActiveStatus(s.activeStatus || 'Active');
    setEActiveReason(s.activeReason || '');
    setECv(s.cv || '');
    setECvData(s.cvDataUrl || '');
    setIsEditorOpen(true);
  };

  const saveStaff = () => {
    if (!eStaffName.trim()) return alert('Please enter staff name');
    if (!eCurrFac) return alert('Please select current facility');
    if (!ePos) return alert('Please select position');
    
    let facId = Number(eCurrFac);
    let extName = '';
    
    if (eDuty === 'Attached') {
        if (eIsExt) {
            facId = -1;
            extName = eExtName;
        } else {
            if (!eSourceFac) return alert('Please select original facility');
            facId = Number(eSourceFac);
        }
    }
    
    if (!eId && facId !== -1) {
        const targetFac = facilities.find(f => f.id === facId);
        if (targetFac) {
            const quota = targetFac.customQuotas.find(q => q.position === ePos);
            if (quota) {
                const occupied = state.staffEntries.filter(s => s.facilityId === facId && s.position === ePos).length;
                if (occupied >= quota.max) {
                     if (!window.confirm(`သတိပေးချက်: ဤဌာနအတွက် ${ePos} ရာထူး သတ်မှတ်အရေအတွက် (${quota.max}) ပြည့်နေပါသည်။ ဆက်လက်ထည့်သွင်းလိုပါသလား?`)) {
                         return;
                     }
                }
            }
        }
    }
    
    const staffData: Staff = {
        id: eId || Date.now() + Math.random(),
        name: eStaffName,
        facilityId: facId,
        currentFacilityId: Number(eCurrFac),
        externalFacilityName: extName,
        position: ePos,
        dutyStatus: eDuty,
        reason: eDuty === 'Attached' ? eReason : '',
        activeStatus: eActiveStatus,
        activeReason: eActiveStatus !== 'Active' ? eActiveReason : '',
        cv: eCv,
        cvDataUrl: eCvData
    };
    
    if (eId) state.updateStaff(staffData);
    else state.addStaff(staffData);
    
    setIsEditorOpen(false);
  };

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{ step: 1 | 2, message: string, action: () => void } | null>(null);

  const safeDelete = (action: () => void, message: string) => {
    setDeleteConfirm({ step: 1, message, action });
  };

  const getFacility = (id: number, ext: string = '') => facilities.find(f => f.id === id) || { name: ext || 'Unknown', type: '', state: '', district: '', township: '' };

  const filteredStaff = staffEntries.filter(s => {
    const currFac = getFacility(s.currentFacilityId);
    const homeFac = getFacility(s.facilityId, s.externalFacilityName);
    
    let match = true;
    if (filterState && currFac.state !== filterState) match = false;
    if (filterDistrict && currFac.district !== filterDistrict) match = false;
    if (filterTownship && currFac.township !== filterTownship) match = false;
    if (filterFac && currFac.name !== filterFac) match = false;
    if (filterPos && s.position !== filterPos) match = false;
    
    if (searchStaff) {
      const searchLower = searchStaff.toLowerCase();
      const staffMatch = s.position.toLowerCase().includes(searchLower) || 
                         homeFac.name.toLowerCase().includes(searchLower) || 
                         currFac.name.toLowerCase().includes(searchLower);
      if (!staffMatch) match = false;
    }
    
    return match;
  });

  const uniqueStates = Array.from(new Set(facilities.map(f => f.state).filter(Boolean)));
  const uniqueDistricts = Array.from(new Set(facilities.map(f => f.district).filter(Boolean)));
  const uniqueTownships = Array.from(new Set(facilities.map(f => f.township).filter(Boolean)));
  const uniqueFacs = Array.from(new Set(facilities.map(f => f.name).filter(Boolean)));
  const uniquePos = Array.from(new Set(staffEntries.map(s => s.position).filter(Boolean)));

  const exportCSV = () => {
    if (filteredStaff.length === 0) return alert('CSV အဖြစ် ထုတ်ယူရန် ဝန်ထမ်းအချက်အလက် မရှိပါ။');
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
    csvContent += "Home Facility,Current Facility,State/Region,District,Township,Position,Duty Status,Attach Reason,Active Status,Status Reason\n";

    filteredStaff.forEach(s => {
      const homeFac = getFacility(s.facilityId, s.externalFacilityName);
      const currFac = getFacility(s.currentFacilityId);
      const isAttached = s.dutyStatus === "Attached" || s.facilityId !== s.currentFacilityId;
      const statusStr = isAttached ? "Attached" : "Present";
      
      const escapeCSV = (str: string) => `"${(str || '').toString().replace(/"/g, '""')}"`;
      const row = [
        escapeCSV(homeFac.name), escapeCSV(currFac.name), escapeCSV(currFac.state), escapeCSV(currFac.district),
        escapeCSV(currFac.township), escapeCSV(s.position), escapeCSV(statusStr), escapeCSV(s.reason),
        escapeCSV(s.activeStatus || 'Active'), escapeCSV(s.activeReason || '')
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HR_Staff_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
           <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-display leading-tight">Staff Directory</h2>
           <p className="text-slate-500 text-base sm:text-lg mt-2 font-medium">ဝန်ထမ်းရေးရာ အချက်အလက်များနှင့် ခန့်ထားမှု မှတ်တမ်းများ</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative group flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by position or facility..." 
              value={searchStaff}
              onChange={(e) => setSearchStaff(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
          {role !== 'viewer' && (
            <button onClick={openAddStaff} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[13px] font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 shrink-0">
              <Plus className="w-4 h-4" /> Add Staff
            </button>
          )}
          <button onClick={exportCSV} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[13px] font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 shrink-0">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="glass-card p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
           <Filter className="w-4 h-4 text-emerald-500" />
           <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Advanced Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Region</label>
            <select value={filterState} onChange={e=>setFilterState(e.target.value)} className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[12px] font-bold outline-none focus:border-emerald-500 transition-all">
              <option value="">All Regions</option>
              {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">District</label>
            <select value={filterDistrict} onChange={e=>setFilterDistrict(e.target.value)} className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[12px] font-bold outline-none focus:border-emerald-500 transition-all">
              <option value="">All Districts</option>
              {uniqueDistricts.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Township</label>
            <select value={filterTownship} onChange={e=>setFilterTownship(e.target.value)} className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[12px] font-bold outline-none focus:border-emerald-500 transition-all">
              <option value="">All Townships</option>
              {uniqueTownships.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Facility</label>
            <select value={filterFac} onChange={e=>setFilterFac(e.target.value)} className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[12px] font-bold outline-none focus:border-emerald-500 transition-all">
              <option value="">All Facilities</option>
              {uniqueFacs.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Position</label>
            <select value={filterPos} onChange={e=>setFilterPos(e.target.value)} className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[12px] font-bold outline-none focus:border-emerald-500 transition-all">
              <option value="">All Positions</option>
              {uniquePos.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-widest font-black">
            <tr>
              <th className="px-8 py-5">Origin (Home)</th>
              <th className="px-8 py-5 text-center"><ArrowRight className="w-4 h-4 mx-auto opacity-30" /></th>
              <th className="px-8 py-5">Placement (Current)</th>
              <th className="px-8 py-5">Position</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center">
                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-3">
                        <User className="w-6 h-6" />
                     </div>
                     <p className="text-slate-400 font-bold font-display uppercase tracking-wider text-xs">No records matching your search</p>
                  </div>
                </td>
              </tr>
            ) : (
              <AnimatePresence>
                {filteredStaff.map((s, idx) => {
                  const homeFac = getFacility(s.facilityId, s.externalFacilityName);
                  const currFac = getFacility(s.currentFacilityId);
                  const isAttached = s.dutyStatus === "Attached" || s.facilityId !== s.currentFacilityId;
                  const homeLoc = [homeFac.state, homeFac.township].filter(Boolean).join(' | ');
                  const currLoc = [currFac.state, currFac.township].filter(Boolean).join(' | ');

                  return (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      key={s.id} 
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-4">
                        <span className="font-bold text-slate-800 block text-[13px]">{homeFac.name}</span>
                        {homeLoc && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{homeLoc}</span>}
                      </td>
                      <td className="px-8 py-4 text-center">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center mx-auto transition-colors ${isAttached ? 'border-purple-100 bg-purple-50 text-purple-400' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                           <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <span className={`font-bold block text-[13px] ${isAttached ? 'text-purple-600' : 'text-slate-800'}`}>{currFac.name}</span>
                        {currLoc && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{currLoc}</span>}
                      </td>
                      <td className="px-8 py-4">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider border border-slate-200/50">{s.position}</span>
                      </td>
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${isAttached ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {isAttached ? 'Attached' : 'Present'}
                          </span>
                          {s.activeStatus && s.activeStatus !== 'Active' && (
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${s.activeStatus === 'Leave' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                              {s.activeStatus}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!s.cv ? (
                            <label className="cursor-pointer p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Upload CV">
                              <input type="file" className="hidden" accept=".pdf,.doc,.docx,image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    alert('File is too large. Please upload a file smaller than 2MB.');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    updateStaff({ ...s, cv: file.name, cvDataUrl: reader.result as string });
                                  };
                                  reader.readAsDataURL(file);
                                }
                                e.target.value = '';
                              }} />
                              <Plus className="w-5 h-5" />
                            </label>
                          ) : (
                            <button onClick={() => {
                              if (s.cvDataUrl) {
                                setCvPreview({ name: s.cv, dataUrl: s.cvDataUrl });
                              } else {
                                alert(`File attached: ${s.cv}\n(Document content is not available)`);
                              }
                            }} className="p-2 text-emerald-600 hover:bg-emerald-100 bg-emerald-50 rounded-xl transition-all shadow-sm" title={`View CV (${s.cv})`}>
                              <Eye className="w-5 h-5" />
                            </button>
                          )}
                          <button onClick={()=>{setActiveStaff(s); setViewerOpen(true)}} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="View Details">
                            <FileText className="w-5 h-5" />
                          </button>
                          {canEditStaff(s.facilityId) && (
                            <button onClick={()=>openEditStaff(s)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Edit Details">
                              <Edit2 className="w-5 h-5" />
                            </button>
                          )}
                          {canEditStaff(s.facilityId) && (
                            <button onClick={()=>safeDelete(() => deleteStaff(s.id), 'ဤဝန်ထမ်းမှတ်တမ်းကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?')} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Delete record">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </AnimatePresence>
            )}
          </tbody>
        </table>
      </div>

      {viewerOpen && activeStaff && (() => {
        const homeFac = getFacility(activeStaff.facilityId, activeStaff.externalFacilityName);
        const currFac = getFacility(activeStaff.currentFacilityId);
        const homeLoc = [homeFac.state, homeFac.district, homeFac.township].filter(Boolean).join(', ');
        const currLoc = [currFac.state, currFac.district, currFac.township].filter(Boolean).join(', ');

        return (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-1">{activeStaff.position}</h4>
              
              <div className="bg-slate-50 p-4 rounded-lg text-left mb-6 border border-slate-100 mt-4 space-y-4">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">မူလဌာန (Home)</p>
                  <p className="text-sm font-semibold text-slate-700 mb-0.5">{homeFac.name} ({homeFac.type || 'ပြင်ပ'})</p>
                  {homeLoc && <p className="text-[11px] font-medium text-slate-500">တည်နေရာ: {homeLoc}</p>}
                </div>
                <div className="border-t border-slate-200/60 pt-3">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">လက်ရှိတာဝန်ကျ (Current)</p>
                  <p className="text-sm font-semibold text-blue-600 mb-0.5">
                    {activeStaff.facilityId === activeStaff.currentFacilityId ? 'မူလဌာနတွင် တာဝန်ထမ်းဆောင်ဆဲ' : `${currFac.name} (${currFac.type})`}
                  </p>
                  {activeStaff.facilityId !== activeStaff.currentFacilityId && currLoc && <p className="text-[11px] font-medium text-slate-500">တည်နေရာ: {currLoc}</p>}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg text-left mb-6 border border-slate-100 space-y-3">
                {(activeStaff.facilityId !== activeStaff.currentFacilityId || activeStaff.dutyStatus === 'Attached') && (
                  <div className="pb-3 border-b border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">တွဲဖက်ရသည့် အကြောင်းပြချက်</p>
                    <p className="text-sm text-slate-700">{activeStaff.reason || '-'}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-2">
                    တာဝန်ထမ်းဆောင်မှု အခြေအနေ
                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${activeStaff.activeStatus === 'Leave' ? 'bg-yellow-100 text-yellow-700' : activeStaff.activeStatus === 'Other' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {activeStaff.activeStatus || 'Active'}
                    </span>
                  </p>
                  {(activeStaff.activeStatus === 'Leave' || activeStaff.activeStatus === 'Other') && (
                    <p className="text-sm text-slate-700 mt-1">{activeStaff.activeReason || '-'}</p>
                  )}
                </div>
              </div>
              
              <button onClick={()=>setViewerOpen(false)} className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition">ပိတ်မည်</button>
            </div>
          </div>
        )
      })()}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl border border-red-100">
            {deleteConfirm.step === 1 ? (
              <>
                <h3 className="text-lg font-bold text-slate-800 mb-2">ဖျက်ရန် အတည်ပြုပါ</h3>
                <p className="text-sm text-slate-600 mb-6">{deleteConfirm.message}</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">ပယ်ဖျက်မည် (Cancel)</button>
                  <button onClick={() => setDeleteConfirm({ ...deleteConfirm, step: 2 })} className="bg-red-500 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-red-600 transition">အတည်ပြုမည် (Confirm)</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-red-600 mb-2">နောက်ဆုံး အတည်ပြုချက်</h3>
                <p className="text-sm text-slate-700 mb-6 font-bold leading-relaxed">
                  သေချာပြီလား? ဤလုပ်ဆောင်ချက်ကို နောက်ပြန်ဆုတ်၍ မရပါ။<br/>
                  <span className="text-red-500 font-normal">Are you absolutely sure? This cannot be undone.</span>
                </p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">ပယ်ဖျက်မည် (Cancel)</button>
                  <button onClick={() => {
                    deleteConfirm.action();
                    setDeleteConfirm(null);
                  }} className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-red-700 hover:shadow-lg transition">ဖျက်ပစ်မည် (Delete)</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{eId ? 'ဝန်ထမ်းအချက်အလက် ပြင်ဆင်ရန်' : 'ဝန်ထမ်းသစ် ထည့်သွင်းရန်'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">အမည် <span className="text-red-500">*</span></label>
                <input type="text" value={eStaffName} onChange={e=>setEStaffName(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" placeholder="Staff Name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">လက်ရှိတာဝန်ကျ ဌာန / Current Facility <span className="text-red-500">*</span></label>
                <select value={eCurrFac} onChange={e=>setECurrFac(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500">
                  <option value="">ရွေးချယ်ပါ...</option>
                  {editableFacilities.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ရာထူး <span className="text-red-500">*</span></label>
                <select value={ePos} onChange={e=>setEPos(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500">
                  <option value="">ရွေးချယ်ပါ...</option>
                  {state.positionsList.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                 <label className="block text-xs font-semibold text-slate-600 mb-1">တာဝန်ထမ်းဆောင်မှု အခြေအနေ (Duty Status)</label>
                 <select value={eDuty} onChange={e=>setEDuty(e.target.value as any)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500">
                   <option value="Present">ပင်မတာဝန် / Main Duty (Present)</option>
                   <option value="Attached">တွဲဖက် / Attached</option>
                 </select>
              </div>
              
              {eDuty === 'Attached' && (
                  <div className="p-3 bg-purple-50 rounded-lg space-y-3 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-purple-700">မည်သည့်ဌာနမှ လာရောက်သနည်း?</label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={eIsExt} onChange={e=>setEIsExt(e.target.checked)} className="accent-purple-600 w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold text-purple-600">အခြားတိုင်း/ပြည်နယ်မှ</span>
                      </label>
                    </div>
                    {eIsExt ? (
                      <input type="text" placeholder="တိုင်းဒေသကြီး/ပြည်နယ်နှင့် ဌာနအမည်..." value={eExtName} onChange={e=>setEExtName(e.target.value)} className="w-full p-2.5 border border-purple-200 rounded-lg text-sm outline-none focus:border-purple-500 bg-white" />
                    ) : (
                      <select value={eSourceFac} onChange={e=>setESourceFac(e.target.value)} className="w-full p-2.5 border border-purple-200 rounded-lg text-sm outline-none focus:border-purple-500 bg-white">
                        <option value="">မူလ ဌာနရွေးချယ်ပါ...</option>
                        {facilities.filter(f => f.id.toString() !== eCurrFac).map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    )}
                    <div>
                      <label className="block text-[11px] font-semibold text-purple-600 mb-1">တွဲဖက်ရသည့် အကြောင်းပြချက် <span className="text-red-500">*</span></label>
                      <input type="text" value={eReason} onChange={e=>setEReason(e.target.value)} className="w-full p-2.5 border border-purple-200 rounded-lg text-sm outline-none focus:border-purple-500 bg-white" placeholder="ဥပမာပြရန်..." />
                    </div>
                  </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">အလုပ်ဆင်းနိုင်မှု (Active Status)</label>
                <select value={eActiveStatus} onChange={e=>{
                    setEActiveStatus(e.target.value as any);
                    if (e.target.value === 'Active') setEActiveReason('');
                }} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500">
                  <option value="Active">အလုပ်ဆင်း (Active)</option>
                  <option value="Leave">ခွင့် (Leave)</option>
                  <option value="Other">အခြား (Other)</option>
                </select>
                {eActiveStatus !== 'Active' && (
                  <input type="text" placeholder="အကြောင်းပြချက်..." value={eActiveReason} onChange={e=>setEActiveReason(e.target.value)} className="w-full mt-2 p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" />
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={()=>setIsEditorOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">ပယ်ဖျက်မည်</button>
              <button onClick={saveStaff} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">အတည်ပြုမည်</button>
            </div>
          </div>
        </div>
      )}

      {/* CV Preview Modal */}
      {cvPreview && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                {cvPreview.name}
              </h3>
              <div className="flex items-center gap-2">
                <a href={cvPreview.dataUrl} download={cvPreview.name} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1">
                   <Download className="w-4 h-4" /> Download
                </a>
                <button onClick={() => setCvPreview(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-300 transition-colors">
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-4">
              {cvPreview.dataUrl.startsWith('data:image/') ? (
                <img src={cvPreview.dataUrl} alt={cvPreview.name} className="max-w-full max-h-full object-contain rounded shadow-sm" />
              ) : (
                <iframe src={cvPreview.dataUrl} title={cvPreview.name} className="w-full h-full bg-white rounded shadow-sm border-0" />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
