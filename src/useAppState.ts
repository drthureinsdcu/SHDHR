import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { AppState, Facility, Quota, Staff, RegionData } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

const defaultFacilityTypes = ["Central", "District", "Hospital", "RHC", "Sub-RHC"];
const defaultPositionsList = ["Medical Officer", "Health Assistant", "Midwife"];

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useAppState() {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguageState] = useState<'en' | 'my'>('en');
  const [facilityTypes, setFacilityTypes] = useState<string[]>([]);
  const [positionsList, setPositionsList] = useState<string[]>([]);
  const [globalDefaultQuotas, setGlobalDefaultQuotas] = useState<Quota[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [staffEntries, setStaffEntries] = useState<Staff[]>([]);
  const [locations, setLocations] = useState<RegionData[]>([]);

  const [subdepartmentsMap, setSubdepartmentsMap] = useState<Record<string, string[]>>({});

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsLoaded(true);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Load static UI state from local storage
    const loadStr = (key: string) => localStorage.getItem(key);
    const loadedLang = loadStr('hr_lang') as 'en' | 'my';
    if (loadedLang) setLanguageState(loadedLang);

    // Setup Firestore listeners
    const unsubFacilities = onSnapshot(collection(db, 'facilities'), (snap) => {
      setFacilities(snap.docs.map(d => ({ ...d.data(), id: Number(d.id) } as Facility)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'facilities'));

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
      setStaffEntries(snap.docs.map(d => ({ ...d.data(), id: Number(d.id) } as Staff)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'staff'));

    const unsubQuotas = onSnapshot(collection(db, 'quotas'), (snap) => {
      setGlobalDefaultQuotas(snap.docs.map(d => ({ ...d.data(), id: Number(d.id) } as Quota)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'quotas'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.facilityTypes) setFacilityTypes(data.facilityTypes);
        if (data.positionsList) setPositionsList(data.positionsList);
        if (data.locations) setLocations(data.locations);
        if (data.subdepartmentsMap) setSubdepartmentsMap(data.subdepartmentsMap);
      } else {
        setFacilityTypes(defaultFacilityTypes);
        setPositionsList(defaultPositionsList);
      }
      setIsLoaded(true);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'settings/general'));

    return () => {
      unsubFacilities();
      unsubStaff();
      unsubQuotas();
      unsubSettings();
    };
  }, [user]);

  const updateSettingsItem = async (updates: any) => {
    try {
      await setDoc(doc(db, 'settings', 'general'), updates, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/general');
    }
  };

  const addFacilityType = (type: string) => {
    if (!facilityTypes.includes(type)) {
      updateSettingsItem({ facilityTypes: [...facilityTypes, type] });
    }
  };

  const deleteFacilityType = (idx: number) => {
    const newTypes = facilityTypes.filter((_, i) => i !== idx);
    updateSettingsItem({ facilityTypes: newTypes });
  };

  const addQuota = async (newQuota: Quota & { isNewPosition?: boolean; newPosName?: string }) => {
    if (newQuota.isNewPosition && newQuota.newPosName && !positionsList.includes(newQuota.newPosName)) {
      await updateSettingsItem({ positionsList: [...positionsList, newQuota.newPosName] });
    }
    const finalQuota = {
      id: newQuota.id,
      type: newQuota.type,
      position: newQuota.position,
      max: newQuota.max
    };
    try {
      await setDoc(doc(db, 'quotas', String(finalQuota.id)), finalQuota);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'quotas'); }
  };

  const deleteQuota = async (id: number) => {
    try {
      await deleteDoc(doc(db, 'quotas', String(id)));
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'quotas'); }
  };

  const addFacility = async (fac: Facility) => {
    try {
      await setDoc(doc(db, 'facilities', String(fac.id)), fac);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'facilities'); }
  };

  const updateFacility = async (updatedFac: Facility) => {
    try {
      await setDoc(doc(db, 'facilities', String(updatedFac.id)), updatedFac);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'facilities'); }
  };

  const deleteFacility = async (id: number) => {
    try {
      await deleteDoc(doc(db, 'facilities', String(id)));
      const staffToDelete = staffEntries.filter(s => s.facilityId === id || s.currentFacilityId === id);
      for (const s of staffToDelete) {
        await deleteDoc(doc(db, 'staff', String(s.id)));
      }
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'facilities'); }
  };

  const addStaff = async (staff: Staff) => {
    try {
      await setDoc(doc(db, 'staff', String(staff.id)), staff);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'staff'); }
  };

  const deleteStaff = async (id: number) => {
    try {
      await deleteDoc(doc(db, 'staff', String(id)));
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'staff'); }
  };

  const updateStaff = async (updatedStaff: Staff) => {
    try {
      await setDoc(doc(db, 'staff', String(updatedStaff.id)), updatedStaff);
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'staff'); }
  };

  const updateLocations = (newLocs: RegionData[]) => {
    updateSettingsItem({ locations: newLocs });
  };

  const updateSubdepartmentsMap = (newMap: Record<string, string[]>) => {
    updateSettingsItem({ subdepartmentsMap: newMap });
  };

  const setLanguage = (lang: 'en' | 'my') => {
    setLanguageState(lang);
    localStorage.setItem('hr_lang', lang);
  };

  return {
    isLoaded,
    user,
    language, setLanguage,
    facilityTypes, addFacilityType, deleteFacilityType,
    positionsList,
    globalDefaultQuotas, addQuota, deleteQuota,
    facilities, addFacility, updateFacility, deleteFacility,
    staffEntries, addStaff, updateStaff, deleteStaff,
    locations, updateLocations,
    subdepartmentsMap, updateSubdepartmentsMap,
  };
}
