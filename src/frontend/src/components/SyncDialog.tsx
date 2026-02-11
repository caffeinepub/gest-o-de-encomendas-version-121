import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGetDadosCompletos, useSalvarDadosCompletos } from '../hooks/useQueries';
import { toast } from 'sonner';

interface SyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SyncDialog({ open, onOpenChange }: SyncDialogProps) {
  const [syncMode, setSyncMode] = useState<'download' | 'upload' | null>(null);
  const [downloadedData, setDownloadedData] = useState<string | null>(null);

  const { refetch: fetchDados, isFetching: isFetchingDados } = useGetDadosCompletos();
  const { mutate: salvarDados, isPending: isSavingDados } = useSalvarDadosCompletos();

  const handleDownloadData = async () => {
    try {
      setSyncMode('download');
      const result = await fetchDados();
      
      if (result.data) {
        const dataStr = JSON.stringify(result.data, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value
        );
        
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gestao-encomendas-sync-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Dados exportados com sucesso!');
        setDownloadedData(dataStr);
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      toast.error('Erro ao exportar dados. Tente novamente.');
    } finally {
      setSyncMode(null);
    }
  };

  const handleUploadData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        setSyncMode('upload');
        const text = await file.text();
        const data = JSON.parse(text, (key, value) => {
          if (typeof value === 'string' && /^\d+$/.test(value) && value.length > 15) {
            return BigInt(value);
          }
          return value;
        });
        
        salvarDados(data, {
          onSuccess: () => {
            toast.success('Sincronização concluída com sucesso!');
            onOpenChange(false);
          },
          onError: (error) => {
            console.error('Erro ao sincronizar dados:', error);
            toast.error('Erro ao sincronizar dados. Tente novamente.');
          },
        });
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        toast.error('Erro ao processar arquivo. Verifique o formato.');
        setSyncMode(null);
      }
    };
    
    input.click();
  };

  const isProcessing = isFetchingDados || isSavingDados;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Sincronizar Dados
          </DialogTitle>
          <DialogDescription>
            Sincronize os dados da aplicação com o seu ambiente de trabalho
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              A sincronização permite exportar todos os dados da aplicação para um arquivo e importá-los
              em outro ambiente, garantindo que ambos os ambientes tenham dados idênticos.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">1. Exportar Dados</h3>
              <p className="text-sm text-muted-foreground">
                Exporte todos os dados da aplicação atual para um arquivo JSON.
              </p>
              <Button
                onClick={handleDownloadData}
                disabled={isProcessing}
                variant="outline"
                className="w-full"
              >
                {syncMode === 'download' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    A exportar dados...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Exportar Dados
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">2. Importar Dados</h3>
              <p className="text-sm text-muted-foreground">
                Importe dados de um arquivo JSON exportado anteriormente. Isto irá substituir todos os
                dados atuais da aplicação.
              </p>
              <Button
                onClick={handleUploadData}
                disabled={isProcessing}
                variant="default"
                className="w-full"
              >
                {syncMode === 'upload' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    A sincronizar...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Importar Dados
                  </>
                )}
              </Button>
            </div>
          </div>

          {downloadedData && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Dados exportados com sucesso! Utilize o arquivo descarregado para sincronizar com outro
                ambiente.
              </AlertDescription>
            </Alert>
          )}

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Atenção:</strong> A importação de dados irá substituir completamente todos os dados
              atuais da aplicação. Certifique-se de que tem um backup antes de prosseguir.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
