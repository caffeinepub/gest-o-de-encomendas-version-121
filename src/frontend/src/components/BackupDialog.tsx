import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { useGetBackups, useCreateBackup, useRestoreBackup, useDeleteBackup } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { Database, Download, Upload, Loader2, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BackupDialog({ open, onOpenChange }: BackupDialogProps) {
  const { data: backups, isLoading: loadingBackups } = useGetBackups();
  const createBackup = useCreateBackup();
  const restoreBackup = useRestoreBackup();
  const deleteBackup = useDeleteBackup();
  const [restoringId, setRestoringId] = useState<bigint | null>(null);
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<bigint | null>(null);

  const handleCreateBackup = async () => {
    try {
      const result = await createBackup.mutateAsync();
      toast.success('Backup criado com sucesso', {
        description: `ID do backup: ${result.backupId}`,
      });
    } catch (error: any) {
      console.error('Erro ao criar backup:', error);
      toast.error('Erro ao criar backup', {
        description: error.message || 'Ocorreu um erro ao criar o backup',
      });
    }
  };

  const handleRestoreBackup = async (id: bigint) => {
    if (!confirm('Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos.')) {
      return;
    }

    setRestoringId(id);
    try {
      const result = await restoreBackup.mutateAsync(id);
      toast.success('Backup restaurado com sucesso', {
        description: result.mensagem,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao restaurar backup:', error);
      toast.error('Erro ao restaurar backup', {
        description: error.message || 'Ocorreu um erro ao restaurar o backup',
      });
    } finally {
      setRestoringId(null);
    }
  };

  const handleDeleteClick = (id: bigint) => {
    setBackupToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!backupToDelete) return;

    setDeletingId(backupToDelete);
    try {
      const result = await deleteBackup.mutateAsync(backupToDelete);
      toast.success('Backup eliminado com sucesso', {
        description: result.mensagem,
      });
      setDeleteConfirmOpen(false);
      setBackupToDelete(null);
    } catch (error: any) {
      console.error('Erro ao eliminar backup:', error);
      toast.error('Erro ao eliminar backup', {
        description: error.message || 'Ocorreu um erro ao eliminar o backup',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gestão de Backups
            </DialogTitle>
            <DialogDescription>
              Crie e restaure backups completos de todos os dados do sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {backups?.length || 0} backup(s) disponível(is)
              </p>
              <Button
                onClick={handleCreateBackup}
                disabled={createBackup.isPending}
                className="gap-2"
              >
                {createBackup.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Criar Novo Backup
                  </>
                )}
              </Button>
            </div>

            <ScrollArea className="h-[400px] rounded-md border">
              {loadingBackups ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : backups && backups.length > 0 ? (
                <div className="p-4 space-y-3">
                  {backups.map((backup) => (
                    <div
                      key={backup.id.toString()}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">Backup #{backup.id.toString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(backup.timestamp)}
                        </p>
                        <p className="text-xs text-muted-foreground">{backup.descricao}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreBackup(backup.id)}
                          disabled={restoringId !== null || deletingId !== null}
                          className="gap-2"
                        >
                          {restoringId === backup.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Restaurando...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Restaurar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(backup.id)}
                          disabled={restoringId !== null || deletingId !== null}
                          className="gap-2"
                        >
                          {deletingId === backup.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Eliminando...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Database className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum backup disponível</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Crie um backup para começar
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O backup será permanentemente eliminado do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBackupToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
