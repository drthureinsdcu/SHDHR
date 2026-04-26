import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown, List, Network, Info, ChevronUp, ZoomIn, ZoomOut, Maximize, Minimize, RefreshCcw } from 'lucide-react';
import { Facility, Staff } from '../types';

interface OrgChartProps {
  facilities: Facility[];
  staffEntries: Staff[];
  subdepartmentsMap: Record<string, string[]>;
}

export default function OrganizationChart({ facilities, staffEntries, subdepartmentsMap }: OrgChartProps) {
  const [expandedNodes, setExpandedNodes] = useState<Record<number, boolean>>({});
  const [expandedSubDepts, setExpandedSubDepts] = useState<Record<number, boolean>>({});
  const [modalData, setModalData] = useState<{ facility: Facility, type: 'local' | 'overall' } | null>(null);
  
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  const toggleNode = (id: number, parentId?: number) => {
    setExpandedNodes(prev => {
      const isCurrentExpanded = !!prev[id];
      if (isCurrentExpanded) {
        return { ...prev, [id]: false }; // Collapse
      }
      
      const next = { ...prev, [id]: true }; // Expand
      
      // Close siblings
      facilities.filter(f => f.parentFacilityId === parentId).forEach(f => {
        if (f.id !== id) {
          next[f.id] = false;
        }
      });
      return next;
    });
  };

  const toggleSubDepts = (id: number, parentId?: number) => {
    setExpandedSubDepts(prev => {
      const isCurrentExpanded = !!prev[id];
      if (isCurrentExpanded) {
        return { ...prev, [id]: false }; // Collapse
      }
      
      const next = { ...prev, [id]: true }; // Expand
      
      // Close siblings
      facilities.filter(f => f.parentFacilityId === parentId).forEach(f => {
        if (f.id !== id) {
          next[f.id] = false;
        }
      });
      return next;
    });
  };

  // Find root facilities (those without a parent)
  const rootFacilities = facilities.filter(f => !f.parentFacilityId);

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className={`flex items-center justify-between ${isFullscreen ? 'p-6 bg-white border-b border-slate-200' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-[#0e7db8] rounded-full" />
          <h3 className="text-xl font-black text-slate-900 font-display">ဌာန ဖွဲ့စည်းပုံ အဆင့်ဆင့် (Line Facilities Structure)</h3>
        </div>
        
        <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-slate-200 p-1">
          <button onClick={handleZoomOut} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Zoom Out">
             <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-500 w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
          <button onClick={handleZoomIn} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors" title="Zoom In">
             <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleZoomReset} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors border-l border-slate-200" title="Reset Zoom">
             <RefreshCcw className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors border-l border-slate-200" title="Full Screen">
             {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className={`bg-white rounded-3xl border border-slate-200/60 shadow-sm p-8 overflow-auto custom-scroll flex ${isFullscreen ? 'h-[calc(100vh-100px)] rounded-none border-0' : 'min-h-[600px]'}`}>
        <div className="min-w-full flex justify-center">
          <div 
            className="min-w-max pb-8 org-tree origin-top inline-block" 
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease' }}
          >
          {rootFacilities.length > 0 ? (
            <ul>
              {rootFacilities.map(f => (
                <OrgNode 
                  key={f.id} 
                  facility={f} 
                  facilities={facilities} 
                  staffEntries={staffEntries} 
                  expandedNodes={expandedNodes} 
                  toggleNode={toggleNode} 
                  expandedSubDepts={expandedSubDepts}
                  toggleSubDepts={toggleSubDepts}
                  setModalData={setModalData} 
                  subdepartmentsMap={subdepartmentsMap}
                />
              ))}
            </ul>
          ) : (
            <div className="text-center py-10 text-slate-400 font-medium">ဌာနများ မရှိသေးပါ။</div>
          )}
          </div>
        </div>
      </div>

      {modalData && (
        <StatsModal 
          facility={modalData.facility} 
          type={modalData.type} 
          facilities={facilities} 
          staffEntries={staffEntries} 
          subdepartmentsMap={subdepartmentsMap}
          onClose={() => setModalData(null)} 
        />
      )}
    </div>
  );
}

interface OrgNodeProps {
  key?: React.Key;
  facility: Facility;
  facilities: Facility[];
  staffEntries: Staff[];
  expandedNodes: Record<number, boolean>;
  toggleNode: (id: number, parentId?: number) => void;
  expandedSubDepts: Record<number, boolean>;
  toggleSubDepts: (id: number, parentId?: number) => void;
  setModalData: (data: { facility: Facility, type: 'local' | 'overall' } | null) => void;
  subdepartmentsMap: Record<string, string[]>;
}

function OrgNode({ facility, facilities, staffEntries, expandedNodes, toggleNode, expandedSubDepts, toggleSubDepts, setModalData, subdepartmentsMap }: OrgNodeProps) {
  const allChildren = facilities.filter(f => f.parentFacilityId === facility.id);
  const subDeptTypes = subdepartmentsMap[facility.type] || [];
  
  const subDepartments = allChildren.filter(c => subDeptTypes.includes(c.type));
  const childFacilities = allChildren.filter(c => !subDeptTypes.includes(c.type));

  const isExpandedFacilities = !!expandedNodes[facility.id];
  const isExpandedSubDepts = !!expandedSubDepts[facility.id];

  // Calculate Local Stats including subdepartments
  let localQuota = 0;
  let localOccupied = 0;
  
  const localTargetIds = [facility.id, ...subDepartments.map(s => s.id)];

  localTargetIds.forEach(id => {
    const fac = facilities.find(f => f.id === id);
    if (fac) {
      (fac.customQuotas || []).forEach(q => localQuota += q.max);
    }
  });

  localOccupied = staffEntries.filter(s => localTargetIds.includes(s.currentFacilityId)).length;

  const getLocalStatus = () => {
    if (localQuota === 0) return { label: 'No Quota', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    if (localOccupied > localQuota) return { label: 'Over', color: 'bg-red-100 text-red-700 border-red-200' };
    if (localOccupied < localQuota) return { label: 'Vacant', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
    return { label: 'Full', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
  };

  const localStatus = getLocalStatus();

  // Calculate Overall Stats recursively
  const getOverallStats = (facId: number): { quota: number, occupied: number } => {
    const fac = facilities.find(f => f.id === facId);
    if (!fac) return { quota: 0, occupied: 0 };
    
    let quota = 0;
    (fac.customQuotas || []).forEach(q => quota += q.max);
    let occupied = staffEntries.filter(s => s.currentFacilityId === facId).length;

    const childFacs = facilities.filter(f => f.parentFacilityId === facId);
    for (const child of childFacs) {
      const childStats = getOverallStats(child.id);
      quota += childStats.quota;
      occupied += childStats.occupied;
    }

    return { quota, occupied };
  };

  const overallStats = getOverallStats(facility.id);

  const showStats = (type: 'local' | 'overall') => {
    setModalData({ facility, type });
  };

  return (
    <li className={isExpandedSubDepts ? "z-50 relative" : "relative"}>
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex relative">
          {/* Main Node Card */}
          <div className="bg-white border-2 border-slate-200 rounded-[2rem] shadow-xl w-72 flex flex-col items-center p-6 relative group overflow-hidden hover:border-emerald-200 transition-all">
            <div className={`absolute top-0 left-0 w-full h-1.5 ${localStatus.color.split(' ')[0]}`} />
            
            {localQuota > 0 && (
              <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${localStatus.color}`}>
                {localStatus.label}
              </div>
            )}
            
            <div className="flex flex-col items-center gap-1 mb-4 mt-2">
              <h4 className="text-slate-900 font-black text-xl leading-tight text-center font-display">{facility.name}</h4>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{facility.type}</p>
            </div>

            <div className="flex gap-2 mb-6 justify-center flex-wrap">
              {facility.status === 'Non-Functioning' && <span className="text-[9px] font-black bg-red-50 text-red-600 px-2.5 py-1 rounded-lg border border-red-100 uppercase">Non-Functioning</span>}
              {facility.infrastructureStatus === 'Sub-standard' && <span className="text-[9px] font-black bg-orange-50 text-orange-600 px-2.5 py-1 rounded-lg border border-orange-100 uppercase">Sub-standard</span>}
            </div>
            
            <div className="grid grid-cols-2 gap-3 w-full mt-auto">
              <button onClick={() => showStats('local')} className="flex items-center justify-center gap-1.5 bg-slate-900 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all hover:bg-slate-800 active:scale-95 shadow-lg shadow-slate-200">
                <List className="w-4 h-4" /> အသေးစိတ်
              </button>
              <button onClick={() => showStats('overall')} className="flex items-center justify-center gap-1.5 bg-emerald-600 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition-all hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-100">
                <Network className="w-4 h-4" /> စုစုပေါင်း
              </button>
            </div>

            {/* Toggle Button for Sub-departments */}
            {subDepartments.length > 0 && (
              <button 
                onClick={() => toggleSubDepts(facility.id, facility.parentFacilityId)}
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors z-20 text-slate-600"
                title={isExpandedSubDepts ? 'Hide Sub-depts' : 'Show Sub-depts'}
              >
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isExpandedSubDepts ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Sub-departments Container */}
          <AnimatePresence>
            {isExpandedSubDepts && subDepartments.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -10, width: 0 }}
                className="absolute z-50 left-[calc(100%+1.5rem)] top-0 flex flex-col gap-3 min-w-[220px] max-w-[280px]"
              >
                {subDepartments.map(subFac => (
                  <SubDeptNode key={subFac.id} subFac={subFac} staffEntries={staffEntries} setModalData={setModalData} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Toggle Button for Child Facilities */}
        {childFacilities.length > 0 && (
          <button 
            onClick={() => toggleNode(facility.id, facility.parentFacilityId)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-colors absolute -bottom-4 z-20 text-slate-600 text-xs font-bold whitespace-nowrap"
          >
            {isExpandedFacilities ? 'Hide Facilities' : 'Show Facilities'}
            <ChevronUp className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpandedFacilities ? '' : 'rotate-180'}`} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpandedFacilities && childFacilities.length > 0 && (
          <motion.ul 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {childFacilities.map(childFac => (
              <OrgNode 
                key={childFac.id} 
                facility={childFac} 
                facilities={facilities} 
                staffEntries={staffEntries} 
                expandedNodes={expandedNodes} 
                toggleNode={toggleNode} 
                expandedSubDepts={expandedSubDepts}
                toggleSubDepts={toggleSubDepts}
                setModalData={setModalData} 
                subdepartmentsMap={subdepartmentsMap}
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

function SubDeptNode({ subFac, staffEntries, setModalData }: { key?: React.Key, subFac: Facility, staffEntries: Staff[], setModalData: any }) {
  let localQuota = 0;
  let localOccupied = 0;
  (subFac.customQuotas || []).forEach(q => localQuota += q.max);
  localOccupied = staffEntries.filter(s => s.currentFacilityId === subFac.id).length;

  const getStatusColor = () => {
    if (localQuota === 0) return 'bg-slate-400';
    if (localOccupied > localQuota) return 'bg-red-500';
    if (localOccupied < localQuota) return 'bg-yellow-400';
    return 'bg-emerald-500';
  };

  return (
    <div className="bg-white border-2 border-slate-200 shadow-xl rounded-[1.5rem] p-5 flex flex-col gap-4 relative w-full group overflow-hidden hover:border-blue-200 transition-all">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${getStatusColor()}`} />
        <div className="flex flex-col gap-1">
            <h5 className="font-black text-[15px] text-slate-800 leading-tight font-display">{subFac.name}</h5>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{subFac.type}</span>
        </div>
        <div className="flex justify-between items-center mt-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Occupied</span>
            <span className="text-xs font-black text-blue-600">{localOccupied} / {localQuota}</span>
        </div>
        <button onClick={() => setModalData({ facility: subFac, type: 'local' })} className="w-full flex items-center justify-center gap-1.5 bg-slate-900 text-white py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:bg-slate-800 active:scale-95">
            <List className="w-3 h-3" /> အသေးစိတ်
        </button>
    </div>
  );
}

function StatsModal({ facility, type, facilities, staffEntries, subdepartmentsMap, onClose }: {
  facility: Facility;
  type: 'local' | 'overall';
  facilities: Facility[];
  staffEntries: Staff[];
  subdepartmentsMap: Record<string, string[]>;
  onClose: () => void;
}) {
  // Helper to get all descendant facility IDs (inclusive of self)
  const getSubTreeIds = (rootId: number, acc: number[] = []) => {
    if (!acc.includes(rootId)) acc.push(rootId);
    facilities.filter(f => f.parentFacilityId === rootId).forEach(child => getSubTreeIds(child.id, acc));
    return acc;
  };

  const getSubDeptIds = (rootFac: Facility) => {
    const subDeptTypes = subdepartmentsMap[rootFac.type] || [];
    return facilities.filter(f => f.parentFacilityId === rootFac.id && subDeptTypes.includes(f.type)).map(f => f.id);
  };

  const targetFacIds = type === 'local' ? [facility.id, ...getSubDeptIds(facility)] : getSubTreeIds(facility.id);

  // We want to combine quotas across all target facilities (group by position)
  const aggregatedQuotas: Record<string, number> = {};
  targetFacIds.forEach(fid => {
    const fac = facilities.find(f => f.id === fid);
    if (!fac) return;
    fac.customQuotas.forEach(q => {
      aggregatedQuotas[q.position] = (aggregatedQuotas[q.position] || 0) + q.max;
    });
  });

  interface PosStats {
    position: string;
    quota: number;
    occupied: number;
    vacancy: number;
    attOut: number;
    attIn: number;
    activeCount: number;
    leaveCount: number;
    otherCount: number;
    leaves: string[];
    others: string[];
  }

  const positions = Object.keys(aggregatedQuotas);
  const statsList: PosStats[] = positions.map(pos => {
    const quota = aggregatedQuotas[pos];
    
    // Assigned to these facilities
    const assignedStaff = staffEntries.filter(s => targetFacIds.includes(s.facilityId) && s.position === pos);
    
    // Working at these facilities
    const occupiedStaff = staffEntries.filter(s => targetFacIds.includes(s.currentFacilityId) && s.position === pos);

    // Att Out: Belong to these targets, but working elsewhere
    const attOut = assignedStaff.filter(s => !targetFacIds.includes(s.currentFacilityId)).length;

    // Att In: Working in these targets, but belong elsewhere
    const attIn = occupiedStaff.filter(s => !targetFacIds.includes(s.facilityId)).length;

    const leaves = occupiedStaff.filter(s => s.activeStatus === 'Leave');
    const others = occupiedStaff.filter(s => s.activeStatus === 'Other');

    return {
      position: pos,
      quota,
      occupied: occupiedStaff.length,
      vacancy: quota - occupiedStaff.length,
      attOut,
      attIn,
      activeCount: occupiedStaff.filter(s => s.activeStatus === 'Active' || !s.activeStatus).length,
      leaveCount: leaves.length,
      otherCount: others.length,
      leaves: leaves.map(s => s.activeReason || 'ခွင့်').filter(Boolean),
      others: others.map(s => s.activeReason || 'အခြား').filter(Boolean)
    };
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
        <button onClick={onClose} className="absolute right-4 top-4 w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full flex items-center justify-center transition-colors">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        <div className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 bg-[#0e7db8]/10 text-[#0e7db8] font-bold rounded-lg text-[10px] uppercase tracking-wider">
              {type === 'local' ? 'သီးသန့် (Local)' : 'စုစုပေါင်း (Overall)'}
            </div>
            {facility.status === 'Non-Functioning' && <div className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-lg text-[10px] uppercase">Non-Functioning</div>}
            {facility.infrastructureStatus === 'Sub-standard' && <div className="px-3 py-1 bg-orange-100 text-orange-700 font-bold rounded-lg text-[10px] uppercase">Sub-standard</div>}
          </div>
          <h2 className="text-2xl font-black text-slate-900 font-display">{facility.name} <span className="text-slate-400 font-medium text-lg">({facility.type})</span></h2>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scroll bg-slate-50/30">
          {statsList.length === 0 ? (
            <div className="text-center text-slate-400 py-10 font-medium bg-slate-50 rounded-2xl border border-slate-200 border-dashed">ရာထူးသတ်မှတ်ချက် (Quotas) မရှိသေးပါ။</div>
          ) : (
            <div className="flex flex-col gap-3">
              {statsList.map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center p-4 md:p-6 gap-4 md:gap-6 min-h-[100px]">
                    {/* Left: Occupancy Badge & Title */}
                    <div className="flex-1 flex flex-col justify-center gap-2">
                       <div className={`w-fit px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${stat.occupied >= stat.quota && stat.quota > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                         {stat.occupied} / {stat.quota} OCCUPIED
                       </div>
                       <h3 className="text-sm md:text-base font-black text-slate-800 font-display leading-snug">
                         {stat.position}
                       </h3>
                    </div>

                    {/* Right: Stats Section */}
                    <div className="flex items-center gap-8 md:pl-8 md:border-l border-slate-100 shrink-0">
                       <div className="text-center w-16">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Vacancy</p>
                          <p className={`text-xl font-black font-display ${stat.vacancy > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{stat.vacancy}</p>
                       </div>
                       <div className="text-center w-16">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Att Out</p>
                          <p className={`text-xl font-black font-display ${stat.attOut > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{stat.attOut}</p>
                       </div>
                       <div className="text-center w-16">
                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Att In</p>
                          <p className={`text-xl font-black font-display ${stat.attIn > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>{stat.attIn}</p>
                       </div>
                    </div>
                  </div>

                  {stat.occupied > 0 && (
                    <div className="px-6 pb-4 border-t border-slate-50 pt-3">
                       <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                             <span className="text-[10px] font-black text-slate-400 uppercase">Active</span>
                             <span className="text-xs font-black text-slate-700">{stat.activeCount}</span>
                          </div>
                          {stat.leaveCount > 0 && (
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase">Leave</span>
                                <span className="text-xs font-black text-orange-600">{stat.leaveCount}</span>
                                <div className="flex gap-1">
                                   {stat.leaves.slice(0, 2).map((l, idx) => (
                                      <span key={idx} className="text-[9px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100 font-bold">{l}</span>
                                   ))}
                                </div>
                             </div>
                          )}
                          {stat.otherCount > 0 && (
                             <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase">Other</span>
                                <span className="text-xs font-black text-purple-600">{stat.otherCount}</span>
                                <div className="flex gap-1">
                                   {stat.others.slice(0, 2).map((l, idx) => (
                                      <span key={idx} className="text-[9px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 font-bold">{l}</span>
                                   ))}
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
