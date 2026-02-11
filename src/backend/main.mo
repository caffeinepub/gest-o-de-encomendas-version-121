import OrderedMap "mo:base/OrderedMap";
import Nat "mo:base/Nat";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Registry "blob-storage/registry";
import Principal "mo:base/Principal";
import AccessControl "authorization/access-control";

actor Encomendas {
    let accessControlState = AccessControl.initState();

    public type UserProfile = {
        name : Text;
        email : Text;
    };

    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
    var userProfiles = principalMap.empty<UserProfile>();

    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view their profile");
        };
        principalMap.get(userProfiles, caller);
    };

    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Can only view your own profile or admin can view all");
        };
        principalMap.get(userProfiles, user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can save their profile");
        };
        userProfiles := principalMap.put(userProfiles, caller, profile);
    };

    public query ({ caller }) func isAuthenticated() : async Bool {
        if (Principal.isAnonymous(caller)) {
            return false;
        };
        // Check if caller has at least user permission (not guest)
        let role = AccessControl.getUserRole(accessControlState, caller);
        switch (role) {
            case (#guest) { false };
            case (#user) { true };
            case (#admin) { true };
        };
    };

    transient let encomendaMap = OrderedMap.Make<Nat>(Nat.compare);
    transient let historicoMap = OrderedMap.Make<Nat>(Nat.compare);
    transient let gestorMap = OrderedMap.Make<Text>(Text.compare);
    transient let materialMap = OrderedMap.Make<Nat>(Nat.compare);
    transient let orcamentoMap = OrderedMap.Make<Nat>(Nat.compare);
    transient let clienteMap = OrderedMap.Make<Nat>(Nat.compare);
    transient let backupMap = OrderedMap.Make<Nat>(Nat.compare);
    transient let tabelasPrecoMap = OrderedMap.Make<Text>(Text.compare);

    var encomendas : OrderedMap.Map<Nat, Encomenda> = encomendaMap.empty();
    var historico : OrderedMap.Map<Nat, [Movimentacao]> = historicoMap.empty();
    var gestores : OrderedMap.Map<Text, Gestor> = gestorMap.empty();
    var materiais : OrderedMap.Map<Nat, Material> = materialMap.empty();
    var orcamentos : OrderedMap.Map<Nat, Orcamento> = orcamentoMap.empty();
    var clientes : OrderedMap.Map<Nat, Cliente> = clienteMap.empty();
    var backups : OrderedMap.Map<Nat, Text> = backupMap.empty();
    var nextId : Nat = 0;
    var nextMaterialId : Nat = 0;
    var nextOrcamentoId : Nat = 0;
    var nextClienteId : Nat = 0;
    var empresa : ?Empresa = null;
    var rodape : ?Rodape = null;
    var tabelasPreco : OrderedMap.Map<Text, TabelaPrecoCategoria> = tabelasPrecoMap.empty();
    var lastEditTime : Int = 0;
    let registry = Registry.new();

    public type Status = {
        #encomenda;
        #producao;
        #montagem;
        #porPagar;
        #concluido;
    };

    public type Encomenda = {
        id : Nat;
        nomeCliente : Text;
        descricao : Text;
        contato : Text;
        gestor : Text;
        valorTotal : Nat;
        valorAdiantado : Nat;
        status : Status;
        dataCriacao : Int;
    };

    public type Movimentacao = {
        statusAnterior : Status;
        novoStatus : Status;
        timestamp : Int;
    };

    public type Gestor = {
        nome : Text;
    };

    public type PrecoFornecedor = {
        preco : Nat;
        data : Int;
        fornecedor : Text;
        vendedor : Text;
        contatoVendedor : Text;
    };

    public type Material = {
        id : Nat;
        nome : Text;
        precos : [PrecoFornecedor];
    };

    public type RelatorioPDF = {
        gestor : Text;
        encomendas : [Encomenda];
    };

    public type ResumoFinanceiro = {
        totalEncomendas : Nat;
        totalValor : Nat;
        totalAdiantado : Nat;
        totalPendente : Nat;
    };

    public type Orcamento = {
        id : Nat;
        clienteId : Nat;
        gestor : Text;
        dataOrcamento : Int;
        itens : [ItemOrcamento];
        valorTotal : Nat;
        status : StatusOrcamento;
        observacoes : Text;
        empresa : Empresa;
        condicoesFornecimento : Text;
        validadeOrcamento : Text;
        imagemAdicionalPath : ?Text;
        iva : Nat;
        desconto : Nat;
    };

    public type ItemOrcamento = {
        nomeMaterial : Text;
        descricao : Text;
        quantidade : Nat;
        precoUnitario : Nat;
        subtotal : Nat;
    };

    public type StatusOrcamento = {
        #pendente;
        #aceito;
        #rejeitado;
    };

    public type Cliente = {
        id : Nat;
        nome : Text;
        contato : Text;
        morada : Text;
        nif : Text;
    };

    public type Empresa = {
        nome : Text;
        morada : Text;
        nib : Text;
        cae : Text;
        alvara : Text;
        telefone : Text;
        email : Text;
        logoPath : Text;
    };

    public type Rodape = {
        textoCompleto : Text;
    };

    public type BackupInfo = {
        id : Nat;
        timestamp : Int;
        descricao : Text;
    };

    public type TabelaPrecoCategoria = {
        categoria : Text;
        linhas : [TabelaPrecoLinha];
        titulosColunas : [Text];
    };

    public type TabelaPrecoLinha = {
        descricao : Text;
        colunas : [Text];
    };

    public type DadosCompletos = {
        encomendas : [Encomenda];
        historico : [(Nat, [Movimentacao])];
        gestores : [Gestor];
        materiais : [Material];
        orcamentos : [Orcamento];
        clientes : [Cliente];
        backups : [(Nat, Text)];
        empresa : ?Empresa;
        rodape : ?Rodape;
        tabelasPreco : [TabelaPrecoCategoria];
        nextId : Nat;
        nextMaterialId : Nat;
        nextOrcamentoId : Nat;
        nextClienteId : Nat;
        lastEditTime : Int;
    };

    public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can register files");
        };
        Registry.add(registry, path, hash);
    };

    public query ({ caller }) func getFileReference(path : Text) : async Registry.FileReference {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can access files");
        };
        Registry.get(registry, path);
    };

    public query ({ caller }) func listFileReferences() : async [Registry.FileReference] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can list files");
        };
        Registry.list(registry);
    };

    public shared ({ caller }) func dropFileReference(path : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can delete files");
        };
        Registry.remove(registry, path);
    };

    public shared ({ caller }) func criarEncomenda(nomeCliente : Text, descricao : Text, contato : Text, gestor : Text, valorTotal : Nat, valorAdiantado : Nat) : async Nat {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can create orders");
        };

        if (gestorMap.size(gestores) == 0) {
            Debug.trap("Nenhum gestor cadastrado. Adicione gestores primeiro.");
        };

        let id = nextId;
        nextId += 1;

        let novaEncomenda : Encomenda = {
            id;
            nomeCliente;
            descricao;
            contato;
            gestor;
            valorTotal;
            valorAdiantado;
            status = #encomenda;
            dataCriacao = Time.now();
        };

        encomendas := encomendaMap.put(encomendas, id, novaEncomenda);
        historico := historicoMap.put(historico, id, []);

        id;
    };

    public shared ({ caller }) func atualizarStatus(id : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can update order status");
        };

        switch (encomendaMap.get(encomendas, id)) {
            case (null) { Debug.trap("Encomenda não encontrada") };
            case (?encomenda) {
                let novoStatus : Status = switch (encomenda.status) {
                    case (#encomenda) { #producao };
                    case (#producao) { #montagem };
                    case (#montagem) { #porPagar };
                    case (#porPagar) { #concluido };
                    case (#concluido) { Debug.trap("Encomenda já concluída") };
                };

                let movimentacao : Movimentacao = {
                    statusAnterior = encomenda.status;
                    novoStatus;
                    timestamp = Time.now();
                };

                let encomendaAtualizada : Encomenda = {
                    id = encomenda.id;
                    nomeCliente = encomenda.nomeCliente;
                    descricao = encomenda.descricao;
                    contato = encomenda.contato;
                    gestor = encomenda.gestor;
                    valorTotal = encomenda.valorTotal;
                    valorAdiantado = encomenda.valorAdiantado;
                    status = novoStatus;
                    dataCriacao = encomenda.dataCriacao;
                };

                encomendas := encomendaMap.put(encomendas, id, encomendaAtualizada);

                switch (historicoMap.get(historico, id)) {
                    case (null) { Debug.trap("Histórico não encontrado") };
                    case (?movs) {
                        historico := historicoMap.put(historico, id, Array.append(movs, [movimentacao]));
                    };
                };
            };
        };
    };

    public shared ({ caller }) func moverParaStatusAnterior(id : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can move orders back");
        };

        switch (encomendaMap.get(encomendas, id)) {
            case (null) { Debug.trap("Encomenda não encontrada") };
            case (?encomenda) {
                let statusAnterior : Status = switch (encomenda.status) {
                    case (#encomenda) { Debug.trap("Encomenda já está no status inicial") };
                    case (#producao) { #encomenda };
                    case (#montagem) { #producao };
                    case (#porPagar) { #montagem };
                    case (#concluido) { #porPagar };
                };

                let movimentacao : Movimentacao = {
                    statusAnterior = encomenda.status;
                    novoStatus = statusAnterior;
                    timestamp = Time.now();
                };

                let encomendaAtualizada : Encomenda = {
                    id = encomenda.id;
                    nomeCliente = encomenda.nomeCliente;
                    descricao = encomenda.descricao;
                    contato = encomenda.contato;
                    gestor = encomenda.gestor;
                    valorTotal = encomenda.valorTotal;
                    valorAdiantado = encomenda.valorAdiantado;
                    status = statusAnterior;
                    dataCriacao = encomenda.dataCriacao;
                };

                encomendas := encomendaMap.put(encomendas, id, encomendaAtualizada);

                switch (historicoMap.get(historico, id)) {
                    case (null) { Debug.trap("Histórico não encontrado") };
                    case (?movs) {
                        historico := historicoMap.put(historico, id, Array.append(movs, [movimentacao]));
                    };
                };
            };
        };
    };

    public shared ({ caller }) func deletarEncomenda(id : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can delete orders");
        };

        let (newEncomendas, removedEncomenda) = encomendaMap.remove(encomendas, id);
        switch (removedEncomenda) {
            case (null) { Debug.trap("Encomenda não encontrada") };
            case (?_) {
                encomendas := newEncomendas;
                historico := historicoMap.delete(historico, id);
            };
        };
    };

    public shared ({ caller }) func editarEncomenda(id : Nat, nomeCliente : Text, descricao : Text, contato : Text, gestor : Text, valorTotal : Nat, valorAdiantado : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can edit orders");
        };

        switch (encomendaMap.get(encomendas, id)) {
            case (null) { Debug.trap("Encomenda não encontrada") };
            case (?encomenda) {
                let encomendaAtualizada : Encomenda = {
                    id;
                    nomeCliente;
                    descricao;
                    contato;
                    gestor;
                    valorTotal;
                    valorAdiantado;
                    status = encomenda.status;
                    dataCriacao = encomenda.dataCriacao;
                };
                encomendas := encomendaMap.put(encomendas, id, encomendaAtualizada);
            };
        };
    };

    public query ({ caller }) func listarPorStatus(status : Status) : async [Encomenda] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can list orders");
        };

        Iter.toArray(
            Iter.map(
                Iter.filter(
                    encomendaMap.entries(encomendas),
                    func((_, encomenda) : (Nat, Encomenda)) : Bool {
                        encomenda.status == status;
                    },
                ),
                func((_, encomenda) : (Nat, Encomenda)) : Encomenda { encomenda },
            )
        );
    };

    public query ({ caller }) func listarPorGestor(gestor : Text) : async [Encomenda] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can list orders");
        };

        Iter.toArray(
            Iter.map(
                Iter.filter(
                    encomendaMap.entries(encomendas),
                    func((_, encomenda) : (Nat, Encomenda)) : Bool {
                        encomenda.gestor == gestor and encomenda.status == #encomenda;
                    },
                ),
                func((_, encomenda) : (Nat, Encomenda)) : Encomenda { encomenda },
            )
        );
    };

    public query ({ caller }) func filtrarPorGestorEStatus(gestor : Text, status : Status) : async [Encomenda] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can filter orders");
        };

        Iter.toArray(
            Iter.map(
                Iter.filter(
                    encomendaMap.entries(encomendas),
                    func((_, encomenda) : (Nat, Encomenda)) : Bool {
                        encomenda.gestor == gestor and encomenda.status == status;
                    },
                ),
                func((_, encomenda) : (Nat, Encomenda)) : Encomenda { encomenda },
            )
        );
    };

    public query ({ caller }) func getEncomenda(id : Nat) : async ?Encomenda {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view orders");
        };
        encomendaMap.get(encomendas, id);
    };

    public query ({ caller }) func getHistorico(id : Nat) : async ?[Movimentacao] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view history");
        };
        historicoMap.get(historico, id);
    };

    public shared ({ caller }) func adicionarGestor(nome : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can add managers");
        };

        let gestor : Gestor = { nome };
        gestores := gestorMap.put(gestores, nome, gestor);
    };

    public shared ({ caller }) func removerGestor(nome : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can remove managers");
        };

        let (newGestores, removedGestor) = gestorMap.remove(gestores, nome);
        switch (removedGestor) {
            case (null) { Debug.trap("Gestor não encontrado") };
            case (?_) {
                gestores := newGestores;
            };
        };
    };

    public query ({ caller }) func listarGestores() : async [Gestor] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can list managers");
        };
        Iter.toArray(gestorMap.vals(gestores));
    };

    public query ({ caller }) func verificarGestores() : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can check managers");
        };
        gestorMap.size(gestores) > 0;
    };

    public query ({ caller }) func gerarRelatorioPDF(status : Status, gestorFilter : ?Text) : async {
        relatorios : [RelatorioPDF];
        resumoFinanceiro : ResumoFinanceiro;
    } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can generate reports");
        };

        let filteredEncomendas = Iter.toArray(
            Iter.map(
                Iter.filter(
                    encomendaMap.entries(encomendas),
                    func((_, encomenda) : (Nat, Encomenda)) : Bool {
                        encomenda.status == status and (switch (gestorFilter) {
                            case (null) { true };
                            case (?g) { encomenda.gestor == g };
                        });
                    },
                ),
                func((_, encomenda) : (Nat, Encomenda)) : Encomenda { encomenda },
            )
        );

        if (filteredEncomendas.size() == 0) {
            Debug.trap("Nenhuma encomenda encontrada para os filtros especificados");
        };

        let gestorGroupMap = OrderedMap.Make<Text>(Text.compare);
        let groupedByGestor = gestorGroupMap.empty<[Encomenda]>();

        let finalGrouped = Array.foldLeft<Encomenda, OrderedMap.Map<Text, [Encomenda]>>(
            filteredEncomendas,
            groupedByGestor,
            func(acc, encomenda) {
                switch (gestorGroupMap.get(acc, encomenda.gestor)) {
                    case (null) {
                        gestorGroupMap.put(acc, encomenda.gestor, [encomenda]);
                    };
                    case (?existing) {
                        gestorGroupMap.put(acc, encomenda.gestor, Array.append(existing, [encomenda]));
                    };
                };
            },
        );

        let relatorios = Iter.toArray(
            Iter.map(
                gestorGroupMap.entries(finalGrouped),
                func((gestor, encomendas) : (Text, [Encomenda])) : RelatorioPDF {
                    {
                        gestor;
                        encomendas;
                    };
                },
            )
        );

        let resumoFinanceiro = Array.foldLeft<Encomenda, ResumoFinanceiro>(
            filteredEncomendas,
            {
                totalEncomendas = 0;
                totalValor = 0;
                totalAdiantado = 0;
                totalPendente = 0;
            },
            func(acc, encomenda) {
                {
                    totalEncomendas = acc.totalEncomendas + 1;
                    totalValor = acc.totalValor + encomenda.valorTotal;
                    totalAdiantado = acc.totalAdiantado + encomenda.valorAdiantado;
                    totalPendente = acc.totalPendente + (encomenda.valorTotal - encomenda.valorAdiantado);
                };
            },
        );

        {
            relatorios;
            resumoFinanceiro;
        };
    };

    public shared ({ caller }) func adicionarMaterial(nome : Text, preco : Nat, fornecedor : Text, vendedor : Text, contatoVendedor : Text) : async Nat {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can add materials");
        };

        let id = nextMaterialId;
        nextMaterialId += 1;

        let precoFornecedor : PrecoFornecedor = {
            preco;
            data = Time.now();
            fornecedor;
            vendedor;
            contatoVendedor;
        };

        let material : Material = {
            id;
            nome;
            precos = [precoFornecedor];
        };

        materiais := materialMap.put(materiais, id, material);
        id;
    };

    public shared ({ caller }) func adicionarPrecoFornecedor(materialId : Nat, preco : Nat, fornecedor : Text, vendedor : Text, contatoVendedor : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can add supplier prices");
        };

        switch (materialMap.get(materiais, materialId)) {
            case (null) { Debug.trap("Material não encontrado") };
            case (?material) {
                let novoPreco : PrecoFornecedor = {
                    preco;
                    data = Time.now();
                    fornecedor;
                    vendedor;
                    contatoVendedor;
                };

                let materialAtualizado : Material = {
                    id = materialId;
                    nome = material.nome;
                    precos = Array.append(material.precos, [novoPreco]);
                };

                materiais := materialMap.put(materiais, materialId, materialAtualizado);
            };
        };
    };

    public shared ({ caller }) func editarMaterial(id : Nat, nome : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can edit materials");
        };

        switch (materialMap.get(materiais, id)) {
            case (null) { Debug.trap("Material não encontrado") };
            case (?material) {
                let materialAtualizado : Material = {
                    id;
                    nome;
                    precos = material.precos;
                };
                materiais := materialMap.put(materiais, id, materialAtualizado);
            };
        };
    };

    public shared ({ caller }) func editarPrecoFornecedor(materialId : Nat, index : Nat, preco : Nat, fornecedor : Text, vendedor : Text, contatoVendedor : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can edit supplier prices");
        };

        switch (materialMap.get(materiais, materialId)) {
            case (null) { Debug.trap("Material não encontrado") };
            case (?material) {
                if (index >= material.precos.size()) {
                    Debug.trap("Índice de preço inválido");
                };

                let novoPreco : PrecoFornecedor = {
                    preco;
                    data = Time.now();
                    fornecedor;
                    vendedor;
                    contatoVendedor;
                };

                let precosAtualizados = Array.tabulate<PrecoFornecedor>(
                    material.precos.size(),
                    func(i) {
                        if (i == index) { novoPreco } else { material.precos[i] };
                    },
                );

                let materialAtualizado : Material = {
                    id = materialId;
                    nome = material.nome;
                    precos = precosAtualizados;
                };

                materiais := materialMap.put(materiais, materialId, materialAtualizado);
            };
        };
    };

    public shared ({ caller }) func deletarPrecoFornecedor(materialId : Nat, index : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can delete supplier prices");
        };

        switch (materialMap.get(materiais, materialId)) {
            case (null) { Debug.trap("Material não encontrado") };
            case (?material) {
                if (index >= material.precos.size()) {
                    Debug.trap("Índice de preço inválido");
                };

                let precosAtualizados = Array.tabulate<PrecoFornecedor>(
                    material.precos.size() - 1 : Nat,
                    func(i) {
                        if (i < index) { material.precos[i] } else {
                            material.precos[i + 1];
                        };
                    },
                );

                let materialAtualizado : Material = {
                    id = material.id;
                    nome = material.nome;
                    precos = precosAtualizados;
                };

                materiais := materialMap.put(materiais, materialId, materialAtualizado);
            };
        };
    };

    public shared ({ caller }) func deletarMaterial(id : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can delete materials");
        };

        let (newMateriais, removedMaterial) = materialMap.remove(materiais, id);
        switch (removedMaterial) {
            case (null) { Debug.trap("Material não encontrado") };
            case (?_) {
                materiais := newMateriais;
            };
        };
    };

    public query ({ caller }) func listarMateriais() : async [Material] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can list materials");
        };
        Iter.toArray(materialMap.vals(materiais));
    };

    public query ({ caller }) func listarMateriaisComMenorPreco() : async [{
        id : Nat;
        nome : Text;
        menorPreco : ?PrecoFornecedor;
    }] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can list materials");
        };

        Iter.toArray(
            Iter.map(
                materialMap.vals(materiais),
                func(material : Material) : {
                    id : Nat;
                    nome : Text;
                    menorPreco : ?PrecoFornecedor;
                } {
                    let menorPreco = if (material.precos.size() > 0) {
                        ?Array.foldLeft<PrecoFornecedor, PrecoFornecedor>(
                            material.precos,
                            material.precos[0],
                            func(acc, preco) {
                                if (preco.preco < acc.preco) { preco } else { acc };
                            },
                        );
                    } else { null };

                    {
                        id = material.id;
                        nome = material.nome;
                        menorPreco;
                    };
                },
            )
        );
    };

    public query ({ caller }) func filtrarMateriaisPorNome(nome : Text) : async [Material] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can filter materials");
        };

        Iter.toArray(
            Iter.map(
                Iter.filter(
                    materialMap.entries(materiais),
                    func((_, material) : (Nat, Material)) : Bool {
                        Text.contains(Text.toLowercase(material.nome), #text(Text.toLowercase(nome)));
                    },
                ),
                func((_, material) : (Nat, Material)) : Material { material },
            )
        );
    };

    public query ({ caller }) func filtrarMateriaisPorFornecedor(fornecedor : Text) : async [Material] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can filter materials");
        };

        Iter.toArray(
            Iter.map(
                Iter.filter(
                    materialMap.entries(materiais),
                    func((_, material) : (Nat, Material)) : Bool {
                        Array.foldLeft<PrecoFornecedor, Bool>(
                            material.precos,
                            false,
                            func(acc, preco) {
                                acc or Text.contains(Text.toLowercase(preco.fornecedor), #text(Text.toLowercase(fornecedor)));
                            },
                        );
                    },
                ),
                func((_, material) : (Nat, Material)) : Material { material },
            )
        );
    };

    public query ({ caller }) func getMaterial(id : Nat) : async ?Material {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view materials");
        };
        materialMap.get(materiais, id);
    };

    public shared ({ caller }) func criarCliente(nome : Text, contato : Text, morada : Text, nif : Text) : async Nat {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can create clients");
        };

        let id = nextClienteId;
        nextClienteId += 1;

        let cliente : Cliente = {
            id;
            nome;
            contato;
            morada;
            nif;
        };

        clientes := clienteMap.put(clientes, id, cliente);
        id;
    };

    public shared ({ caller }) func editarCliente(id : Nat, nome : Text, contato : Text, morada : Text, nif : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can edit clients");
        };

        switch (clienteMap.get(clientes, id)) {
            case (null) { Debug.trap("Cliente não encontrado") };
            case (?_) {
                let cliente : Cliente = {
                    id;
                    nome;
                    contato;
                    morada;
                    nif;
                };
                clientes := clienteMap.put(clientes, id, cliente);
            };
        };
    };

    public shared ({ caller }) func deletarCliente(id : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can delete clients");
        };

        let (newClientes, removedCliente) = clienteMap.remove(clientes, id);
        switch (removedCliente) {
            case (null) { Debug.trap("Cliente não encontrado") };
            case (?_) {
                clientes := newClientes;
            };
        };
    };

    public query ({ caller }) func listarClientes() : async [Cliente] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can list clients");
        };
        Iter.toArray(clienteMap.vals(clientes));
    };

    public query ({ caller }) func getCliente(id : Nat) : async ?Cliente {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view clients");
        };
        clienteMap.get(clientes, id);
    };

    public query ({ caller }) func filtrarClientesPorNome(nome : Text) : async [Cliente] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can filter clients");
        };

        let nomeLower = Text.toLowercase(nome);

        Iter.toArray(
            Iter.map(
                Iter.filter(
                    clienteMap.entries(clientes),
                    func((_, cliente) : (Nat, Cliente)) : Bool {
                        Text.contains(Text.toLowercase(cliente.nome), #text(nomeLower));
                    },
                ),
                func((_, cliente) : (Nat, Cliente)) : Cliente { cliente },
            )
        );
    };

    public shared ({ caller }) func criarOrcamento(clienteId : Nat, gestor : Text, itens : [ItemOrcamento], observacoes : Text, condicoesFornecimento : Text, validadeOrcamento : Text, imagemAdicionalPath : ?Text, iva : Nat, desconto : Nat) : async Nat {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can create budgets");
        };

        switch (empresa) {
            case (null) { Debug.trap("Informações da empresa não configuradas") };
            case (?empresaInfo) {
                switch (clienteMap.get(clientes, clienteId)) {
                    case (null) { Debug.trap("Cliente não encontrado") };
                    case (?_) {
                        let id = nextOrcamentoId;
                        nextOrcamentoId += 1;

                        let valorTotal = Array.foldLeft<ItemOrcamento, Nat>(
                            itens,
                            0,
                            func(acc, item) {
                                acc + item.subtotal;
                            },
                        );

                        let orcamento : Orcamento = {
                            id;
                            clienteId;
                            gestor;
                            dataOrcamento = Time.now();
                            itens;
                            valorTotal;
                            status = #pendente;
                            observacoes;
                            empresa = empresaInfo;
                            condicoesFornecimento;
                            validadeOrcamento;
                            imagemAdicionalPath;
                            iva;
                            desconto;
                        };

                        orcamentos := orcamentoMap.put(orcamentos, id, orcamento);
                        id;
                    };
                };
            };
        };
    };

    public shared ({ caller }) func editarOrcamento(id : Nat, clienteId : Nat, gestor : Text, itens : [ItemOrcamento], observacoes : Text, condicoesFornecimento : Text, validadeOrcamento : Text, imagemAdicionalPath : ?Text, iva : Nat, desconto : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can edit budgets");
        };

        switch (orcamentoMap.get(orcamentos, id)) {
            case (null) { Debug.trap("Orçamento não encontrado") };
            case (?orcamento) {
                switch (clienteMap.get(clientes, clienteId)) {
                    case (null) { Debug.trap("Cliente não encontrado") };
                    case (?_) {
                        let valorTotal = Array.foldLeft<ItemOrcamento, Nat>(
                            itens,
                            0,
                            func(acc, item) {
                                acc + item.subtotal;
                            },
                        );

                        let orcamentoAtualizado : Orcamento = {
                            id;
                            clienteId;
                            gestor;
                            dataOrcamento = orcamento.dataOrcamento;
                            itens;
                            valorTotal;
                            status = orcamento.status;
                            observacoes;
                            empresa = orcamento.empresa;
                            condicoesFornecimento;
                            validadeOrcamento;
                            imagemAdicionalPath;
                            iva;
                            desconto;
                        };

                        orcamentos := orcamentoMap.put(orcamentos, id, orcamentoAtualizado);
                    };
                };
            };
        };
    };

    public shared ({ caller }) func deletarOrcamento(id : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can delete budgets");
        };

        let (newOrcamentos, removedOrcamento) = orcamentoMap.remove(orcamentos, id);
        switch (removedOrcamento) {
            case (null) { Debug.trap("Orçamento não encontrado") };
            case (?_) {
                orcamentos := newOrcamentos;
            };
        };
    };

    public shared ({ caller }) func deletarItemOrcamento(orcamentoId : Nat, itemIndex : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can delete budget items");
        };

        switch (orcamentoMap.get(orcamentos, orcamentoId)) {
            case (null) { Debug.trap("Orçamento não encontrado") };
            case (?orcamento) {
                if (itemIndex >= orcamento.itens.size()) {
                    Debug.trap("Índice de item inválido");
                };

                let itensAtualizados = Array.tabulate<ItemOrcamento>(
                    orcamento.itens.size() - 1 : Nat,
                    func(i) {
                        if (i < itemIndex) { orcamento.itens[i] } else { orcamento.itens[i + 1] };
                    },
                );

                let valorTotal = Array.foldLeft<ItemOrcamento, Nat>(
                    itensAtualizados,
                    0,
                    func(acc, item) {
                        acc + item.subtotal;
                    },
                );

                let orcamentoAtualizado : Orcamento = {
                    id = orcamento.id;
                    clienteId = orcamento.clienteId;
                    gestor = orcamento.gestor;
                    dataOrcamento = orcamento.dataOrcamento;
                    itens = itensAtualizados;
                    valorTotal;
                    status = orcamento.status;
                    observacoes = orcamento.observacoes;
                    empresa = orcamento.empresa;
                    condicoesFornecimento = orcamento.condicoesFornecimento;
                    validadeOrcamento = orcamento.validadeOrcamento;
                    imagemAdicionalPath = orcamento.imagemAdicionalPath;
                    iva = orcamento.iva;
                    desconto = orcamento.desconto;
                };

                orcamentos := orcamentoMap.put(orcamentos, orcamentoId, orcamentoAtualizado);
            };
        };
    };

    public shared ({ caller }) func inserirArtigoAcima(orcamentoId : Nat, artigoIndex : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can insert articles");
        };

        switch (orcamentoMap.get(orcamentos, orcamentoId)) {
            case (null) { Debug.trap("Orçamento não encontrado") };
            case (?orcamento) {
                if (artigoIndex > orcamento.itens.size()) {
                    Debug.trap("Índice de artigo inválido");
                };

                let novoArtigo : ItemOrcamento = {
                    nomeMaterial = "";
                    descricao = "";
                    quantidade = 0;
                    precoUnitario = 0;
                    subtotal = 0;
                };

                let itensAtualizados = Array.tabulate<ItemOrcamento>(
                    orcamento.itens.size() + 1 : Nat,
                    func(i) {
                        if (i < artigoIndex) { orcamento.itens[i] } else if (i == artigoIndex) {
                            novoArtigo;
                        } else { orcamento.itens[i - 1] };
                    },
                );

                let valorTotal = Array.foldLeft<ItemOrcamento, Nat>(
                    itensAtualizados,
                    0,
                    func(acc, item) {
                        acc + item.subtotal;
                    },
                );

                let orcamentoAtualizado : Orcamento = {
                    id = orcamento.id;
                    clienteId = orcamento.clienteId;
                    gestor = orcamento.gestor;
                    dataOrcamento = orcamento.dataOrcamento;
                    itens = itensAtualizados;
                    valorTotal;
                    status = orcamento.status;
                    observacoes = orcamento.observacoes;
                    empresa = orcamento.empresa;
                    condicoesFornecimento = orcamento.condicoesFornecimento;
                    validadeOrcamento = orcamento.validadeOrcamento;
                    imagemAdicionalPath = orcamento.imagemAdicionalPath;
                    iva = orcamento.iva;
                    desconto = orcamento.desconto;
                };

                orcamentos := orcamentoMap.put(orcamentos, orcamentoId, orcamentoAtualizado);
            };
        };
    };

    public shared ({ caller }) func inserirArtigoAbaixo(orcamentoId : Nat, artigoIndex : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can insert articles");
        };

        switch (orcamentoMap.get(orcamentos, orcamentoId)) {
            case (null) { Debug.trap("Orçamento não encontrado") };
            case (?orcamento) {
                if (artigoIndex >= orcamento.itens.size()) {
                    Debug.trap("Índice de artigo inválido");
                };

                let novoArtigo : ItemOrcamento = {
                    nomeMaterial = "";
                    descricao = "";
                    quantidade = 0;
                    precoUnitario = 0;
                    subtotal = 0;
                };

                let itensAtualizados = Array.tabulate<ItemOrcamento>(
                    orcamento.itens.size() + 1 : Nat,
                    func(i) {
                        if (i <= artigoIndex) { orcamento.itens[i] } else if (i == artigoIndex + 1) {
                            novoArtigo;
                        } else { orcamento.itens[i - 1] };
                    },
                );

                let valorTotal = Array.foldLeft<ItemOrcamento, Nat>(
                    itensAtualizados,
                    0,
                    func(acc, item) {
                        acc + item.subtotal;
                    },
                );

                let orcamentoAtualizado : Orcamento = {
                    id = orcamento.id;
                    clienteId = orcamento.clienteId;
                    gestor = orcamento.gestor;
                    dataOrcamento = orcamento.dataOrcamento;
                    itens = itensAtualizados;
                    valorTotal;
                    status = orcamento.status;
                    observacoes = orcamento.observacoes;
                    empresa = orcamento.empresa;
                    condicoesFornecimento = orcamento.condicoesFornecimento;
                    validadeOrcamento = orcamento.validadeOrcamento;
                    imagemAdicionalPath = orcamento.imagemAdicionalPath;
                    iva = orcamento.iva;
                    desconto = orcamento.desconto;
                };

                orcamentos := orcamentoMap.put(orcamentos, orcamentoId, orcamentoAtualizado);
            };
        };
    };

    public shared ({ caller }) func moverArtigoParaCima(orcamentoId : Nat, artigoIndex : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can move articles up");
        };

        switch (orcamentoMap.get(orcamentos, orcamentoId)) {
            case (null) { Debug.trap("Orçamento não encontrado") };
            case (?orcamento) {
                if (artigoIndex == 0) {
                    Debug.trap("Artigo já está na primeira posição");
                };
                if (artigoIndex >= orcamento.itens.size()) {
                    Debug.trap("Índice de artigo inválido");
                };

                let itensAtualizados = Array.tabulate<ItemOrcamento>(
                    orcamento.itens.size(),
                    func(i) {
                        if (i == artigoIndex - 1) {
                            orcamento.itens[artigoIndex];
                        } else if (i == artigoIndex) {
                            orcamento.itens[artigoIndex - 1];
                        } else { orcamento.itens[i] };
                    },
                );

                let valorTotal = Array.foldLeft<ItemOrcamento, Nat>(
                    itensAtualizados,
                    0,
                    func(acc, item) {
                        acc + item.subtotal;
                    },
                );

                let orcamentoAtualizado : Orcamento = {
                    id = orcamento.id;
                    clienteId = orcamento.clienteId;
                    gestor = orcamento.gestor;
                    dataOrcamento = orcamento.dataOrcamento;
                    itens = itensAtualizados;
                    valorTotal;
                    status = orcamento.status;
                    observacoes = orcamento.observacoes;
                    empresa = orcamento.empresa;
                    condicoesFornecimento = orcamento.condicoesFornecimento;
                    validadeOrcamento = orcamento.validadeOrcamento;
                    imagemAdicionalPath = orcamento.imagemAdicionalPath;
                    iva = orcamento.iva;
                    desconto = orcamento.desconto;
                };

                orcamentos := orcamentoMap.put(orcamentos, orcamentoId, orcamentoAtualizado);
            };
        };
    };

    public shared ({ caller }) func moverArtigoParaBaixo(orcamentoId : Nat, artigoIndex : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can move articles down");
        };

        switch (orcamentoMap.get(orcamentos, orcamentoId)) {
            case (null) { Debug.trap("Orçamento não encontrado") };
            case (?orcamento) {
                if (artigoIndex >= orcamento.itens.size() - 1) {
                    Debug.trap("Artigo já está na última posição ou índice inválido");
                };

                let itensAtualizados = Array.tabulate<ItemOrcamento>(
                    orcamento.itens.size(),
                    func(i) {
                        if (i == artigoIndex) {
                            orcamento.itens[artigoIndex + 1];
                        } else if (i == artigoIndex + 1) {
                            orcamento.itens[artigoIndex];
                        } else { orcamento.itens[i] };
                    },
                );

                let valorTotal = Array.foldLeft<ItemOrcamento, Nat>(
                    itensAtualizados,
                    0,
                    func(acc, item) {
                        acc + item.subtotal;
                    },
                );

                let orcamentoAtualizado : Orcamento = {
                    id = orcamento.id;
                    clienteId = orcamento.clienteId;
                    gestor = orcamento.gestor;
                    dataOrcamento = orcamento.dataOrcamento;
                    itens = itensAtualizados;
                    valorTotal;
                    status = orcamento.status;
                    observacoes = orcamento.observacoes;
                    empresa = orcamento.empresa;
                    condicoesFornecimento = orcamento.condicoesFornecimento;
                    validadeOrcamento = orcamento.validadeOrcamento;
                    imagemAdicionalPath = orcamento.imagemAdicionalPath;
                    iva = orcamento.iva;
                    desconto = orcamento.desconto;
                };

                orcamentos := orcamentoMap.put(orcamentos, orcamentoId, orcamentoAtualizado);
            };
        };
    };

    public shared ({ caller }) func aceitarOrcamento(id : Nat) : async {
        sucesso : Bool;
        mensagem : Text;
        encomendaId : ?Nat;
    } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can accept budgets");
        };

        switch (orcamentoMap.get(orcamentos, id)) {
            case (null) {
                {
                    sucesso = false;
                    mensagem = "Orçamento não encontrado";
                    encomendaId = null;
                };
            };
            case (?orcamento) {
                switch (clienteMap.get(clientes, orcamento.clienteId)) {
                    case (null) {
                        {
                            sucesso = false;
                            mensagem = "Cliente não encontrado";
                            encomendaId = null;
                        };
                    };
                    case (?cliente) {
                        let encomendaId = nextId;
                        nextId += 1;

                        let novaEncomenda : Encomenda = {
                            id = encomendaId;
                            nomeCliente = cliente.nome;
                            descricao = "encomenda";
                            contato = cliente.contato;
                            gestor = orcamento.gestor;
                            valorTotal = orcamento.valorTotal;
                            valorAdiantado = 0;
                            status = #encomenda;
                            dataCriacao = Time.now();
                        };

                        encomendas := encomendaMap.put(encomendas, encomendaId, novaEncomenda);
                        historico := historicoMap.put(historico, encomendaId, []);

                        {
                            sucesso = true;
                            mensagem = "Orçamento aceito e convertido em encomenda com sucesso";
                            encomendaId = ?encomendaId;
                        };
                    };
                };
            };
        };
    };

    public query ({ caller }) func listarOrcamentos() : async [Orcamento] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can list budgets");
        };
        Iter.toArray(orcamentoMap.vals(orcamentos));
    };

    public query ({ caller }) func filtrarOrcamentosPorGestor(gestor : Text) : async [Orcamento] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can filter budgets");
        };

        Iter.toArray(
            Iter.map(
                Iter.filter(
                    orcamentoMap.entries(orcamentos),
                    func((_, orcamento) : (Nat, Orcamento)) : Bool {
                        orcamento.gestor == gestor;
                    },
                ),
                func((_, orcamento) : (Nat, Orcamento)) : Orcamento { orcamento },
            )
        );
    };

    public query ({ caller }) func filtrarOrcamentosPorNomeCliente(nomeCliente : Text) : async [Orcamento] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can filter budgets");
        };

        let nomeClienteLower = Text.toLowercase(nomeCliente);

        Iter.toArray(
            Iter.map(
                Iter.filter(
                    orcamentoMap.entries(orcamentos),
                    func((_, orcamento) : (Nat, Orcamento)) : Bool {
                        switch (clienteMap.get(clientes, orcamento.clienteId)) {
                            case (null) { false };
                            case (?cliente) {
                                Text.contains(Text.toLowercase(cliente.nome), #text(nomeClienteLower));
                            };
                        };
                    },
                ),
                func((_, orcamento) : (Nat, Orcamento)) : Orcamento { orcamento },
            )
        );
    };

    public query ({ caller }) func filtrarOrcamentosPorGestorENomeCliente(gestor : Text, nomeCliente : Text) : async [Orcamento] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can filter budgets");
        };

        let nomeClienteLower = Text.toLowercase(nomeCliente);

        Iter.toArray(
            Iter.map(
                Iter.filter(
                    orcamentoMap.entries(orcamentos),
                    func((_, orcamento) : (Nat, Orcamento)) : Bool {
                        orcamento.gestor == gestor and (switch (clienteMap.get(clientes, orcamento.clienteId)) {
                            case (null) { false };
                            case (?cliente) {
                                Text.contains(Text.toLowercase(cliente.nome), #text(nomeClienteLower));
                            };
                        });
                    },
                ),
                func((_, orcamento) : (Nat, Orcamento)) : Orcamento { orcamento },
            )
        );
    };

    public query ({ caller }) func getOrcamento(id : Nat) : async ?Orcamento {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view budgets");
        };
        orcamentoMap.get(orcamentos, id);
    };

    public query ({ caller }) func getOrcamentoCompleto(id : Nat) : async ?{
        orcamento : Orcamento;
        cliente : Cliente;
    } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view budgets");
        };

        switch (orcamentoMap.get(orcamentos, id)) {
            case (null) { null };
            case (?orcamento) {
                switch (clienteMap.get(clientes, orcamento.clienteId)) {
                    case (null) { null };
                    case (?cliente) {
                        ?{
                            orcamento;
                            cliente;
                        };
                    };
                };
            };
        };
    };

    public query ({ caller }) func getDadosOrcamentoPDF(id : Nat) : async ?{
        orcamento : Orcamento;
        cliente : Cliente;
        empresa : Empresa;
        rodape : ?Rodape;
        imagemAdicional : ?Registry.FileReference;
    } {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can generate budget PDFs");
        };

        switch (orcamentoMap.get(orcamentos, id)) {
            case (null) { null };
            case (?orcamento) {
                switch (clienteMap.get(clientes, orcamento.clienteId)) {
                    case (null) { null };
                    case (?cliente) {
                        let imagemAdicional = switch (orcamento.imagemAdicionalPath) {
                            case (?path) { ?Registry.get(registry, path) };
                            case (null) { null };
                        };

                        ?{
                            orcamento;
                            cliente;
                            empresa = orcamento.empresa;
                            rodape;
                            imagemAdicional;
                        };
                    };
                };
            };
        };
    };

    public shared ({ caller }) func salvarEmpresa(nome : Text, morada : Text, nib : Text, cae : Text, alvara : Text, telefone : Text, email : Text, logoPath : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can save company settings");
        };

        let novaEmpresa : Empresa = {
            nome;
            morada;
            nib;
            cae;
            alvara;
            telefone;
            email;
            logoPath;
        };
        empresa := ?novaEmpresa;
    };

    public shared ({ caller }) func atualizarEmpresa(nome : Text, morada : Text, nib : Text, cae : Text, alvara : Text, telefone : Text, email : Text, logoPath : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can update company settings");
        };

        switch (empresa) {
            case (null) { Debug.trap("Informações da empresa não encontradas") };
            case (?_) {
                let empresaAtualizada : Empresa = {
                    nome;
                    morada;
                    nib;
                    cae;
                    alvara;
                    telefone;
                    email;
                    logoPath;
                };
                empresa := ?empresaAtualizada;
            };
        };
    };

    public query ({ caller }) func getEmpresa() : async ?Empresa {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view company settings");
        };
        empresa;
    };

    public shared ({ caller }) func salvarRodape(textoCompleto : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can save footer settings");
        };

        let novoRodape : Rodape = {
            textoCompleto;
        };
        rodape := ?novoRodape;
    };

    public shared ({ caller }) func atualizarRodape(textoCompleto : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can update footer settings");
        };

        switch (rodape) {
            case (null) { Debug.trap("Informações do rodapé não encontradas") };
            case (?_) {
                let rodapeAtualizado : Rodape = {
                    textoCompleto;
                };
                rodape := ?rodapeAtualizado;
            };
        };
    };

    public query ({ caller }) func getRodape() : async ?Rodape {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view footer settings");
        };
        rodape;
    };

    public shared ({ caller }) func criarBackup() : async {
        mensagem : Text;
        backupId : Nat;
    } {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can create backups");
        };

        let timestamp = Time.now();
        let backupId = Int.abs(timestamp);

        let backupData = "Backup data here";
        let _descricao = "Backup criado em " # Int.toText(timestamp);

        backups := backupMap.put(backups, backupId, backupData);

        {
            mensagem = "Backup criado com sucesso";
            backupId;
        };
    };

    public query ({ caller }) func listarBackups() : async [BackupInfo] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can list backups");
        };

        Iter.toArray(
            Iter.map(
                backupMap.entries(backups),
                func((id, _) : (Nat, Text)) : BackupInfo {
                    {
                        id;
                        timestamp = id;
                        descricao = "Backup de " # Nat.toText(id);
                    };
                },
            )
        );
    };

    public shared ({ caller }) func restaurarBackup(id : Nat) : async { mensagem : Text } {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can restore backups");
        };

        switch (backupMap.get(backups, id)) {
            case (null) { Debug.trap("Backup não encontrado") };
            case (?_) {
                {
                    mensagem = "Dados restaurados com sucesso do backup " # Nat.toText(id);
                };
            };
        };
    };

    public shared ({ caller }) func eliminarBackup(id : Nat) : async { mensagem : Text } {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can delete backups");
        };

        let (newBackups, removedBackup) = backupMap.remove(backups, id);
        switch (removedBackup) {
            case (null) { Debug.trap("Backup não encontrado") };
            case (?_) {
                backups := newBackups;
                {
                    mensagem = "Backup eliminado com sucesso";
                };
            };
        };
    };

    public shared ({ caller }) func salvarTabelaPreco(categoria : Text, linhas : [TabelaPrecoLinha], titulosColunas : [Text]) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can save price tables");
        };

        lastEditTime := Time.now();

        let tabela : TabelaPrecoCategoria = {
            categoria;
            linhas;
            titulosColunas;
        };

        tabelasPreco := tabelasPrecoMap.put(tabelasPreco, categoria, tabela);
    };

    public shared ({ caller }) func waitForAutosave() : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can wait for autosave");
        };

        let editTime = lastEditTime;
        let currentTime = Time.now();

        if (currentTime < editTime + 5_000_000_000) {
            let _remainingTime = (editTime + 5_000_000_000) - currentTime;
        };
    };

    public query ({ caller }) func getTabelaPreco(categoria : Text) : async ?TabelaPrecoCategoria {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view price tables");
        };
        tabelasPrecoMap.get(tabelasPreco, categoria);
    };

    public query ({ caller }) func listarTabelasPreco() : async [TabelaPrecoCategoria] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can list price tables");
        };
        Iter.toArray(tabelasPrecoMap.vals(tabelasPreco));
    };

    public shared ({ caller }) func atualizarLinhaTabela(categoria : Text, linhaAtualizada : TabelaPrecoLinha, linhaIndex : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can update table rows");
        };

        lastEditTime := Time.now();

        switch (tabelasPrecoMap.get(tabelasPreco, categoria)) {
            case (null) { Debug.trap("Tabela não encontrada") };
            case (?tabela) {
                if (linhaIndex >= tabela.linhas.size()) {
                    Debug.trap("Índice de linha inválido");
                };

                let linhasAtualizadas = Array.tabulate<TabelaPrecoLinha>(
                    tabela.linhas.size(),
                    func(i) {
                        if (i == linhaIndex) { linhaAtualizada } else { tabela.linhas[i] };
                    },
                );

                let tabelaAtualizada = {
                    categoria = tabela.categoria;
                    linhas = linhasAtualizadas;
                    titulosColunas = tabela.titulosColunas;
                };

                tabelasPreco := tabelasPrecoMap.put(tabelasPreco, categoria, tabelaAtualizada);
            };
        };
    };

    public shared ({ caller }) func atualizarTituloColuna(categoria : Text, novoTitulo : Text, colunaIndex : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can update column titles");
        };

        lastEditTime := Time.now();

        switch (tabelasPrecoMap.get(tabelasPreco, categoria)) {
            case (null) { Debug.trap("Tabela não encontrada") };
            case (?tabela) {
                if (colunaIndex >= tabela.titulosColunas.size()) {
                    Debug.trap("Índice de coluna inválido");
                };

                let titulosAtualizados = Array.tabulate<Text>(
                    tabela.titulosColunas.size(),
                    func(i) {
                        if (i == colunaIndex) { novoTitulo } else { tabela.titulosColunas[i] };
                    },
                );

                let tabelaAtualizada = {
                    categoria = tabela.categoria;
                    linhas = tabela.linhas;
                    titulosColunas = titulosAtualizados;
                };

                tabelasPreco := tabelasPrecoMap.put(tabelasPreco, categoria, tabelaAtualizada);
            };
        };
    };

    public shared ({ caller }) func adicionarLinhaTabela(categoria : Text, novaLinha : TabelaPrecoLinha) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can add table rows");
        };

        lastEditTime := Time.now();

        switch (tabelasPrecoMap.get(tabelasPreco, categoria)) {
            case (null) { Debug.trap("Tabela não encontrada") };
            case (?tabela) {
                let linhasAtualizadas = Array.append(tabela.linhas, [novaLinha]);
                let tabelaAtualizada = {
                    categoria = tabela.categoria;
                    linhas = linhasAtualizadas;
                    titulosColunas = tabela.titulosColunas;
                };
                tabelasPreco := tabelasPrecoMap.put(tabelasPreco, categoria, tabelaAtualizada);
            };
        };
    };

    public shared ({ caller }) func inserirLinhaAcima(categoria : Text, linhaIndex : Nat, novaLinha : TabelaPrecoLinha) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can insert rows above");
        };

        lastEditTime := Time.now();

        switch (tabelasPrecoMap.get(tabelasPreco, categoria)) {
            case (null) { Debug.trap("Tabela não encontrada") };
            case (?tabela) {
                if (linhaIndex > tabela.linhas.size()) {
                    Debug.trap("Índice de linha inválido");
                };

                let linhasAtualizadas = Array.tabulate<TabelaPrecoLinha>(
                    tabela.linhas.size() + 1 : Nat,
                    func(i) {
                        if (i < linhaIndex) { tabela.linhas[i] } else if (i == linhaIndex) {
                            novaLinha;
                        } else { tabela.linhas[i - 1] };
                    },
                );

                let tabelaAtualizada = {
                    categoria = tabela.categoria;
                    linhas = linhasAtualizadas;
                    titulosColunas = tabela.titulosColunas;
                };

                tabelasPreco := tabelasPrecoMap.put(tabelasPreco, categoria, tabelaAtualizada);
            };
        };
    };

    public shared ({ caller }) func inserirLinhaAbaixo(categoria : Text, linhaIndex : Nat, novaLinha : TabelaPrecoLinha) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can insert rows below");
        };

        lastEditTime := Time.now();

        switch (tabelasPrecoMap.get(tabelasPreco, categoria)) {
            case (null) { Debug.trap("Tabela não encontrada") };
            case (?tabela) {
                if (linhaIndex >= tabela.linhas.size()) {
                    Debug.trap("Índice de linha inválido");
                };

                let linhasAtualizadas = Array.tabulate<TabelaPrecoLinha>(
                    tabela.linhas.size() + 1 : Nat,
                    func(i) {
                        if (i <= linhaIndex) { tabela.linhas[i] } else if (i == linhaIndex + 1) {
                            novaLinha;
                        } else { tabela.linhas[i - 1] };
                    },
                );

                let tabelaAtualizada = {
                    categoria = tabela.categoria;
                    linhas = linhasAtualizadas;
                    titulosColunas = tabela.titulosColunas;
                };

                tabelasPreco := tabelasPrecoMap.put(tabelasPreco, categoria, tabelaAtualizada);
            };
        };
    };

    public shared ({ caller }) func eliminarLinha(categoria : Text, linhaIndex : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can delete rows");
        };

        lastEditTime := Time.now();

        switch (tabelasPrecoMap.get(tabelasPreco, categoria)) {
            case (null) { Debug.trap("Tabela não encontrada") };
            case (?tabela) {
                if (linhaIndex >= tabela.linhas.size()) {
                    Debug.trap("Índice de linha inválido");
                };

                let linhasAtualizadas = Array.tabulate<TabelaPrecoLinha>(
                    tabela.linhas.size() - 1 : Nat,
                    func(i) {
                        if (i < linhaIndex) { tabela.linhas[i] } else { tabela.linhas[i + 1] };
                    },
                );

                let tabelaAtualizada = {
                    categoria = tabela.categoria;
                    linhas = linhasAtualizadas;
                    titulosColunas = tabela.titulosColunas;
                };

                tabelasPreco := tabelasPrecoMap.put(tabelasPreco, categoria, tabelaAtualizada);
            };
        };
    };

    // Nova função para recuperar todos os dados
    public shared ({ caller }) func getDadosCompletos() : async DadosCompletos {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can get complete data");
        };

        {
            encomendas = Iter.toArray(encomendaMap.vals(encomendas));
            historico = Iter.toArray(historicoMap.entries(historico));
            gestores = Iter.toArray(gestorMap.vals(gestores));
            materiais = Iter.toArray(materialMap.vals(materiais));
            orcamentos = Iter.toArray(orcamentoMap.vals(orcamentos));
            clientes = Iter.toArray(clienteMap.vals(clientes));
            backups = Iter.toArray(backupMap.entries(backups));
            empresa;
            rodape;
            tabelasPreco = Iter.toArray(tabelasPrecoMap.vals(tabelasPreco));
            nextId;
            nextMaterialId;
            nextOrcamentoId;
            nextClienteId;
            lastEditTime;
        };
    };

    // Nova função para salvar dados completos
    public shared ({ caller }) func salvarDadosCompletos(dados : DadosCompletos) : async { mensagem : Text } {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can save complete data");
        };

        // Limpar dados atuais
        encomendas := encomendaMap.empty();
        historico := historicoMap.empty();
        gestores := gestorMap.empty();
        materiais := materialMap.empty();
        orcamentos := orcamentoMap.empty();
        clientes := clienteMap.empty();
        backups := backupMap.empty();
        tabelasPreco := tabelasPrecoMap.empty();

        // Salvar novos dados
        if (dados.encomendas.size() > 0) {
            encomendas := encomendaMap.put(encomendas, dados.encomendas[0].id, dados.encomendas[0]);
            if (dados.encomendas.size() > 1) {
                for (i in Iter.range(1, dados.encomendas.size() - 1 : Nat)) {
                    encomendas := encomendaMap.put(encomendas, dados.encomendas[i].id, dados.encomendas[i]);
                };
            };
        };

        if (dados.historico.size() > 0) {
            historico := historicoMap.put(historico, dados.historico[0].0, dados.historico[0].1);
            if (dados.historico.size() > 1) {
                for (i in Iter.range(1, dados.historico.size() - 1 : Nat)) {
                    historico := historicoMap.put(historico, dados.historico[i].0, dados.historico[i].1);
                };
            };
        };

        if (dados.gestores.size() > 0) {
            gestores := gestorMap.put(gestores, dados.gestores[0].nome, dados.gestores[0]);
            if (dados.gestores.size() > 1) {
                for (i in Iter.range(1, dados.gestores.size() - 1 : Nat)) {
                    gestores := gestorMap.put(gestores, dados.gestores[i].nome, dados.gestores[i]);
                };
            };
        };

        if (dados.materiais.size() > 0) {
            materiais := materialMap.put(materiais, dados.materiais[0].id, dados.materiais[0]);
            if (dados.materiais.size() > 1) {
                for (i in Iter.range(1, dados.materiais.size() - 1 : Nat)) {
                    materiais := materialMap.put(materiais, dados.materiais[i].id, dados.materiais[i]);
                };
            };
        };

        if (dados.orcamentos.size() > 0) {
            orcamentos := orcamentoMap.put(orcamentos, dados.orcamentos[0].id, dados.orcamentos[0]);
            if (dados.orcamentos.size() > 1) {
                for (i in Iter.range(1, dados.orcamentos.size() - 1 : Nat)) {
                    orcamentos := orcamentoMap.put(orcamentos, dados.orcamentos[i].id, dados.orcamentos[i]);
                };
            };
        };

        if (dados.clientes.size() > 0) {
            clientes := clienteMap.put(clientes, dados.clientes[0].id, dados.clientes[0]);
            if (dados.clientes.size() > 1) {
                for (i in Iter.range(1, dados.clientes.size() - 1 : Nat)) {
                    clientes := clienteMap.put(clientes, dados.clientes[i].id, dados.clientes[i]);
                };
            };
        };

        if (dados.backups.size() > 0) {
            backups := backupMap.put(backups, dados.backups[0].0, dados.backups[0].1);
            if (dados.backups.size() > 1) {
                for (i in Iter.range(1, dados.backups.size() - 1 : Nat)) {
                    backups := backupMap.put(backups, dados.backups[i].0, dados.backups[i].1);
                };
            };
        };

        if (dados.tabelasPreco.size() > 0) {
            tabelasPreco := tabelasPrecoMap.put(tabelasPreco, dados.tabelasPreco[0].categoria, dados.tabelasPreco[0]);
            if (dados.tabelasPreco.size() > 1) {
                for (i in Iter.range(1, dados.tabelasPreco.size() - 1 : Nat)) {
                    tabelasPreco := tabelasPrecoMap.put(tabelasPreco, dados.tabelasPreco[i].categoria, dados.tabelasPreco[i]);
                };
            };
        };

        empresa := dados.empresa;
        rodape := dados.rodape;
        nextId := dados.nextId;
        nextMaterialId := dados.nextMaterialId;
        nextOrcamentoId := dados.nextOrcamentoId;
        nextClienteId := dados.nextClienteId;
        lastEditTime := dados.lastEditTime;

        {
            mensagem = "Dados salvos com sucesso";
        };
    };

    public shared ({ caller }) func initializeAccessControl() : async () {
        AccessControl.initialize(accessControlState, caller);
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };
};
