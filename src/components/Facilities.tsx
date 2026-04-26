import React, { useState } from 'react';
import { Plus, Trash2, MapPin, SlidersHorizontal, UserPlus, AlertCircle, Edit2, Search, Building, MoreVertical, FileText, ChevronRight, Info, Filter, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Facility, CustomQuota } from '../types';
import FacilitySelect from './FacilitySelect';
import { useRole } from '../contexts/RoleContext';

export default function Facilities({ state }: { state: ReturnType<typeof import('../useAppState').useAppState> }) {
  const { role, allowedTownship } = useRole();
  const { facilities, facilityTypes, globalDefaultQuotas, addFacility, updateFacility, deleteFacility, staffEntries, positionsList, addStaff, updateStaff } = state;

  const openAddFacility = () => {
    handleFacTypeChange(fType);
    if (role === 'manager' && allowedTownship) {
      // Find state and district
      for (const r of state.locations) {
        for (const d of r.districts) {
          if (d.townships.includes(allowedTownship)) {
            setFState(r.name);
            setFDistrict(d.name);
            setFTownship(allowedTownship);
            break;
          }
        }
      }
    }
    setIsAddOpen(true);
  };

  const canEditFacility = (township?: string) => {
    if (role === 'admin') return true;
    if (role === 'manager') {
      if (!allowedTownship) return true; // If no specific township assigned, they can manage everything (or restrict them to none? Typically no assigned means everything, or restrict? Wait, I should make "restricted if specified")
      if (township && township === allowedTownship) return true;
    }
    return false;
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isRecruitOpen, setIsRecruitOpen] = useState(false);
  const [isEditFacOpen, setIsEditFacOpen] = useState(false);
  const [activeRecruit, setActiveRecruit] = useState<{facId: number, pos: string} | null>(null);
  const [activeFacility, setActiveFacility] = useState<Facility | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Facility Form State
  const [fName, setFName] = useState('');
  const [fType, setFType] = useState(facilityTypes[0]?.name || '');
  const [fState, setFState] = useState('');
  const [fDistrict, setFDistrict] = useState('');
  const [fTownship, setFTownship] = useState('');
  const [fParent, setFParent] = useState<number | undefined>(undefined);
  const [fQuotas, setFQuotas] = useState<Record<string, number>>({});
  const [fStatus, setFStatus] = useState<'Functioning'|'Non-Functioning'>('Functioning');
  const [fInfraStatus, setFInfraStatus] = useState<'Standard'|'Sub-standard'>('Standard');

  // File Preview Modal
  const [cvPreview, setCvPreview] = useState<{ name: string, dataUrl: string } | null>(null);

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
  const [rStaffName, setRStaffName] = useState('');
  const [rCvName, setRCvName] = useState('');
  const [rCvDataUrl, setRCvDataUrl] = useState('');

  const resetFacilityForm = () => {
    setFName(''); setFType(facilityTypes[0]?.name || ''); setFState(''); setFDistrict(''); setFTownship(''); setFParent(undefined); setFQuotas({});
    setFStatus('Functioning'); setFInfraStatus('Standard');
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
    const parentFacilityId = fParent;
    addFacility({
      id: Date.now(), name: fName.trim(), type: fType, state: fState, district: fDistrict, township: fTownship, 
      customQuotas, parentFacilityId,
      status: fStatus, infrastructureStatus: fInfraStatus
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
    setRStaffName(''); setRCvName(''); setRCvDataUrl('');
    setREditingStaffId(null);
    setIsRecruitOpen(true);
  }

  const openEditStaff = (staff: typeof staffEntries[0], facId: number, pos: string) => {
    setActiveRecruit({facId, pos});
    if (staff.dutyStatus === 'Attached') {
       setRDuty('attach');
       if (staff.facilityId === -1) {
         setRIsExternal(true);
         setRSourceFac('');
         setRExtName(staff.externalFacilityName || '');
       } else {
         setRIsExternal(false);
         setRSourceFac(staff.facilityId.toString());
         setRExtName('');
       }
    } else {
       setRDuty('main');
       setRIsExternal(false);
       setRSourceFac('');
       setRExtName('');
    }
    setRReason(staff.reason || '');
    setRActiveStatus(staff.activeStatus || 'Active');
    setRActiveReason(staff.activeReason || '');
    setRStaffName(staff.name || '');
    setRCvName(staff.cv || '');
    setRCvDataUrl(staff.cvDataUrl || '');
    setRConfirmOver(true); // Don't block editing
    setREditingStaffId(staff.id);
    setIsRecruitOpen(true);
  }

  const submitRecruit = () => {
    if (!activeRecruit) return;
    if (!rStaffName.trim()) return alert('ဝန်ထမ်းအမည် (Staff Name) ဖြည့်သွင်းပေးပါ။');
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
          name: rStaffName,
          facilityId: homeFacId,
          currentFacilityId: destFacId,
          externalFacilityName: extName,
          dutyStatus,
          reason: rDuty === 'attach' ? rReason.trim() : '',
          activeStatus: rActiveStatus,
          activeReason: rActiveStatus !== 'Active' ? rActiveReason.trim() : '',
          cv: rCvName,
          cvDataUrl: rCvDataUrl
        });
      }
    } else {
      addStaff({
        id: Date.now(),
        name: rStaffName,
        facilityId: homeFacId,
        currentFacilityId: destFacId,
        externalFacilityName: extName,
        position: activeRecruit.pos,
        reason: rDuty === 'attach' ? rReason.trim() : '',
        cv: rCvName, 
        cvDataUrl: rCvDataUrl,
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

  const rootFacilitiesToShow = React.useMemo(() => {
    return facilities.filter(f => {
      const isChild = f.parentFacilityId && f.parentFacilityId !== f.id && facilities.some(p => p.id === f.parentFacilityId);

      if (!searchTerm) {
        // Normal view: only show root facilities or those with invalid parents
        return !isChild;
      }
      
      // Search view: check if this facility matches
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (fac: Facility) => {
        const fullLoc = [fac.state, fac.district, fac.township].filter(Boolean).join(' ').toLowerCase();
        return fac.name.toLowerCase().includes(searchLower) ||
          fac.type.toLowerCase().includes(searchLower) ||
          fullLoc.includes(searchLower);
      };
      
      if (matchesSearch(f)) return true;
      
      // If it's a parent, also show it if any of its children match
      const children = facilities.filter(child => child.parentFacilityId === f.id);
      return children.some(matchesSearch);
    });
  }, [facilities, searchTerm]);

  const locationGroups = React.useMemo(() => {
    const groups: Record<string, Facility[]> = {};
    rootFacilitiesToShow.forEach(f => {
      const loc = [f.state, f.district, f.township].filter(Boolean).join(' • ') || 'Unspecified Location';
      if (!groups[loc]) groups[loc] = [];
      groups[loc].push(f);
    });
    return groups;
  }, [rootFacilitiesToShow]);

  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});
  const [expandedSubDepts, setExpandedSubDepts] = useState<Record<number, boolean>>({});
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const [cardFilters, setCardFilters] = useState<Record<number, 'all'|'vacancy'|'attOut'|'attIn'>>({});
  const [showNoParentOnly, setShowNoParentOnly] = useState(false);

  const toggleLocation = (loc: string) => {
    setExpandedLocations(prev => ({ ...prev, [loc]: !prev[loc] }));
  };

  const toggleParent = (id: number) => {
    setExpandedParents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubDepts = (id: number) => {
    setExpandedSubDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCard = (id: number) => {
    setExpandedCards(prev => {
       const isExpanded = !prev[id];
       if (!isExpanded) {
          setCardFilters(fPrev => ({ ...fPrev, [id]: 'all' }));
       } else {
          setCardFilters(fPrev => ({ ...fPrev, [id]: 'all' }));
       }
       return { ...prev, [id]: isExpanded };
    });
  };

  const setCardFilterAndExpand = (id: number, filter: 'all'|'vacancy'|'attOut'|'attIn') => {
    setCardFilters(prev => {
      const isSame = prev[id] === filter;
      return { ...prev, [id]: isSame ? 'all' : filter };
    });
    setExpandedCards(prev => ({ ...prev, [id]: true }));
  };

  const renderFacilityCard = (f: Facility, depth = 0) => {
    const allChildren = facilities.filter(child => child.parentFacilityId === f.id);
    const subDeptTypes = state.subdepartmentsMap[f.type] || [];
    const subDepartments = allChildren.filter(c => subDeptTypes.includes(c.type));
    const childFacilities = allChildren.filter(c => !subDeptTypes.includes(c.type));

    const totalQuota = f.customQuotas.reduce((acc, q) => acc + q.max, 0);
    const totalOccupied = staffEntries.filter(s => s.facilityId === f.id).length;
    
    // Aggregated stats for the right side of the card
    const totalVacancy = f.customQuotas.reduce((acc, q) => {
      const occupied = staffEntries.filter(s => s.facilityId === f.id && s.position === q.position).length;
      return acc + Math.max(0, q.max - occupied);
    }, 0);
    
    const totalAttOut = staffEntries.filter(s => s.facilityId === f.id && s.currentFacilityId !== f.id).length;
    const totalAttIn = staffEntries.filter(s => s.currentFacilityId === f.id && s.facilityId !== f.id).length;

    const isExpandedFacilities = expandedParents[f.id];
    const isSubDeptsExpanded = expandedSubDepts[f.id];
    const isCardExpanded = expandedCards[f.id] === true;

    return (
      <div key={f.id} className="flex flex-col">
        {/* STYLE 1 CARD */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`group bg-white ${depth > 0 ? 'rounded-xl mb-2' : 'rounded-2xl mb-3'} border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${isCardExpanded ? 'ring-2 ring-emerald-500/20' : ''}`}
        >
          <div className={`flex flex-col md:flex-row items-stretch md:items-center ${depth > 0 ? 'p-3 md:p-4 gap-3 md:gap-4' : 'p-5 md:p-7 gap-5 md:gap-7'} relative`}>
             <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-emerald-400 to-emerald-600 hidden md:block" />
             {/* Left: Occupancy Badge & Title */}
             <div className={`flex-1 flex flex-col justify-center ${depth > 0 ? 'gap-2' : 'gap-3'}`}>
                <div className="flex items-center gap-2 mb-1">
                   <div className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-widest ${totalOccupied >= totalQuota && totalQuota > 0 ? 'bg-emerald-100/80 text-emerald-700' : 'bg-amber-100/80 text-amber-700'}`}>
                     {totalOccupied} / {totalQuota} OCCUPIED
                   </div>
                   <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none bg-slate-100 px-2.5 py-1 rounded">{f.type}</span>
                   {f.status === 'Non-Functioning' && <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest leading-none bg-red-50 border border-red-100 px-2.5 py-1 rounded">Non-Functioning</span>}
                </div>
                
                <div className="flex items-start gap-4">
                   <h4 className={`${depth > 0 ? 'text-base md:text-lg' : 'text-lg md:text-xl'} font-black text-slate-900 font-display leading-snug`}>
                     {f.name}
                   </h4>
                   <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                      <button onClick={() => toggleCard(f.id)} className={`p-2 rounded-xl border transition-all shadow-sm flex items-center justify-center ${isCardExpanded ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}>
                         <span className="text-[10px] font-bold uppercase tracking-widest mr-1.5">{isCardExpanded ? 'Close' : 'Details'}</span>
                         <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${isCardExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      {canEditFacility(f.township) && (
                        <button onClick={() => openEditFacility(f)} className="p-2 rounded-xl border bg-white border-slate-200 text-slate-500 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all shadow-sm">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                   </div>
                </div>
             </div>

             {/* Right: Boxed Stats Section */}
             <div className="grid grid-cols-3 gap-2 md:gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 md:ml-auto">
                <button onClick={() => setCardFilterAndExpand(f.id, 'vacancy')} className={`bg-slate-50 border rounded-xl flex flex-col items-center justify-center transition-colors hover:bg-slate-100 ${cardFilters[f.id] === 'vacancy' ? 'ring-2 ring-red-400 border-red-200' : 'border-slate-100'} ${depth > 0 ? 'p-2 min-w-[60px]' : 'p-3 min-w-[80px]'}`}>
                   <p className="text-[8px] md:text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Vacancy</p>
                   <p className={`${depth > 0 ? 'text-lg' : 'text-xl'} font-black font-display leading-none ${totalVacancy > 0 ? 'text-red-500' : 'text-slate-400'}`}>{totalVacancy}</p>
                </button>
                <button onClick={() => setCardFilterAndExpand(f.id, 'attOut')} className={`bg-amber-50/50 border rounded-xl flex flex-col items-center justify-center transition-colors hover:bg-amber-50 ${cardFilters[f.id] === 'attOut' ? 'ring-2 ring-amber-400 border-amber-200' : 'border-amber-100/50'} ${depth > 0 ? 'p-2 min-w-[60px]' : 'p-3 min-w-[80px]'}`}>
                   <p className="text-[8px] md:text-[9px] font-semibold text-amber-600/80 uppercase tracking-wider mb-1">Att Out</p>
                   <p className={`${depth > 0 ? 'text-lg' : 'text-xl'} font-black font-display leading-none ${totalAttOut > 0 ? 'text-amber-600' : 'text-amber-300'}`}>{totalAttOut}</p>
                </button>
                <button onClick={() => setCardFilterAndExpand(f.id, 'attIn')} className={`bg-blue-50/50 border rounded-xl flex flex-col items-center justify-center transition-colors hover:bg-blue-50 ${cardFilters[f.id] === 'attIn' ? 'ring-2 ring-blue-400 border-blue-200' : 'border-blue-100/50'} ${depth > 0 ? 'p-2 min-w-[60px]' : 'p-3 min-w-[80px]'}`}>
                   <p className="text-[8px] md:text-[9px] font-semibold text-blue-600/80 uppercase tracking-wider mb-1">Att In</p>
                   <p className={`${depth > 0 ? 'text-lg' : 'text-xl'} font-black font-display leading-none ${totalAttIn > 0 ? 'text-blue-600' : 'text-blue-300'}`}>{totalAttIn}</p>
                </button>
             </div>
          </div>

          <AnimatePresence>
            {isCardExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-50 bg-slate-50/30 overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {f.customQuotas.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-4 font-bold italic">No positions defined for this facility.</p>
                  ) : (
                    f.customQuotas.filter(q => {
                      const filterMode = cardFilters[f.id] || 'all';
                      if (filterMode === 'all') return true;
                      const allowed = q.max || 0;
                      const homeStaff = staffEntries.filter(s => s.facilityId === f.id && s.position === q.position);
                      const occupied = homeStaff.length;
                      const vacancy = Math.max(0, allowed - occupied);
                      const attachedOut = homeStaff.filter(s => s.currentFacilityId !== f.id).length;
                      const attachedIn = staffEntries.filter(s => s.currentFacilityId === f.id && s.facilityId !== f.id && s.position === q.position).length;
                      
                      if (filterMode === 'vacancy') return vacancy > 0;
                      if (filterMode === 'attOut') return attachedOut > 0;
                      if (filterMode === 'attIn') return attachedIn > 0;
                      return true;
                    }).map(q => {
                      const allowed = q.max || 0;
                      const homeStaff = staffEntries.filter(s => s.facilityId === f.id && s.position === q.position);
                      const occupied = homeStaff.length;
                      const attachedOut = homeStaff.filter(s => s.currentFacilityId !== f.id).length;
                      const attachedIn = staffEntries.filter(s => s.currentFacilityId === f.id && s.facilityId !== f.id && s.position === q.position).length;
                      const vacancy = Math.max(0, allowed - occupied);
                      const isOver = allowed > 0 && occupied > allowed;

                      return (
                        <div key={q.position} className={`p-4 bg-white border rounded-xl flex flex-col gap-3 transition-shadow hover:shadow-sm ${isOver ? 'border-red-200' : 'border-slate-100'}`}>
                          <div className="flex items-center justify-between">
                             <span className="text-xs font-black text-slate-700 font-display">{q.position}</span>
                             {canEditFacility(f.township) && (
                               <button onClick={() => openRecruit(f.id, q.position)} className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center gap-1.5 leading-none">
                                 <Plus className="w-3 h-3" /> Recruit
                               </button>
                             )}
                          </div>
                          
                          <div className="grid grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                            <div className="bg-white p-2 border border-slate-100 rounded flex flex-col items-center justify-center shadow-sm">
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 leading-none">Vacant</p>
                               <span className={`text-base font-black ${vacancy > 0 ? 'text-red-500' : 'text-slate-300'}`}>{vacancy}</span>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 p-2 rounded flex flex-col items-center justify-center shadow-sm">
                               <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 leading-none">Occupied</p>
                               <span className="text-base font-black text-emerald-700">{occupied} <span className="text-emerald-400 text-xs">/ {allowed}</span></span>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 p-2 rounded flex flex-col items-center justify-center shadow-sm">
                               <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1 leading-none">Att Out</p>
                               <span className={`text-base font-black ${attachedOut > 0 ? 'text-amber-600' : 'text-amber-300'}`}>{attachedOut}</span>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 p-2 rounded flex flex-col items-center justify-center shadow-sm">
                               <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 leading-none">Att In</p>
                               <span className={`text-base font-black ${attachedIn > 0 ? 'text-blue-600' : 'text-blue-300'}`}>{attachedIn}</span>
                            </div>
                          </div>

                          {/* List of related staff */}
                          {(homeStaff.length > 0 || attachedIn > 0) && (
                            <div className="space-y-2 mt-1">
                              {staffEntries.filter(s => {
                                 if (!((s.facilityId === f.id || s.currentFacilityId === f.id) && s.position === q.position)) return false;
                                 const filterMode = cardFilters[f.id] || 'all';
                                 if (filterMode === 'all' || filterMode === 'vacancy') return true;
                                 
                                 const isAttOut = s.facilityId === f.id && s.currentFacilityId !== f.id;
                                 const isAttIn = s.facilityId !== f.id && s.currentFacilityId === f.id;
                                 
                                 if (filterMode === 'attOut') return isAttOut;
                                 if (filterMode === 'attIn') return isAttIn;
                                 
                                 return true;
                              }).map((staff, idx) => {
                                const isPerm = staff.facilityId === f.id && staff.currentFacilityId === f.id;
                                const isAttOut = staff.facilityId === f.id && staff.currentFacilityId !== f.id;
                                const isAttIn = staff.facilityId !== f.id && staff.currentFacilityId === f.id;
                                
                                let statusColor = "bg-slate-100 text-slate-600";
                                let statusText = "Unknown";
                                if (isPerm) { statusColor = "bg-emerald-50 text-emerald-600 border border-emerald-100"; statusText = "Permanent"; }
                                if (isAttOut) { statusColor = "bg-amber-50 text-amber-600 border border-amber-100"; statusText = "Attached Out"; }
                                if (isAttIn) { statusColor = "bg-blue-50 text-blue-600 border border-blue-100"; statusText = "Attached In"; }

                                const actStatus = staff.activeStatus || 'Active';
                                const actReason = staff.activeReason || '';

                                return (
                                  <div key={staff.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-slate-100 hover:border-slate-300 rounded-lg shadow-sm transition-all gap-3">
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-bold text-slate-700">{staff.name || `Staff #${idx + 1}`}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${statusColor}`}>{statusText}</span>
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${actStatus === 'Active' ? 'bg-emerald-100 text-emerald-700' : actStatus === 'Leave' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                          {actStatus} {actReason && actStatus !== 'Active' && `(${actReason})`}
                                        </span>
                                      </div>
                                      {(isAttOut || isAttIn) && staff.reason && (
                                        <p className="text-xs text-slate-500 font-medium">
                                          Reason: <span className="italic">{staff.reason}</span> 
                                          {isAttOut && staff.currentFacilityId !== -1 && ` (at ${facilities.find(ff=>ff.id===staff.currentFacilityId)?.name || 'Unknown'})`}
                                          {isAttIn && staff.facilityId !== -1 && ` (from ${facilities.find(ff=>ff.id===staff.facilityId)?.name || 'Unknown'})`}
                                          {isAttIn && staff.facilityId === -1 && ` (from ${staff.externalFacilityName})`}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      {staff.cvDataUrl && (
                                        <button onClick={() => setCvPreview({ name: staff.cv || `CV_${staff.id}`, dataUrl: staff.cvDataUrl! })} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1.5">
                                          <FileText className="w-3 h-3" /> View CV
                                        </button>
                                      )}
                                      {canEditFacility(f.township) && (
                                        <button onClick={() => openEditStaff(staff, f.id, q.position)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1.5">
                                          <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Child Containers */}
        {(subDepartments.length > 0 || childFacilities.length > 0) && !showNoParentOnly && (
          <div className="ml-2 sm:ml-4 border-l-2 border-slate-100 pl-2 sm:pl-4 space-y-2 mb-3">
            {subDepartments.length > 0 && (
              <div className="flex flex-col">
                 <button onClick={() => toggleSubDepts(f.id)} className="w-fit text-[10px] font-black text-blue-500/60 uppercase tracking-widest py-1 px-2 flex items-center gap-2 hover:text-blue-600 transition-colors">
                   <ChevronRight className={`w-3 h-3 transition-transform ${isSubDeptsExpanded ? 'rotate-90' : ''}`} />
                   Sub-Depts ({subDepartments.length})
                 </button>
                 {isSubDeptsExpanded && (
                   <div className="flex flex-col mt-2">
                     {subDepartments.map(child => renderFacilityCard(child, depth + 1))}
                   </div>
                 )}
              </div>
            )}

            {childFacilities.length > 0 && (
              <div className="flex flex-col">
                 <button onClick={() => toggleParent(f.id)} className="w-fit text-[10px] font-black text-emerald-500/60 uppercase tracking-widest py-1 px-2 flex items-center gap-2 hover:text-emerald-600 transition-colors">
                   <ChevronRight className={`w-3 h-3 transition-transform ${isExpandedFacilities ? 'rotate-90' : ''}`} />
                   Child Facilities ({childFacilities.length})
                 </button>
                 {isExpandedFacilities && (
                   <div className="flex flex-col mt-2">
                     {childFacilities.map(child => renderFacilityCard(child, depth + 1))}
                   </div>
                 )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 relative">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 mb-2">
        <div className="max-w-xl">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-display leading-tight">Facilities Management</h2>
          <p className="text-slate-500 text-base sm:text-lg mt-2 font-medium">ဌာနများ၏ လစ်လပ်ရာထူးများအား စီမံခန့်ခွဲခြင်းနှင့် ဝန်ထမ်းခန့်အပ်ခြင်း</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="relative group flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search facilities..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-sm"
            />
          </div>
          <button 
            onClick={() => setShowNoParentOnly(!showNoParentOnly)} 
            className={`px-4 py-3 rounded-xl border text-[13px] font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${showNoParentOnly ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Filter className="w-4 h-4" /> {showNoParentOnly ? 'ပင်မဌာနများသာ' : 'ပင်မဌာနများသာ ပြမည်'}
          </button>
          {canEditFacility() && (
            <button onClick={openAddFacility} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[13px] font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 shrink-0">
              <Plus className="w-4 h-4" /> ဌာနအသစ် ထည့်သွင်းရန်
            </button>
          )}
        </div>
      </div>

      {Object.keys(locationGroups).length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-24 text-center glass-card rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
            <Building className="w-8 h-8" />
          </div>
          <p className="text-slate-500 font-bold font-display">ကိုက်ညီသော ဌာနများ ရှာမတွေ့ပါ</p>
          <button onClick={() => setSearchTerm('')} className="mt-4 text-emerald-600 text-sm font-bold hover:underline">Search အား ပယ်ဖျက်မည်</button>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-10">
          {Object.entries(locationGroups).map(([loc, facs]: [string, Facility[]]) => {
            const isLocationExpanded = expandedLocations[loc] !== false; // expanded by default
            return (
              <div key={loc} className="flex flex-col gap-4">
                <button 
                  onClick={() => toggleLocation(loc)} 
                  className="flex items-center gap-3 text-left w-full hover:bg-slate-50 p-2 -ml-2 rounded-2xl transition-colors group"
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${isLocationExpanded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isLocationExpanded ? 'rotate-90' : ''}`} />
                  </div>
                  <MapPin className={`w-5 h-5 ${isLocationExpanded ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span className="text-xl font-black text-slate-800 font-display">{loc}</span>
                  <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl ml-auto hidden sm:block">
                    {facs.length} Facilities
                  </span>
                </button>
                
                <AnimatePresence>
                  {isLocationExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pl-2"
                    >
                      <div className="flex flex-col gap-8 py-2">
                        {facs.map(f => renderFacilityCard(f))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
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
                  }} disabled={role === 'manager' && !!allowedTownship} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 disabled:opacity-50 disabled:bg-slate-50">
                    <option value="">ရွေးချယ်ပါ...</option>
                    {state.locations.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">ခရိုင်</label>
                  <select value={fDistrict} onChange={e=>{
                    setFDistrict(e.target.value);
                    setFTownship('');
                  }} disabled={!fState || (role === 'manager' && !!allowedTownship)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 disabled:opacity-50 disabled:bg-slate-50">
                    <option value="">ရွေးချယ်ပါ...</option>
                    {fState && state.locations.find(r => r.name === fState)?.districts.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">မြို့နယ်</label>
                  <select value={fTownship} onChange={e=>setFTownship(e.target.value)} disabled={!fDistrict || (role === 'manager' && !!allowedTownship)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 disabled:opacity-50 disabled:bg-slate-50">
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
                    {facilityTypes.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 font-medium mb-1">ပင်မဌာန (ရွေးချယ်နိုင်သည်)</label>
                  <FacilitySelect 
                    value={fParent} 
                    onChange={setFParent} 
                    facilities={facilities} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">လုပ်ငန်းဆောင်ရွက်မှု အခြေအနေ</label>
                  <select value={fStatus} onChange={e => setFStatus(e.target.value as any)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white">
                    <option value="Functioning">Functioning (လုပ်ငန်းဆောင်ရွက်ဆဲ)</option>
                    <option value="Non-Functioning">Non-Functioning (လုပ်ငန်းရပ်နားထား)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">အဆောက်အဦ အခြေအနေ</label>
                  <select value={fInfraStatus} onChange={e => setFInfraStatus(e.target.value as any)} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white">
                    <option value="Standard">Standard (စံချိန်မီ)</option>
                    <option value="Sub-standard">Sub-standard (စံချိန်မမီ)</option>
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
            <h3 className="text-xl font-bold text-slate-800 mb-2">ဌာနအချက်အလက်များ ပြင်ဆင်ရန်</h3>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scroll pr-2">
              
              <div className="space-y-4 mb-4 pb-4 border-b border-slate-100">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">ဌာနအမည်</label>
                  <input 
                    type="text" 
                    value={activeFacility.name} 
                    onChange={e => setActiveFacility({...activeFacility, name: e.target.value})}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 font-medium mb-1">ပင်မဌာန (ရွေးချယ်နိုင်သည်)</label>
                  <FacilitySelect 
                    value={activeFacility.parentFacilityId} 
                    onChange={val => setActiveFacility({...activeFacility, parentFacilityId: val})} 
                    facilities={facilities} 
                    excludeId={activeFacility.id}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">လုပ်ငန်းဆောင်ရွက်မှု အခြေအနေ</label>
                  <select value={activeFacility.status || 'Functioning'} onChange={e => setActiveFacility({...activeFacility, status: e.target.value as 'Functioning' | 'Non-Functioning'})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white">
                    <option value="Functioning">Functioning (လုပ်ငန်းဆောင်ရွက်ဆဲ)</option>
                    <option value="Non-Functioning">Non-Functioning (လုပ်ငန်းရပ်နားထား)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 font-medium mb-1">အဆောက်အဦ အခြေအနေ</label>
                  <select value={activeFacility.infrastructureStatus || 'Standard'} onChange={e => setActiveFacility({...activeFacility, infrastructureStatus: e.target.value as 'Standard' | 'Sub-standard'})} className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 bg-white">
                    <option value="Standard">Standard (စံချိန်မီ)</option>
                    <option value="Sub-standard">Sub-standard (စံချိန်မမီ)</option>
                  </select>
                </div>
              </div>

              <p className="text-sm text-slate-500 mb-2 mt-4">ရာထူးသတ်မှတ်ချက်များ ပြင်ဆင်ရန် (Quota Overrides)</p>
              
              {activeFacility.customQuotas.map((q, idx) => (
                <div key={q.position + idx} className="flex items-center justify-between bg-slate-50 p-3 border border-slate-200 rounded-lg">
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
                  {positionsList.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              {(state.subdepartmentsMap[activeFacility.type] || []).length > 0 && (
                <div className="mt-6 p-4 border border-emerald-100 bg-emerald-50/30 rounded-xl">
                  <h4 className="text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wide">Add Subdepartment (လက်အောက်ခံ ဌာနခွဲထည့်ရန်)</h4>
                  <div className="flex gap-2">
                    <select id="subdep-select" className="flex-1 p-2.5 border border-emerald-200 rounded-lg text-sm outline-none focus:border-emerald-500 bg-white">
                      <option value="">ရွေးချယ်ပါ...</option>
                      {(state.subdepartmentsMap[activeFacility.type] || []).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button onClick={() => {
                      const sel = document.getElementById('subdep-select') as HTMLSelectElement;
                      if (!sel || !sel.value) return;
                      const subType = sel.value;
                      const subName = `${activeFacility.name} - ${subType}`;
                      // Check if already exists
                      if (facilities.find(f => f.parentFacilityId === activeFacility.id && f.type === subType)) {
                         return alert('This subdepartment already exists for this facility.');
                      }

                      const defaults = globalDefaultQuotas.filter(q => q.type === subType);
                      const customQuotas: CustomQuota[] = defaults.map(q => ({ position: q.position, max: q.max }));
                      
                      addFacility({
                        id: Date.now() + Math.floor(Math.random() * 1000), 
                        name: subName, 
                        type: subType, 
                        state: activeFacility.state, 
                        district: activeFacility.district, 
                        township: activeFacility.township, 
                        customQuotas, 
                        parentFacilityId: activeFacility.id,
                        status: 'Functioning', 
                        infrastructureStatus: 'Standard'
                      });
                      
                      sel.value = "";
                      alert(`Successfully added ${subType} as a subdepartment.`);
                    }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-700 transition">
                       Add
                    </button>
                  </div>
                </div>
              )}
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
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ဝန်ထမ်းအမည် (Staff Name) <span className="text-red-500">*</span></label>
                <input type="text" value={rStaffName} onChange={e=>setRStaffName(e.target.value)} placeholder="ဥပမာ - ဒေါက်တာအောင်အောင်" className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-500 bg-white" />
              </div>

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

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-xs font-semibold text-slate-600 mb-2">ဝန်ထမ်းကိုယ်ရေးရာဇဝင် (CV Attachment)</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer bg-white border border-slate-200 hover:border-emerald-500 rounded-lg p-2.5 flex items-center justify-center gap-2 transition-colors">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-slate-600 truncate">{rCvName || 'Upload PDF/Image'}</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setRCvName(file.name);
                          const reader = new FileReader();
                          reader.onload = (e) => setRCvDataUrl(e.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden" 
                    />
                  </label>
                  {rCvDataUrl && (
                    <button onClick={() => { setRCvName(''); setRCvDataUrl(''); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
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
