import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  Encomenda,
  Status,
  Gestor,
  Material,
  PrecoFornecedor,
  Orcamento,
  ItemOrcamento,
  Cliente,
  Empresa,
  Rodape,
  BackupInfo,
  TabelaPrecoLinha,
  DadosCompletos,
} from '../backend';

export function useGetOrders(status: Status) {
  const { actor, isFetching } = useActor();

  return useQuery<Encomenda[]>({
    queryKey: ['orders', status],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listarPorStatus(status);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nomeCliente: string;
      descricao: string;
      contato: string;
      gestor: string;
      valorTotal: bigint;
      valorAdiantado: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.criarEncomenda(
        data.nomeCliente,
        data.descricao,
        data.contato,
        data.gestor,
        data.valorTotal,
        data.valorAdiantado
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.atualizarStatus(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useMoveOrderBack() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.moverParaStatusAnterior(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useDeleteOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletarEncomenda(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useEditOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      nomeCliente: string;
      descricao: string;
      contato: string;
      gestor: string;
      valorTotal: bigint;
      valorAdiantado: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editarEncomenda(
        data.id,
        data.nomeCliente,
        data.descricao,
        data.contato,
        data.gestor,
        data.valorTotal,
        data.valorAdiantado
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useGetGestores() {
  const { actor, isFetching } = useActor();

  return useQuery<Gestor[]>({
    queryKey: ['gestores'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listarGestores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddGestor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nome: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adicionarGestor(nome);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestores'] });
    },
  });
}

export function useRemoveGestor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nome: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removerGestor(nome);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestores'] });
    },
  });
}

export function useVerifyGestores() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['gestores-exist'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.verificarGestores();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGeneratePDFReport() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (data: { status: Status; gestorFilter: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.gerarRelatorioPDF(data.status, data.gestorFilter);
    },
  });
}

export function useGetMaterials() {
  const { actor, isFetching } = useActor();

  return useQuery<Material[]>({
    queryKey: ['materials'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listarMateriais();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMaterial(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Material | null>({
    queryKey: ['material', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMaterial(id);
    },
    enabled: !!actor && !isFetching && id > BigInt(0),
  });
}

export function useGetMaterialsWithLowestPrice() {
  const { actor, isFetching } = useActor();

  return useQuery<
    Array<{
      id: bigint;
      nome: string;
      menorPreco?: PrecoFornecedor;
    }>
  >({
    queryKey: ['materials-lowest-price'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listarMateriaisComMenorPreco();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMaterial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nome: string;
      preco: bigint;
      fornecedor: string;
      vendedor: string;
      contatoVendedor: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adicionarMaterial(
        data.nome,
        data.preco,
        data.fornecedor,
        data.vendedor,
        data.contatoVendedor
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials-lowest-price'] });
    },
  });
}

export function useAddSupplierPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      materialId: bigint;
      preco: bigint;
      fornecedor: string;
      vendedor: string;
      contatoVendedor: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adicionarPrecoFornecedor(
        data.materialId,
        data.preco,
        data.fornecedor,
        data.vendedor,
        data.contatoVendedor
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials-lowest-price'] });
      queryClient.invalidateQueries({ queryKey: ['material'] });
    },
  });
}

export function useEditMaterial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: bigint; nome: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editarMaterial(data.id, data.nome);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials-lowest-price'] });
      queryClient.invalidateQueries({ queryKey: ['material'] });
    },
  });
}

export function useEditSupplierPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      materialId: bigint;
      index: bigint;
      preco: bigint;
      fornecedor: string;
      vendedor: string;
      contatoVendedor: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editarPrecoFornecedor(
        data.materialId,
        data.index,
        data.preco,
        data.fornecedor,
        data.vendedor,
        data.contatoVendedor
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials-lowest-price'] });
      queryClient.invalidateQueries({ queryKey: ['material'] });
    },
  });
}

export function useDeleteSupplierPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { materialId: bigint; index: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletarPrecoFornecedor(data.materialId, data.index);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials-lowest-price'] });
      queryClient.invalidateQueries({ queryKey: ['material'] });
    },
  });
}

export function useDeleteMaterial() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletarMaterial(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials-lowest-price'] });
    },
  });
}

export function useGetClientes() {
  const { actor, isFetching } = useActor();

  return useQuery<Cliente[]>({
    queryKey: ['clientes'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listarClientes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCliente(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Cliente | null>({
    queryKey: ['cliente', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCliente(id);
    },
    enabled: !!actor && !isFetching && id > BigInt(0),
  });
}

export function useCreateCliente() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nome: string;
      contato: string;
      morada: string;
      nif: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.criarCliente(data.nome, data.contato, data.morada, data.nif);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useEditCliente() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      nome: string;
      contato: string;
      morada: string;
      nif: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editarCliente(data.id, data.nome, data.contato, data.morada, data.nif);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['cliente'] });
    },
  });
}

export function useDeleteCliente() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletarCliente(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
  });
}

export function useGetOrcamentos() {
  const { actor, isFetching } = useActor();

  return useQuery<Orcamento[]>({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listarOrcamentos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrcamento() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      clienteId: bigint;
      gestor: string;
      itens: ItemOrcamento[];
      observacoes: string;
      condicoesFornecimento: string;
      validadeOrcamento: string;
      imagemAdicionalPath: string | null;
      iva: bigint;
      desconto: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.criarOrcamento(
        data.clienteId,
        data.gestor,
        data.itens,
        data.observacoes,
        data.condicoesFornecimento,
        data.validadeOrcamento,
        data.imagemAdicionalPath,
        data.iva,
        data.desconto
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    },
  });
}

export function useEditOrcamento() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      clienteId: bigint;
      gestor: string;
      itens: ItemOrcamento[];
      observacoes: string;
      condicoesFornecimento: string;
      validadeOrcamento: string;
      imagemAdicionalPath: string | null;
      iva: bigint;
      desconto: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editarOrcamento(
        data.id,
        data.clienteId,
        data.gestor,
        data.itens,
        data.observacoes,
        data.condicoesFornecimento,
        data.validadeOrcamento,
        data.imagemAdicionalPath,
        data.iva,
        data.desconto
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    },
  });
}

export function useDeleteOrcamento() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletarOrcamento(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    },
  });
}

export function useDeleteItemOrcamento() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { orcamentoId: bigint; itemIndex: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletarItemOrcamento(data.orcamentoId, data.itemIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
    },
  });
}

export function useAcceptOrcamento() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.aceitarOrcamento(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useGetEmpresa() {
  const { actor, isFetching } = useActor();

  return useQuery<Empresa | null>({
    queryKey: ['empresa'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getEmpresa();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveEmpresa() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nome: string;
      morada: string;
      nib: string;
      cae: string;
      alvara: string;
      telefone: string;
      email: string;
      logoPath: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.salvarEmpresa(
        data.nome,
        data.morada,
        data.nib,
        data.cae,
        data.alvara,
        data.telefone,
        data.email,
        data.logoPath
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa'] });
    },
  });
}

export function useUpdateEmpresa() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nome: string;
      morada: string;
      nib: string;
      cae: string;
      alvara: string;
      telefone: string;
      email: string;
      logoPath: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.atualizarEmpresa(
        data.nome,
        data.morada,
        data.nib,
        data.cae,
        data.alvara,
        data.telefone,
        data.email,
        data.logoPath
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresa'] });
    },
  });
}

export function useGetRodape() {
  const { actor, isFetching } = useActor();

  return useQuery<Rodape | null>({
    queryKey: ['rodape'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRodape();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveRodape() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (textoCompleto: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.salvarRodape(textoCompleto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rodape'] });
    },
  });
}

export function useUpdateRodape() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (textoCompleto: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.atualizarRodape(textoCompleto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rodape'] });
    },
  });
}

export function useCreateBackup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.criarBackup();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
}

export function useListBackups() {
  const { actor, isFetching } = useActor();

  return useQuery<BackupInfo[]>({
    queryKey: ['backups'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listarBackups();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRestoreBackup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.restaurarBackup(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useDeleteBackup() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.eliminarBackup(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
    },
  });
}

export function useGetTabelaPreco(categoria: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['tabela-preco', categoria],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getTabelaPreco(categoria);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveTabelaPreco() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      categoria: string;
      linhas: TabelaPrecoLinha[];
      titulosColunas: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.salvarTabelaPreco(data.categoria, data.linhas, data.titulosColunas);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tabela-preco', variables.categoria] });
    },
  });
}

export function useUpdateTituloColuna() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      categoria: string;
      novoTitulo: string;
      colunaIndex: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.atualizarTituloColuna(data.categoria, data.novoTitulo, data.colunaIndex);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tabela-preco', variables.categoria] });
    },
  });
}

export function useInsertRowAbove() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      categoria: string;
      linhaIndex: bigint;
      novaLinha: TabelaPrecoLinha;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.inserirLinhaAcima(data.categoria, data.linhaIndex, data.novaLinha);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tabela-preco', variables.categoria] });
    },
  });
}

export function useInsertRowBelow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      categoria: string;
      linhaIndex: bigint;
      novaLinha: TabelaPrecoLinha;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.inserirLinhaAbaixo(data.categoria, data.linhaIndex, data.novaLinha);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tabela-preco', variables.categoria] });
    },
  });
}

export function useDeleteRow() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      categoria: string;
      linhaIndex: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.eliminarLinha(data.categoria, data.linhaIndex);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tabela-preco', variables.categoria] });
    },
  });
}

export function useGetDadosCompletos() {
  const { actor, isFetching } = useActor();

  return useQuery<DadosCompletos>({
    queryKey: ['dados-completos'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDadosCompletos();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useSalvarDadosCompletos() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: DadosCompletos) => {
      if (!actor) throw new Error('Actor not available');
      return actor.salvarDadosCompletos(dados);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

// Wrapper functions for backward compatibility
export function useOrderQueries() {
  return {
    useOrdersByStatus: useGetOrders,
    useCreateOrder,
    useAdvanceOrder: useUpdateOrderStatus,
    useMoveToPreviousStatus: useMoveOrderBack,
    useDeleteOrder,
    useEditOrder,
    useGestores: useGetGestores,
    useAddGestor,
    useRemoveGestor,
    useVerifyGestores,
    useGeneratePDFReport,
  };
}

export function useMaterialQueries() {
  return {
    useMaterial: useGetMaterial,
    useMaterialsWithLowestPrice: useGetMaterialsWithLowestPrice,
    useAddMaterial,
    useAddSupplierPrice,
    useEditMaterialName: useEditMaterial,
    useEditSupplierPrice,
    useDeleteSupplierPrice,
    useDeleteMaterial,
  };
}

export function useClienteQueries() {
  return {
    useClientes: useGetClientes,
    useCliente: useGetCliente,
    useCreateCliente,
    useEditCliente,
    useDeleteCliente,
  };
}

export function useOrcamentoQueries() {
  return {
    useOrcamentos: useGetOrcamentos,
    useCreateOrcamento,
    useEditOrcamento,
    useDeleteOrcamento,
    useDeleteItemOrcamento,
    useAcceptOrcamento,
  };
}

export function useEmpresaQueries() {
  return {
    useEmpresa: useGetEmpresa,
    useSaveEmpresa,
    useUpdateEmpresa,
  };
}

export function useRodapeQueries() {
  return {
    useRodape: useGetRodape,
    useSaveRodape,
    useUpdateRodape,
  };
}

export function useGetBackups() {
  return useListBackups();
}
