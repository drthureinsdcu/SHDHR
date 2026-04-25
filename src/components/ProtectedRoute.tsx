import React, { useEffect } from 'react';
import { useRole, Role } from '../contexts/RoleContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  onAccessDenied: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, onAccessDenied }) => {
  const { role, loadingRole } = useRole();

  useEffect(() => {
    if (!loadingRole && !allowedRoles.includes(role)) {
      onAccessDenied();
    }
  }, [role, loadingRole, allowedRoles, onAccessDenied]);

  if (loadingRole) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return null; // The useEffect will handle the redirect/fallback
  }

  return <>{children}</>;
};
