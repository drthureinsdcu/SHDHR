import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown, List, Network, Building2, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { Facility, Staff } from '../types';

interface OrgChartProps {
  facilities: Facility[];
  staffEntries: Staff[];
  subdepartmentsMap: Record<string, string[]>;
  facilityTypes: import('../types').FacilityType[];
}

export default function OrganizationChart({ facilities, staffEntries, subdepartmentsMap, facilityTypes }: OrgChartProps) {
  const [modalData, setModalData] = useState<{ facility: Facility, type: 'local' | 'overall' } | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string | number, boolean>>({});
  const [expandedSubDepts, setExpandedSubDepts] = useState<Record<string | number, boolean>>({});
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        setIsFullscreen(true); // Fallback to CSS fullscreen
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Add fullscreen change listener to sync state if exited via Esc key
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const sortByLevel = (a: Facility, b: Facility) => {
    const typeA = facilityTypes?.find(t => t.name === a.type);
    const typeB = facilityTypes?.find(t => t.name === b.type);
    const levelA = typeA?.level ?? 999;
    const levelB = typeB?.level ?? 999;
    return levelA - levelB;
  };

  const rootFacilities = facilities
    .filter(f => !f.parentFacilityId || f.parentFacilityId === 0 || f.parentFacilityId === -1)
    .sort(sortByLevel);

  const availableLevels = React.useMemo(() => {
    const levels = new Set<number>();
    facilities.forEach(f => {
      const type = facilityTypes?.find(t => t.name === f.type);
      if (type?.level !== undefined && type?.level !== null) {
        levels.add(type.level);
      }
    });
    return Array.from(levels).sort((a, b) => a - b);
  }, [facilities, facilityTypes]);

  const collapseAll = () => {
    setExpandedNodes({});
    setExpandedSubDepts({});
  };

  const expandToLevel = (targetLevel: number) => {
    const newState: Record<string | number, boolean> = {};
    // Expand nodes
    facilities.forEach(f => {
      const type = facilityTypes?.find(t => t.name === f.type);
      const level = type?.level ?? 999;
      
      if (level < targetLevel) {
        newState[f.id] = true;
        // Expand parent group keys up to this level
        availableLevels.forEach(lvl => {
          if (lvl <= targetLevel) {
             newState[`${f.id}-level-${lvl}`] = true;
             newState[`root-level-${lvl}`] = true;
             // Also need to expand the group containing THIS facility if it's level < targetLevel
             const parentId = f.parentFacilityId || 'root';
             newState[`${parentId}-level-${level}`] = true;
          }
        });
      }
    });
    setExpandedNodes(newState);
  };

  const expandAll = () => {
    const newState: Record<string | number, boolean> = {};
    facilities.forEach(f => {
      newState[f.id] = true;
      availableLevels.forEach(lvl => {
         newState[`${f.id}-level-${lvl}`] = true;
         newState[`root-level-${lvl}`] = true;
      });
      newState[`${f.id}-level-undefined`] = true;
      newState[`root-level-undefined`] = true;
    });
    setExpandedNodes(newState);
  };

  const toggleNode = (id: string | number) => {
    setExpandedNodes(prev => {
      const isCurrentlyExpanded = !!prev[id];
      if (isCurrentlyExpanded) {
        return { ...prev, [id]: false };
      } else {
        return { ...prev, [id]: true }; 
      }
    });
  };

  const renderFacilityList = (facs: Facility[], parentKey: string) => {
    if (facs.length === 0) return null;

    const groups: Record<number, Facility[]> = {};
    const unknownLevel: Facility[] = [];
    facs.forEach(c => {
      const type = facilityTypes?.find(t => t.name === c.type);
      const level = type?.level;
      if (level !== undefined && level !== null) {
        if (!groups[level]) groups[level] = [];
        groups[level].push(c);
      } else {
        unknownLevel.push(c);
      }
    });

    const sortedLevels = Object.keys(groups).map(Number).sort((a, b) => a - b);

    return (
      <ul className={`${parentKey === 'root' ? 'space-y-6' : 'pl-6 md:pl-8 border-l-2 border-slate-100 ml-4 mt-2 space-y-4'}`}>
        {sortedLevels.map(level => {
          const levelFacs = groups[level];
          const groupKey = `${parentKey}-level-${level}`;
          const isGroupExpanded = expandedNodes[groupKey] ?? false; // Default collapsed
          return (
            <li key={groupKey} className="relative">
              {parentKey !== 'root' && <div className="absolute left-[-24px] md:left-[-32px] top-[14px] w-[20px] md:w-[28px] border-t-2 border-slate-100" />}
              <button 
                onClick={() => toggleNode(groupKey)} 
                className={`relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                  isGroupExpanded 
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                } border`}
              >
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isGroupExpanded ? 'rotate-90 text-blue-500' : 'text-slate-400'}`} />
                <span className="uppercase tracking-widest">Level {level} Facilities</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                  isGroupExpanded ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>{levelFacs.length}</span>
              </button>
              
              <AnimatePresence>
                {isGroupExpanded && (
                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                     <ul className="mt-4 space-y-6">
                       {levelFacs.map(c => renderNode(c))}
                     </ul>
                   </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
        {unknownLevel.length > 0 && (
          <li key={`${parentKey}-level-unk`} className="relative">
            {parentKey !== 'root' && <div className="absolute left-[-24px] md:left-[-32px] top-[14px] w-[20px] md:w-[28px] border-t-2 border-slate-100" />}
            <button 
              onClick={() => toggleNode(`${parentKey}-level-undefined`)} 
              className={`relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm ${
                (expandedNodes[`${parentKey}-level-undefined`] ?? false) 
                  ? 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              } border`}
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${(expandedNodes[`${parentKey}-level-undefined`] ?? false) ? 'rotate-90 text-slate-500' : 'text-slate-400'}`} />
              <span className="uppercase tracking-widest">Other Facilities</span>
              <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[9px]">{unknownLevel.length}</span>
            </button>
            <AnimatePresence>
              {(expandedNodes[`${parentKey}-level-undefined`] ?? false) && (
                 <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                   <ul className="mt-4 space-y-6">
                     {unknownLevel.map(c => renderNode(c))}
                   </ul>
                 </motion.div>
              )}
            </AnimatePresence>
          </li>
        )}
      </ul>
    );
  };

  const renderNode = (facility: Facility) => {
    const children = facilities.filter(child => child.parentFacilityId === facility.id);
    const subDeptTypes = subdepartmentsMap[facility.type] || [];
    
    let subDepartments = children.filter(c => subDeptTypes.includes(c.type));
    let childFacilities = children.filter(c => !subDeptTypes.includes(c.type));

    subDepartments.sort(sortByLevel);
    childFacilities.sort(sortByLevel);

    const hasExpandable = childFacilities.length > 0;
    const isNodeExpanded = expandedNodes[facility.id] ?? false; // Default to collapsed
    const isSubDeptsExpanded = expandedSubDepts[facility.id] ?? false;

    // Local calculation
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
      if (localOccupied > localQuota) return { label: 'Over', color: 'bg-red-50 text-red-700 border-red-200' };
      if (localOccupied < localQuota) return { label: 'Vacant', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
      return { label: 'Full', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    };

    const status = getLocalStatus();

    return (
      <li key={facility.id}>
        <div className={`relative z-10 w-[280px] sm:w-[320px] bg-white border ${status.color.split(' ')[2]} rounded-2xl shadow-sm hover:shadow-md transition-all`}>
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                 <Building2 className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h4 className="font-black text-slate-800 text-[14px] leading-tight mb-1 truncate">{facility.name}</h4>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-full">
                    {facility.type}
                  </span>
                  {facilityTypes?.find(t => t.name === facility.type)?.level && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      Level {facilityTypes.find(t => t.name === facility.type)?.level}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${status.color}`}>
                 <span className="font-black text-[11px] uppercase tracking-widest opacity-80">Occ.</span>
                 <span className="font-black text-xs">{localOccupied}/{localQuota}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setModalData({ facility, type: 'overall' })} className="flex items-center justify-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2 py-1 rounded-md text-[10px] font-bold transition-colors" title="Overall View">
                  <Network className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setModalData({ facility, type: 'local' })} className="flex items-center justify-center bg-slate-50 text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold transition-colors" title="Local View">
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            
            {(facility.status === 'Non-Functioning' || facility.infrastructureStatus === 'Sub-standard') && (
              <div className="flex gap-1.5 mt-2">
                {facility.status === 'Non-Functioning' && <span className="text-[9px] font-bold uppercase bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">Non-Functioning</span>}
                {facility.infrastructureStatus === 'Sub-standard' && <span className="text-[9px] font-bold uppercase bg-orange-50 text-orange-600 px-2 py-0.5 rounded border border-orange-100">Sub-standard</span>}
              </div>
            )}
          </div>

          {(subDepartments.length > 0 || hasExpandable) && (
            <div className="flex flex-col bg-slate-50/50 rounded-b-2xl overflow-hidden divide-y divide-slate-100 border-t border-slate-100">
              {subDepartments.length > 0 && (
                <div>
                  <button onClick={() => setExpandedSubDepts(prev => ({ ...prev, [facility.id]: !prev[facility.id] }))} className="w-full flex items-center justify-between p-3 text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                    <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-400" /> Sub-departments ({subDepartments.length})</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSubDeptsExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isSubDeptsExpanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-3 pt-0 flex flex-col gap-2">
                          {subDepartments.map(subFac => (
                             <div key={subFac.id} className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-left">
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-bold text-[11px] text-slate-800 leading-tight truncate">{subFac.name}</h5>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block truncate">{subFac.type}</span>
                                </div>
                                <button onClick={() => setModalData({ facility: subFac, type: 'local' })} className="ml-2 w-6 h-6 shrink-0 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-600 rounded flex-none hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                   <List className="w-3 h-3" />
                                </button>
                             </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {hasExpandable && (
                <button onClick={() => toggleNode(facility.id)} className="w-full flex items-center justify-between p-3 text-[11px] font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
                  <span className="flex items-center gap-1.5"><Network className="w-3 h-3" /> Child Facilities ({childFacilities.length})</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isNodeExpanded ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          )}
        </div>

        {isNodeExpanded && childFacilities.length > 0 && renderFacilityList(childFacilities, facility.id.toString())}
      </li>
    );
  };

  const handleZoomIn = () => setZoomLevel(z => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoomLevel(z => Math.max(z - 0.1, 0.4));
  const resetZoom = () => setZoomLevel(1);

  return (
    <div ref={containerRef} className={isFullscreen ? "fixed inset-0 z-50 bg-slate-50/95 backdrop-blur-sm overflow-hidden flex flex-col p-4 sm:p-6" : "space-y-6"}>
      <div className="flex flex-col xl:flex-row sm:items-start xl:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-[#0e7db8] rounded-full" />
          <h3 className="text-xl font-black text-slate-900 font-display">ဌာန ဖွဲ့စည်းပုံ အဆင့်ဆင့် (Line Facilities Structure)</h3>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap xl:flex-nowrap">
          {availableLevels.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 custom-scroll hide-scrollbar">
               <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Expand to:</span>
               <button
                  onClick={collapseAll}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-colors whitespace-nowrap"
               >
                 Collapse All
               </button>
               <button
                  onClick={expandAll}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors whitespace-nowrap"
               >
                 Expand All
               </button>
               {availableLevels.map(lvl => (
                 <button
                   key={lvl}
                   onClick={() => expandToLevel(lvl)}
                   className="px-3 py-1.5 text-xs font-bold rounded-lg border border-[#0e7db8]/20 bg-[#0e7db8]/5 text-[#0e7db8] hover:bg-[#0e7db8]/10 transition-colors whitespace-nowrap"
                 >
                   Level {lvl}
                 </button>
               ))}
            </div>
          )}
          
          <div className="flex items-center gap-2 xl:border-l border-slate-200 xl:pl-4">
            <button onClick={handleZoomOut} className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={resetZoom} className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors text-xs font-bold w-12 text-center" title="Reset Zoom">
              {Math.round(zoomLevel * 100)}%
            </button>
            <button onClick={handleZoomIn} className="p-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={toggleFullscreen} className={`ml-2 p-1.5 rounded-md transition-colors ${isFullscreen ? 'bg-[#0e7db8] text-white hover:bg-[#0e7db8]/90 shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className={`bg-white/80 rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-10 custom-scroll overflow-auto ${isFullscreen ? 'flex-1 mt-6' : ''}`}>
        <div 
          className="org-tree inline-block min-w-full origin-top-left transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {rootFacilities.length > 0 ? (
            renderFacilityList(rootFacilities, 'root')
          ) : (
            <div className="text-center py-10 text-slate-400 font-medium bg-white rounded-2xl border border-slate-200 border-dashed max-w-md mx-auto whitespace-normal">ဌာနများ မရှိသေးပါ။ (No facilities available)</div>
          )}
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

function StatsModal({ facility, type, facilities, staffEntries, subdepartmentsMap, onClose }: {
  facility: Facility;
  type: 'local' | 'overall';
  facilities: Facility[];
  staffEntries: Staff[];
  subdepartmentsMap: Record<string, string[]>;
  onClose: () => void;
}) {
  const getSubTreeIds = (rootId: number, acc: number[] = []) => {
    if (!acc.includes(rootId)) acc.push(rootId);
    facilities.filter((f: Facility) => f.parentFacilityId === rootId).forEach((child: Facility) => getSubTreeIds(child.id, acc));
    return acc;
  };

  const getSubDeptIds = (rootFac: Facility) => {
    const subDeptTypes = subdepartmentsMap[rootFac.type] || [];
    return facilities.filter((f: Facility) => f.parentFacilityId === rootFac.id && subDeptTypes.includes(f.type)).map((f: Facility) => f.id);
  };

  const targetFacIds = type === 'local' ? [facility.id, ...getSubDeptIds(facility)] : getSubTreeIds(facility.id);

  const aggregatedQuotas: Record<string, number> = {};
  targetFacIds.forEach(fid => {
    const fac = facilities.find((f: Facility) => f.id === fid);
    if (!fac) return;
    fac.customQuotas.forEach((q: any) => {
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
    
    const assignedStaff = staffEntries.filter((s: Staff) => targetFacIds.includes(s.facilityId) && s.position === pos);
    const occupiedStaff = staffEntries.filter((s: Staff) => targetFacIds.includes(s.currentFacilityId) && s.position === pos);

    const attOut = assignedStaff.filter((s: Staff) => !targetFacIds.includes(s.currentFacilityId)).length;
    const attIn = occupiedStaff.filter((s: Staff) => !targetFacIds.includes(s.facilityId)).length;

    const leaves = occupiedStaff.filter((s: Staff) => s.activeStatus === 'Leave');
    const others = occupiedStaff.filter((s: Staff) => s.activeStatus === 'Other');

    return {
      position: pos,
      quota,
      occupied: occupiedStaff.length,
      vacancy: quota - occupiedStaff.length,
      attOut,
      attIn,
      activeCount: occupiedStaff.filter((s: Staff) => s.activeStatus === 'Active' || !s.activeStatus).length,
      leaveCount: leaves.length,
      otherCount: others.length,
      leaves: leaves.map((s: Staff) => s.activeReason || 'ခွင့်').filter(Boolean),
      others: others.map((s: Staff) => s.activeReason || 'အခြား').filter(Boolean)
    };
  });

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
        <button onClick={onClose} className="absolute right-4 top-4 w-10 h-10 bg-slate-50 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-colors">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>

        <div className="p-6 pb-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="px-2.5 py-1 bg-[#0e7db8]/10 text-[#0e7db8] font-bold rounded-md text-[9px] uppercase tracking-wider border border-[#0e7db8]/20">
              {type === 'local' ? 'သီးသန့် (Local)' : 'စုစုပေါင်း (Overall)'}
            </div>
            {facility.status === 'Non-Functioning' && <div className="px-2.5 py-1 bg-red-50 text-red-700 font-bold rounded-md text-[9px] uppercase border border-red-100">Non-Functioning</div>}
            {facility.infrastructureStatus === 'Sub-standard' && <div className="px-2.5 py-1 bg-orange-50 text-orange-700 font-bold rounded-md text-[9px] uppercase border border-orange-100">Sub-standard</div>}
          </div>
          <h2 className="text-2xl font-black text-slate-800 font-display leading-tight">{facility.name} <span className="text-slate-400 font-medium text-lg tracking-tight">({facility.type})</span></h2>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scroll bg-slate-50/50">
          {statsList.length === 0 ? (
            <div className="text-center text-slate-400 py-10 font-medium bg-white rounded-2xl border border-slate-200 border-dashed shadow-sm">ရာထူးသတ်မှတ်ချက် (Quotas) မရှိသေးပါ။</div>
          ) : (
            <div className="flex flex-col gap-3">
              {statsList.map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 overflow-hidden">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center p-4 gap-4 min-h-[90px]">
                    <div className="flex-1 flex flex-col justify-center gap-1.5">
                       <div className={`w-fit px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${stat.occupied >= stat.quota && stat.quota > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                         {stat.occupied} / {stat.quota} OCCUPIED
                       </div>
                       <h3 className="text-sm font-black text-slate-800 font-display leading-snug">
                         {stat.position}
                       </h3>
                    </div>

                    <div className="flex items-center gap-6 md:pl-6 md:border-l border-slate-100 shrink-0">
                       <div className="text-center w-14">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vacancy</p>
                          <p className={`text-xl font-black font-display ${stat.vacancy > 0 ? 'text-slate-800' : 'text-slate-300'}`}>{stat.vacancy}</p>
                       </div>
                       <div className="text-center w-14">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Att Out</p>
                          <p className={`text-xl font-black font-display ${stat.attOut > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{stat.attOut}</p>
                       </div>
                       <div className="text-center w-14">
                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Att In</p>
                          <p className={`text-xl font-black font-display ${stat.attIn > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>{stat.attIn}</p>
                       </div>
                    </div>
                  </div>

                  {stat.occupied > 0 && (
                    <div className="px-4 pb-4 border-t border-slate-50 pt-3">
                       <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                             <span className="text-xs font-black text-slate-700">{stat.activeCount}</span>
                          </div>
                          {stat.leaveCount > 0 && (
                             <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Leave</span>
                                <span className="text-xs font-black text-orange-600">{stat.leaveCount}</span>
                                <div className="flex gap-1 ml-1">
                                   {stat.leaves.slice(0, 2).map((l, idx) => (
                                      <span key={idx} className="text-[9px] bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-100 font-bold">{l}</span>
                                   ))}
                                </div>
                             </div>
                          )}
                          {stat.otherCount > 0 && (
                             <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Other</span>
                                <span className="text-xs font-black text-purple-600">{stat.otherCount}</span>
                                <div className="flex gap-1 ml-1">
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

