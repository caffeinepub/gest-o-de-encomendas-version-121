import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useOrcamentoQueries, useClienteQueries } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { Orcamento } from '../backend';
import { useState, useEffect } from 'react';

interface AcceptOrcamentoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orcamento: Orcamento | null;
}

export default function AcceptOrcamentoDialog({ open, onOpenChange, orcamento }: AcceptOrcamentoDialogProps) {
  const { useAcceptOrcamento } = useOrcamentoQueries();
  const { useCliente } = useClienteQueries();
  const acceptOrcamentoMutation = useAcceptOrcamento();
  const [isProcessing, setIsProcessing] = useState(false);

  const clienteQuery = useCliente(orcamento?.clienteId || BigInt(0));

  // Reset processing state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsProcessing(false);
    }
  }, [open]);

  const formatCurrency = (value: bigint) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(value) / 100);
  };

  const handleAccept = async () => {
    if (!orcamento) {
      toast.error('Orçamento não disponível');
      return;
    }

    if (!clienteQuery.data) {
      toast.error('Dados do cliente não disponíveis. Por favor, aguarde o carregamento.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await acceptOrcamentoMutation.mutateAsync(orcamento.id);
      
      // Check if the backend operation was successful
      if (result.sucesso) {
        toast.success(
          'Encomenda criada com sucesso! O orçamento permanece visível na lista de orçamentos.',
          { duration: 5000 }
        );
        // Close dialog after successful operation
        setTimeout(() => {
          onOpenChange(false);
        }, 500);
      } else {
        // Backend returned failure
        toast.error(result.mensagem || 'Erro ao aceitar orçamento');
        setIsProcessing(false);
      }
    } catch (error) {
      // Network or other error
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao aceitar orçamento: ${errorMessage}`);
      console.error('Error accepting orcamento:', error);
      setIsProcessing(false);
    }
  };

  const isLoading = clienteQuery.isLoading || !clienteQuery.data;
  const isDisabled = isLoading || isProcessing || acceptOrcamentoMutation.isPending;

  if (!orcamento) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // Prevent closing while processing
      if (!isProcessing) {
        onOpenChange(newOpen);
      }
    }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Aceitar Orçamento e Criar Encomenda</DialogTitle>
          <DialogDescription>
            Confirme a criação de uma nova encomenda baseada neste orçamento
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">A carregar dados do cliente...</span>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <h4 className="font-semibold mb-3">Dados que serão transferidos para a nova encomenda</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome do Cliente:</span>
                    <span className="font-medium">{clienteQuery.data?.nome || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contato:</span>
                    <span className="font-medium">{clienteQuery.data?.contato || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Descrição:</span>
                    <span className="font-medium">encomenda</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gestor Responsável:</span>
                    <span className="font-medium">{orcamento.gestor || 'Não definido'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground font-semibold">Valor Total:</span>
                    <span className="font-bold text-primary text-lg">{formatCurrency(orcamento.valorTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      O que acontecerá ao aceitar este orçamento:
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1.5 list-disc list-inside ml-1">
                      <li>
                        <strong>Uma nova encomenda será criada</strong> no sistema de encomendas com:
                        <ul className="ml-6 mt-1 space-y-0.5 list-circle">
                          <li>Nome: {clienteQuery.data?.nome}</li>
                          <li>Contato: {clienteQuery.data?.contato}</li>
                          <li>Descrição: "encomenda"</li>
                          <li>Valor: {formatCurrency(orcamento.valorTotal)}</li>
                        </ul>
                      </li>
                      <li className="font-semibold text-blue-900 dark:text-blue-100">
                        O orçamento original permanecerá visível e inalterado na lista de orçamentos
                      </li>
                      <li>Poderá continuar a consultar, editar e gerar PDF deste orçamento</li>
                      <li>A nova encomenda aparecerá na aba "Encomendas" com status inicial</li>
                    </ul>
                  </div>
                </div>
              </div>

              {isProcessing && (
                <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5 animate-spin" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        A criar encomenda...
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Por favor, aguarde enquanto criamos a nova encomenda com os dados do cliente.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {acceptOrcamentoMutation.isError && !isProcessing && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        Erro ao criar encomenda
                      </p>
                      <p className="text-sm text-red-800 dark:text-red-200">
                        {acceptOrcamentoMutation.error instanceof Error 
                          ? acceptOrcamentoMutation.error.message 
                          : 'Ocorreu um erro ao tentar criar a encomenda. Por favor, tente novamente.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isDisabled}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAccept} 
                disabled={isDisabled}
              >
                {isProcessing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {!isProcessing && (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                {isProcessing ? 'A criar encomenda...' : 'Aceitar e Criar Encomenda'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
