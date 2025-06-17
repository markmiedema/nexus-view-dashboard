
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
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .eq('owner_id', user.id);

      if (error) throw error;
      
      setOrganizations(data || []);
      if (data && data.length > 0) {
        setCurrentOrg(data[0]);
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
            <Building2 className="h-4 w-4 mr-2" />
            {org.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
