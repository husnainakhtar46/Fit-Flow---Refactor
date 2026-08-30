'use client';

import { useState, useEffect } from 'react';

/**
 * Centralized authentication hook for role-based access control.
 * Provides user type and permission checking utilities.
 */

export type UserType = 'qa' | 'quality_head' | 'quality_supervisor' | 'merchandiser' | 'admin';

export interface AuthState {
  userType: UserType;
  isSuperUser: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  // Page Access
  canViewDashboard: boolean;
  canViewCustomers: boolean;
  canViewTemplates: boolean;
  canViewResources: boolean;
  // Create/Edit Permissions
  canCreateInspections: boolean;
  canEditEvaluation: boolean;
  canEditFinalInspection: (creatorId?: string | null) => boolean;
  canAddCustomerFeedback: boolean;
  canEditCustomers: boolean;
  canEditFactories: boolean;
  canEditStyleCycle: boolean;
  canEditTemplates: boolean;
  // General
  isReadOnly: boolean;
  canDownloadPdf: boolean;
}

const DEFAULT_AUTH_STATE: AuthState = {
  userType: 'qa',
  isSuperUser: false,
  isAuthenticated: false,
  userId: null,
  canViewDashboard: false,
  canViewCustomers: false,
  canViewTemplates: false,
  canViewResources: false,
  canCreateInspections: false,
  canEditEvaluation: false,
  canEditFinalInspection: () => false,
  canAddCustomerFeedback: false,
  canEditCustomers: false,
  canEditFactories: false,
  canEditStyleCycle: false,
  canEditTemplates: false,
  isReadOnly: false,
  canDownloadPdf: true,
};

function computeAuthState(
  userType: UserType,
  isSuperUser: boolean,
  isAuthenticated: boolean,
  userId: string | null
): AuthState {
  if (isSuperUser) {
    return {
      userType: 'admin',
      isSuperUser: true,
      isAuthenticated,
      userId,
      canViewDashboard: true,
      canViewCustomers: true,
      canViewTemplates: true,
      canViewResources: true,
      canCreateInspections: true,
      canEditEvaluation: true,
      canEditFinalInspection: () => true,
      canAddCustomerFeedback: true,
      canEditCustomers: true,
      canEditFactories: true,
      canEditStyleCycle: true,
      canEditTemplates: true,
      isReadOnly: false,
      canDownloadPdf: true,
    };
  }

  const canViewDashboard = ['quality_head', 'quality_supervisor'].includes(userType);
  const canViewCustomers = userType === 'quality_head';
  const canViewTemplates = userType !== 'merchandiser';
  const canCreateInspections = ['qa', 'quality_head', 'quality_supervisor'].includes(userType);
  const canEditEvaluation = ['qa', 'quality_head', 'quality_supervisor'].includes(userType);

  const canEditFinalInspection = (creatorId?: string | null): boolean => {
    if (['quality_head', 'quality_supervisor'].includes(userType)) {
      return true;
    }
    if (userType === 'qa' && creatorId && userId) {
      return creatorId === userId;
    }
    return false;
  };

  const canAddCustomerFeedback = userType === 'merchandiser';
  const isReadOnly = userType === 'merchandiser';
  const canViewResources = isSuperUser || userType === 'quality_head';
  const canEditCustomers = isSuperUser || userType === 'quality_head';
  const canEditFactories =
    isSuperUser || userType === 'quality_head' || userType === 'quality_supervisor';
  const canEditStyleCycle = userType !== 'merchandiser';
  const canEditTemplates = isSuperUser || userType === 'quality_head';
  const canDownloadPdf = true;

  return {
    userType,
    isSuperUser,
    isAuthenticated,
    userId,
    canViewDashboard,
    canViewCustomers,
    canViewTemplates,
    canViewResources,
    canCreateInspections,
    canEditEvaluation,
    canEditFinalInspection,
    canAddCustomerFeedback,
    canEditCustomers,
    canEditFactories,
    canEditStyleCycle,
    canEditTemplates,
    isReadOnly,
    canDownloadPdf,
  };
}

export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>(DEFAULT_AUTH_STATE);

  useEffect(() => {
    try {
      const userType = (localStorage.getItem('user_type') || 'qa') as UserType;
      const isSuperUser = localStorage.getItem('is_superuser') === 'true';
      const isAuthenticated = !!localStorage.getItem('access_token');
      const userId = localStorage.getItem('user_id');

      setAuthState(computeAuthState(userType, isSuperUser, isAuthenticated, userId));
    } catch {
      // Fallback to default if localStorage is inaccessible
      setAuthState(DEFAULT_AUTH_STATE);
    }
  }, []);

  return authState;
};

export default useAuth;
