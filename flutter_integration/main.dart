import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';

void main() async {
  // Garante que os bindings do Flutter estejam inicializados antes de códigos nativos/async
  WidgetsFlutterBinding.ensureInitialized();

  // =======================================================================
  // INICIALIZAÇÃO DO SUPABASE (SÓCIO TÉCNICO V1)
  // Substitua os placeholders abaixo pelas chaves reais obtidas no seu Painel Supabase:
  // Projeto -> Project Settings -> API
  // =======================================================================
  await Supabase.initialize(
    url: '[SUA_URL_AQUI]', // Ex: 'https://xyzdomainok.supabase.co'
    anonKey: '[SUA_CHAVE_ANONIMA_AQUI]', // Ex: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  );

  runApp(const CasaFacilApp());
}

class CasaFacilApp extends StatelessWidget {
  const CasaFacilApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CasaFácil Match',
      theme: ThemeData(
        useMaterial3: true,
        fontFamily: 'Playfair Display', // Tipografia sofisticada do app
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF001226), // Navy de luxo
          primary: const Color(0xFF001226),
          secondary: const Color(0xFFC5A059), // Tons em Gold refinado
        ),
      ),
      home: const HomeScreenPlaceholder(),
    );
  }
}

/// Tela de demonstração temporária enquanto as demais telas do Flutter são integradas
class HomeScreenPlaceholder extends StatefulWidget {
  const HomeScreenPlaceholder({super.key});

  @override
  State<HomeScreenPlaceholder> createState() => _HomeScreenPlaceholderState();
}

class _HomeScreenPlaceholderState extends State<HomeScreenPlaceholder> {
  final SupabaseService _supabaseService = SupabaseService();
  bool _isLoading = false;
  List<ImovelModel> _imoveis = [];

  @override
  void initState() {
    super.initState();
    _carregarFeed();
  }

  Future<void> _carregarFeed() async {
    setState(() => _isLoading = true);
    try {
      final feed = await _supabaseService.buscarImoveisFeed();
      setState(() {
        _imoveis = feed;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erro ao carregar imóveis: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CasaFácil Match - V1'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _imoveis.isEmpty
              ? const Center(child: Text('Nenhum imóvel disponível para Palhoça, São José ou Florianópolis.'))
              : ListView.builder(
                  itemCount: _imoveis.length,
                  itemBuilder: (context, index) {
                    final imovel = _imoveis[index];
                    return ListTile(
                      title: Text(imovel.titulo),
                      subtitle: Text('${imovel.bairro} - ${imovel.cidade}'),
                      trailing: Text(
                        'R\$ ${imovel.preco.toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    );
                  },
                ),
    );
  }
}
