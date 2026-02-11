import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Building, User, Phone, Euro, Calendar } from 'lucide-react';
import { useMaterialQueries } from '../hooks/useQueries';
import { toast } from 'sonner';

interface SupplierPrice {
  preco: string;
  fornecedor: string;
  vendedor: string;
  contatoVendedor: string;
}

interface AddMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddMaterialDialog({ open, onOpenChange }: AddMaterialDialogProps) {
  const [nome, setNome] = useState('');
  const [supplierPrices, setSupplierPrices] = useState<SupplierPrice[]>([
    { preco: '', fornecedor: '', vendedor: '', contatoVendedor: '' }
  ]);

  const { useAddMaterial } = useMaterialQueries();
  const addMaterialMutation = useAddMaterial();

  const addSupplierPrice = () => {
    setSupplierPrices([...supplierPrices, { preco: '', fornecedor: '', vendedor: '', contatoVendedor: '' }]);
  };

  const removeSupplierPrice = (index: number) => {
    if (supplierPrices.length > 1) {
      setSupplierPrices(supplierPrices.filter((_, i) => i !== index));
    }
  };

  const updateSupplierPrice = (index: number, field: keyof SupplierPrice, value: string) => {
    const updated = [...supplierPrices];
    updated[index][field] = value;
    setSupplierPrices(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error('Por favor, insira o nome do material');
      return;
    }

    // Validate at least one complete supplier price
    const validPrices = supplierPrices.filter(sp => 
      sp.preco && sp.fornecedor && sp.vendedor && sp.contatoVendedor
    );

    if (validPrices.length === 0) {
      toast.error('Por favor, adicione pelo menos um preço de fornecedor completo');
      return;
    }

    // Validate all prices are valid numbers
    for (const sp of validPrices) {
      const precoValue = parseFloat(sp.preco);
      if (isNaN(precoValue) || precoValue < 0) {
        toast.error('Por favor, insira preços válidos');
        return;
      }
    }

    try {
      // Add material with first supplier price
      const firstPrice = validPrices[0];
      const materialId = await addMaterialMutation.mutateAsync({
        nome: nome.trim(),
        preco: BigInt(Math.round(parseFloat(firstPrice.preco) * 100)),
        fornecedor: firstPrice.fornecedor.trim(),
        vendedor: firstPrice.vendedor.trim(),
        contatoVendedor: firstPrice.contatoVendedor.trim(),
      });

      toast.success('Material adicionado com sucesso!');
      
      // Reset form
      setNome('');
      setSupplierPrices([{ preco: '', fornecedor: '', vendedor: '', contatoVendedor: '' }]);
      
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao adicionar material');
      console.error('Error adding material:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Material</DialogTitle>
          <DialogDescription>
            Adicione um novo material com preços de um ou mais fornecedores
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Material *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Cimento Portland"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Preços de Fornecedores *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSupplierPrice}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Fornecedor
                </Button>
              </div>

              {supplierPrices.map((sp, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Fornecedor {index + 1}</CardTitle>
                      {supplierPrices.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSupplierPrice(index)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor={`preco-${index}`} className="flex items-center gap-2">
                          <Euro className="h-3 w-3" />
                          Preço (€)
                        </Label>
                        <Input
                          id={`preco-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={sp.preco}
                          onChange={(e) => updateSupplierPrice(index, 'preco', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`fornecedor-${index}`} className="flex items-center gap-2">
                          <Building className="h-3 w-3" />
                          Empresa
                        </Label>
                        <Input
                          id={`fornecedor-${index}`}
                          value={sp.fornecedor}
                          onChange={(e) => updateSupplierPrice(index, 'fornecedor', e.target.value)}
                          placeholder="Nome da empresa"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor={`vendedor-${index}`} className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Vendedor
                        </Label>
                        <Input
                          id={`vendedor-${index}`}
                          value={sp.vendedor}
                          onChange={(e) => updateSupplierPrice(index, 'vendedor', e.target.value)}
                          placeholder="Nome do vendedor"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor={`contato-${index}`} className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          Contato
                        </Label>
                        <Input
                          id={`contato-${index}`}
                          value={sp.contatoVendedor}
                          onChange={(e) => updateSupplierPrice(index, 'contatoVendedor', e.target.value)}
                          placeholder="Telefone ou email"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={addMaterialMutation.isPending}>
              {addMaterialMutation.isPending ? 'Adicionando...' : 'Adicionar Material'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
