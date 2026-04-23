import React, { useState } from 'react';
import { Plus, Trash2, MapPin, SlidersHorizontal, UserPlus, AlertCircle, Edit2 } from 'lucide-react';
import { Facility, CustomQuota } from '../types';

export default function Facilities({ state }: { state: ReturnType<typeof import('../useAppState').useAppState> }) {
  const { facilities, facilityTypes, globalDefaultQuotas, addFacility, updateFacility, deleteFacility, staffEntries, positionsList, addStaff, updateStaff } = state;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRecruitOpen, setIsRecruitOpen] = useState(false);
  const [isEditFacOpen, setIsEditFacOpen] = useState(false);
  const [activeRecruit, setActiveRecruit] = useState<{facId: number, pos: string} | null>(null);
  const [activeFacility, setActiveFacility] = useState<Facility | null>(null);

  // Facility Form State
  const [fName, setFName] = useState('');
  const [fType, setFType] = useState(facilityTypes[0] || '');
  const [fState, setFState] = useState('');
  const [fDistrict, setFDistrict] = useState('');
  const [fTownship, setFTownship] = useState('');
  const [fParent, setFParent] = useState('');
  const [fQuotas, setFQuotas] = useState<Record<string, number>>({});

  // Delete confirm state
  const [deleteConfirm, setDeleteConfirm] = useState<{ step: 1 | 2, message: string, action: () => void } | null>(null);

  const safeDelete = (action: () => void, message: string) => {
    setDeleteConfirm({ step: 1, message, action });
  };

  // Recruit Form State
  const [rDuty, setRDuty] = useState<'main'|'attach'>('main');
  const [rIsExternal, setRIsExternal] = useState(false);
  const [rSourceFac, setRSourceFac] = useState('');
  const [rExtName, setRExtName] = useState('');
  const [rReason, setRReason] = useState(''); // Attachment reason
  const [rConfirmOver, setRConfirmOver] = useState(false);
  const [rActiveStatus, setRActiveStatus] = useState<'Active'|'Leave'|'Other'>('Active');
  const [rActiveReason, setRActiveReason] = useState(''); // Leave reason
  const [rEditingStaffId, setREditingStaffId] = useState<number | null>(null);

  const resetFacilityForm = () => {
    setFName(''); setFType(facilityTypes[0] || ''); setFState(''); setFDistrict(''); setFTownship(''); setFParent(''); setFQuotas({});
    setIsAddOpen(false);
  }

  const handleFacTypeChange = (t: string) => {
    setFType(t);
    const defaults = globalDefaultQuotas.filter(q => q.type === t);
    const newQ: any = {};
    defaults.forEach(q => newQ[q.position] = q.max);
    setFQuotas(newQ);
  }

  const submitAddFacility = () => {
    if (!fName.trim()) return alert('ဌာနအမည် ထည့်သွင်းရန် လိုအပ်ပါသည်။');
    const customQuotas: CustomQuota[] = Object.keys(fQuotas).map(k => ({ position: k, max: fQuotas[k] }));
    const parentFacilityId = fParent ? parseInt(fParent) : undefined;
    addFacility({
      id: Date.now(), name: fName.trim(), type: fType, state: fState, district: fDistrict, township: fTownship, customQuotas, parentFacilityId
    });
    resetFacilityForm();
  }

  const openEditFacility = (fac: Facility) => {
    setActiveFacility(fac);
    setIsEditFacOpen(true);
  }

  const submitEditFacilityQuotas = () => {
    if (!activeFacility) return;
    updateFacility({ ...activeFacility });
    setIsEditFacOpen(false);
  }

  const openRecruit = (facId: number, pos: string) => {
    setActiveRecruit({facId, pos});
    setRDuty('main'); setRIsExternal(false); setRSourceFac(''); setRExtName(''); setRReason(''); setRConfirmOver(false);
    setRActiveStatus('Active'); setRActiveReason('');
    setREditingStaffId(null);
    setIsRecruitOpen(true);
  }

  const submitRecruit = () => {
    if (!activeRecruit) return;
    if (rDuty === 'attach' && !rReason.trim()) return alert('အကြောင်းပြချက် (Reason for Attachment) ကို မဖြစ်မနေ ဖြည့်သွင်းပေးပါ။');
    if (rActiveStatus !== 'Active' && !rActiveReason.trim()) return alert('ဝန်ထမ်း ခွင့်/အခြားအခြေအနေအတွက် အကြောင်းပြချက်ကို ဖြည့်သွင်းရန် လိုအပ်ပါသည်။');

    let homeFacId = activeRecruit.facId;
    let destFacId = activeRecruit.facId;
    let dutyStatus: 'Present' | 'Attached' = 'Present';
    let extName = '';

    if (rDuty === 'attach') {
      if (rIsExternal) {
        homeFacId = -1;
        extName = rExtName.trim();
        if (!extName) return alert('လာရောက်သည့် တိုင်းဒေသကြီး သို့မဟုတ် ဌာနအမည်ကို ထည့်သွင်းပေးပါ။');
      } else {
        homeFacId = parseInt(rSourceFac);
      }
      dutyStatus = 'Attached';
    }

    if (rEditingStaffId) {
      const existing = staffEntries.find(s => s.id === rEditingStaffId);
      if (existing) {
        updateStaff({
          ...existing,
          facilityId: homeFacId,
          currentFacilityId: destFacId,
          externalFacilityName: extName,
          dutyStatus,
          reason: rDuty === 'attach' ? rReason.trim() : '',
          activeStatus: rActiveStatus,
          activeReason: rActiveStatus !== 'Active' ? rActiveReason.trim() : ''
        });
      }
    } else {
      addStaff({
        id: Date.now(),
        facilityId: homeFacId,
        currentFacilityId: destFacId,
        externalFacilityName: extName,
        position: activeRecruit.pos,
        reason: rDuty === 'attach' ? rReason.trim() : '',
        cv: '', 
        dutyStatus,
        activeStatus: rActiveStatus,
        activeReason: rActiveStatus !== 'Active' ? rActiveReason.trim() : ''
      });
    }

    setIsRecruitOpen(false);
  }

  const activeFacForRecruit = activeRecruit ? facilities.find(f => f.id === activeRecruit.facId) : null;
  const activeQuotaDef = activeFacForRecruit ? activeFacForRecruit.customQuotas.find(q => q.position === activeRecruit?.pos) : null;
  const occupiedCountForRecruit = activeRecruit ? staffEntries.filter(s => s.facilityId === activeRecruit.facId && s.position === activeRecruit.pos).length : 0;
  const isOverQuota = activeQuotaDef && activeQuotaDef.max > 0 && occupiedCountForRecruit >= activeQuotaDef.max;

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ဌာနနှင့် ဝန်ထမ်းခန့်ထားမှုများ</h2>
          <p className="text-slate-500 text-sm mt-1">ဌာနများ၏ လစ်လပ်ရာထူးများတွင် တိုက်ရိုက် ဝန်ထမ်းခန့်အပ်နိုင်ပါသည်</p>
        </div>
        <button onClick={() => { handleFacTypeChange(fType); setIsAddOpen(true); }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> ဌာနအသစ် ထည့်ရန်
        </button>
      </div>

      {facilities.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-400 text-sm">မှတ်ပုံတင်ထားသော ဌာနများ မရှိသေးပါ။</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {facilities.map(f => {
            const locationStr = [f.state, f.district, f.township].filter(Boolean).join(' • ');
            const parentName = f.parentFacilityId ? facilities.find(p => p.id === f.parentFacilityId)?.name : null;
            
            return (
              <div key={f.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{f.type}</span>
                      {parentName && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">ပင်မဌာန: {parentName}</span>}
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mt-2">{f.name}</h4>
                    {locationStr && <p className="text-[11px] text-slate-400 font-medium mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {locationStr}</p>}
                  </div>
                </div>

                <div className="space-y-3 mt-2">
                  {f.customQuotas.length === 0 && <p className="text-[11px] text-slate-400">ရာထူးသတ်မှတ်ချက် မရှိသေးပါ။</p>}
                  {f.customQuotas.map(q => {
                    const allowed = q.max || 0;
                    const homeStaff = staffEntries.filter(s => s.facilityId === f.id && s.position === q.position);
                    const occupied = homeStaff.length;
                    const attachedOut = homeStaff.filter(s => s.currentFacilityId !== f.id).length;
                    const attachedIn = staffEntries.filter(s => s.currentFacilityId === f.id && s.facilityId !== f.id && s.position === q.position).length;
                    const vacancy = Math.max(0, allowed - occupied);
                    const isOver = allowed > 0 && occupied > allowed;

                    return (
                      <div key={q.position} className={`flex flex-col p-3 rounded-lg border ${isOver ? 'bg-red-50/50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-2">
                          <span className="text-[13px] font-bold text-slate-800">{q.position}</span>
                          <button onClick={() => openRecruit(f.id, q.position)} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded shadow-sm text-[11px] font-semibold hover:border-emerald-500 hover:text-emerald-600 transition flex items-center gap-1">
                            <Plus className="w-3 h-3" /> ဝန်ထမ်းခန့်ရန်
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
                          <div className="text-slate-600">
                            <span className="font-medium">Occupied:</span> <span className={`font-bold ${isOver ? 'text-red-600' : 'text-slate-800'}`}>{occupied}</span> <span className="text-slate-400">/ {allowed}</span>
                          </div>
                          <div className="text-slate-600">
                            <span className="font-medium">Vacancy:</span> <span className={`font-bold ${vacancy > 0 ? 'text-red-500' : 'text-slate-800'}`}>{vacancy}</span>
                          </div>
                          <div className="text-slate-600">
                            <span className="font-medium">Attached Out:</span> <span className={attachedOut > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>{attachedOut}</span>
                          </div>
                          <div className="text-slate-600">
                            <span className="font-medium">Attached In:</span> <span className={attachedIn > 0 ? 'text-purple-600 font-bold' : 'text-slate-400'}>{attachedIn}</span>
                          </div>
                        </div>

                        {/* Occupied Staff CV Dropdown */}
                        {(() => {
                          const occupantList = staffEntries.filter(s => s.currentFacilityId === f.id && s.position === q.position);
                          if (occupantList.length === 0) return null;
                          return (
                            <details className="mt-3 group/acc border border-slate-200 rounded-lg overflow-hidden bg-white">
                              <summary className="bg-slate-100 p-2 text-[11px] font-bold text-slate-700 cursor-pointer flex justify-between items-center outline-none list-none transition hover:bg-slate-200/50">
                                <span>Occupied Staff ({occupantList.length})</span>
                                <span className="text-slate-400 group-open/acc:rotate-180 transition-transform text-[10px]">▼</span>
                              </summary>
                              <div className="p-2 flex flex-col gap-1.5 bg-white">
                                {occupantList.map((staff, sIdx) => {
                                  const isAttachedIn = staff.facilityId !== f.id;
                                  return (
                                    <div key={staff.id} className="flex justify-between p-2 rounded-md bg-slate-50 border border-slate-100 gap-2 items-start">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex flex-col">
                                          <span className="text-xs font-semibold text-slate-800">
                                            Staff {sIdx + 1} {isAttachedIn && <span className="text-purple-600 text-[10px] ml-1">(Attached)</span>}
                                          </span>
                                          <span className={`text-[10px] font-medium ${staff.activeStatus === 'Leave' ? 'text-yellow-600' : staff.activeStatus === 'Other' ? 'text-red-600' : 'text-emerald-600'}`}>
                                            [{staff.activeStatus || 'Active'}]
                                          </span>
                                        </div>
                                        {(isAttachedIn && staff.reason) && (
                                          <p className="text-[10px] text-slate-500"><span className="font-semibold text-slate-600">တွဲဖက်:</span> {staff.reason}</p>
                                        )}
                                        {((staff.activeStatus === 'Leave' || staff.activeStatus === 'Other') && staff.activeReason) && (
                                          <p className="text-[10px] text-slate-500"><span className="font-semibold text-slate-600">အခြေအနေ:</span> {staff.activeReason}</p>
                                        )}
                                      </div>
                                      
                                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                                        <button onClick={() => {
                                          openRecruit(f.id, q.position);
                                          setREditingStaffId(staff.id);
                                          setRIsExternal(staff.facilityId === -1);
                                          if (staff.facilityId !== -1 && staff.facilityId !== f.id) {
                                            setRSourceFac(staff.facilityId.toString());
                                          }
                                          if (staff.facilityId === -1) {
                                            setRExtName(staff.externalFacilityName || '');
                                          }
                                          setRDuty(staff.dutyStatus === 'Attached' ? 'attach' : 'main');
                                          setRReason(staff.reason || '');
                                          setRActiveStatus(staff.activeStatus || 'Active');
                                          setRActiveReason(staff.activeReason || '');
                                        }} className="p-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100 transition" title="Edit Staff Status">
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        
                                        {!staff.cv ? (
                                          <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-[11px] font-semibold rounded hover:border-emerald-500 hover:text-emerald-600 transition truncate max-w-[120px] text-center">
                                            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                const updated = { ...staff, cv: file.name };
                                                updateStaff(updated);
                                              }
                                              e.target.value = '';
                                            }} />
                                            + Upload CV
                                          </label>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <button onClick={() => alert(`Simulating opening document:\n${staff.cv}`)} className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold rounded hover:bg-blue-100 transition flex items-center gap-1.5 truncate max-w-[130px]">
                                              <span className="truncate">{staff.cv}</span>
                                            </button>
                                            <label className="cursor-pointer p-1.5 text-slate-400 hover:text-emerald-600 transition bg-white border border-slate-200 rounded">
                                              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  const updated = { ...staff, cv: file.name };
                                                  updateStaff(updated);
                                                }
                                                e.target.value = '';
                                              }} />
                                              <Edit2 className="w-3 h-3" />
                                            </label>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          );
                        })()}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <button onClick={() => openEditFacility(f)} className="text-slate-400 hover:text-blue-600 text-sm transition flex items-center gap-1"><Edit2 className="w-4 h-4" /> ရာထူးပြင်ဆင်ရန်</button>
                  <button onClick={() => safeDelete(() => deleteFacility(f.id), `ဌာန '${f.name}' ကို ဖျက်ပစ်မည်မှာ သေချာပါသလား?`)} className="text-slate-300 hover:text-red-500 text-sm transition flex items-center gap-1"><Trash2 className="w-4 h-4" /> ဖျက်မည်</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODALS */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 flex flex-col max-h-[90vh] shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">ဌာနအသစ် မှတ်ပုံတင်ရန်</h3>
            
            <div className="space-y-5 overflow-y-auto flex-1 pr-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">ပြည်နယ် / တိုင်းဒေသကြီး</label>
                  <select value={fState} onChange={e=>{
                    setFState(e.target.value);
                    setFDistrict('');
                    setFTownship('');
                  }} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500">
                    <option value="">ရွေးချယ်ပါ...</option>
                    {state.locations.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">ခရိုင်</label>
                  <select value={fDistrict} onChange={e=>{
                    setFDistrict(e.target.value);
                    setFTownship('');
                  }} disabled={!fState} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 disabled:opacity-50 disabled:bg-slate-50">
                    <option value="">ရွေးချယ်ပါ...</option>
                    {fState && state.locations.find(r => r.name === fState)?.districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">မြို့နယ်</label>
                  <select value={fTownship} onChange={e=>setFTownship(e.target.value)} disabled={!fDistrict} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 disabled:opacity-50 disabled:bg-slate-50">
                    <option value="">ရွေးချယ်ပါ...</option>
                    {fDistrict && state.locations.find(r => r.name === fState)?.districts.find(d => d.name === fDistrict)?.townships.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">ဌာနအမည် <span className="text-red-500">*</span></label>
                  <input value={fName} onChange={e=>setFName(e.target.value)} type="text" className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 font-semibold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">ဌာန အမျိုးအစား</label>
                  <select value={fType} onChange={e => handleFacTypeChange(e.target.value)} className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg outline-none focus:border-emerald-500">
                    {facilityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">ပင်မဌာန (ရွေးချယ်နိုင်သည်)</label>
                  <select value={fParent} onChange={e => setFParent(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white">
                    <option value="">(ပင်မဌာန မရှိပါ)</option>
                    {facilities.map(t => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-2">
                <h4 className="text-xs font-semibold text-slate-700 mb-3 flex items-center justify-between">
                  ဝန်ထမ်းလိုအပ်ချက် ပြင်ဆင်ရန် (ရွေးချယ်နိုင်သည်) <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                </h4>
                <div className="space-y-2">
                  {Object.keys(fQuotas).length === 0 ? <p className="text-xs text-slate-400 italic text-center py-2">သတ်မှတ်ချက် မရှိသေးပါ။</p> : 
                    Object.keys(fQuotas).map(k => (
                      <div key={k} className="flex items-center justify-between bg-white p-2 border border-slate-100 rounded-lg">
                        <span className="text-xs font-semibold text-slate-700 pl-2">{k}</span>
                        <input type="number" value={fQuotas[k]} onChange={e => setFQuotas({...fQuotas, [k]: parseInt(e.target.value)||0})} className="w-16 p-1 border border-slate-200 rounded text-center text-sm focus:border-emerald-500 outline-none" min="0" />
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={resetFacilityForm} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition">ပယ်ဖျက်မည်</button>
              <button onClick={submitAddFacility} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">သိမ်းဆည်းမည်</button>
            </div>
          </div>
        </div>
      )}

      {isEditFacOpen && activeFacility && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl relative max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-2">{activeFacility.name}</h3>
            <p className="text-sm text-slate-500 mb-6 border-b border-slate-100 pb-4">ရာထူးသတ်မှတ်ချက်များ ပြင်ဆင်ရန် (Quota Overrides)</p>
            
            <div className="flex-1 overflow-y-auto space-y-3 custom-scroll pr-2">
              {activeFacility.customQuotas.map((q, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 border border-slate-200 rounded-lg">
                  <span className="text-sm font-semibold text-slate-700">{q.position}</span>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={q.max} 
                      onChange={(e) => {
                        const newFac = { ...activeFacility };
                        newFac.customQuotas[idx].max = parseInt(e.target.value) || 0;
                        setActiveFacility(newFac);
                      }} 
                      className="w-20 p-1.5 border border-slate-200 rounded text-center focus:border-emerald-500 outline-none" min="0" 
                    />
                    <button onClick={() => {
                      const newFac = { ...activeFacility, customQuotas: activeFacility.customQuotas.filter((_, i) => i !== idx) };
                      setActiveFacility(newFac);
                    }} className="text-slate-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t border-slate-200">
                <label className="block text-xs font-semibold text-slate-600 mb-2">ရာထူးအသစ် ထပ်တိုးရန်</label>
                <select onChange={(e) => {
                  const pos = e.target.value;
                  if (!pos) return;
                  if (activeFacility.customQuotas.find(q => q.position === pos)) return alert('Already added!');
                  const newFac = { ...activeFacility, customQuotas: [...activeFacility.customQuotas, { position: pos, max: 1 }] };
                  setActiveFacility(newFac);
                  e.target.value = "";
                }} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 bg-white">
                  <option value="">ရာထူးရွေးချယ်ပါ...</option>
                  {positionsList.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setIsEditFacOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">ပယ်ဖျက်မည်</button>
              <button onClick={submitEditFacilityQuotas} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition">အတည်ပြုမည်</button>
            </div>
          </div>
        </div>
      )}

      {isRecruitOpen && activeFacForRecruit && activeRecruit && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{rEditingStaffId ? 'ဝန်ထမ်းအခြေအနေ ပြင်ဆင်ရန်' : 'ဝန်ထမ်းခန့်အပ်ရန်'}</h3>
            
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg mb-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-md flex items-center justify-center"><UserPlus className="w-4 h-4" /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{activeFacForRecruit.name} ({activeFacForRecruit.type})</p>
                <p className="text-sm font-bold text-slate-800">{activeRecruit.pos}</p>
              </div>
            </div>

            {!rEditingStaffId && isOverQuota && (
              <div className="mb-4 bg-red-50 border border-red-100 p-4 rounded-xl">
                <p className="text-[13px] text-red-600 font-medium flex items-start gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  သတိပေးချက် - ဤရာထူးသည် သတ်မှတ်အရေအတွက် ပြည့်နေပါသည်။
                </p>
                <label className="flex items-start gap-3 bg-white p-3 rounded-lg border border-red-200 cursor-pointer hover:border-red-300 transition">
                  <input type="checkbox" checked={rConfirmOver} onChange={e=>setRConfirmOver(e.target.checked)} className="mt-0.5 accent-emerald-600" />
                  <span className="text-xs text-slate-700 font-medium leading-relaxed">
                    သတ်မှတ်အရေအတွက် ပြည့်နေသော်လည်း ဤဝန်ထမ်းအား ဆက်လက်ခန့်အပ်ရန် သဘောတူပါသည်။
                  </span>
                </label>
              </div>
            )}

            <div className="space-y-4 text-sm">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-semibold text-slate-600 mb-2">တာဝန်ထမ်းဆောင်မည့် ပုံစံ (Duty Type) <span className="text-red-500">*</span></label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={rDuty==='main'} onChange={()=>setRDuty('main')} className="w-4 h-4 accent-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">မူလခန့်ထားမှု (Permanent)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={rDuty==='attach'} onChange={()=>{
                      setRDuty('attach');
                      if(facilities.length <= 1) setRIsExternal(true); 
                    }} className="w-4 h-4 accent-purple-600" />
                    <span className="text-sm font-medium text-slate-700">အခြားဌာနမှ တွဲဖက်လာရောက်ခြင်း (Attached In)</span>
                  </label>
                  {facilities.length <= 1 && rDuty==='attach' && <p className="text-[11px] text-red-500 mt-1 ml-6">* စနစ်တွင်း အခြားဌာနများ မရှိသေးသဖြင့် ပြင်ပမှသာ တွဲဖက်နိုင်ပါမည်။</p>}
                </div>

                {rDuty === 'attach' && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-600">မည်သည့်ဌာနမှ လာရောက်သနည်း? <span className="text-red-500">*</span></label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={rIsExternal} disabled={facilities.length<=1} onChange={e=>setRIsExternal(e.target.checked)} className="accent-purple-600 w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold text-purple-600">အခြားတိုင်း/ပြည်နယ်မှ</span>
                      </label>
                    </div>
                    {rIsExternal ? (
                      <input type="text" placeholder="တိုင်းဒေသကြီး/ပြည်နယ်နှင့် ဌာနအမည်..." value={rExtName} onChange={e=>setRExtName(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-purple-500 bg-purple-50/30" />
                    ) : (
                      <select value={rSourceFac} onChange={e=>setRSourceFac(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-purple-500 bg-purple-50/30">
                        <option value="">ဌာနရွေးချယ်ပါ...</option>
                        {facilities.filter(f=>f.id !== activeRecruit.facId).map(f => <option key={f.id} value={f.id}>{f.name} ({f.type})</option>)}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {rDuty === 'attach' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">တွဲဖက်ရသည့် အကြောင်းပြချက် <span className="text-red-500">*</span></label>
                  <textarea placeholder="ဥပမာ - အရေးပေါ်လိုအပ်ချက်၊ တာဝန်ပြောင်း..." value={rReason} onChange={e=>setRReason(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm h-16 outline-none focus:border-purple-500 resize-none"></textarea>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-semibold text-slate-600 mb-2">တာဝန်ထမ်းဆောင်မှု အခြေအနေ (Active Status) <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={rActiveStatus==='Active'} onChange={()=>setRActiveStatus('Active')} className="w-4 h-4 accent-emerald-600" />
                    <span className="text-sm font-medium text-slate-700">တာဝန်ထမ်းဆောင်ဆဲ (Active)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={rActiveStatus==='Leave'} onChange={()=>setRActiveStatus('Leave')} className="w-4 h-4 accent-yellow-500" />
                    <span className="text-sm font-medium text-slate-700">ခွင့် (Leave)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={rActiveStatus==='Other'} onChange={()=>setRActiveStatus('Other')} className="w-4 h-4 accent-red-600" />
                    <span className="text-sm font-medium text-slate-700">အခြား (Other)</span>
                  </label>
                </div>

                {rActiveStatus !== 'Active' && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">ခွင့်/အခြားအခြေအနေအတွက် အကြောင်းပြချက် <span className="text-red-500">*</span></label>
                    <input type="text" placeholder="ဥပမာ - ကျန်းမာရေးခွင့်၊ သင်တန်း..." value={rActiveReason} onChange={e=>setRActiveReason(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-500 bg-white" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button onClick={()=>setIsRecruitOpen(false)} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">ပယ်ဖျက်မည်</button>
              <button onClick={submitRecruit} disabled={!rEditingStaffId && isOverQuota && !rConfirmOver} className="bg-emerald-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed">အတည်ပြုမည်</button>
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
