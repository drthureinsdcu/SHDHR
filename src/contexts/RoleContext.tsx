import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export type Role = 'admin' | 'manager' | 'viewer';

interface RoleContextType {
  role: Role;
  loadingRole: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: 'viewer',
  loadingRole: true,
});

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role>('viewer');
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoadingRole(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
             setRole(userDoc.data().role as Role || 'viewer');
          } else {
             // Create default viewer record
             await setDoc(userDocRef, { role: 'viewer', email: user.email, name: user.displayName });
             setRole('viewer');
          }
        } catch (e) {
          console.error("Error fetching user role", e);
          setRole('viewer');
        } finally {
          setLoadingRole(false);
        }
      } else {
        setRole('viewer');
        setLoadingRole(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <RoleContext.Provider value={{ role, loadingRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
