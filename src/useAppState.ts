import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { AppState, Facility, Quota, Staff, RegionData, Position, FacilityType } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';

const defaultFacilityTypes: FacilityType[] = [
  { name: "Central", category: "Public Health" },
  { name: "District", category: "Public Health" },
  { name: "Hospital", category: "Clinical" },
  { name: "RHC", category: "Public Health" },
  { name: "Sub-RHC", category: "Public Health" }
];
const defaultPositionsList: Position[] = [
  { name: "Medical Officer", rank: 1, category: "Clinical" },
  { name: "Health Assistant", rank: 2, category: "Public Health" },
  { name: "Midwife", rank: 3, category: "Public Health" }
];

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

function sanitizeForFirestore(obj: any) {
  const sanitized = { ...obj };
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });
  return sanitized;
}

export function useAppState() {
  const [user, setUser] = useState<User | null>(null);
  const [language, setLanguageState] = useState<'en' | 'my'>('en');
  const [facilityTypes, setFacilityTypes] = useState<FacilityType[]>([]);
  const [positionsList, setPositionsList] = useState<Position[]>([]);
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
      setFacilities(snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: Number(d.id),
          type: typeof data.type === 'object' ? data.type.name : data.type
        } as Facility;
      }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'facilities'));

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
      setStaffEntries(snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: Number(d.id),
          position: typeof data.position === 'object' ? data.position.name : data.position
        } as Staff;
      }));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'staff'));

    const unsubQuotas = onSnapshot(collection(db, 'quotas'), (snap) => {
      setGlobalDefaultQuotas(snap.docs.map(d => ({ ...d.data(), id: Number(d.id) } as Quota)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'quotas'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.facilityTypes) {
           const formattedFac = data.facilityTypes.map((f: any) => typeof f === 'string' ? { name: f, category: 'Public Health' } : f);
           setFacilityTypes(formattedFac);
        }
        if (data.positionsList) {
          const formatted = data.positionsList.map((p: any) => {
            if (typeof p === 'string') return { name: p, rank: 99, category: 'Public Health' };
            return {
              ...p,
              category: p.category || (p.name.startsWith('ပက') ? 'Public Health' : 'Clinical')
            };
          });
          setPositionsList(formatted);
        }
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
      await setDoc(doc(db, 'settings', 'general'), sanitizeForFirestore(updates), { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'settings/general');
    }
  };

  const addFacilityType = (name: string) => {
    if (!facilityTypes.find(f => f.name === name)) {
      updateSettingsItem({ facilityTypes: [...facilityTypes, { name, category: 'Public Health' }] });
    }
  };

  const deleteFacilityType = (name: string) => {
    const newTypes = facilityTypes.filter((f) => f.name !== name);
    updateSettingsItem({ facilityTypes: newTypes });
  };

  const updateFacilityTypes = (newList: FacilityType[]) => {
    updateSettingsItem({ facilityTypes: newList });
  };

  const addQuota = async (newQuota: Quota & { isNewPosition?: boolean; newPosName?: string; newPosCat?: 'Public Health' | 'Clinical' }) => {
    if (newQuota.isNewPosition && newQuota.newPosName && !positionsList.find(p => p.name === newQuota.newPosName)) {
      await updateSettingsItem({ positionsList: [...positionsList, { name: newQuota.newPosName, rank: 99, category: newQuota.newPosCat || 'Public Health' }] });
    }
    const finalQuota = {
      id: newQuota.id,
      type: newQuota.type,
      position: newQuota.position,
      max: newQuota.max
    };
    try {
      await setDoc(doc(db, 'quotas', String(finalQuota.id)), sanitizeForFirestore(finalQuota));
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'quotas'); }
  };

  const deleteQuota = async (id: number) => {
    try {
      await deleteDoc(doc(db, 'quotas', String(id)));
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'quotas'); }
  };

  const addFacility = async (fac: Facility) => {
    try {
      await setDoc(doc(db, 'facilities', String(fac.id)), sanitizeForFirestore(fac));
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'facilities'); }
  };

  const updateFacility = async (updatedFac: Facility) => {
    try {
      await setDoc(doc(db, 'facilities', String(updatedFac.id)), sanitizeForFirestore(updatedFac));
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
      await setDoc(doc(db, 'staff', String(staff.id)), sanitizeForFirestore(staff));
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'staff'); }
  };

  const deleteStaff = async (id: number) => {
    try {
      await deleteDoc(doc(db, 'staff', String(id)));
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'staff'); }
  };

  const updateStaff = async (updatedStaff: Staff) => {
    try {
      await setDoc(doc(db, 'staff', String(updatedStaff.id)), sanitizeForFirestore(updatedStaff));
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, 'staff'); }
  };

  const updateLocations = (newLocs: RegionData[]) => {
    updateSettingsItem({ locations: newLocs });
  };

  const updatePositionsList = (newList: Position[]) => {
    updateSettingsItem({ positionsList: newList });
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
    facilityTypes, addFacilityType, deleteFacilityType, updateFacilityTypes,
    positionsList,
    globalDefaultQuotas, addQuota, deleteQuota,
    facilities, addFacility, updateFacility, deleteFacility,
    staffEntries, addStaff, updateStaff, deleteStaff,
    locations, updateLocations,
    subdepartmentsMap, updateSubdepartmentsMap,
    updatePositionsList
  };
}
