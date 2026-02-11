import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, X, Edit, Loader2, User, Search } from 'lucide-react';
import { useClienteQueries } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { Cliente } from '../backend';

interface ClienteManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ClienteManagementDialog({ open, onOpenChange }: ClienteManagementDialogProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [morada, setMorada] = useState('');
  const [nif, setNif] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { useClientes, useCreateCliente, useEditCliente, useDeleteCliente } = useClienteQueries();
  const clientes = useClientes();
  const createClienteMutation = useCreateCliente();
  const editClienteMutation = useEditCliente();
  const deleteClienteMutation = useDeleteCliente();

  // Filter clients based on search query
  const filteredClientes = useMemo(() => {
    if (!clientes.data) return [];
    if (!searchQuery.trim()) return clientes.data;

    const query = searchQuery.toLowerCase().trim();
    return clientes.data.filter((cliente) =>
      cliente.nome.toLowerCase().includes(query)
    );
  }, [clientes.data, searchQuery]);

  const resetForm = () => {
    setNome('');
    setContato('');
    setMorada('');
    setNif('');
    setIsAdding(false);
    setEditingCliente(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleStartEdit = (cliente: Cliente) => {
    setNome(cliente.nome);
    setContato(cliente.contato);
    setMorada(cliente.morada);
    setNif(cliente.nif);
    setEditingCliente(cliente);
    setIsAdding(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error('Nome do cliente é obrigatório');
      return;
    }

    try {
      if (editingCliente) {
        await editClienteMutation.mutateAsync({
          id: editingCliente.id,
          nome: nome.trim(),
          contato: contato.trim(),
          morada: morada.trim(),
          nif: nif.trim()
        });
        toast.success('Cliente atualizado com sucesso!');
      } else {
        await createClienteMutation.mutateAsync({
          nome: nome.trim(),
          contato: contato.trim(),
          morada: morada.trim(),
          nif: nif.trim()
        });
        toast.success('Cliente criado com sucesso!');
      }
      resetForm();
    } catch (error) {
      toast.error(editingCliente ? 'Erro ao atualizar cliente' : 'Erro ao criar cliente');
      console.error('Error saving cliente:', error);
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteClienteMutation.mutateAsync(id);
      toast.success('Cliente eliminado com sucesso!');
    } catch (error) {
      toast.error('Erro ao eliminar cliente');
      console.error('Error deleting cliente:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestão de Clientes</DialogTitle>
          <DialogDescription>
            Adicione e gerencie seus clientes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {(isAdding || editingCliente) && (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        placeholder="Nome do cliente"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contato">Contato</Label>
                      <Input
                        id="contato"
                        value={contato}
                        onChange={(e) => setContato(e.target.value)}
                        placeholder="Telefone ou email"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="morada">Morada</Label>
                      <Input
                        id="morada"
                        value={morada}
                        onChange={(e) => setMorada(e.target.value)}
                        placeholder="Endereço completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nif">NIF</Label>
                      <Input
                        id="nif"
                        value={nif}
                        onChange={(e) => setNif(e.target.value)}
                        placeholder="Número de identificação fiscal"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createClienteMutation.isPending || editClienteMutation.isPending}
                    >
                      {(createClienteMutation.isPending || editClienteMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {editingCliente ? 'Atualizar' : 'Adicionar'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {!isAdding && !editingCliente && (
            <Button onClick={handleStartAdd} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Novo Cliente
            </Button>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h4 className="font-semibold text-sm">Clientes Cadastrados</h4>
              {clientes.data && clientes.data.length > 0 && (
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Pesquisar por nome..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              )}
            </div>
            {clientes.isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !clientes.data || clientes.data.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum cliente cadastrado
                  </p>
                </CardContent>
              </Card>
            ) : filteredClientes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum cliente encontrado para "{searchQuery}"
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredClientes.map((cliente) => (
                  <Card key={cliente.id.toString()}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold truncate">{cliente.nome}</h5>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            {cliente.contato && <p className="truncate">{cliente.contato}</p>}
                            {cliente.morada && <p className="truncate">{cliente.morada}</p>}
                            {cliente.nif && <p className="truncate">NIF: {cliente.nif}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(cliente)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cliente.id)}
                            className="h-8 w-8 p-0 text-destructive"
                            disabled={deleteClienteMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
