import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Encomenda {
  'id' : bigint,
  'status' : Status,
  'contato' : string,
  'descricao' : string,
  'dataCriacao' : bigint,
  'gestor' : string,
  'valorAdiantado' : bigint,
  'nomeCliente' : string,
  'valorTotal' : bigint,
}
export interface FileReference { 'hash' : string, 'path' : string }
export interface Gestor { 'nome' : string }
export interface Movimentacao {
  'statusAnterior' : Status,
  'timestamp' : bigint,
  'novoStatus' : Status,
}
export interface RelatorioPDF {
  'gestor' : string,
  'encomendas' : Array<Encomenda>,
}
export interface ResumoFinanceiro {
  'totalValor' : bigint,
  'totalEncomendas' : bigint,
  'totalPendente' : bigint,
  'totalAdiantado' : bigint,
}
export type Status = { 'encomenda' : null } |
  { 'concluido' : null } |
  { 'montagem' : null } |
  { 'producao' : null } |
  { 'porPagar' : null };
export interface _SERVICE {
  'adicionarGestor' : ActorMethod<[string], undefined>,
  'atualizarStatus' : ActorMethod<[bigint], undefined>,
  'criarEncomenda' : ActorMethod<
    [string, string, string, string, bigint, bigint],
    bigint
  >,
  'deletarEncomenda' : ActorMethod<[bigint], undefined>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'editarEncomenda' : ActorMethod<
    [bigint, string, string, string, string, bigint, bigint],
    undefined
  >,
  'filtrarPorGestorEStatus' : ActorMethod<[string, Status], Array<Encomenda>>,
  'gerarRelatorioPDF' : ActorMethod<
    [Status, [] | [string]],
    {
      'relatorios' : Array<RelatorioPDF>,
      'resumoFinanceiro' : ResumoFinanceiro,
    }
  >,
  'getEncomenda' : ActorMethod<[bigint], [] | [Encomenda]>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getHistorico' : ActorMethod<[bigint], [] | [Array<Movimentacao>]>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'listarGestores' : ActorMethod<[], Array<Gestor>>,
  'listarPorGestor' : ActorMethod<[string], Array<Encomenda>>,
  'listarPorStatus' : ActorMethod<[Status], Array<Encomenda>>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'removerGestor' : ActorMethod<[string], undefined>,
  'verificarGestores' : ActorMethod<[], boolean>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
