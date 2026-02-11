import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Cliente {
    id: bigint;
    nif: string;
    contato: string;
    nome: string;
    morada: string;
}
export interface Rodape {
    textoCompleto: string;
}
export interface PrecoFornecedor {
    fornecedor: string;
    data: bigint;
    vendedor: string;
    contatoVendedor: string;
    preco: bigint;
}
export interface DadosCompletos {
    clientes: Array<Cliente>;
    lastEditTime: bigint;
    orcamentos: Array<Orcamento>;
    historico: Array<[bigint, Array<Movimentacao>]>;
    nextId: bigint;
    gestores: Array<Gestor>;
    materiais: Array<Material>;
    encomendas: Array<Encomenda>;
    tabelasPreco: Array<TabelaPrecoCategoria>;
    nextOrcamentoId: bigint;
    rodape?: Rodape;
    nextMaterialId: bigint;
    empresa?: Empresa;
    nextClienteId: bigint;
    backups: Array<[bigint, string]>;
}
export interface Gestor {
    nome: string;
}
export interface Encomenda {
    id: bigint;
    status: Status;
    contato: string;
    descricao: string;
    dataCriacao: bigint;
    gestor: string;
    valorAdiantado: bigint;
    nomeCliente: string;
    valorTotal: bigint;
}
export interface Empresa {
    cae: string;
    nib: string;
    alvara: string;
    nome: string;
    email: string;
    logoPath: string;
    morada: string;
    telefone: string;
}
export interface ItemOrcamento {
    nomeMaterial: string;
    descricao: string;
    precoUnitario: bigint;
    quantidade: bigint;
    subtotal: bigint;
}
export interface BackupInfo {
    id: bigint;
    descricao: string;
    timestamp: bigint;
}
export interface TabelaPrecoCategoria {
    categoria: string;
    titulosColunas: Array<string>;
    linhas: Array<TabelaPrecoLinha>;
}
export interface TabelaPrecoLinha {
    descricao: string;
    colunas: Array<string>;
}
export interface ResumoFinanceiro {
    totalValor: bigint;
    totalEncomendas: bigint;
    totalPendente: bigint;
    totalAdiantado: bigint;
}
export interface Movimentacao {
    statusAnterior: Status;
    timestamp: bigint;
    novoStatus: Status;
}
export interface Material {
    id: bigint;
    nome: string;
    precos: Array<PrecoFornecedor>;
}
export interface RelatorioPDF {
    gestor: string;
    encomendas: Array<Encomenda>;
}
export interface Orcamento {
    id: bigint;
    iva: bigint;
    desconto: bigint;
    status: StatusOrcamento;
    condicoesFornecimento: string;
    imagemAdicionalPath?: string;
    validadeOrcamento: string;
    observacoes: string;
    gestor: string;
    itens: Array<ItemOrcamento>;
    empresa: Empresa;
    clienteId: bigint;
    dataOrcamento: bigint;
    valorTotal: bigint;
}
export interface UserProfile {
    name: string;
    email: string;
}
export interface FileReference {
    hash: string;
    path: string;
}
export enum Status {
    encomenda = "encomenda",
    concluido = "concluido",
    montagem = "montagem",
    producao = "producao",
    porPagar = "porPagar"
}
export enum StatusOrcamento {
    aceito = "aceito",
    pendente = "pendente",
    rejeitado = "rejeitado"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    aceitarOrcamento(id: bigint): Promise<{
        mensagem: string;
        encomendaId?: bigint;
        sucesso: boolean;
    }>;
    adicionarGestor(nome: string): Promise<void>;
    adicionarLinhaTabela(categoria: string, novaLinha: TabelaPrecoLinha): Promise<void>;
    adicionarMaterial(nome: string, preco: bigint, fornecedor: string, vendedor: string, contatoVendedor: string): Promise<bigint>;
    adicionarPrecoFornecedor(materialId: bigint, preco: bigint, fornecedor: string, vendedor: string, contatoVendedor: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    atualizarEmpresa(nome: string, morada: string, nib: string, cae: string, alvara: string, telefone: string, email: string, logoPath: string): Promise<void>;
    atualizarLinhaTabela(categoria: string, linhaAtualizada: TabelaPrecoLinha, linhaIndex: bigint): Promise<void>;
    atualizarRodape(textoCompleto: string): Promise<void>;
    atualizarStatus(id: bigint): Promise<void>;
    atualizarTituloColuna(categoria: string, novoTitulo: string, colunaIndex: bigint): Promise<void>;
    criarBackup(): Promise<{
        backupId: bigint;
        mensagem: string;
    }>;
    criarCliente(nome: string, contato: string, morada: string, nif: string): Promise<bigint>;
    criarEncomenda(nomeCliente: string, descricao: string, contato: string, gestor: string, valorTotal: bigint, valorAdiantado: bigint): Promise<bigint>;
    criarOrcamento(clienteId: bigint, gestor: string, itens: Array<ItemOrcamento>, observacoes: string, condicoesFornecimento: string, validadeOrcamento: string, imagemAdicionalPath: string | null, iva: bigint, desconto: bigint): Promise<bigint>;
    deletarCliente(id: bigint): Promise<void>;
    deletarEncomenda(id: bigint): Promise<void>;
    deletarItemOrcamento(orcamentoId: bigint, itemIndex: bigint): Promise<void>;
    deletarMaterial(id: bigint): Promise<void>;
    deletarOrcamento(id: bigint): Promise<void>;
    deletarPrecoFornecedor(materialId: bigint, index: bigint): Promise<void>;
    dropFileReference(path: string): Promise<void>;
    editarCliente(id: bigint, nome: string, contato: string, morada: string, nif: string): Promise<void>;
    editarEncomenda(id: bigint, nomeCliente: string, descricao: string, contato: string, gestor: string, valorTotal: bigint, valorAdiantado: bigint): Promise<void>;
    editarMaterial(id: bigint, nome: string): Promise<void>;
    editarOrcamento(id: bigint, clienteId: bigint, gestor: string, itens: Array<ItemOrcamento>, observacoes: string, condicoesFornecimento: string, validadeOrcamento: string, imagemAdicionalPath: string | null, iva: bigint, desconto: bigint): Promise<void>;
    editarPrecoFornecedor(materialId: bigint, index: bigint, preco: bigint, fornecedor: string, vendedor: string, contatoVendedor: string): Promise<void>;
    eliminarBackup(id: bigint): Promise<{
        mensagem: string;
    }>;
    eliminarLinha(categoria: string, linhaIndex: bigint): Promise<void>;
    filtrarClientesPorNome(nome: string): Promise<Array<Cliente>>;
    filtrarMateriaisPorFornecedor(fornecedor: string): Promise<Array<Material>>;
    filtrarMateriaisPorNome(nome: string): Promise<Array<Material>>;
    filtrarOrcamentosPorGestor(gestor: string): Promise<Array<Orcamento>>;
    filtrarOrcamentosPorGestorENomeCliente(gestor: string, nomeCliente: string): Promise<Array<Orcamento>>;
    filtrarOrcamentosPorNomeCliente(nomeCliente: string): Promise<Array<Orcamento>>;
    filtrarPorGestorEStatus(gestor: string, status: Status): Promise<Array<Encomenda>>;
    gerarRelatorioPDF(status: Status, gestorFilter: string | null): Promise<{
        relatorios: Array<RelatorioPDF>;
        resumoFinanceiro: ResumoFinanceiro;
    }>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCliente(id: bigint): Promise<Cliente | null>;
    getDadosCompletos(): Promise<DadosCompletos>;
    getDadosOrcamentoPDF(id: bigint): Promise<{
        rodape?: Rodape;
        empresa: Empresa;
        orcamento: Orcamento;
        imagemAdicional?: FileReference;
        cliente: Cliente;
    } | null>;
    getEmpresa(): Promise<Empresa | null>;
    getEncomenda(id: bigint): Promise<Encomenda | null>;
    getFileReference(path: string): Promise<FileReference>;
    getHistorico(id: bigint): Promise<Array<Movimentacao> | null>;
    getMaterial(id: bigint): Promise<Material | null>;
    getOrcamento(id: bigint): Promise<Orcamento | null>;
    getOrcamentoCompleto(id: bigint): Promise<{
        orcamento: Orcamento;
        cliente: Cliente;
    } | null>;
    getRodape(): Promise<Rodape | null>;
    getTabelaPreco(categoria: string): Promise<TabelaPrecoCategoria | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    inserirArtigoAbaixo(orcamentoId: bigint, artigoIndex: bigint): Promise<void>;
    inserirArtigoAcima(orcamentoId: bigint, artigoIndex: bigint): Promise<void>;
    inserirLinhaAbaixo(categoria: string, linhaIndex: bigint, novaLinha: TabelaPrecoLinha): Promise<void>;
    inserirLinhaAcima(categoria: string, linhaIndex: bigint, novaLinha: TabelaPrecoLinha): Promise<void>;
    isAuthenticated(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    listFileReferences(): Promise<Array<FileReference>>;
    listarBackups(): Promise<Array<BackupInfo>>;
    listarClientes(): Promise<Array<Cliente>>;
    listarGestores(): Promise<Array<Gestor>>;
    listarMateriais(): Promise<Array<Material>>;
    listarMateriaisComMenorPreco(): Promise<Array<{
        id: bigint;
        nome: string;
        menorPreco?: PrecoFornecedor;
    }>>;
    listarOrcamentos(): Promise<Array<Orcamento>>;
    listarPorGestor(gestor: string): Promise<Array<Encomenda>>;
    listarPorStatus(status: Status): Promise<Array<Encomenda>>;
    listarTabelasPreco(): Promise<Array<TabelaPrecoCategoria>>;
    moverArtigoParaBaixo(orcamentoId: bigint, artigoIndex: bigint): Promise<void>;
    moverArtigoParaCima(orcamentoId: bigint, artigoIndex: bigint): Promise<void>;
    moverParaStatusAnterior(id: bigint): Promise<void>;
    registerFileReference(path: string, hash: string): Promise<void>;
    removerGestor(nome: string): Promise<void>;
    restaurarBackup(id: bigint): Promise<{
        mensagem: string;
    }>;
    salvarDadosCompletos(dados: DadosCompletos): Promise<{
        mensagem: string;
    }>;
    salvarEmpresa(nome: string, morada: string, nib: string, cae: string, alvara: string, telefone: string, email: string, logoPath: string): Promise<void>;
    salvarRodape(textoCompleto: string): Promise<void>;
    salvarTabelaPreco(categoria: string, linhas: Array<TabelaPrecoLinha>, titulosColunas: Array<string>): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    verificarGestores(): Promise<boolean>;
    waitForAutosave(): Promise<void>;
}
