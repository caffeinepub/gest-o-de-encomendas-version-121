import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useOrderQueries } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Status, type Encomenda } from '../backend';

interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Encomenda | null;
}

const statusLabels: Record<Status, string> = {
  [Status.encomenda]: 'Encomendas',
  [Status.producao]: 'Em Produção',
  [Status.montagem]: 'Em Montagem em Obra',
  [Status.porPagar]: 'Por Pagar',
  [Status.concluido]: 'Concluído'
};

const getPreviousStatus = (currentStatus: Status): Status | null => {
  switch (currentStatus) {
    case Status.producao:
      return Status.encomenda;
    case Status.montagem:
      return Status.producao;
    case Status.porPagar:
      return Status.montagem;
    case Status.concluido:
      return Status.porPagar;
    case Status.encomenda:
      return null;
    default:
      return null;
  }
};

export default function EditOrderDialog({ open, onOpenChange, order }: EditOrderDialogProps) {
  const [formData, setFormData] = useState({
    nomeCliente: '',
    descricao: '',
    contato: '',
    gestor: '',
    valorTotal: '',
    valorAdiantado: ''
  });

  const { useEditOrder, useGestores, useMoveToPreviousStatus } = useOrderQueries();
  const editOrderMutation = useEditOrder();
  const moveToPreviousMutation = useMoveToPreviousStatus();
  const gestores = useGestores();

  // Initialize form data when order changes
  useEffect(() => {
    if (order && open) {
      setFormData({
        nomeCliente: order.nomeCliente,
        descricao: order.descricao,
        contato: order.contato,
        gestor: order.gestor,
        valorTotal: (Number(order.valorTotal) / 100).toString(),
        valorAdiantado: (Number(order.valorAdiantado) / 100).toString()
      });
    }
  }, [order, open]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setFormData({
        nomeCliente: '',
        descricao: '',
        contato: '',
        gestor: '',
        valorTotal: '',
        valorAdiantado: ''
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order) {
      toast.error('Nenhuma encomenda selecionada para edição');
      return;
    }
    
    // Double-check gestores exist
    if (!gestores.data || gestores.data.length === 0) {
      toast.error('Nenhum gestor cadastrado. Adicione gestores primeiro.');
      onOpenChange(false);
      return;
    }
    
    // Validation
    if (!formData.nomeCliente.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }
    
    if (!formData.descricao.trim()) {
      toast.error('Descrição da encomenda é obrigatória');
      return;
    }
    
    if (!formData.contato.trim()) {
      toast.error('Contato é obrigatório');
      return;
    }

    if (!formData.gestor.trim()) {
      toast.error('Gestor é obrigatório');
      return;
    }
    
    if (!formData.valorTotal || parseFloat(formData.valorTotal) <= 0) {
      toast.error('Valor total deve ser maior que zero');
      return;
    }
    
    const valorTotal = parseFloat(formData.valorTotal);
    const valorAdiantado = parseFloat(formData.valorAdiantado) || 0;
    
    if (valorAdiantado > valorTotal) {
      toast.error('Valor adiantado não pode ser maior que o valor total');
      return;
    }

    try {
      // Convert to cents for backend storage
      const valorTotalCents = BigInt(Math.round(valorTotal * 100));
      const valorAdiantadoCents = BigInt(Math.round(valorAdiantado * 100));

      await editOrderMutation.mutateAsync({
        id: order.id,
        nomeCliente: formData.nomeCliente.trim(),
        descricao: formData.descricao.trim(),
        contato: formData.contato.trim(),
        gestor: formData.gestor.trim(),
        valorTotal: valorTotalCents,
        valorAdiantado: valorAdiantadoCents
      });

      toast.success('Encomenda atualizada com sucesso!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao atualizar encomenda');
      console.error('Error editing order:', error);
    }
  };

  const handleMoveToPrevious = async () => {
    if (!order) return;

    const previousStatus = getPreviousStatus(order.status);
    if (!previousStatus) {
      toast.error('Esta encomenda já está no status inicial');
      return;
    }

    try {
      await moveToPreviousMutation.mutateAsync(order.id);
      toast.success(`Encomenda movida para "${statusLabels[previousStatus]}" com sucesso!`);
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao mover encomenda para status anterior');
      console.error('Error moving order to previous status:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Check if gestores are available and loaded
  const gestoresLoaded = !gestores.isLoading;
  const hasGestores = gestores.data && gestores.data.length > 0;

  if (!order) {
    return null;
  }

  const previousStatus = getPreviousStatus(order.status);
  const canMoveToPrevious = previousStatus !== null;
  const isProcessing = editOrderMutation.isPending || moveToPreviousMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Encomenda</DialogTitle>
          <DialogDescription>
            Edite os dados da encomenda #{order.id.toString()}. Todos os campos são obrigatórios exceto o valor adiantado.
          </DialogDescription>
        </DialogHeader>
        
        {/* Show loading state while gestores are being fetched */}
        {!gestoresLoaded && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Carregando gestores disponíveis...
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeCliente">Nome do Cliente</Label>
            <Input
              id="nomeCliente"
              value={formData.nomeCliente}
              onChange={(e) => handleInputChange('nomeCliente', e.target.value)}
              placeholder="Digite o nome do cliente"
              disabled={isProcessing || !gestoresLoaded}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição da Encomenda</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva detalhadamente a encomenda"
              rows={3}
              disabled={isProcessing || !gestoresLoaded}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contato">Contato</Label>
            <Input
              id="contato"
              value={formData.contato}
              onChange={(e) => handleInputChange('contato', e.target.value)}
              placeholder="Telefone, email ou outro contato"
              disabled={isProcessing || !gestoresLoaded}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gestor">Gestor Responsável</Label>
            <Select
              value={formData.gestor}
              onValueChange={(value) => handleInputChange('gestor', value)}
              disabled={isProcessing || !gestoresLoaded || !hasGestores}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  !gestoresLoaded 
                    ? "Carregando gestores..." 
                    : !hasGestores
                    ? "Nenhum gestor disponível" 
                    : "Selecione o gestor responsável"
                } />
              </SelectTrigger>
              <SelectContent>
                {gestores.data?.map((gestor) => (
                  <SelectItem key={gestor.nome} value={gestor.nome}>
                    {gestor.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor Total (€)</Label>
              <Input
                id="valorTotal"
                type="number"
                step="0.01"
                min="0"
                value={formData.valorTotal}
                onChange={(e) => handleInputChange('valorTotal', e.target.value)}
                placeholder="0,00"
                disabled={isProcessing || !gestoresLoaded}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="valorAdiantado">Valor Adiantado (€)</Label>
              <Input
                id="valorAdiantado"
                type="number"
                step="0.01"
                min="0"
                value={formData.valorAdiantado}
                onChange={(e) => handleInputChange('valorAdiantado', e.target.value)}
                placeholder="0,00"
                disabled={isProcessing || !gestoresLoaded}
              />
            </div>
          </div>

          {/* Status change section - Always show for orders that can move back */}
          {canMoveToPrevious && (
            <>
              <Separator className="my-4" />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Voltar Status</Label>
                  <Alert className="flex-1 py-2 px-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Status atual: <strong>{statusLabels[order.status]}</strong>
                    </AlertDescription>
                  </Alert>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMoveToPrevious}
                  disabled={isProcessing || !gestoresLoaded}
                  className="w-full"
                >
                  {moveToPreviousMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowLeft className="mr-2 h-4 w-4" />
                  )}
                  Voltar para "{statusLabels[previousStatus]}"
                </Button>
              </div>
            </>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={isProcessing || !gestoresLoaded || !hasGestores}
            >
              {editOrderMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Atualizar Encomenda
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
