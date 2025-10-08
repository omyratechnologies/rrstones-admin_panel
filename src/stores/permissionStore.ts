import React from 'react';
import { create } from 'zustand';
import type { Permission, Role, User, PermissionContext } from '@/types/dynamic';

interface PermissionState {
  permissions: Permission[];
  roles: Role[];
  currentUser: User | null;
  user: User | null; // Alias for currentUser
  hasPermission: (permission: string, context?: Partial<PermissionContext>) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  canAccess: (resource: string, action: string, context?: any) => boolean;
  getRoleLevel: () => number;
  isHigherRole: (targetRole: string) => boolean;
  setUser: (user: User) => void;
  setPermissions: (permissions: Permission[]) => void;
  setRoles: (roles: Role[]) => void;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: [],
  roles: [],
  currentUser: null,
  get user() {
    return get().currentUser;
  },

  // Check if user has specific permission
  hasPermission: (permission: string, _context?: Partial<PermissionContext>) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    // Super admin has all permissions
    if (currentUser.role === 'super_admin') return true;

    // Check direct user permissions
    const userPermissions = currentUser.permissions || [];
    const hasDirectPermission = userPermissions.some(p => 
      p.id === permission || p.name === permission
    );

    if (hasDirectPermission) return true;

    // Check role-based permissions
    const userRoles = currentUser.roles || [];
    const hasRolePermission = userRoles.some(role =>
      role.permissions.some((p: string) => p === permission)
    );

    return hasRolePermission;
  },

  // Check if user has specific role
  hasRole: (role: string) => {
    const { currentUser } = get();
    if (!currentUser) return false;

    // Check primary role
    if (currentUser.role === role) return true;

    // Check additional roles
    return currentUser.roles?.some(r => r.name === role) || false;
  },

  // Check if user has any of the specified roles
  hasAnyRole: (roles: string[]) => {
    const { hasRole } = get();
    return roles.some(role => hasRole(role));
  },

  // Check if user has all specified permissions
  hasAllPermissions: (permissions: string[]) => {
    const { hasPermission } = get();
    return permissions.every(permission => hasPermission(permission));
  },

  // Check if user has any of the specified permissions
  hasAnyPermission: (permissions: string[]) => {
    const { hasPermission } = get();
    return permissions.some(permission => hasPermission(permission));
  },

  // Check if user can access a resource with specific action
  canAccess: (resource: string, action: string, context?: any) => {
    const { hasPermission } = get();
    const permissionKey = `${resource}:${action}`;
    return hasPermission(permissionKey, context);
  },

  // Get user's role level (for hierarchy)
  getRoleLevel: () => {
    const { currentUser, roles } = get();
    if (!currentUser) return 0;

    if (currentUser.role === 'super_admin') return 1000;

    const userRole = roles.find(r => r.name === currentUser.role);
    return userRole?.level || 0;
  },

  // Check if current user has higher role than target
  isHigherRole: (targetRole: string) => {
    const { getRoleLevel, roles } = get();
    const currentLevel = getRoleLevel();
    const targetRoleObj = roles.find(r => r.name === targetRole);
    const targetLevel = targetRoleObj?.level || 0;
    
    return currentLevel > targetLevel;
  },

  // Setters
  setUser: (user: User) => set({ currentUser: user }),
  setPermissions: (permissions: Permission[]) => set({ permissions }),
  setRoles: (roles: Role[]) => set({ roles }),
}));

// Permission hook for conditional rendering
export function usePermissions() {
  const store = usePermissionStore();
  
  return {
    hasPermission: store.hasPermission,
    hasRole: store.hasRole,
    hasAnyRole: store.hasAnyRole,
    hasAllPermissions: store.hasAllPermissions,
    hasAnyPermission: store.hasAnyPermission,
    canAccess: store.canAccess,
    getRoleLevel: store.getRoleLevel,
    isHigherRole: store.isHigherRole,
    currentUser: store.currentUser,
  };
}

// Permission component for JSX conditional rendering
interface PermissionGateProps {
  permissions?: string[];
  roles?: string[];
  requireAll?: boolean; // true = AND, false = OR
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permissions = [],
  roles = [],
  requireAll = true,
  fallback = null,
  children
}: PermissionGateProps) {
  const { hasAllPermissions, hasAnyPermission, hasAnyRole, hasRole } = usePermissions();
  
  let hasPermissionAccess = true;
  let hasRoleAccess = true;
  
  if (permissions.length > 0) {
    hasPermissionAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }
  
  if (roles.length > 0) {
    hasRoleAccess = requireAll
      ? roles.every(role => hasRole(role))
      : hasAnyRole(roles);
  }
  
  const hasAccess = hasPermissionAccess && hasRoleAccess;
  
  return hasAccess ? children : fallback;
}

// Utility functions
export const PermissionUtils = {
  // Create permission string
  createPermission: (resource: string, action: string) => `${resource}:${action}`,
  
  // Parse permission string
  parsePermission: (permission: string) => {
    const [resource, action] = permission.split(':');
    return { resource, action };
  },
  
  // Check if permission is wildcard
  isWildcard: (permission: string) => permission.includes('*'),
  
  // Match wildcard permission
  matchWildcard: (permission: string, pattern: string) => {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return regex.test(permission);
  },
  
  // Get all permissions for a resource
  getResourcePermissions: (permissions: Permission[], resource: string) => {
    return permissions.filter(p => p.resource === resource);
  },
  
  // Check hierarchical permissions
  checkHierarchy: (userLevel: number, requiredLevel: number) => {
    return userLevel >= requiredLevel;
  }
};
