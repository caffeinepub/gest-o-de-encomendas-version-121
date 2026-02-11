import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, X, Package, Filter, Search, ArrowUpDown, Euro, Building, Users, ArrowLeft } from 'lucide-react';
import { type Material } from '../backend';
import { useMaterialQueries } from '../hooks/useQueries';
import { toast } from 'sonner';
import AddMaterialDialog from './AddMaterialDialog';
import EditMaterialDialog from './EditMaterialDialog';

type SortField = 'nome' | 'preco' | 'fornecedor';
type SortOrder = 'asc' | 'desc';

interface MaterialPricesManagementProps {
  onBack?: () => void;
}

export default function MaterialPricesManagement({ onBack }: MaterialPricesManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'material' | 'fornecedor'>('all');
  const [sortField, setSortField] = useState<SortField>('nome');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const { useMaterialsWithLowestPrice, useDeleteMaterial } = useMaterialQueries();
  const materials = useMaterialsWithLowestPrice();
  const deleteMaterialMutation = useDeleteMaterial();

  const formatCurrency = (value: bigint) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(value) / 100);
  };

  const handleDeleteMaterial = async (id: bigint) => {
    try {
      await deleteMaterialMutation.mutateAsync(id);
      toast.success('Material eliminado com sucesso!');
    } catch (error) {
      toast.error('Erro ao eliminar material');
      console.error('Error deleting material:', error);
    }
  };

  const handleEditMaterial = (material: { id: bigint; nome: string }) => {
    setSelectedMaterial({ id: material.id, nome: material.nome, precos: [] });
    setIsEditDialogOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter materials
  const filteredMaterials = materials.data?.filter((material) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    if (filterType === 'material') {
      return material.nome.toLowerCase().includes(searchLower);
    } else if (filterType === 'fornecedor') {
      return material.menorPreco?.fornecedor.toLowerCase().includes(searchLower) || false;
    } else {
      return (
        material.nome.toLowerCase().includes(searchLower) ||
        material.menorPreco?.fornecedor.toLowerCase().includes(searchLower) ||
        false
      );
    }
  }) || [];

  // Sort materials
  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'nome':
        comparison = a.nome.localeCompare(b.nome);
        break;
      case 'preco':
        const precoA = a.menorPreco?.preco || BigInt(0);
        const precoB = b.menorPreco?.preco || BigInt(0);
        comparison = Number(precoA - precoB);
        break;
      case 'fornecedor':
        const fornecedorA = a.menorPreco?.fornecedor || '';
        const fornecedorB = b.menorPreco?.fornecedor || '';
        comparison = fornecedorA.localeCompare(fornecedorB);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 text-muted-foreground" />;
    }
    return (
      <ArrowUpDown 
        className={`h-4 w-4 ml-1 ${sortOrder === 'asc' ? 'rotate-180' : ''} transition-transform`} 
      />
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {onBack && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Preços de Materiais</h2>
          <p className="text-muted-foreground">
            Gerir materiais e preços de múltiplos fornecedores
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Material
        </Button>
      </div>

      {/* Filter and Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros e Pesquisa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os campos</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="fornecedor">Fornecedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Materiais</CardTitle>
              <CardDescription>
                {sortedMaterials.length} {sortedMaterials.length === 1 ? 'material' : 'materiais'} encontrado(s)
              </CardDescription>
            </div>
            {materials.data && materials.data.length > 0 && (
              <Badge variant="secondary">
                Total: {materials.data.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {materials.isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Carregando materiais...</p>
            </div>
          ) : sortedMaterials.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'Nenhum material encontrado' : 'Nenhum material cadastrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Tente ajustar os filtros de pesquisa'
                  : 'Comece adicionando o primeiro material'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Material
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('nome')}
                        className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Material
                        <SortIcon field="nome" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('preco')}
                        className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        <Euro className="h-4 w-4 mr-2" />
                        Menor Preço
                        <SortIcon field="preco" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('fornecedor')}
                        className="flex items-center hover:bg-transparent p-0 h-auto font-semibold"
                      >
                        <Building className="h-4 w-4 mr-2" />
                        Fornecedor
                        <SortIcon field="fornecedor" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Fornecedores
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMaterials.map((material) => (
                    <TableRow key={material.id.toString()}>
                      <TableCell className="font-medium">{material.nome}</TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {material.menorPreco ? formatCurrency(material.menorPreco.preco) : '-'}
                      </TableCell>
                      <TableCell>{material.menorPreco?.fornecedor || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          Ver detalhes
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMaterial(material)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddMaterialDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      <EditMaterialDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        materialId={selectedMaterial?.id || null}
      />
    </div>
  );
}
