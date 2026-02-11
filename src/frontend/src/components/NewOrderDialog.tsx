import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Users } from 'lucide-react';
import { useOrderQueries } from '../hooks/useQueries';
import { toast } from 'sonner';

interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function NewOrderDialog({ open, onOpenChange }: NewOrderDialogProps) {
  const [formData, setFormData] = useState({
    nomeCliente: '',
    descricao: '',
    contato: '',
    gestor: '',
    valorTotal: '',
    valorAdiantado: ''
  });

  const { useCreateOrder, useGestores } = useOrderQueries();
  const createOrderMutation = useCreateOrder();
  const gestores = useGestores();

  // Reset form when dialog opens/closes
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

  // Prevent dialog from opening if no gestores exist
  useEffect(() => {
    if (open && gestores.data && gestores.data.length === 0) {
      toast.error('Adicione gestores primeiro antes de criar encomendas');
      onOpenChange(false);
    }
  }, [open, gestores.data, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      await createOrderMutation.mutateAsync({
        nomeCliente: formData.nomeCliente.trim(),
        descricao: formData.descricao.trim(),
        contato: formData.contato.trim(),
        gestor: formData.gestor.trim(),
        valorTotal: valorTotalCents,
        valorAdiantado: valorAdiantadoCents
      });

      toast.success('Encomenda criada com sucesso!');
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao criar encomenda');
      console.error('Error creating order:', error);
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
  const showGestorWarning = gestoresLoaded && !hasGestores;

  // Don't render dialog content if no gestores exist
  if (showGestorWarning) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Encomenda</DialogTitle>
          <DialogDescription>
            Preencha os dados da nova encomenda. Todos os campos são obrigatórios exceto o valor adiantado.
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
              disabled={createOrderMutation.isPending || !gestoresLoaded}
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
              disabled={createOrderMutation.isPending || !gestoresLoaded}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contato">Contato</Label>
            <Input
              id="contato"
              value={formData.contato}
              onChange={(e) => handleInputChange('contato', e.target.value)}
              placeholder="Telefone, email ou outro contato"
              disabled={createOrderMutation.isPending || !gestoresLoaded}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gestor">Gestor Responsável</Label>
            <Select
              value={formData.gestor}
              onValueChange={(value) => handleInputChange('gestor', value)}
              disabled={createOrderMutation.isPending || !gestoresLoaded || !hasGestores}
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
                disabled={createOrderMutation.isPending || !gestoresLoaded}
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
                disabled={createOrderMutation.isPending || !gestoresLoaded}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createOrderMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={createOrderMutation.isPending || !gestoresLoaded || !hasGestores}
            >
              {createOrderMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Criar Encomenda
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
