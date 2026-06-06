import 'package:supabase_flutter/supabase_flutter.dart';

// =======================================================================
// MODELO DE DADOS: ImovelModel (Correspondente às colunas do Supabase)
// =======================================================================
class ImovelModel {
  final String? id;
  final String titulo;
  final String bairro;
  final double preco;
  final String fotoUrl;
  final String? descricao;
  final String? status;
  final String? cep;
  final String? estado;
  final String? cidade;
  final String? rua;
  final String? numero;
  final String? whatsappProprietario;
  final int? quartos;
  final int? banheiros;
  final int? vagas;
  final bool cozinhaEquipada;
  final bool areaServico;
  final bool mobiliado;
  final String? userId; // ID do proprietário logado que publicou o anúncio

  ImovelModel({
    this.id,
    required this.titulo,
    required this.bairro,
    required this.preco,
    required this.fotoUrl,
    this.descricao,
    this.status = 'disponivel',
    this.cep,
    this.estado,
    this.cidade,
    this.rua,
    this.numero,
    this.whatsappProprietario,
    this.quartos,
    this.banheiros,
    this.vagas,
    this.cozinhaEquipada = false,
    this.areaServico = false,
    this.mobiliado = false,
    this.userId,
  });

  /// Converte um JSON/Map vindo do Supabase para o modelo Dart
  factory ImovelModel.fromJson(Map<String, dynamic> json) {
    return ImovelModel(
      id: json['id'] as String?,
      titulo: json['titulo'] as String? ?? 'Sem título',
      bairro: json['bairro'] as String? ?? '',
      preco: (json['preco'] as num? ?? 0.0).toDouble(),
      fotoUrl: json['foto_url'] as String? ?? '',
      descricao: json['descricao'] as String?,
      status: json['status'] as String? ?? 'disponivel',
      cep: json['cep'] as String?,
      estado: json['estado'] as String?,
      cidade: json['cidade'] as String?,
      rua: json['rua'] as String?,
      numero: json['numero'] as String?,
      whatsappProprietario: json['whatsapp_proprietario'] as String?,
      quartos: json['quartos'] as int?,
      banheiros: json['banheiros'] as int?,
      vagas: json['vagas'] as int?,
      cozinhaEquipada: json['cozinha_equipada'] as bool? ?? false,
      areaServico: json['area_servico'] as bool? ?? false,
      mobiliado: json['mobiliado'] as bool? ?? false,
      userId: json['user_id'] as String?,
    );
  }

  /// Converte o nosso modelo Dart de volta para JSON para ser inserido no Supabase
  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'titulo': titulo,
      'bairro': bairro,
      'preco': preco,
      'foto_url': fotoUrl,
      'descricao': descricao,
      'status': status,
      'cep': cep,
      'estado': estado,
      'cidade': cidade,
      'rua': rua,
      'numero': numero,
      'whatsapp_proprietario': whatsappProprietario,
      'quartos': quartos,
      'banheiros': banheiros,
      'vagas': vagas,
      'cozinha_equipada': cozinhaEquipada,
      'area_servico': areaServico,
      'mobiliado': mobiliado,
      if (userId != null) 'user_id': userId,
    };
  }
}

// =======================================================================
// SERVIÇO CENTRAL: SupabaseService (Comunicação Ativa com o Banco)
// =======================================================================
class SupabaseService {
  // Obtém o cliente do Supabase de forma Singleton
  final SupabaseClient _client = Supabase.instance.client;

  /// 1. BUSCAR IMÓVEIS FEED
  /// Busca a lista de casas disponíveis de forma altamente refinada,
  /// cobrindo o escopo geográfico expandido de todos os 22 municípios da Grande Florianópolis.
  Future<List<ImovelModel>> buscarImoveisFeed() async {
    try {
      // SÓCIO TÉCNICO: Com a expansão para os 22 municípios da Grande Florianópolis,
      // buscamos todos os anúncios ativos no banco de dados regional e ordenamos pelos mais recentes.
      final List<dynamic> response = await _client
          .from('imoveis')
          .select('*')
          .eq('status', 'disponivel') // Apenas anúncios ativos
          .order('created_at', ascending: false); // Mais recentes primeiro

      // Mapeia os dados do JSON recebido para instâncias de ImovelModel
      return response
          .map((data) => ImovelModel.fromJson(data as Map<String, dynamic>))
          .toList();
    } catch (e) {
      print('[SupabaseService] Erro em buscarImoveisFeed: $e');
      rethrow;
    }
  }

  /// 2. PUBLICAR IMÓVEL
  /// Salva as informações de um imóvel real preenchidos pelo proprietário no banco do Supabase.
  Future<ImovelModel> publicarImovel(ImovelModel novoImovel) async {
    try {
      // Obtém o ID do usuário atualmente autenticado de forma robusta
      final currentUser = _client.auth.currentUser;
      
      // Vincula o ID do proprietário logado se disponível para segurança estrita
      final imovelComUsuario = ImovelModel(
        titulo: novoImovel.titulo,
        bairro: novoImovel.bairro,
        preco: novoImovel.preco,
        fotoUrl: novoImovel.fotoUrl,
        descricao: novoImovel.descricao,
        status: novoImovel.status,
        cep: novoImovel.cep,
        estado: novoImovel.estado,
        cidade: novoImovel.cidade,
        rua: novoImovel.rua,
        numero: novoImovel.numero,
        whatsappProprietario: novoImovel.whatsappProprietario ?? currentUser?.userMetadata?['whatsapp_proprietario'],
        quartos: novoImovel.quartos,
        banheiros: novoImovel.banheiros,
        vagas: novoImovel.vagas,
        cozinhaEquipada: novoImovel.cozinhaEquipada,
        areaServico: novoImovel.areaServico,
        mobiliado: novoImovel.mobiliado,
        userId: currentUser?.id, // Associa o id do usuário atual de forma automática
      );

      // Realiza a inserção na tabela 'imoveis' e retorna o objeto gravado com seu ID recém-criado
      final List<dynamic> response = await _client
          .from('imoveis')
          .insert(imovelComUsuario.toJson())
          .select();

      if (response.isEmpty) {
        throw Exception('A resposta do banco de dados retornou vazia ao inserir o imóvel.');
      }

      return ImovelModel.fromJson(response.first as Map<String, dynamic>);
    } catch (e) {
      print('[SupabaseService] Erro em publicarImovel: $e');
      rethrow;
    }
  }
}
