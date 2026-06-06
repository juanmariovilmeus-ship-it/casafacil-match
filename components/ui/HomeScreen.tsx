import React, { useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Heart, 
  User, 
  Search, 
  MapPin, 
  LogOut, 
  Loader2, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PropertyDetailScreen from './PropertyDetailScreen';
import ProfileScreen from './ProfileScreen';
import MatchesScreen from './MatchesScreen';
import AddPropertyScreen from './AddPropertyScreen';

interface Imovel {
  id: string;
  titulo: string;
  bairro: string;
  preco: number;
  foto_url: string;
  descricao?: string;
  status?: 'disponivel' | 'indisponivel';
  // Brazil-focused properties
  cep?: string;
  estado?: string;
  cidade?: string;
  rua?: string;
  numero?: string;
  whatsapp_proprietario?: string;
  quartos?: number;
  banheiros?: number;
  vagas?: number;
  cozinha_equipada?: boolean;
  area_servico?: boolean;
  mobiliado?: boolean;
  uploaded_images?: string[];
  curtidas?: number;
}

export default function HomeScreen() {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inicio');
  const [selectedImovel, setSelectedImovel] = useState<Imovel | null>(null);
  const [showAddPropertyScreen, setShowAddPropertyScreen] = useState(false);
  const [userRole, setUserRole] = useState<'cliente' | 'proprietario'>('cliente');
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [spamBlocked, setSpamBlocked] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    fetchImoveis();
    fetchUserRole();
    fetchUserFavorites();
  }, []);

  const fetchUserFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('usuario_favoritos')
          .select('imovel_id')
          .eq('user_id', user.id);
        
        if (error) {
          console.warn('Erro ao carregar favoritos do banco:', error);
          const localFavs = JSON.parse(localStorage.getItem('casafacil_local_usuario_favoritos') || '[]');
          setUserFavorites(localFavs);
        } else if (data) {
          const ids = data.map((item: any) => item.imovel_id as string);
          setUserFavorites(ids);
          localStorage.setItem('casafacil_local_usuario_favoritos', JSON.stringify(ids));
        }
      } else {
        const localFavs = JSON.parse(localStorage.getItem('casafacil_local_usuario_favoritos') || '[]');
        setUserFavorites(localFavs);
      }
    } catch (err) {
      console.error('Erro ao processar favoritos:', err);
    }
  };

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const metadata = user.user_metadata || {};
        const role = (metadata.tipo_conta || metadata.role || 'cliente') as 'cliente' | 'proprietario';
        setUserRole(role);
      }
    } catch (err) {
      console.error('Erro ao buscar o papel do usuário:', err);
    }
  };

  const fetchImoveis = async () => {
    setIsLoading(true);
    try {
      // Chamada real ao Supabase: Supabase.instance.client.from('imoveis').select()
      // DICA SÓCIO TÉCNICO: No futuro, para buscar diretamente no Supabase em tempo real com ilike, trocaríamos por:
      // const { data, error } = await supabase.from('imoveis').select('*').or(`bairro.ilike.%${searchQuery}%,cidade.ilike.%${searchQuery}%`);
      const { data, error } = await supabase
        .from('imoveis')
        .select('*');

      let baseImoveis: Imovel[] = [];
      if (error) {
        console.error('Erro ao buscar imóveis:', error);
        baseImoveis = [];
      } else {
        // ✅ Mapeia nomes das colunas do Supabase para os usados nos componentes
        baseImoveis = (data || []).map((im: any) => ({
          ...im,
          preco: im.preco_aluguel || im.preco || 0,
          foto_url: (im.fotos_urls && im.fotos_urls.length > 0) ? im.fotos_urls[0] : (im.foto_url || ''),
          uploaded_images: im.fotos_urls || [],
          quartos: im.quantidade_quartos || im.quartos || 0,
          banheiros: im.quantidade_banheiros || im.banheiros || 0,
          vagas: im.vagas_garagem || im.vagas || 0,
          status: im.status_imovel || im.status || 'disponivel',
          curtidas: im.curtidas || 0,
          whatsapp_proprietario: im.whatsapp_proprietario || '',
        }));
      }

      // Merge with offline/locally published properties
      const localAddedString = localStorage.getItem('casafacil_local_added_properties') || '[]';
      const localAdded: Imovel[] = JSON.parse(localAddedString);

      // Create indexed lookups for deduplication
      const allImoveisMap: { [key: string]: Imovel } = {};
      baseImoveis.forEach(im => {
        allImoveisMap[im.id] = im;
      });
      localAdded.forEach(im => {
        allImoveisMap[im.id] = im;
      });

      // Filter and enrich using dynamic extended metadata from localStorage
      const extendedMetadata = JSON.parse(localStorage.getItem('casafacil_extended_metadata') || '{}');
      const finalImoveis = Object.values(allImoveisMap)
        .map(imovel => {
          const metadata = extendedMetadata[imovel.id];
          if (metadata) {
            const displayBairro = [metadata.bairro, metadata.cidade, metadata.estado]
              .filter(Boolean)
              .join(', ');
            return {
              ...imovel,
              ...metadata,
              descricao: metadata.descricao || imovel.descricao,
              bairro: displayBairro || imovel.bairro,
              status: metadata.status || 'disponivel',
              preco: metadata.price_rent || imovel.preco,
              curtidas: metadata.curtidas ?? (imovel as any).curtidas ?? 0
            };
          }
          return {
            ...imovel,
            status: (imovel as any).status || 'disponivel',
            curtidas: (imovel as any).curtidas ?? 0
          };
        });

      setImoveis(finalImoveis);
    } catch (err) {
      console.error('Erro de conexão:', err);
      setImoveis([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent, imovelId: string) => {
    e.stopPropagation();
    
    // Bloqueio de spam para cliques rápidos
    if (spamBlocked[imovelId]) return;
    
    const target = imoveis.find(im => im.id === imovelId);
    if (!target || target.status === 'indisponivel') return;

    // Ativa o bloqueio de spam temporário para esse imóvel
    setSpamBlocked(prev => ({ ...prev, [imovelId]: true }));

    const isLiked = userFavorites.includes(imovelId);
    const currentLikes = target.curtidas || 0;
    const newLikes = isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

    // 1. Atualização Otimista no State React (Efeito instantâneo fluido)
    setImoveis(prev => prev.map(im => im.id === imovelId ? { ...im, curtidas: newLikes } : im));
    
    if (isLiked) {
      setUserFavorites(prev => prev.filter(id => id !== imovelId));
    } else {
      setUserFavorites(prev => [...prev, imovelId]);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Atualiza o contador de curtidas na tabela imoveis
      await supabase
        .from('imoveis')
        .update({ curtidas: newLikes })
        .eq('id', imovelId);

      if (user) {
        if (isLiked) {
          // Remove da tabela de favoritos reais do Supabase
          await supabase
            .from('usuario_favoritos')
            .delete()
            .eq('user_id', user.id)
            .eq('imovel_id', imovelId);
        } else {
          // Insere na tabela de favoritos reais do Supabase
          await supabase
            .from('usuario_favoritos')
            .insert({ user_id: user.id, imovel_id: imovelId });
        }
      }

      // Suporte para salvar em metadados offline locais
      const extendedMetadata = JSON.parse(localStorage.getItem('casafacil_extended_metadata') || '{}');
      if (!extendedMetadata[imovelId]) {
        extendedMetadata[imovelId] = {};
      }
      extendedMetadata[imovelId].curtidas = newLikes;
      localStorage.setItem('casafacil_extended_metadata', JSON.stringify(extendedMetadata));

      // Sincroniza estado de favoritos locais
      const updatedFavs = isLiked 
        ? userFavorites.filter(id => id !== imovelId) 
        : [...userFavorites, imovelId];
      localStorage.setItem('casafacil_local_usuario_favoritos', JSON.stringify(updatedFavs));

    } catch (err) {
      console.error('Erro ao processar alternância de curtida:', err);
    } finally {
      // Pequeno timer de cooldown para evitar o spam e assegurar a integridade
      setTimeout(() => {
        setSpamBlocked(prev => ({ ...prev, [imovelId]: false }));
      }, 500);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Lógica de filtragem local em tempo real (Estilo 'ilike' ignorando Case/Accents)
  const filteredImoveis = imoveis.filter(im => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    
    const matchesBairro = im.bairro ? im.bairro.toLowerCase().includes(query) : false;
    const matchesCidade = im.cidade ? im.cidade.toLowerCase().includes(query) : false;
    
    return matchesBairro || matchesCidade;
  });

  if (selectedImovel) {
    return (
      <PropertyDetailScreen 
        imovel={selectedImovel} 
        onBack={() => setSelectedImovel(null)} 
      />
    );
  }

  if (showAddPropertyScreen) {
    return (
      <AddPropertyScreen 
        onBack={() => setShowAddPropertyScreen(false)}
        onSuccess={() => {
          setShowAddPropertyScreen(false);
          fetchImoveis();
          setActiveTab('inicio');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      {/* Header Fixo */}
      <header className="bg-white border-b border-navy-100 px-6 py-4 sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-5xl mx-auto w-full">
          <div>
            {activeTab === 'inicio' && (
              <>
                <h2 className="text-[10px] uppercase tracking-[0.3em] text-navy-400 font-bold mb-0.5">Explore</h2>
                <h1 className="text-2xl font-serif text-navy-950 italic">Novas <span className="text-gold-600 not-italic font-bold">Oportunidades</span></h1>
              </>
            )}
            {activeTab === 'matches' && (
              <>
                <h2 className="text-[10px] uppercase tracking-[0.3em] text-gold-600 font-bold mb-0.5">CasaFácil Match</h2>
                <h1 className="text-2xl font-serif text-navy-950 italic">
                  {userRole === 'proprietario' ? (
                    <>Meus Imóveis</>
                  ) : (
                    <>Seus <span className="text-emerald-600 not-italic font-bold">Matches Ativos</span></>
                  )}
                </h1>
              </>
            )}
            {activeTab === 'perfil' && (
              <>
                <h2 className="text-[10px] uppercase tracking-[0.3em] text-navy-400 font-bold mb-0.5">Área do Membro</h2>
                <h1 className="text-2xl font-serif text-navy-950 italic">Configurar <span className="text-gold-600 not-italic font-bold">Perfil</span></h1>
              </>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleLogout}
            className="text-navy-400 hover:text-navy-950 hover:bg-navy-50"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
        
        {activeTab === 'inicio' && (
          <div className="max-w-5xl mx-auto mt-6 relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-navy-950" />
            <Input 
              type="text"
              placeholder="🔍 Busque por bairros e cidades em todo o Brasil..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-gold-500 text-navy-950 pl-12 h-12 rounded-xl focus-visible:ring-gold-500/50 focus-visible:border-gold-500 shadow-sm transition-all duration-300 placeholder:text-navy-300"
            />
          </div>
        )}
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 pb-24">
        {activeTab === 'inicio' ? (
          isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <Loader2 className="w-10 h-10 text-gold-600 animate-spin" />
              <p className="text-navy-400 text-xs uppercase tracking-widest animate-pulse font-medium">Curando seleção exclusiva...</p>
            </div>
          ) : imoveis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto space-y-6">
              <div className="w-16 h-16 bg-gold-50 border border-gold-200 rounded-full flex items-center justify-center text-gold-600">
                <Home className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <p className="font-serif text-lg text-navy-950 font-bold leading-relaxed">
                  Nenhuma oportunidade disponível no momento. <br className="hidden sm:inline" />
                  <span className="text-gold-600 italic font-medium">Seja o primeiro a anunciar!</span>
                </p>
              </div>
              <Button
                onClick={() => {
                  setShowAddPropertyScreen(true);
                }}
                className="bg-navy-950 hover:bg-navy-900 text-white font-bold tracking-widest uppercase text-[10px] py-4 px-6 rounded-xl cursor-pointer"
              >
                Anunciar Meu Imóvel
              </Button>
            </div>
          ) : filteredImoveis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto space-y-6">
              <div className="w-16 h-16 bg-navy-50 border border-navy-200 rounded-full flex items-center justify-center text-navy-550">
                <Search className="w-8 h-8 text-navy-950" />
              </div>
              <div className="space-y-2">
                <p className="font-serif text-lg text-navy-950 font-bold leading-relaxed">
                  Nenhum imóvel encontrado. <br className="hidden sm:inline" />
                  <span className="text-navy-500 italic font-medium text-sm">Não encontramos propriedades em "{searchQuery}"</span>
                </p>
              </div>
              <Button
                onClick={() => setSearchQuery('')}
                className="bg-navy-950 hover:bg-navy-900 text-white font-bold tracking-widest uppercase text-[10px] py-4 px-6 rounded-xl cursor-pointer"
              >
                Limpar Pesquisa
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredImoveis.map((imovel, index) => (
                  <PropertyCard 
                    key={imovel.id} 
                    imovel={imovel} 
                    index={index} 
                    onClick={() => setSelectedImovel(imovel)} // CLIQUE AQUI PARA NAVEGAR PARA DETALHES (Fase 3 Ativada!)
                    onLike={(e) => handleLike(e, imovel.id)}
                    isLiked={userFavorites.includes(imovel.id)}
                    isSpamBlocked={!!spamBlocked[imovel.id]}
                  />
                ))}
              </AnimatePresence>
            </div>
          )
        ) : activeTab === 'matches' ? (
          <MatchesScreen onOpenAddProperty={() => setShowAddPropertyScreen(true)} />
        ) : (
          <ProfileScreen onOpenAddProperty={() => setShowAddPropertyScreen(true)} />
        )}
      </main>

      {/* Barra de Navegação Inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-navy-100 px-6 py-3 flex justify-around items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] rounded-t-3xl sm:max-w-md sm:mx-auto sm:mb-4 sm:rounded-full">
        <NavButton 
          active={activeTab === 'inicio'} 
          onClick={() => setActiveTab('inicio')}
          icon={<Home className="w-5 h-5" />}
          label="Início"
        />
        <NavButton 
          active={activeTab === 'matches'} 
          onClick={() => setActiveTab('matches')}
          icon={<Heart className="w-5 h-5" />}
          label="Matches"
        />
        <NavButton 
          active={activeTab === 'perfil'} 
          onClick={() => setActiveTab('perfil')}
          icon={<User className="w-5 h-5" />}
          label="Perfil"
        />
      </nav>
    </div>
  );
}

function PropertyCard({ imovel, index, onClick, onLike, isLiked, isSpamBlocked }: { imovel: Imovel; index: number; onClick: () => void; onLike: (e: React.MouseEvent) => void; isLiked: boolean; isSpamBlocked: boolean; key?: React.Key }) {
  const isUnavailable = imovel.status === 'indisponivel';
  const hasManyLikes = (imovel.curtidas || 0) > 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-navy-50/50 relative ${
        isUnavailable ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
      }`}
      onClick={() => {
        if (!isUnavailable) {
          onClick();
        }
      }}
    >
      <div className="relative h-64 overflow-hidden">
        <motion.img 
          whileHover={isUnavailable ? {} : { scale: 1.1 }}
          transition={{ duration: 0.8 }}
          src={imovel.foto_url} 
          alt={imovel.titulo}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isUnavailable ? 'blur-[1.5px] grayscale' : 'grayscale-[20%] group-hover:grayscale-0'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Selo Destaque do Broker */}
        {!isUnavailable && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span className="text-[10px] font-bold text-navy-950 uppercase tracking-tight">Destaque</span>
          </div>
        )}

        {/* Selo Automático: Mais Curtida (> 5 curtidas) */}
        {!isUnavailable && hasManyLikes && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-rose-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 z-10 animate-pulse">
            <span className="text-[9px] font-black uppercase tracking-wider">🔥 Mais Curtida</span>
          </div>
        )}

        {/* Selo Automático: Indisponível / Alugado */}
        {isUnavailable && (
          <div className="absolute inset-0 bg-navy-950/70 backdrop-blur-[2px] flex items-center justify-center z-20">
            <div className="bg-navy-900 border border-gold-500/30 px-5 py-2.5 rounded-xl shadow-2xl text-center space-y-1">
              <span className="text-xs font-serif text-gold-500 font-extrabold uppercase tracking-[0.2em] block">Contrato Fechado</span>
              <span className="text-[10px] font-bold text-white/85 uppercase tracking-widest block font-sans">Indisponível</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center gap-1 text-gold-600 mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">{imovel.bairro}</span>
        </div>
        <h3 className="text-lg font-serif text-navy-950 font-medium mb-4 group-hover:text-gold-600 transition-colors line-clamp-1">{imovel.titulo}</h3>
        
        <div className="h-[1px] w-full bg-navy-50 mb-4" />
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[9px] text-navy-400 uppercase tracking-widest mb-1">Preço Sugerido</p>
            <p className="text-xl font-bold text-navy-950 tracking-tight">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.preco)}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Botão Curtir com quantidade em tempo real */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isUnavailable && !isSpamBlocked) {
                  onLike(e);
                }
              }}
              disabled={isUnavailable || isSpamBlocked}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-300 ${
                isUnavailable
                  ? 'bg-navy-50/30 border-none text-navy-300 cursor-not-allowed'
                  : isLiked
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:scale-105 active:scale-95 cursor-pointer shadow-sm shadow-rose-200/40'
                    : 'bg-navy-50/50 border-navy-100 text-navy-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 hover:scale-105 active:scale-95 cursor-pointer'
              } ${isSpamBlocked ? 'opacity-70 cursor-wait' : ''}`}
              title={isLiked ? "Descurtir Imóvel" : "Curtir Imóvel"}
            >
              <Heart className={`w-3.5 h-3.5 transition-transform duration-300 ${
                isLiked && !isUnavailable 
                  ? 'fill-rose-500 text-rose-500 scale-110' 
                  : 'text-current'
              }`} />
              <span className={`text-xs font-extrabold font-mono ${isLiked ? 'text-rose-600' : ''}`}>{imovel.curtidas || 0}</span>
            </button>

            {!isUnavailable ? (
              <div className="p-2 border border-navy-100 rounded-full group-hover:bg-gold-600 group-hover:border-gold-600 transition-all duration-300">
                <ChevronRight className="w-5 h-5 text-navy-400 group-hover:text-white" />
              </div>
            ) : (
              <div className="p-2 bg-navy-100/50 rounded-full text-navy-300">
                <ChevronRight className="w-5 h-5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${active ? 'text-gold-600' : 'text-navy-300 hover:text-navy-500'}`}
    >
      <div className={`p-1.5 rounded-xl transition-all ${active ? 'bg-gold-50 shadow-sm' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium tracking-wide uppercase ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
      {active && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-gold-600 rounded-full" />}
    </button>
  );
}
