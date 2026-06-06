import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'supabase_service.dart';

/// =======================================================================
/// PLAYGROUND VIP SÓCIO TÉCNICO V1: ADICIONAR IMÓVEL
/// Tela de Cadastro de Imóveis no Flutter integrada ao Supabase regional.
/// =======================================================================
class AddPropertyScreen extends StatefulWidget {
  final VoidCallback onSuccess;

  const AddPropertyScreen({
    super.key,
    required this.onSuccess,
  });

  @override
  State<AddPropertyScreen> createState() => _AddPropertyScreenState();
}

class _AddPropertyScreenState extends State<AddPropertyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _supabaseService = SupabaseService();

  // Controllers para Campos de Texto
  final _tituloController = TextEditingController();
  final _descricaoController = TextEditingController();
  final _cepController = TextEditingController();
  final _bairroController = TextEditingController();
  final _ruaController = TextEditingController();
  final _numeroController = TextEditingController();
  final _precoController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _fotoUrlController = TextEditingController();

  // Estados & Cidades carregados Dinamicamente da API Oficial do IBGE
  List<Map<String, dynamic>> _estados = [];
  List<String> _cidades = [];
  String? _estadoSelecionado; // Sigla do estado escolhido (ex: 'RJ')
  String? _cidadeSelecionada; // Nome da cidade escolhida
  bool _loadingEstados = false;
  bool _loadingCidades = false;

  @override
  void initState() {
    super.initState();
    _carregarEstadosIBGE();
  }

  Future<void> _carregarEstadosIBGE() async {
    setState(() => _loadingEstados = true);
    try {
      final client = HttpClient();
      final request = await client.getUrl(Uri.parse('https://servicodados.ibge.gov.br/api/v1/localidades/estados'));
      final response = await request.close();
      if (response.statusCode == 200) {
        final content = await response.transform(utf8.decoder).join();
        final List<dynamic> data = json.decode(content);
        final List<Map<String, dynamic>> estadosMapeados = data.map<Map<String, dynamic>>((e) => {
          'sigla': e['sigla'].toString(),
          'nome': e['nome'].toString(),
        }).toList();
        
        estadosMapeados.sort((a, b) => a['nome'].toString().compareTo(b['nome'].toString()));

        setState(() {
          _estados = estadosMapeados;
        });
      }
      client.close();
    } catch (e) {
      debugPrint('Erro ao buscar estados do IBGE: $e');
    } finally {
      setState(() => _loadingEstados = false);
    }
  }

  Future<void> _carregarCidadesIBGE(String uf) async {
    setState(() {
      _loadingCidades = true;
      _cidades = [];
      _cidadeSelecionada = null;
    });
    try {
      final client = HttpClient();
      final request = await client.getUrl(Uri.parse('https://servicodados.ibge.gov.br/api/v1/localidades/estados/$uf/municipios'));
      final response = await request.close();
      if (response.statusCode == 200) {
        final content = await response.transform(utf8.decoder).join();
        final List<dynamic> data = json.decode(content);
        final List<String> cidadesMapeadas = data.map<String>((e) => e['nome'].toString()).toList();
        
        cidadesMapeadas.sort((a, b) => a.compareTo(b));

        setState(() {
          _cidades = cidadesMapeadas;
        });
      }
      client.close();
    } catch (e) {
      debugPrint('Erro ao buscar cidades do IBGE: $e');
    } finally {
      setState(() => _loadingCidades = false);
    }
  }

  // Atributos adicionais do imóvel
  int _quartos = 2;
  int _banheiros = 1;
  int _vagas = 1;
  bool _cozinhaEquipada = true;
  bool _areaServico = true;
  bool _mobiliado = false;

  bool _isLoading = false;

  @override
  void dispose() {
    _tituloController.dispose();
    _descricaoController.dispose();
    _cepController.dispose();
    _bairroController.dispose();
    _ruaController.dispose();
    _numeroController.dispose();
    _precoController.dispose();
    _whatsappController.dispose();
    _fotoUrlController.dispose();
    super.dispose();
  }

  /// Método de salvamento no Supabase
  Future<void> _submeterAnuncio() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final novoImovel = ImovelModel(
        titulo: _tituloController.text.trim(),
        descricao: _descricaoController.text.trim(),
        preco: double.parse(_precoController.text.trim()),
        bairro: _bairroController.text.trim(),
        cidade: _cidadeSelecionada,
        estado: _estadoSelecionado ?? '',
        cep: _cepController.text.trim(),
        rua: _ruaController.text.trim(),
        numero: _numeroController.text.trim(),
        whatsappProprietario: _whatsappController.text.trim(),
        fotoUrl: _fotoUrlController.text.trim(),
        quartos: _quartos,
        banheiros: _banheiros,
        vagas: _vagas,
        cozinhaEquipada: _cozinhaEquipada,
        areaServico: _areaServico,
        mobiliado: _mobiliado,
        status: 'disponivel',
      );

      await _supabaseService.publicarImovel(novoImovel);

      // Feedback visual refinado (Cores de sucesso / gold)
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFFC5A059),
            content: Text(
              'Imóvel publicado no Painel VIP regional com sucesso!',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        );
        widget.onSuccess();
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red[900],
            content: Text('Falha ao publicar imóvel no Supabase: $e'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    // Definindo a paleta de cores super premium do CasaFácil
    const navyBackground = Color(0xFF001226);
    const goldAccent = Color(0xFFC5A059);
    const softNavy = Color(0xFF0C2440);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        iconTheme: const IconThemeData(color: Colors.white),
        backgroundColor: navyBackground,
        title: const Text(
          '➕ Publicar Novo Imóvel',
          style: TextStyle(
            fontFamily: 'Playfair Display',
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(goldAccent),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Tag VIP Info
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: navyBackground.withOpacity(0.05),
                        border: Border.all(color: goldAccent.withOpacity(0.3)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.stars, color: goldAccent, size: 20),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Você está publicando em escala nacional. Exclusivo para imobiliárias e proprietários cadastrados.',
                              style: TextStyle(
                                fontSize: 11,
                                color: navyBackground,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // TÍTULO DO ANÚNCIO
                    _buildSectionTitle('1. Informações Básicas de Divulgação'),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _tituloController,
                      maxLength: 40,
                      decoration: const InputDecoration(
                        labelText: 'Título do Anúncio (Ex: Loft no Centro) *',
                        border: OutlineInputBorder(),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: goldAccent, width: 2),
                        ),
                      ),
                      validator: (value) => value == null || value.trim().isEmpty
                          ? 'Diga um título elegante para o seu anúncio.'
                          : null,
                    ),
                    const SizedBox(height: 16),

                    // TELEFONE WHATSAPP
                    TextFormField(
                      controller: _whatsappController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'WhatsApp do Proprietário (Somente Números) *',
                        prefixIcon: Icon(Icons.phone, color: goldAccent),
                        border: OutlineInputBorder(),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: goldAccent, width: 2),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'WhatsApp obrigatório para contato direto do match.';
                        }
                        if (value.length < 10) {
                          return 'Insira DDD + Telefone completo.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // PREÇO DO ALUGUEL
                    TextFormField(
                      controller: _precoController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'Preço Mensal do Aluguel (R\$) *',
                        prefixIcon: Icon(Icons.attach_money, color: goldAccent),
                        border: OutlineInputBorder(),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: goldAccent, width: 2),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Informe o valor mensal para o aluguel.';
                        }
                        if (double.tryParse(value) == null) {
                          return 'Valor inválido de moeda.';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),

                    // DESCRIÇÃO
                    TextFormField(
                      controller: _descricaoController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        labelText: 'Descrição detalhada do imóvel *',
                        border: OutlineInputBorder(),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: goldAccent, width: 2),
                        ),
                      ),
                      validator: (value) => value == null || value.trim().isEmpty
                          ? 'Descreva o imóvel para qualificar melhor os inquilinos.'
                          : null,
                    ),
                    const SizedBox(height: 24),

                    // ENDEREÇO DA ESCALA NACIONAL
                    _buildSectionTitle('2. Endereço Completo (Escala Nacional)'),
                    const SizedBox(height: 12),

                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ESTADO SELECIONADO DA INDICAÇÃO DO IBGE
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _estadoSelecionado,
                            decoration: InputDecoration(
                              labelText: _loadingEstados ? 'Buscando Estados...' : 'Estado (UF) *',
                              border: const OutlineInputBorder(),
                              focusedBorder: const OutlineInputBorder(
                                borderSide: BorderSide(color: goldAccent, width: 2),
                              ),
                            ),
                            dropdownColor: navyBackground,
                            style: const TextStyle(color: navyBackground),
                            iconEnabledColor: goldAccent,
                            items: _estados.map((est) {
                              final sigla = est['sigla'].toString();
                              final nome = est['nome'].toString();
                              return DropdownMenuItem<String>(
                                value: sigla,
                                child: Text(
                                  '$sigla - $nome',
                                  style: const TextStyle(
                                    color: navyBackground,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                  ),
                                ),
                              );
                            }).toList(),
                            onChanged: _loadingEstados ? null : (String? novoEstado) {
                              if (novoEstado != null) {
                                setState(() {
                                  _estadoSelecionado = novoEstado;
                                });
                                _carregarCidadesIBGE(novoEstado);
                              }
                            },
                            validator: (value) => value == null ? 'Selecione o Estado' : null,
                          ),
                        ),
                        const SizedBox(width: 12),

                        // CEP
                        Expanded(
                          child: TextFormField(
                            controller: _cepController,
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'CEP',
                              border: OutlineInputBorder(),
                              focusedBorder: OutlineInputBorder(
                                borderSide: BorderSide(color: goldAccent, width: 2),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // MENU SUSPENSO DA CIDADE (Estrito Escala Nacional)
                    DropdownButtonFormField<String>(
                      value: _cidadeSelecionada,
                      decoration: InputDecoration(
                        labelText: _estadoSelecionado == null 
                            ? 'Selecione o Estado Primeiro *' 
                            : (_loadingCidades ? 'Carregando Cidades...' : 'Cidade *'),
                        prefixIcon: const Icon(Icons.location_city, color: goldAccent),
                        border: const OutlineInputBorder(),
                        focusedBorder: const OutlineInputBorder(
                          borderSide: BorderSide(color: goldAccent, width: 2),
                        ),
                      ),
                      dropdownColor: navyBackground,
                      style: const TextStyle(color: navyBackground),
                      iconEnabledColor: goldAccent,
                      items: _cidades.map((String cidade) {
                        return DropdownMenuItem<String>(
                          value: cidade,
                          child: Text(
                            cidade,
                            style: const TextStyle(
                              color: navyBackground,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        );
                      }).toList(),
                      onChanged: (_estadoSelecionado == null || _loadingCidades) 
                          ? null 
                          : (String? novaCidade) {
                              setState(() {
                                _cidadeSelecionada = novaCidade;
                              });
                            },
                      validator: (value) => value == null ? 'Selecione a cidade do imóvel.' : null,
                    ),
                    const SizedBox(height: 16),

                    // BAIRRO
                    TextFormField(
                      controller: _bairroController,
                      decoration: const InputDecoration(
                        labelText: 'Bairro *',
                        border: OutlineInputBorder(),
                        focusedBorder: OutlineInputBorder(
                          borderSide: BorderSide(color: goldAccent, width: 2),
                        ),
                      ),
                      validator: (value) => value == null || value.trim().isEmpty
                          ? 'Diga o bairro de localização.'
                          : null,
                    ),
                    const SizedBox(height: 16),

                    // RUA E NÚMERO
                    Row(
                      children: [
                        Expanded(
                          flex: 3,
                          child: TextFormField(
                            controller: _ruaController,
                            decoration: const InputDecoration(
                              labelText: 'Rua',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 1,
                          child: TextFormField(
                            controller: _numeroController,
                            decoration: const InputDecoration(
                              labelText: 'Nº',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // CARACTERÍSTICAS TÉCNICAS
                    _buildSectionTitle('3. Características Internas'),
                    const SizedBox(height: 12),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _buildCounter('Quartos', _quartos, (v) => setState(() => _quartos = v)),
                        _buildCounter('Banheiros', _banheiros, (v) => setState(() => _banheiros = v)),
                        _buildCounter('Vagas Garagem', _vagas, (v) => setState(() => _vagas = v)),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // SWITCHES DE INFRAESTRUTURA
                    SwitchListTile(
                      activeColor: goldAccent,
                      title: const Text('Cozinha Equipada', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      subtitle: const Text('Armários, bancada e eletrodomésticos básicos inclusos', style: TextStyle(fontSize: 11)),
                      value: _cozinhaEquipada,
                      onChanged: (v) => setState(() => _cozinhaEquipada = v),
                    ),
                    SwitchListTile(
                      activeColor: goldAccent,
                      title: const Text('Área de Serviço Integrada', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      value: _areaServico,
                      onChanged: (v) => setState(() => _areaServico = v),
                    ),
                    SwitchListTile(
                      activeColor: goldAccent,
                      title: const Text('Mobiliado (Pronto para Morar)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      value: _mobiliado,
                      onChanged: (v) => setState(() => _mobiliado = v),
                    ),
                    const SizedBox(height: 24),

                    // FOTO PRINCIPAL
                    _buildSectionTitle('4. Mídia Exclusiva de Alto Padrão'),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _fotoUrlController,
                      decoration: const InputDecoration(
                        labelText: 'URL da Foto Principal (Hospedada)',
                        prefixIcon: Icon(Icons.photo, color: goldAccent),
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) => value == null || value.trim().isEmpty
                          ? 'Informe uma imagem ilustrativa elegante para o Match.'
                          : null,
                    ),
                    const SizedBox(height: 32),

                    // BOTÃO SUBMIT DE LUXO
                    ElevatedButton(
                      onPressed: _submeterAnuncio,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: navyBackground,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: const BorderSide(color: goldAccent, width: 1.5),
                        ),
                        elevation: 4,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.publish, color: goldAccent),
                          const SizedBox(width: 10),
                          Text(
                            _isLoading ? 'PUBLICANDO NO SUPABASE...' : 'PUBLICAR ANÚNCIO REGIONAL',
                            style: const TextStyle(
                              letterSpacing: 1.2,
                              fontWeight: FontWeight.w900,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontFamily: 'Playfair Display',
        color: Color(0xFF001226),
        fontWeight: FontWeight.bold,
        fontSize: 14,
      ),
    );
  }

  Widget _buildCounter(String label, int val, ValueChanged<int> onChange) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
        const SizedBox(height: 6),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              onPressed: val > 0 ? () => onChange(val - 1) : null,
              icon: const Icon(Icons.remove, size: 18, color: Color(0xFF001226)),
            ),
            Text('$val', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            IconButton(
              onPressed: () => onChange(val + 1),
              icon: const Icon(Icons.add, size: 18, color: Color(0xFF001226)),
            ),
          ],
        )
      ],
    );
  }
}
