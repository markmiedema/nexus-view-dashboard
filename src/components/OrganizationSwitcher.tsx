
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown, User } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          {currentOrg ? (
            <>
              <Building2 className="h-4 w-4" />
              {currentOrg.name}
            </>
          ) : (
            <>
              <User className="h-4 w-4" />
              Personal Dashboard
            </>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem
          onClick={() => setCurrentOrg(null)}
          className={!currentOrg ? 'bg-blue-50' : ''}
        >
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            Personal Dashboard
          </div>
        </DropdownMenuItem>
        
        {organizations.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => setCurrentOrg(org)}
                className={currentOrg?.id === org.id ? 'bg-blue-50' : ''}
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
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/organizations" className="w-full">
            <Building2 className="h-4 w-4 mr-2" />
            Manage Organizations
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
