import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Package, Wrench, Building, CreditCard, CheckCircle, ArrowRight, Calendar, Euro, Phone, User, AlertCircle, Users, Filter, X, Edit, FileText, FileSpreadsheet, Building2, ArrowLeft } from 'lucide-react';
import { Status, type Encomenda } from '../backend';
import { useOrderQueries } from '../hooks/useQueries';
import { toast } from 'sonner';
import NewOrderDialog from './NewOrderDialog';
import EditOrderDialog from './EditOrderDialog';
import GestorManagement from './GestorManagement';
import PDFReportDialog from './PDFReportDialog';
import OrcamentosManagement from './OrcamentosManagement';
import EmpresaSettingsDialog from './EmpresaSettingsDialog';

const statusConfig = {
  [Status.encomenda]: {
    label: 'Encomendas',
    icon: Package,
    color: 'bg-blue-500',
    nextLabel: 'Iniciar Produção'
  },
  [Status.producao]: {
    label: 'Fabrico',
    icon: Wrench,
    color: 'bg-orange-500',
    nextLabel: 'Enviar para Montagem'
  },
  [Status.montagem]: {
    label: 'Montagem',
    icon: Building,
    color: 'bg-purple-500',
    nextLabel: 'Enviar para Pagamento'
  },
  [Status.porPagar]: {
    label: 'Por Pagar',
    icon: CreditCard,
    color: 'bg-yellow-500',
    nextLabel: 'Marcar como Concluído'
  },
  [Status.concluido]: {
    label: 'Concluído',
    icon: CheckCircle,
    color: 'bg-green-500',
    nextLabel: null
  }
};

function OrdersTable({ 
  orders, 
  gestores, 
  onAdvance, 
  onDelete, 
  onEdit,
  emptyIcon: EmptyIcon, 
  emptyTitle, 
  emptyDescription,
  showAdvanceButton = true
}: {
  orders: Encomenda[] | undefined;
  gestores: { nome: string }[] | undefined;
  onAdvance: (id: bigint) => void;
  onDelete: (id: bigint) => void;
  onEdit: (order: Encomenda) => void;
  emptyIcon: React.ComponentType<{ className?: string }>;
  emptyTitle: string;
  emptyDescription: string;
  showAdvanceButton?: boolean;
}) {
  const [selectedGestor, setSelectedGestor] = useState<string>('all');

  const formatCurrency = (value: bigint) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(value) / 100);
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('pt-PT');
  };

  const filteredOrders = orders?.filter(order => 
    selectedGestor === 'all' || order.gestor === selectedGestor
  ) || [];

  const groupOrdersByGestor = (orders: Encomenda[]): Record<string, Encomenda[]> => {
    if (!orders) return {};
    
    return orders.reduce((groups, order) => {
      const gestor = order.gestor || 'Sem Gestor';
      if (!groups[gestor]) {
        groups[gestor] = [];
      }
      groups[gestor].push(order);
      return groups;
    }, {} as Record<string, Encomenda[]>);
  };

  const ordersByGestor = groupOrdersByGestor(filteredOrders);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedGestor} onValueChange={setSelectedGestor}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por gestor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os gestores</SelectItem>
            {gestores?.map((gestor) => (
              <SelectItem key={gestor.nome} value={gestor.nome}>
                {gestor.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedGestor !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedGestor('all')}
            className="text-muted-foreground"
          >
            Limpar filtro
          </Button>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <EmptyIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {selectedGestor === 'all' ? emptyTitle : `Nenhuma encomenda para ${selectedGestor}`}
            </h3>
            <p className="text-muted-foreground">
              {selectedGestor === 'all' ? emptyDescription : `${selectedGestor} não possui encomendas neste status`}
            </p>
          </CardContent>
        </Card>
      ) : selectedGestor === 'all' ? (
        <div className="space-y-6">
          {Object.entries(ordersByGestor).map(([gestor, gestorOrders]) => (
            <Card key={gestor}>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{gestor}</h3>
                  <Badge variant="secondary">
                    {gestorOrders.length} {gestorOrders.length === 1 ? 'encomenda' : 'encomendas'}
                  </Badge>
                </div>
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
                        <TableHead>Descrição</TableHead>
                        <TableHead>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            Contato
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            Data
                          </div>
                        </TableHead>
                        <TableHead className="text-right">
                          <div className="flex items-center justify-end">
                            <Euro className="h-4 w-4 mr-2" />
                            Valor Total
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Valor Pago</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gestorOrders.map((order) => {
                        const remainingValue = Number(order.valorTotal) - Number(order.valorAdiantado);
                        return (
                          <TableRow key={order.id.toString()}>
                            <TableCell className="font-medium">{order.nomeCliente}</TableCell>
                            <TableCell className="max-w-xs truncate">{order.descricao}</TableCell>
                            <TableCell>{order.contato}</TableCell>
                            <TableCell>{formatDate(order.dataCriacao)}</TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(order.valorTotal)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="space-y-1">
                                <div className="text-green-600 font-medium">
                                  {formatCurrency(order.valorAdiantado)}
                                </div>
                                <div className="text-xs text-orange-600">
                                  Restante: {formatCurrency(BigInt(remainingValue))}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {showAdvanceButton && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => onAdvance(order.id)}
                                    className="h-8"
                                  >
                                    <ArrowRight className="h-3 w-3 mr-1" />
                                    Avançar
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(order)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDelete(order.id)}
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
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
                    <TableHead>Descrição</TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        Contato
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Gestor
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Data
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end">
                        <Euro className="h-4 w-4 mr-2" />
                        Valor Total
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Valor Pago</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const remainingValue = Number(order.valorTotal) - Number(order.valorAdiantado);
                    return (
                      <TableRow key={order.id.toString()}>
                        <TableCell className="font-medium">{order.nomeCliente}</TableCell>
                        <TableCell className="max-w-xs truncate">{order.descricao}</TableCell>
                        <TableCell>{order.contato}</TableCell>
                        <TableCell>{order.gestor}</TableCell>
                        <TableCell>{formatDate(order.dataCriacao)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(order.valorTotal)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <div className="text-green-600 font-medium">
                              {formatCurrency(order.valorAdiantado)}
                            </div>
                            <div className="text-xs text-orange-600">
                              Restante: {formatCurrency(BigInt(remainingValue))}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {showAdvanceButton && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => onAdvance(order.id)}
                                className="h-8"
                              >
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Avançar
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(order)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(order.id)}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EncomendasTabContent({ 
  orders, 
  gestores, 
  onAdvance, 
  onDelete, 
  onEdit,
  hasGestores,
  onNewOrderClick,
  onGestorManagementClick
}: {
  orders: Encomenda[] | undefined;
  gestores: { nome: string }[] | undefined;
  onAdvance: (id: bigint) => void;
  onDelete: (id: bigint) => void;
  onEdit: (order: Encomenda) => void;
  hasGestores: boolean;
  onNewOrderClick: () => void;
  onGestorManagementClick: () => void;
}) {
  if (!orders || orders.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma encomenda</h3>
          <p className="text-muted-foreground mb-4">
            {!hasGestores 
              ? 'Adicione gestores primeiro para poder criar encomendas'
              : 'Comece criando sua primeira encomenda'
            }
          </p>
          {!hasGestores ? (
            <Button onClick={onGestorManagementClick}>
              <Users className="h-4 w-4 mr-2" />
              Adicionar Gestores
            </Button>
          ) : (
            <Button onClick={onNewOrderClick}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Encomenda
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <OrdersTable
      orders={orders}
      gestores={gestores}
      onAdvance={onAdvance}
      onDelete={onDelete}
      onEdit={onEdit}
      emptyIcon={Package}
      emptyTitle="Nenhuma encomenda"
      emptyDescription="As novas encomendas aparecerão aqui"
    />
  );
}

interface OrderManagementProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function OrderManagement({ activeTab = 'orcamentos', onTabChange }: OrderManagementProps) {
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Encomenda | null>(null);
  const [isGestorManagementOpen, setIsGestorManagementOpen] = useState(false);
  const [isPDFReportOpen, setIsPDFReportOpen] = useState(false);
  const [isEmpresaSettingsOpen, setIsEmpresaSettingsOpen] = useState(false);
  const [hasCheckedGestores, setHasCheckedGestores] = useState(false);
  
  const { 
    useOrdersByStatus, 
    useAdvanceOrder,
    useDeleteOrder,
    useEditOrder,
    useGestores
  } = useOrderQueries();

  const encomendas = useOrdersByStatus(Status.encomenda);
  const producao = useOrdersByStatus(Status.producao);
  const montagem = useOrdersByStatus(Status.montagem);
  const porPagar = useOrdersByStatus(Status.porPagar);
  const concluido = useOrdersByStatus(Status.concluido);
  const gestores = useGestores();

  const advanceOrderMutation = useAdvanceOrder();
  const deleteOrderMutation = useDeleteOrder();
  const editOrderMutation = useEditOrder();

  useEffect(() => {
    if (gestores.data && !gestores.isLoading && !hasCheckedGestores) {
      setHasCheckedGestores(true);
      if (gestores.data.length === 0) {
        toast.info('Adicione gestores primeiro para poder criar encomendas', {
          duration: 5000,
          action: {
            label: 'Gerir Gestores',
            onClick: () => setIsGestorManagementOpen(true)
          }
        });
      }
    }
  }, [gestores.data, gestores.isLoading, hasCheckedGestores]);

  const handleAdvanceOrder = async (id: bigint) => {
    try {
      await advanceOrderMutation.mutateAsync(id);
      toast.success('Encomenda avançada com sucesso!');
    } catch (error) {
      toast.error('Erro ao avançar encomenda');
      console.error('Error advancing order:', error);
    }
  };

  const handleDeleteOrder = async (id: bigint) => {
    try {
      await deleteOrderMutation.mutateAsync(id);
      toast.success('Encomenda eliminada com sucesso!');
    } catch (error) {
      toast.error('Erro ao eliminar encomenda');
      console.error('Error deleting order:', error);
    }
  };

  const handleEditOrder = (order: Encomenda) => {
    setSelectedOrder(order);
    setIsEditOrderOpen(true);
  };

  const handleNewOrderClick = () => {
    if (gestores.isLoading) {
      toast.info('Aguarde o carregamento dos gestores...');
      return;
    }

    if (!gestores.data || gestores.data.length === 0) {
      toast.error('Adicione gestores primeiro antes de criar encomendas');
      setIsGestorManagementOpen(true);
      return;
    }
    setIsNewOrderOpen(true);
  };

  const getTabCount = (orders: { data?: Encomenda[] }) => {
    return orders?.data?.length || 0;
  };

  const hasGestores = Boolean(gestores.data && gestores.data.length > 0);
  const gestoresLoaded = !gestores.isLoading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Encomendas</h2>
          <p className="text-muted-foreground">
            Acompanhe o progresso de todas as suas encomendas
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEmpresaSettingsOpen(true)}
            className="text-muted-foreground"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Empresa
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsPDFReportOpen(true)}
            className="text-muted-foreground"
          >
            <FileText className="h-4 w-4 mr-2" />
            Relatório PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsGestorManagementOpen(true)}
            className="text-muted-foreground"
          >
            <Users className="h-4 w-4 mr-2" />
            Gestores
            {gestoresLoaded && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {gestores.data?.length || 0}
              </Badge>
            )}
          </Button>
          <Button 
            onClick={handleNewOrderClick}
            disabled={!gestoresLoaded || !hasGestores}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Encomenda
          </Button>
        </div>
      </div>

      {gestoresLoaded && !hasGestores && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <span>
                Nenhum gestor cadastrado. É necessário adicionar gestores antes de criar encomendas.
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsGestorManagementOpen(true)}
                className="ml-4 border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <Users className="h-4 w-4 mr-2" />
                Adicionar Gestores
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="orcamentos" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Orçamento
          </TabsTrigger>
          <TabsTrigger value="encomenda" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Encomenda
            {getTabCount(encomendas) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTabCount(encomendas)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="producao" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Fabrico
            {getTabCount(producao) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTabCount(producao)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="montagem" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Montagem
            {getTabCount(montagem) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTabCount(montagem)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="porPagar" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Por Pagar
            {getTabCount(porPagar) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTabCount(porPagar)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="concluido" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Concluído
            {getTabCount(concluido) > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs">
                {getTabCount(concluido)}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orcamentos" className="space-y-4">
          <OrcamentosManagement />
        </TabsContent>

        <TabsContent value="encomenda" className="space-y-6">
          {encomendas.isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando encomendas...</p>
            </div>
          ) : (
            <EncomendasTabContent
              orders={encomendas.data}
              gestores={gestores.data}
              onAdvance={handleAdvanceOrder}
              onDelete={handleDeleteOrder}
              onEdit={handleEditOrder}
              hasGestores={hasGestores}
              onNewOrderClick={handleNewOrderClick}
              onGestorManagementClick={() => setIsGestorManagementOpen(true)}
            />
          )}
        </TabsContent>

        <TabsContent value="producao" className="space-y-4">
          {producao.isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando encomendas...</p>
            </div>
          ) : (
            <OrdersTable
              orders={producao.data}
              gestores={gestores.data}
              onAdvance={handleAdvanceOrder}
              onDelete={handleDeleteOrder}
              onEdit={handleEditOrder}
              emptyIcon={Wrench}
              emptyTitle="Nenhuma encomenda em produção"
              emptyDescription="As encomendas em produção aparecerão aqui"
            />
          )}
        </TabsContent>

        <TabsContent value="montagem" className="space-y-4">
          {montagem.isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando encomendas...</p>
            </div>
          ) : (
            <OrdersTable
              orders={montagem.data}
              gestores={gestores.data}
              onAdvance={handleAdvanceOrder}
              onDelete={handleDeleteOrder}
              onEdit={handleEditOrder}
              emptyIcon={Building}
              emptyTitle="Nenhuma encomenda em montagem"
              emptyDescription="As encomendas em montagem em obra aparecerão aqui"
            />
          )}
        </TabsContent>

        <TabsContent value="porPagar" className="space-y-4">
          {porPagar.isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando encomendas...</p>
            </div>
          ) : (
            <OrdersTable
              orders={porPagar.data}
              gestores={gestores.data}
              onAdvance={handleAdvanceOrder}
              onDelete={handleDeleteOrder}
              onEdit={handleEditOrder}
              emptyIcon={CreditCard}
              emptyTitle="Nenhuma encomenda por pagar"
              emptyDescription="As encomendas aguardando pagamento aparecerão aqui"
            />
          )}
        </TabsContent>

        <TabsContent value="concluido" className="space-y-4">
          {concluido.isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando encomendas...</p>
            </div>
          ) : (
            <OrdersTable
              orders={concluido.data}
              gestores={gestores.data}
              onAdvance={handleAdvanceOrder}
              onDelete={handleDeleteOrder}
              onEdit={handleEditOrder}
              emptyIcon={CheckCircle}
              emptyTitle="Nenhuma encomenda concluída"
              emptyDescription="As encomendas totalmente concluídas aparecerão aqui"
              showAdvanceButton={false}
            />
          )}
        </TabsContent>
      </Tabs>

      <NewOrderDialog 
        open={isNewOrderOpen} 
        onOpenChange={setIsNewOrderOpen}
      />
      
      <EditOrderDialog
        open={isEditOrderOpen}
        onOpenChange={setIsEditOrderOpen}
        order={selectedOrder}
      />
      
      <GestorManagement
        open={isGestorManagementOpen}
        onOpenChange={setIsGestorManagementOpen}
      />

      <PDFReportDialog
        open={isPDFReportOpen}
        onOpenChange={setIsPDFReportOpen}
      />

      <EmpresaSettingsDialog
        open={isEmpresaSettingsOpen}
        onOpenChange={setIsEmpresaSettingsOpen}
      />
    </div>
  );
}
