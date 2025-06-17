
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at?: string;
  role?: string;
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  setCurrentOrg: (org: Organization) => void;
  isLoading: boolean;
  refetchOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrg(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          role,
          organisations (
            id,
            name,
            owner_id,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      const orgs = (data || []).map(membership => ({
        ...membership.organisations,
        role: membership.role
      })).filter(org => org.id);
      
      console.log('Fetched organizations:', orgs);
      setOrganizations(orgs);
      
      if (orgs.length > 0 && !currentOrg) {
        setCurrentOrg(orgs[0]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchOrganizations = async () => {
    await fetchOrganizations();
  };

  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  return (
    <OrganizationContext.Provider value={{
      currentOrg,
      organizations,
      setCurrentOrg,
      isLoading,
      refetchOrganizations
    }}>
      {children}
    </OrganizationContext.Provider>
  );
};
