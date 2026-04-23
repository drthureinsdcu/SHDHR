import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { AppState, Facility, Quota, Staff, RegionData } from './types';

const defaultFacilityTypes = ["Central", "District", "Hospital", "RHC", "Sub-RHC"];
const defaultPositionsList = ["Medical Officer", "Health Assistant", "Midwife"];

export function useAppState() {
  const [facilityTypes, setFacilityTypes] = useState<string[]>([]);
  const [positionsList, setPositionsList] = useState<string[]>([]);
  const [globalDefaultQuotas, setGlobalDefaultQuotas] = useState<Quota[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [staffEntries, setStaffEntries] = useState<Staff[]>([]);
  const [locations, setLocations] = useState<RegionData[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load from local storage
    const loadStr = (key: string) => localStorage.getItem(key);
    const loadObj = (key: string, defVal: any) => {
      const stored = loadStr(key);
      if (stored) {
        try { return JSON.parse(stored); } catch (e) { return defVal; }
      }
      return defVal;
    };

    setFacilityTypes(loadObj('hr_fac_types', defaultFacilityTypes));
    setPositionsList(loadObj('hr_positions_list', defaultPositionsList));
    setGlobalDefaultQuotas(loadObj('hr_quotas', []));
    setFacilities(loadObj('hr_facilities', []));
    setLocations(loadObj('hr_locations', []));
    
    // Migrate staff to include standard dutyStatus and activeStatus
    let rawStaff = loadObj('hr_staff', []);
    let migrated = false;
    const migratedStaff = rawStaff.map((s: any) => {
      let updated = { ...s };
      if (!updated.currentFacilityId || !updated.dutyStatus) {
        migrated = true;
        updated.currentFacilityId = s.facilityId;
        updated.dutyStatus = 'Present';
      }
      if (!updated.activeStatus) {
        migrated = true;
        updated.activeStatus = 'Active';
      }
      return updated;
    });

    setStaffEntries(migratedStaff);
    if (migrated) {
      localStorage.setItem('hr_staff', JSON.stringify(migratedStaff));
    }

    setIsLoaded(true);
  }, []);

  const updateState = (key: string, value: any, setter: Dispatch<SetStateAction<any>>) => {
    setter(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  const addFacilityType = (type: string) => {
    if (!facilityTypes.includes(type)) {
      updateState('hr_fac_types', [...facilityTypes, type], setFacilityTypes);
    }
  };

  const deleteFacilityType = (idx: number) => {
    const newTypes = facilityTypes.filter((_, i) => i !== idx);
    updateState('hr_fac_types', newTypes, setFacilityTypes);
  };

  const addQuota = (newQuota: Quota & { isNewPosition?: boolean; newPosName?: string }) => {
    if (newQuota.isNewPosition && newQuota.newPosName && !positionsList.includes(newQuota.newPosName)) {
      updateState('hr_positions_list', [...positionsList, newQuota.newPosName], setPositionsList);
    }
    const finalQuota = {
      id: newQuota.id,
      type: newQuota.type,
      position: newQuota.position,
      max: newQuota.max
    };
    updateState('hr_quotas', [...globalDefaultQuotas, finalQuota], setGlobalDefaultQuotas);
  };

  const deleteQuota = (id: number) => {
    updateState('hr_quotas', globalDefaultQuotas.filter(q => q.id !== id), setGlobalDefaultQuotas);
  };

  const addFacility = (fac: Facility) => {
    updateState('hr_facilities', [...facilities, fac], setFacilities);
  };

  const updateFacility = (updatedFac: Facility) => {
    updateState('hr_facilities', facilities.map(f => f.id === updatedFac.id ? updatedFac : f), setFacilities);
  };

  const deleteFacility = (id: number) => {
    updateState('hr_facilities', facilities.filter(f => f.id !== id), setFacilities);
    // Also delete associated staff
    const newStaff = staffEntries.filter(s => s.facilityId !== id && s.currentFacilityId !== id);
    updateState('hr_staff', newStaff, setStaffEntries);
  };

  const addStaff = (staff: Staff) => {
    updateState('hr_staff', [...staffEntries, staff], setStaffEntries);
  };

  const deleteStaff = (id: number) => {
    updateState('hr_staff', staffEntries.filter(s => s.id !== id), setStaffEntries);
  };

  const updateStaff = (updatedStaff: Staff) => {
    updateState('hr_staff', staffEntries.map(s => s.id === updatedStaff.id ? updatedStaff : s), setStaffEntries);
  };

  const updateLocations = (newLocs: RegionData[]) => {
    updateState('hr_locations', newLocs, setLocations);
  };

  return {
    isLoaded,
    facilityTypes, addFacilityType, deleteFacilityType,
    positionsList,
    globalDefaultQuotas, addQuota, deleteQuota,
    facilities, addFacility, updateFacility, deleteFacility,
    staffEntries, addStaff, updateStaff, deleteStaff,
    locations, updateLocations,
  };
}
