import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileSpreadsheet, Calendar, Euro, Edit, X, CheckCircle, FileDown, Users, Filter, Search, User } from 'lucide-react';
import { StatusOrcamento, type Orcamento, type Cliente } from '../backend';
import { useOrcamentoQueries, useClienteQueries, useOrderQueries } from '../hooks/useQueries';
import { toast } from 'sonner';
import NewOrcamentoView from './NewOrcamentoView';
import EditOrcamentoView from './EditOrcamentoView';
import AcceptOrcamentoDialog from './AcceptOrcamentoDialog';
import ClienteManagementDialog from './ClienteManagementDialog';
import OrcamentoPDFDialog from './OrcamentoPDFDialog';

const statusConfig = {
  [StatusOrcamento.pendente]: {
    label: 'Pendente',
    color: 'bg-yellow-500',
    variant: 'default' as const
  },
  [StatusOrcamento.aceito]: {
    label: 'Aceito',
    color: 'bg-green-500',
    variant: 'default' as const
  },
  [StatusOrcamento.rejeitado]: {
    label: 'Rejeitado',
    color: 'bg-red-500',
    variant: 'destructive' as const
  }
};

type ViewMode = 'list' | 'new' | 'edit';

export default function OrcamentosManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isAcceptOrcamentoOpen, setIsAcceptOrcamentoOpen] = useState(false);
  const [isClienteManagementOpen, setIsClienteManagementOpen] = useState(false);
  const [isPDFDialogOpen, setIsPDFDialogOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [gestorFilter, setGestorFilter] = useState<string>('all');
  const [nomeClienteFilter, setNomeClienteFilter] = useState<string>('');

  const { useOrcamentos, useDeleteOrcamento } = useOrcamentoQueries();
  const { useClientes } = useClienteQueries();
  const { useGestores } = useOrderQueries();
  const orcamentos = useOrcamentos();
  const clientes = useClientes();
  const gestores = useGestores();
  const deleteOrcamentoMutation = useDeleteOrcamento();

  const formatCurrency = (value: bigint) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(value) / 100);
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('pt-PT');
  };

  const getClienteById = (clienteId: bigint): Cliente | undefined => {
    return clientes.data?.find(c => c.id === clienteId);
  };

  const filteredOrcamentos = useMemo(() => {
    if (!orcamentos.data || !clientes.data) return [];
    
    let filtered = orcamentos.data;
    
    if (gestorFilter !== 'all') {
      filtered = filtered.filter(o => o.gestor === gestorFilter);
    }
    
    if (nomeClienteFilter.trim() !== '') {
      const searchTerm = nomeClienteFilter.toLowerCase().trim();
      filtered = filtered.filter(o => {
        const cliente = getClienteById(o.clienteId);
        return cliente && cliente.nome.toLowerCase().includes(searchTerm);
      });
    }
    
    return filtered;
  }, [orcamentos.data, clientes.data, gestorFilter, nomeClienteFilter]);

  const handleEdit = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setViewMode('edit');
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteOrcamentoMutation.mutateAsync(id);
      toast.success('Orçamento eliminado com sucesso!');
    } catch (error) {
      toast.error('Erro ao eliminar orçamento');
      console.error('Error deleting orcamento:', error);
    }
  };

  const handleAccept = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setIsAcceptOrcamentoOpen(true);
  };

  const handleGeneratePDF = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setIsPDFDialogOpen(true);
  };

  const handleClearFilters = () => {
    setGestorFilter('all');
    setNomeClienteFilter('');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedOrcamento(null);
  };

  const hasActiveFilters = gestorFilter !== 'all' || nomeClienteFilter.trim() !== '';

  if (viewMode === 'new') {
    return <NewOrcamentoView onBack={handleBackToList} />;
  }

  if (viewMode === 'edit' && selectedOrcamento) {
    return <EditOrcamentoView orcamento={selectedOrcamento} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Gestão de Orçamentos</h3>
          <p className="text-muted-foreground text-sm">
            Crie e gerencie orçamentos para seus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsClienteManagementOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Clientes
          </Button>
          <Button onClick={() => setViewMode('new')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Gestor:</span>
              <Select value={gestorFilter} onValueChange={setGestorFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os gestores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os gestores</SelectItem>
                  {gestores.data && gestores.data.length > 0 && gestores.data.map((gestor) => (
                    <SelectItem key={gestor.nome} value={gestor.nome}>
                      {gestor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Cliente:</span>
              <Input
                type="text"
                placeholder="Pesquisar por nome..."
                value={nomeClienteFilter}
                onChange={(e) => setNomeClienteFilter(e.target.value)}
                className="w-[250px]"
              />
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Orçamentos</CardTitle>
              <CardDescription>
                {filteredOrcamentos.length} {filteredOrcamentos.length === 1 ? 'orçamento' : 'orçamentos'} encontrado(s)
              </CardDescription>
            </div>
            {orcamentos.data && orcamentos.data.length > 0 && (
              <Badge variant="secondary">
                Total: {orcamentos.data.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {orcamentos.isLoading || clientes.isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando orçamentos...</p>
            </div>
          ) : !filteredOrcamentos || filteredOrcamentos.length === 0 ? (
            <div className="text-center py-12">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {hasActiveFilters ? 'Nenhum orçamento encontrado' : 'Nenhum orçamento'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? 'Tente ajustar os filtros ou limpar a pesquisa' 
                  : 'Comece criando seu primeiro orçamento'}
              </p>
              {!hasActiveFilters && (
                <Button onClick={() => setViewMode('new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Orçamento
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Cliente
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Data
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Gestor
                      </div>
                    </TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end">
                        <Euro className="h-4 w-4 mr-2" />
                        Valor Total
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrcamentos.map((orcamento) => {
                    const cliente = getClienteById(orcamento.clienteId);
                    const statusInfo = statusConfig[orcamento.status];
                    return (
                      <TableRow key={orcamento.id.toString()}>
                        <TableCell className="font-medium">
                          {cliente?.nome || 'Cliente não encontrado'}
                        </TableCell>
                        <TableCell>{formatDate(orcamento.dataOrcamento)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{orcamento.gestor}</Badge>
                        </TableCell>
                        <TableCell>{orcamento.itens.length}</TableCell>
                        <TableCell className="text-right font-semibold text-primary">
                          {formatCurrency(orcamento.valorTotal)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGeneratePDF(orcamento)}
                              className="h-8"
                            >
                              <FileDown className="h-3 w-3 mr-1" />
                              PDF
                            </Button>
                            {orcamento.status === StatusOrcamento.pendente && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleAccept(orcamento)}
                                className="h-8"
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Aceitar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(orcamento)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(orcamento.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AcceptOrcamentoDialog
        open={isAcceptOrcamentoOpen}
        onOpenChange={setIsAcceptOrcamentoOpen}
        orcamento={selectedOrcamento}
      />

      <ClienteManagementDialog
        open={isClienteManagementOpen}
        onOpenChange={setIsClienteManagementOpen}
      />

      <OrcamentoPDFDialog
        open={isPDFDialogOpen}
        onOpenChange={setIsPDFDialogOpen}
        orcamento={selectedOrcamento}
      />
    </div>
  );
}
