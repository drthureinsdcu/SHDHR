import React, { useState } from 'react';
import { Trash2, Plus, ChevronRight } from 'lucide-react';
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
    if (newTypeName.trim()) {
      addFacilityType(newTypeName.trim());
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">စနစ် ဆက်တင်များ</h2>
      </div>

      <div className="flex border-b border-slate-200 mb-6">
        <button onClick={() => setActiveTab('types')} className={`px-6 py-3 text-sm transition ${activeTab === 'types' ? 'border-b-2 border-emerald-600 text-emerald-600 font-semibold' : 'text-slate-500'}`}>ဌာနအမျိုးအစားများ</button>
        <button onClick={() => { setActiveTab('locations'); }} className={`px-6 py-3 text-sm transition ${activeTab === 'locations' ? 'border-b-2 border-emerald-600 text-emerald-600 font-semibold' : 'text-slate-500'}`}>တည်နေရာများ</button>
        <button onClick={() => { setActiveTab('quotas'); setFilterType(facilityTypes[0] || ''); }} className={`px-6 py-3 text-sm transition ${activeTab === 'quotas' ? 'border-b-2 border-emerald-600 text-emerald-600 font-semibold' : 'text-slate-500'}`}>ပုံသေ ဝန်ထမ်းသတ်မှတ်ချက်</button>
      </div>

      {activeTab === 'locations' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Regions Column */}
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden h-[500px]">
              <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-700 text-sm">ပြည်နယ် / တိုင်းဒေသကြီး</div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll">
                {locations.map(r => (
                  <button key={r.name} onClick={() => { setSelReg(r.name); setSelDist(''); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-between ${selReg === r.name ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}>
                    {r.name}
                    {selReg === r.name && <ChevronRight className="w-4 h-4 text-emerald-600" />}
                  </button>
                ))}
              </div>
              <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
                <input value={newRegInp} onChange={e=>setNewRegInp(e.target.value)} type="text" placeholder="အသစ်ထည့်ရန်..." className="flex-1 p-2 border border-slate-200 rounded text-xs outline-none focus:border-emerald-500" />
                <button onClick={handleAddRegion} className="bg-emerald-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-emerald-700">+</button>
              </div>
            </div>

            {/* Districts Column */}
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden h-[500px]">
              <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-700 text-sm">ခရိုင်</div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll">
                {!selReg ? (
                  <div className="text-center text-slate-400 text-xs mt-10">တိုင်း/ပြည်နယ် ရွေးချယ်ပါ</div>
                ) : (() => {
                  const r = locations.find(x => x.name === selReg);
                  if (!r) return null;
                  return r.districts.map(d => (
                    <button key={d.name} onClick={() => setSelDist(d.name)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition flex items-center justify-between ${selDist === d.name ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}>
                      {d.name}
                      {selDist === d.name && <ChevronRight className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ));
                })()}
              </div>
              <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
                <input value={newDistInp} onChange={e=>setNewDistInp(e.target.value)} disabled={!selReg} type="text" placeholder="အသစ်ထည့်ရန်..." className="flex-1 p-2 border border-slate-200 rounded text-xs outline-none focus:border-emerald-500 disabled:opacity-50" />
                <button onClick={handleAddDistrict} disabled={!selReg} className="bg-emerald-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">+</button>
              </div>
            </div>

            {/* Townships Column */}
            <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden h-[500px]">
              <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-700 text-sm">မြို့နယ်</div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll">
                {!selDist ? (
                  <div className="text-center text-slate-400 text-xs mt-10">ခရိုင် ရွေးချယ်ပါ</div>
                ) : (() => {
                  const r = locations.find(x => x.name === selReg);
                  if (!r) return null;
                  const d = r.districts.find(x => x.name === selDist);
                  if (!d) return null;
                  return d.townships.map(t => (
                    <div key={t} className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-600 border border-transparent flex items-center justify-between group hover:bg-slate-50">
                      {t}
                    </div>
                  ));
                })()}
              </div>
              <div className="p-3 border-t border-slate-200 bg-slate-50 flex gap-2">
                <input value={newTownInp} onChange={e=>setNewTownInp(e.target.value)} disabled={!selDist} type="text" placeholder="အသစ်ထည့်ရန်..." className="flex-1 p-2 border border-slate-200 rounded text-xs outline-none focus:border-emerald-500 disabled:opacity-50" />
                <button onClick={handleAddTownship} disabled={!selDist} className="bg-emerald-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">+</button>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'types' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in">
          <div className="p-5 flex justify-between items-center border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">ဌာနအမျိုးအစားများ</h3>
            <button onClick={() => setIsTypeOpen(true)} className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition flex items-center gap-1"><Plus className="w-3 h-3" /> အမျိုးအစားသစ် ထည့်ရန်</button>
          </div>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-100">
              {facilityTypes.map((t, idx) => (
                <tr key={t}>
                  <td className="px-5 py-3 text-slate-700">{t}</td>
                  <td className="px-5 py-3 text-right"><button onClick={() => safeDelete(() => deleteFacilityType(idx), `ဌာနအမျိုးအစား '${t}' ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?`)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'quotas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in fade-in">
          <div className="mb-6 flex gap-4 items-center">
            <select value={filterType} onChange={e=>setFilterType(e.target.value)} className="p-2 border border-slate-200 rounded-lg outline-none bg-slate-50 flex-1 text-sm focus:border-emerald-500">
              {facilityTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={() => { setQType(filterType); setQPos(''); setQNewPos(''); setIsQuotaOpen(true); }} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-700 transition flex items-center gap-1"><Plus className="w-3 h-3" /> သတ်မှတ်ချက်အသစ် ထည့်ရန်</button>
          </div>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr><th className="px-5 py-3">ရာထူး</th><th className="px-5 py-3 text-center">အရေအတွက်</th><th className="px-5 py-3"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {globalDefaultQuotas.filter(q => q.type === filterType).map(q => (
                  <tr key={q.id}>
                    <td className="px-5 py-3 text-slate-700 font-medium">{q.position}</td>
                    <td className="px-5 py-3 text-center font-bold text-slate-600">{q.max}</td>
                    <td className="px-5 py-3 text-right"><button onClick={()=>safeDelete(() => deleteQuota(q.id), `သတ်မှတ်ချက် '${q.position}' ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?`)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}
      {isTypeOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-slate-800">ဌာနအမျိုးအစား ထည့်ရန်</h3>
            <input value={newTypeName} onChange={e=>setNewTypeName(e.target.value)} type="text" placeholder="အမျိုးအစားအမည် (Type Name)" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none text-sm focus:border-emerald-500" />
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={()=>setIsTypeOpen(false)} className="px-4 py-2 text-sm text-slate-600">ပယ်ဖျက်မည်</button>
              <button onClick={saveFacType} className="bg-slate-800 text-white px-5 py-2 rounded-lg text-sm hover:bg-slate-700">သိမ်းမည်</button>
            </div>
          </div>
        </div>
      )}

      {isQuotaOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-slate-800">ပုံသေသတ်မှတ်ချက် ထည့်ရန် ({qType})</h3>
            <div className="space-y-3">
              <select value={qPos} onChange={e=>setQPos(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg bg-white text-sm outline-none focus:border-emerald-500">
                <option value="">ရာထူးရွေးချယ်ပါ...</option>
                {positionsList.map(p => <option key={p} value={p}>{p}</option>)}
                <option value="ADD_NEW">+ ရာထူးအသစ်</option>
              </select>
              {qPos === 'ADD_NEW' && (
                <input value={qNewPos} onChange={e=>setQNewPos(e.target.value)} type="text" placeholder="ရာထူးအသစ်အမည်" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 animate-in fade-in slide-in-from-top-1" />
              )}
              <input value={qCount} onChange={e=>setQCount(parseInt(e.target.value)||0)} type="number" min="1" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={()=>setIsQuotaOpen(false)} className="px-4 py-2 text-sm text-slate-600">ပယ်ဖျက်မည်</button>
              <button onClick={saveNewQuota} className="bg-slate-800 text-white px-5 py-2 rounded-lg text-sm hover:bg-slate-700">သိမ်းမည်</button>
            </div>
          </div>
        </div>
      )}

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
