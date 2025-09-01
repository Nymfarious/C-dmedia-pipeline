import { useToast } from '@/hooks/use-toast';

export function useToastManager() {
  const { toast } = useToast();

  const showSuccess = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'default',
    });
  };

  const showError = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'destructive',
    });
  };

  const showMigrationSuccess = (count: number) => {
    toast({
      title: "Assets Updated",
      description: `${count} asset(s) have been migrated to permanent storage for better performance.`,
      variant: 'default',
    });
  };

  const showGenerationSuccess = (type: string = 'Image') => {
    toast({
      title: `${type} Generated Successfully`,
      description: "Your new asset has been added to the canvas.",
      variant: 'default',
    });
  };

  return {
    showSuccess,
    showError, 
    showMigrationSuccess,
    showGenerationSuccess,
  };
}