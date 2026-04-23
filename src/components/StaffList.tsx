import React, { useState } from 'react';
import { FileText, Download, Trash2 } from 'lucide-react';
import { Staff } from '../types';

export default function StaffList({ state }: { state: ReturnType<typeof import('../useAppState').useAppState> }) {
  const { staffEntries, facilities, deleteStaff } = state;
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterTownship, setFilterTownship] = useState('');
  const [filterFac, setFilterFac] = useState('');
  const [filterPos, setFilterPos] = useState('');
  
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{ step: 1 | 2, message: string, action: () => void } | null>(null);

  const safeDelete = (action: () => void, message: string) => {
    setDeleteConfirm({ step: 1, message, action });
  };

  const getFacility = (id: number, ext: string = '') => facilities.find(f => f.id === id) || { name: ext || 'Unknown', type: '', state: '', district: '', township: '' };

  const filteredStaff = staffEntries.filter(s => {
    const currFac = getFacility(s.currentFacilityId);
    let match = true;
    if (filterState && currFac.state !== filterState) match = false;
    if (filterDistrict && currFac.district !== filterDistrict) match = false;
    if (filterTownship && currFac.township !== filterTownship) match = false;
    if (filterFac && currFac.name !== filterFac) match = false;
    if (filterPos && s.position !== filterPos) match = false;
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-800">ဝန်ထမ်းများ စာရင်း</h2>
        <button onClick={exportCSV} className="bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-700 transition flex items-center gap-2 shadow-sm">
          <Download className="w-4 h-4" /> CSV ဖိုင် ထုတ်ယူမည်
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <select value={filterState} onChange={e=>setFilterState(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-emerald-500 bg-slate-50">
          <option value="">တိုင်း/ပြည်နယ် အားလုံး</option>
          {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterDistrict} onChange={e=>setFilterDistrict(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-emerald-500 bg-slate-50">
          <option value="">ခရိုင် အားလုံး</option>
          {uniqueDistricts.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterTownship} onChange={e=>setFilterTownship(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-emerald-500 bg-slate-50">
          <option value="">မြို့နယ် အားလုံး</option>
          {uniqueTownships.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterFac} onChange={e=>setFilterFac(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-emerald-500 bg-slate-50">
          <option value="">ဌာန အားလုံး</option>
          {uniqueFacs.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPos} onChange={e=>setFilterPos(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-emerald-500 bg-slate-50">
          <option value="">ရာထူး အားလုံး</option>
          {uniquePos.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-4">မူလဌာန (Home)</th>
              <th className="px-6 py-4">လက်ရှိတာဝန်ကျ (Current)</th>
              <th className="px-6 py-4">ရာထူး</th>
              <th className="px-6 py-4">တာဝန်အခြေအနေ</th>
              <th className="px-6 py-4 text-right">လုပ်ဆောင်ချက်</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filteredStaff.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">ရှာဖွေမှုနှင့် ကိုက်ညီသော ဝန်ထမ်းမှတ်တမ်းများ မရှိပါ။</td></tr>
            ) : filteredStaff.map(s => {
              const homeFac = getFacility(s.facilityId, s.externalFacilityName);
              const currFac = getFacility(s.currentFacilityId);
              const isAttached = s.dutyStatus === "Attached" || s.facilityId !== s.currentFacilityId;
              const homeLoc = [homeFac.state, homeFac.township].filter(Boolean).join(' | ');
              const currLoc = [currFac.state, currFac.township].filter(Boolean).join(' | ');

              return (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition group">
                  <td className="px-6 py-3">
                    <span className="font-semibold text-slate-800 block">{homeFac.name}</span>
                    {homeLoc && <span className="text-[10px] text-slate-400 font-medium">{homeLoc}</span>}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`font-semibold ${isAttached ? 'text-blue-600' : 'text-slate-800'} block`}>{currFac.name}</span>
                    {currLoc && <span className="text-[10px] text-slate-400 font-medium">{currLoc}</span>}
                  </td>
                  <td className="px-6 py-3"><span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-[11px] font-semibold">{s.position}</span></td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isAttached ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {isAttached ? 'Attached (တွဲဖက်)' : 'Present (မူလ)'}
                      </span>
                      {s.activeStatus && s.activeStatus !== 'Active' && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${s.activeStatus === 'Leave' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {s.activeStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={()=>{setActiveStaff(s); setViewerOpen(true)}} className="text-blue-600 hover:underline mr-3 text-xs font-semibold flex items-center justify-end gap-1 ml-auto mb-1"><FileText className="w-3 h-3" /> ကြည့်ရန်</button>
                    <button onClick={()=>safeDelete(() => deleteStaff(s.id), 'ဤဝန်ထမ်းမှတ်တမ်းကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?')} className="text-slate-300 hover:text-red-500 transition ml-auto flex"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              )
            })}
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

    </div>
  );
}
