export const idlFactory = ({ IDL }) => {
  const Status = IDL.Variant({
    'encomenda' : IDL.Null,
    'concluido' : IDL.Null,
    'montagem' : IDL.Null,
    'producao' : IDL.Null,
    'porPagar' : IDL.Null,
  });
  const Encomenda = IDL.Record({
    'id' : IDL.Nat,
    'status' : Status,
    'contato' : IDL.Text,
    'descricao' : IDL.Text,
    'dataCriacao' : IDL.Int,
    'gestor' : IDL.Text,
    'valorAdiantado' : IDL.Nat,
    'nomeCliente' : IDL.Text,
    'valorTotal' : IDL.Nat,
  });
  const RelatorioPDF = IDL.Record({
    'gestor' : IDL.Text,
    'encomendas' : IDL.Vec(Encomenda),
  });
  const ResumoFinanceiro = IDL.Record({
    'totalValor' : IDL.Nat,
    'totalEncomendas' : IDL.Nat,
    'totalPendente' : IDL.Nat,
    'totalAdiantado' : IDL.Nat,
  });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  const Movimentacao = IDL.Record({
    'statusAnterior' : Status,
    'timestamp' : IDL.Int,
    'novoStatus' : Status,
  });
  const Gestor = IDL.Record({ 'nome' : IDL.Text });
  return IDL.Service({
    'adicionarGestor' : IDL.Func([IDL.Text], [], []),
    'atualizarStatus' : IDL.Func([IDL.Nat], [], []),
    'criarEncomenda' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Nat],
        [IDL.Nat],
        [],
      ),
    'deletarEncomenda' : IDL.Func([IDL.Nat], [], []),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'editarEncomenda' : IDL.Func(
        [IDL.Nat, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Nat],
        [],
        [],
      ),
    'filtrarPorGestorEStatus' : IDL.Func(
        [IDL.Text, Status],
        [IDL.Vec(Encomenda)],
        ['query'],
      ),
    'gerarRelatorioPDF' : IDL.Func(
        [Status, IDL.Opt(IDL.Text)],
        [
          IDL.Record({
            'relatorios' : IDL.Vec(RelatorioPDF),
            'resumoFinanceiro' : ResumoFinanceiro,
          }),
        ],
        ['query'],
      ),
    'getEncomenda' : IDL.Func([IDL.Nat], [IDL.Opt(Encomenda)], ['query']),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'getHistorico' : IDL.Func(
        [IDL.Nat],
        [IDL.Opt(IDL.Vec(Movimentacao))],
        ['query'],
      ),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'listarGestores' : IDL.Func([], [IDL.Vec(Gestor)], ['query']),
    'listarPorGestor' : IDL.Func([IDL.Text], [IDL.Vec(Encomenda)], ['query']),
    'listarPorStatus' : IDL.Func([Status], [IDL.Vec(Encomenda)], ['query']),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'removerGestor' : IDL.Func([IDL.Text], [], []),
    'verificarGestores' : IDL.Func([], [IDL.Bool], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
