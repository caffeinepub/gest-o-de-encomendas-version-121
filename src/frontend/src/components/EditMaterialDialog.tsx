import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Building, User, Phone, Euro, Calendar, Edit2, Check } from 'lucide-react';
import { useMaterialQueries } from '../hooks/useQueries';
import { toast } from 'sonner';
import { type PrecoFornecedor } from '../backend';

interface EditMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: bigint | null;
}

export default function EditMaterialDialog({ open, onOpenChange, materialId }: EditMaterialDialogProps) {
  const [nome, setNome] = useState('');
  const [precos, setPrecos] = useState<PrecoFornecedor[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    preco: '',
    fornecedor: '',
    vendedor: '',
    contatoVendedor: ''
  });
  const [addingNew, setAddingNew] = useState(false);
  const [newPriceForm, setNewPriceForm] = useState({
    preco: '',
    fornecedor: '',
    vendedor: '',
    contatoVendedor: ''
  });

  const { useMaterial, useEditMaterialName, useAddSupplierPrice, useEditSupplierPrice, useDeleteSupplierPrice } = useMaterialQueries();
  const material = useMaterial(materialId || BigInt(0));
  const editMaterialNameMutation = useEditMaterialName();
  const addSupplierPriceMutation = useAddSupplierPrice();
  const editSupplierPriceMutation = useEditSupplierPrice();
  const deleteSupplierPriceMutation = useDeleteSupplierPrice();

  useEffect(() => {
    if (material.data) {
      setNome(material.data.nome);
      setPrecos(material.data.precos);
    }
  }, [material.data]);

  const formatCurrency = (value: bigint) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(value) / 100);
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('pt-PT');
  };

  const handleUpdateName = async () => {
    if (!materialId || !nome.trim()) {
      toast.error('Por favor, insira o nome do material');
      return;
    }

    try {
      await editMaterialNameMutation.mutateAsync({
        id: materialId,
        nome: nome.trim()
      });
      toast.success('Nome do material atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar nome do material');
      console.error('Error updating material name:', error);
    }
  };

  const handleEditPrice = (index: number) => {
    const preco = precos[index];
    setEditingIndex(index);
    setEditForm({
      preco: (Number(preco.preco) / 100).toFixed(2),
      fornecedor: preco.fornecedor,
      vendedor: preco.vendedor,
      contatoVendedor: preco.contatoVendedor
    });
  };

  const handleSaveEdit = async () => {
    if (!materialId || editingIndex === null) return;

    const precoValue = parseFloat(editForm.preco);
    if (isNaN(precoValue) || precoValue < 0) {
      toast.error('Por favor, insira um preço válido');
      return;
    }

    if (!editForm.fornecedor || !editForm.vendedor || !editForm.contatoVendedor) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      await editSupplierPriceMutation.mutateAsync({
        materialId,
        index: BigInt(editingIndex),
        preco: BigInt(Math.round(precoValue * 100)),
        fornecedor: editForm.fornecedor.trim(),
        vendedor: editForm.vendedor.trim(),
        contatoVendedor: editForm.contatoVendedor.trim()
      });
      toast.success('Preço atualizado com sucesso!');
      setEditingIndex(null);
    } catch (error) {
      toast.error('Erro ao atualizar preço');
      console.error('Error updating price:', error);
    }
  };

  const handleDeletePrice = async (index: number) => {
    if (!materialId) return;

    if (precos.length === 1) {
      toast.error('Não é possível eliminar o último preço. Elimine o material se necessário.');
      return;
    }

    try {
      await deleteSupplierPriceMutation.mutateAsync({
        materialId,
        index: BigInt(index)
      });
      toast.success('Preço eliminado com sucesso!');
    } catch (error) {
      toast.error('Erro ao eliminar preço');
      console.error('Error deleting price:', error);
    }
  };

  const handleAddNewPrice = async () => {
    if (!materialId) return;

    const precoValue = parseFloat(newPriceForm.preco);
    if (isNaN(precoValue) || precoValue < 0) {
      toast.error('Por favor, insira um preço válido');
      return;
    }

    if (!newPriceForm.fornecedor || !newPriceForm.vendedor || !newPriceForm.contatoVendedor) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    try {
      await addSupplierPriceMutation.mutateAsync({
        materialId,
        preco: BigInt(Math.round(precoValue * 100)),
        fornecedor: newPriceForm.fornecedor.trim(),
        vendedor: newPriceForm.vendedor.trim(),
        contatoVendedor: newPriceForm.contatoVendedor.trim()
      });
      toast.success('Preço de fornecedor adicionado!');
      setAddingNew(false);
      setNewPriceForm({ preco: '', fornecedor: '', vendedor: '', contatoVendedor: '' });
    } catch (error) {
      toast.error('Erro ao adicionar preço');
      console.error('Error adding price:', error);
    }
  };

  const getLowestPriceIndex = () => {
    if (precos.length === 0) return -1;
    let lowestIndex = 0;
    let lowestPrice = precos[0].preco;
    for (let i = 1; i < precos.length; i++) {
      if (precos[i].preco < lowestPrice) {
        lowestPrice = precos[i].preco;
        lowestIndex = i;
      }
    }
    return lowestIndex;
  };

  const lowestPriceIndex = getLowestPriceIndex();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Material</DialogTitle>
          <DialogDescription>
            Atualize o nome do material e gerir preços de fornecedores
          </DialogDescription>
        </DialogHeader>

        {material.isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando material...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Material Name */}
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Material</Label>
              <div className="flex gap-2">
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Cimento Portland"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleUpdateName}
                  disabled={editMaterialNameMutation.isPending}
                >
                  {editMaterialNameMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>

            {/* Supplier Prices */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Preços de Fornecedores ({precos.length})</Label>
                {!addingNew && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAddingNew(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Fornecedor
                  </Button>
                )}
              </div>

              {/* Add New Price Form */}
              {addingNew && (
                <Card className="border-primary">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Novo Fornecedor</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingNew(false);
                          setNewPriceForm({ preco: '', fornecedor: '', vendedor: '', contatoVendedor: '' });
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <Euro className="h-3 w-3" />
                          Preço (€)
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newPriceForm.preco}
                          onChange={(e) => setNewPriceForm({ ...newPriceForm, preco: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <Building className="h-3 w-3" />
                          Empresa
                        </Label>
                        <Input
                          value={newPriceForm.fornecedor}
                          onChange={(e) => setNewPriceForm({ ...newPriceForm, fornecedor: e.target.value })}
                          placeholder="Nome da empresa"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Vendedor
                        </Label>
                        <Input
                          value={newPriceForm.vendedor}
                          onChange={(e) => setNewPriceForm({ ...newPriceForm, vendedor: e.target.value })}
                          placeholder="Nome do vendedor"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          Contato
                        </Label>
                        <Input
                          value={newPriceForm.contatoVendedor}
                          onChange={(e) => setNewPriceForm({ ...newPriceForm, contatoVendedor: e.target.value })}
                          placeholder="Telefone ou email"
                        />
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddNewPrice}
                      disabled={addSupplierPriceMutation.isPending}
                      className="w-full"
                    >
                      {addSupplierPriceMutation.isPending ? 'Adicionando...' : 'Adicionar Preço'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Existing Prices */}
              {precos.map((preco, index) => (
                <Card key={index} className={index === lowestPriceIndex ? 'border-green-500' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm">Fornecedor {index + 1}</CardTitle>
                        {index === lowestPriceIndex && (
                          <Badge variant="default" className="bg-green-600">
                            Menor Preço
                          </Badge>
                        )}
                      </div>
                      {editingIndex !== index && (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPrice(index)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePrice(index)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingIndex === index ? (
                      <div className="grid gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-2">
                            <Label className="flex items-center gap-2">
                              <Euro className="h-3 w-3" />
                              Preço (€)
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editForm.preco}
                              onChange={(e) => setEditForm({ ...editForm, preco: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="flex items-center gap-2">
                              <Building className="h-3 w-3" />
                              Empresa
                            </Label>
                            <Input
                              value={editForm.fornecedor}
                              onChange={(e) => setEditForm({ ...editForm, fornecedor: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-2">
                            <Label className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              Vendedor
                            </Label>
                            <Input
                              value={editForm.vendedor}
                              onChange={(e) => setEditForm({ ...editForm, vendedor: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              Contato
                            </Label>
                            <Input
                              value={editForm.contatoVendedor}
                              onChange={(e) => setEditForm({ ...editForm, contatoVendedor: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingIndex(null)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            onClick={handleSaveEdit}
                            disabled={editSupplierPriceMutation.isPending}
                            className="flex-1"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {editSupplierPriceMutation.isPending ? 'Salvando...' : 'Salvar'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Euro className="h-3 w-3" />
                            <span>Preço</span>
                          </div>
                          <div className="font-semibold text-green-600">{formatCurrency(preco.preco)}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="h-3 w-3" />
                            <span>Data</span>
                          </div>
                          <div>{formatDate(preco.data)}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Building className="h-3 w-3" />
                            <span>Empresa</span>
                          </div>
                          <div>{preco.fornecedor}</div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <User className="h-3 w-3" />
                            <span>Vendedor</span>
                          </div>
                          <div>{preco.vendedor}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Phone className="h-3 w-3" />
                            <span>Contato</span>
                          </div>
                          <div>{preco.contatoVendedor}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
