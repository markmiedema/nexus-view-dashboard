
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  role?: string;
}

export const OrganizationSwitcher = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  const fetchOrganizations = async () => {
    if (!user) return;

    try {
      // Fetch organizations through memberships table
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          role,
          organisations (
            id,
            name,
            owner_id
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Transform the data to include role information
      const orgs = (data || []).map(membership => ({
        ...membership.organisations,
        role: membership.role
      })).filter(org => org.id); // Filter out any null organizations
      
      console.log('Fetched organizations:', orgs);
      setOrganizations(orgs);
      
      if (orgs && orgs.length > 0) {
        setCurrentOrg(orgs[0]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  if (!currentOrg) {
    return (
      <Button variant="ghost" className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        No Organization
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {currentOrg.name}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setCurrentOrg(org)}
            className={currentOrg.id === org.id ? 'bg-blue-50' : ''}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                {org.name}
              </div>
              <span className="text-xs text-gray-500 capitalize">
                {org.role}
              </span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
