
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Building2 } from 'lucide-react';

interface DeleteOrganizationDialogProps {
  organization: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (orgId: string) => void;
}

export const DeleteOrganizationDialog = ({
  organization,
  open,
  onOpenChange,
  onConfirm,
}: DeleteOrganizationDialogProps) => {
  if (!organization) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-red-500" />
            Delete Organization
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{organization.name}</strong>? 
            This action cannot be undone and will permanently remove all data associated with this organization.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(organization.id)}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Delete Organization
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
