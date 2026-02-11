import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, X, Loader2, UserPlus, FileImage, Search, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useOrcamentoQueries, useClienteQueries, useEmpresaQueries, useOrderQueries } from '../hooks/useQueries';
import { useFileUpload } from '../blob-storage/FileStorage';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ItemOrcamento } from '../backend';

interface NewOrcamentoViewProps {
  onBack: () => void;
}

export default function NewOrcamentoView({ onBack }: NewOrcamentoViewProps) {
  const [clienteId, setClienteId] = useState<string>('');
  const [gestor, setGestor] = useState<string>('');
  const [clienteSearchTerm, setClienteSearchTerm] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [condicoesFornecimento, setCondicoesFornecimento] = useState('');
  const [validadeOrcamento, setValidadeOrcamento] = useState('');
  const [imagemAdicionalPath, setImagemAdicionalPath] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [iva, setIva] = useState<string>('23');
  const [desconto, setDesconto] = useState<string>('0');
  const [itens, setItens] = useState<Array<{ nomeMaterial: string; descricao: string; quantidade: string; precoUnitario: string }>>([
    { nomeMaterial: '', descricao: '', quantidade: '', precoUnitario: '' }
  ]);

  const { useCreateOrcamento } = useOrcamentoQueries();
  const { useClientes } = useClienteQueries();
  const { useEmpresa } = useEmpresaQueries();
  const { useGestores } = useOrderQueries();
  const createOrcamentoMutation = useCreateOrcamento();
  const clientes = useClientes();
  const empresa = useEmpresa();
  const gestores = useGestores();
  const { uploadFile } = useFileUpload();

  const filteredClientes = useMemo(() => {
    if (!clientes.data) return [];
    if (!clienteSearchTerm.trim()) return clientes.data;
    
    const searchLower = clienteSearchTerm.toLowerCase();
    return clientes.data.filter(cliente => 
      cliente.nome.toLowerCase().includes(searchLower) ||
      (cliente.contato && cliente.contato.toLowerCase().includes(searchLower)) ||
      (cliente.nif && cliente.nif.toLowerCase().includes(searchLower))
    );
  }, [clientes.data, clienteSearchTerm]);

  const handleAddItem = () => {
    setItens([...itens, { nomeMaterial: '', descricao: '', quantidade: '', precoUnitario: '' }]);
  };

  const handleInsertItemAbove = (index: number) => {
    const newItens = [...itens];
    newItens.splice(index, 0, { nomeMaterial: '', descricao: '', quantidade: '', precoUnitario: '' });
    setItens(newItens);
  };

  const handleInsertItemBelow = (index: number) => {
    const newItens = [...itens];
    newItens.splice(index + 1, 0, { nomeMaterial: '', descricao: '', quantidade: '', precoUnitario: '' });
    setItens(newItens);
  };

  const handleMoveItemUp = (index: number) => {
    if (index === 0) return;
    const newItens = [...itens];
    [newItens[index - 1], newItens[index]] = [newItens[index], newItens[index - 1]];
    setItens(newItens);
  };

  const handleMoveItemDown = (index: number) => {
    if (index === itens.length - 1) return;
    const newItens = [...itens];
    [newItens[index], newItens[index + 1]] = [newItens[index + 1], newItens[index]];
    setItens(newItens);
  };

  const handleRemoveItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    setUploadingImage(true);
    try {
      const path = `orcamentos/condicoes/${Date.now()}_${file.name}`;
      
      await uploadFile(path, file);
      setImagemAdicionalPath(path);
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao carregar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const calculateSubtotal = (quantidade: string, precoUnitario: string): number => {
    const qtd = parseFloat(quantidade) || 0;
    const preco = parseFloat(precoUnitario) || 0;
    return qtd * preco;
  };

  const calculateSubtotalSemIva = (): number => {
    return itens.reduce((total, item) => {
      return total + calculateSubtotal(item.quantidade, item.precoUnitario);
    }, 0);
  };

  const calculateDescontoAmount = (): number => {
    const subtotal = calculateSubtotalSemIva();
    const descontoRate = parseFloat(desconto) || 0;
    return subtotal * (descontoRate / 100);
  };

  const calculateSubtotalComDesconto = (): number => {
    return calculateSubtotalSemIva() - calculateDescontoAmount();
  };

  const calculateIvaAmount = (): number => {
    const subtotalComDesconto = calculateSubtotalComDesconto();
    const ivaRate = parseFloat(iva) || 0;
    return subtotalComDesconto * (ivaRate / 100);
  };

  const calculateTotal = (): number => {
    return calculateSubtotalComDesconto() + calculateIvaAmount();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empresa.data) {
      toast.error('Configure as informações da empresa primeiro nas configurações');
      return;
    }

    if (!clienteId) {
      toast.error('Selecione um cliente');
      return;
    }

    if (!gestor) {
      toast.error('Selecione um gestor responsável');
      return;
    }

    const hasValidItem = itens.some(item => 
      item.quantidade.trim() !== '' && item.precoUnitario.trim() !== ''
    );

    if (!hasValidItem) {
      toast.error('Adicione pelo menos um item válido com quantidade e preço');
      return;
    }

    const ivaValue = parseFloat(iva);
    if (isNaN(ivaValue) || ivaValue < 0) {
      toast.error('Taxa de IVA inválida');
      return;
    }

    const descontoValue = parseFloat(desconto);
    if (isNaN(descontoValue) || descontoValue < 0 || descontoValue > 100) {
      toast.error('Desconto inválido (deve estar entre 0 e 100%)');
      return;
    }

    try {
      const validItens: ItemOrcamento[] = itens
        .filter(item => item.quantidade.trim() !== '' && item.precoUnitario.trim() !== '')
        .map(item => {
          const quantidadeValue = parseFloat(item.quantidade) || 0;
          const precoUnitarioValue = parseFloat(item.precoUnitario) || 0;
          
          const quantidade = BigInt(Math.round(quantidadeValue));
          const precoUnitario = BigInt(Math.round(precoUnitarioValue * 100));
          const subtotal = quantidade * precoUnitario;
          
          return {
            nomeMaterial: item.nomeMaterial.trim() || '',
            descricao: item.descricao.trim(),
            quantidade,
            precoUnitario,
            subtotal
          };
        });

      await createOrcamentoMutation.mutateAsync({
        clienteId: BigInt(clienteId),
        gestor: gestor,
        itens: validItens,
        observacoes: observacoes.trim(),
        condicoesFornecimento: condicoesFornecimento.trim(),
        validadeOrcamento: validadeOrcamento.trim(),
        imagemAdicionalPath: imagemAdicionalPath,
        iva: BigInt(Math.round(ivaValue)),
        desconto: BigInt(Math.round(descontoValue))
      });

      toast.success('Orçamento criado com sucesso!');
      onBack();
    } catch (error) {
      console.error('Error creating orcamento:', error);
      toast.error('Erro ao criar orçamento');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h2 className="text-2xl font-bold">Novo Orçamento</h2>
        <div className="w-24"></div>
      </div>

      {!empresa.data && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Configure as informações da empresa primeiro através do botão "Empresa" antes de criar orçamentos.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Cliente</h4>
            <div className="space-y-2">
              <Label htmlFor="clienteSearch">Pesquisar Cliente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="clienteSearch"
                  value={clienteSearchTerm}
                  onChange={(e) => setClienteSearchTerm(e.target.value)}
                  placeholder="Digite o nome, contato ou NIF do cliente..."
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cliente">Selecione o Cliente *</Label>
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger id="cliente">
                  <SelectValue placeholder="Escolha um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClientes.length > 0 ? (
                    filteredClientes.map((cliente) => (
                      <SelectItem key={cliente.id.toString()} value={cliente.id.toString()}>
                        {cliente.nome} {cliente.contato && `- ${cliente.contato}`}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      {clienteSearchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                    </div>
                  )}
                </SelectContent>
              </Select>
              {(!clientes.data || clientes.data.length === 0) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <UserPlus className="h-3 w-3" />
                  Adicione clientes primeiro através do botão "Clientes"
                </p>
              )}
              {clienteSearchTerm && filteredClientes.length === 0 && clientes.data && clientes.data.length > 0 && (
                <p className="text-sm text-amber-600">
                  Nenhum cliente encontrado com "{clienteSearchTerm}". Limpe a pesquisa para ver todos.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gestor">Gestor Responsável *</Label>
            <Select value={gestor} onValueChange={setGestor}>
              <SelectTrigger id="gestor">
                <SelectValue placeholder="Escolha um gestor" />
              </SelectTrigger>
              <SelectContent>
                {gestores.data && gestores.data.length > 0 ? (
                  gestores.data.map((g) => (
                    <SelectItem key={g.nome} value={g.nome}>
                      {g.nome}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    Nenhum gestor cadastrado
                  </div>
                )}
              </SelectContent>
            </Select>
            {(!gestores.data || gestores.data.length === 0) && (
              <p className="text-sm text-muted-foreground">
                Adicione gestores primeiro através do botão "Gestores"
              </p>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <h4 className="font-semibold text-base">Artigos do Orçamento</h4>
          
          <div className="space-y-4">
            {itens.map((item, index) => (
              <div key={index} className="p-5 border rounded-lg space-y-4 bg-muted/20">
                <div className="flex gap-3 items-start">
                  <div className="flex-1 grid grid-cols-4 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-sm font-medium">Artigo/Material (opcional)</Label>
                      <Input
                        value={item.nomeMaterial}
                        onChange={(e) => handleItemChange(index, 'nomeMaterial', e.target.value)}
                        placeholder="Nome do artigo"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Quantidade *</Label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                        placeholder="Qtd"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Preço Unit. (€) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.precoUnitario}
                        onChange={(e) => handleItemChange(index, 'precoUnitario', e.target.value)}
                        placeholder="0.00"
                        className="h-10"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 pt-7">
                    <span className="text-base font-semibold whitespace-nowrap min-w-[100px] text-right">
                      {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(
                        calculateSubtotal(item.quantidade, item.precoUnitario)
                      )}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItemUp(index)}
                        disabled={index === 0}
                        className="h-8 w-8 p-0"
                        title="Mover Para Cima"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveItemDown(index)}
                        disabled={index === itens.length - 1}
                        className="h-8 w-8 p-0"
                        title="Mover Para Baixo"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleInsertItemAbove(index)}>
                            Adicionar Artigo Acima
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleInsertItemBelow(index)}>
                            Adicionar Artigo Abaixo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {itens.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Descrição Detalhada</Label>
                  <Textarea
                    value={item.descricao}
                    onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                    placeholder="Descrição completa do artigo/material..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-start">
            <Button type="button" variant="outline" size="default" onClick={handleAddItem}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Artigo
            </Button>
          </div>

          <div className="flex justify-end pt-4 border-t-2">
            <div className="text-right space-y-2 min-w-[500px]">
              <div className="flex justify-between gap-12 text-base">
                <span className="text-muted-foreground font-medium">Subtotal (sem desconto/IVA):</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateSubtotalSemIva())}
                </span>
              </div>
              <div className="flex justify-between gap-12 text-base items-center">
                <span className="text-muted-foreground font-medium">Desconto:</span>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                    className="h-9 w-24 text-right"
                  />
                  <span className="text-base font-medium">%</span>
                  <span className="font-semibold min-w-[100px] text-right">
                    -{new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateDescontoAmount())}
                  </span>
                </div>
              </div>
              <div className="flex justify-between gap-12 text-base pt-2 border-t">
                <span className="text-muted-foreground font-medium">Subtotal com desconto:</span>
                <span className="font-semibold">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateSubtotalComDesconto())}
                </span>
              </div>
              <div className="flex justify-between gap-12 text-base items-center">
                <span className="text-muted-foreground font-medium">IVA:</span>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={iva}
                    onChange={(e) => setIva(e.target.value)}
                    className="h-9 w-24 text-right"
                  />
                  <span className="text-base font-medium">%</span>
                  <span className="font-semibold min-w-[100px] text-right">
                    {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateIvaAmount())}
                  </span>
                </div>
              </div>
              <div className="flex justify-between gap-12 pt-3 border-t-2">
                <span className="text-base text-muted-foreground font-medium">Total do Orçamento:</span>
                <span className="text-3xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(calculateTotal())}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="font-semibold text-base">Condições</h4>
            <div className="space-y-2">
              <Label htmlFor="condicoesFornecimento">Condições de fornecimento</Label>
              <Textarea
                id="condicoesFornecimento"
                value={condicoesFornecimento}
                onChange={(e) => setCondicoesFornecimento(e.target.value)}
                placeholder="Ex: Prazo de entrega, forma de pagamento..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validadeOrcamento">Validade do orçamento</Label>
              <Input
                id="validadeOrcamento"
                value={validadeOrcamento}
                onChange={(e) => setValidadeOrcamento(e.target.value)}
                placeholder="Ex: 30 dias"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-base">Imagem Adicional (Opcional)</h4>
            <div className="space-y-2">
              <Label htmlFor="imagemAdicional">Carregar imagem com condições detalhadas</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="imagemAdicional"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="flex-1"
                />
                {uploadingImage && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {imagemAdicionalPath && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <FileImage className="h-4 w-4" />
                  <span>Imagem carregada - será incluída como página adicional no PDF</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setImagemAdicionalPath(null)}
                    className="h-6 text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Esta imagem será adicionada como uma página extra no final do PDF do orçamento
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Notas adicionais sobre o orçamento..."
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createOrcamentoMutation.isPending || !empresa.data}>
            {createOrcamentoMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Criar Orçamento
          </Button>
        </div>
      </form>
    </div>
  );
}
