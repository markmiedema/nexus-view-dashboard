
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown } from 'lucide-react';

export const OrganizationSwitcher = () => {
  const { currentOrg, organizations, setCurrentOrg, isLoading } = useOrganization();

  if (isLoading) {
    return (
      <Button variant="ghost" className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Loading...
      </Button>
    );
  }

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
