import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export type Role = 'admin' | 'manager' | 'viewer';

interface RoleContextType {
  role: Role;
  loadingRole: boolean;
  allowedTownship: string | null;
}

const RoleContext = createContext<RoleContextType>({
  role: 'viewer',
  loadingRole: true,
  allowedTownship: null,
});

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('viewer');
  const [allowedTownship, setAllowedTownship] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoadingRole(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
             let userRole = userDoc.data().role as Role || 'viewer';
             if (user.email === 'drthurein.sdcu@gmail.com' && userRole !== 'admin') {
               userRole = 'admin';
               await updateDoc(userDocRef, { role: 'admin' });
             }
             setRole(userRole);
             setAllowedTownship(userDoc.data().allowedTownship || null);
          } else {
             // Create default viewer record
             const initialRole = user.email === 'drthurein.sdcu@gmail.com' ? 'admin' : 'viewer';
             await setDoc(userDocRef, { 
               role: initialRole, 
               email: user.email || null, 
               name: user.displayName || null,
               allowedTownship: null
             });
             setRole(initialRole);
             setAllowedTownship(null);
          }
        } catch (e) {
          console.error("Error fetching user role", e);
          setRole('viewer');
          setAllowedTownship(null);
        } finally {
          setLoadingRole(false);
        }
      } else {
        setRole('viewer');
        setAllowedTownship(null);
        setLoadingRole(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <RoleContext.Provider value={{ role, loadingRole, allowedTownship }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
