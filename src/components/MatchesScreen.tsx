import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage, safeLocalStorageSetItem } from '@/src/lib/imageCompressor';
import { 
  Building, 
  CheckCircle2, 
  XCircle,
  Sparkles, 
  Smartphone, 
  History, 
  Compass, 
  Loader2,
  Plus,
  MapPin,
  Layers,
  FileText,
  Phone,
  Home,
  Check,
  X,
  Camera,
  Minus,
  Trash2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Imovel {
  id: string;
  titulo: string;
  bairro: string;
  preco: number;
  foto_url: string;
  descricao?: string;
  cep?: string;
  estado?: string;
  cidade?: string;
  whatsapp_proprietario?: string;
  status?: 'disponivel' | 'indisponivel';
  quartos?: number;
  banheiros?: number;
  vagas?: number;
  cozinha_equipada?: boolean;
  area_servico?: boolean;
  mobiliado?: boolean;
  rua?: string;
  numero?: string;
  uploaded_images?: string[];
}

interface LocalMatch {
  imovelId: string;
  approvedAt: string;
  imovel: Imovel;
}

const EXAMPLES: Imovel[] = [];

const PRESETS = [
  {
    name: 'Mansão Aurora',
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Vila Mediterrânea',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Concept Zenith',
    url: 'https://images.unsplash.com/photo-1600607687940-4e2a09695d2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Oasis Moderno',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  },
];

interface MatchesScreenProps {
  onOpenAddProperty?: () => void;
}

export default function MatchesScreen({ onOpenAddProperty }: MatchesScreenProps = {}) {
  const [role, setRole] = useState<'cliente' | 'proprietario'>('cliente');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [myApprovedMatches, setMyApprovedMatches] = useState<LocalMatch[]>([]);


  
  // Real Estate properties lists
  const [imoveis, setImoveis] = useState<Imovel[]>([]);

  // Delete dynamic modal state target
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Form view triggers
  const [showAddForm, setShowAddForm] = useState(false);
  const [publishing, setPublishing] = useState(false);
  
  // Expanded Form States 
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCEP, setNewCEP] = useState('');
  const [newEstado, setNewEstado] = useState('SC');
  const [newCidade, setNewCidade] = useState('Florianópolis');
  const [newBairro, setNewBairro] = useState('');
  const [newRua, setNewRua] = useState('');
  const [newNumero, setNewNumero] = useState('');
  const [newPrecoAluguel, setNewPrecoAluguel] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newStatus, setNewStatus] = useState<'disponivel' | 'indisponivel'>('disponivel');
  const [newFotoUrl, setNewFotoUrl] = useState('');

  // Brand-new Brazilian-focussed dynamic layout states
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const fileInputRefMulti = useRef<HTMLInputElement>(null);

  // House characteristics numerical state
  const [numQuartos, setNumQuartos] = useState<number>(2);
  const [numBanheiros, setNumBanheiros] = useState<number>(1);
  const [numVagas, setNumVagas] = useState<number>(1);

  // Yes/No Switches state
  const [cozinhaEquipada, setCozinhaEquipada] = useState<boolean>(true);
  const [areaServico, setAreaServico] = useState<boolean>(true);
  const [mobiliado, setMobiliado] = useState<boolean>(false);

  // Dynamic multi image pick simulations
  const handleMultiImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingImages(true);
    const fileList = Array.from(files).slice(0, 10);
    
    try {
      const compressedResults = await Promise.all(
        fileList.map(async (file: File) => {
          try {
            return await compressImage(file, 600, 600, 0.45);
          } catch (err) {
            console.error('Error compressing image:', err);
            return new Promise<string>((resolve) => {
              const r = new FileReader();
              r.onloadend = () => resolve(typeof r.result === 'string' ? r.result : '');
              r.onerror = () => resolve('');
              r.readAsDataURL(file);
            });
          }
        })
      );

      const validImages = compressedResults.filter(img => img !== '');

      setUploadedImages(prev => {
        const combined = [...prev, ...validImages].slice(0, 10);
        if (combined.length > 0) {
          setNewFotoUrl(combined[0]);
        }
        return combined;
      });
      toast.success(`${validImages.length} foto(s) de luxo processada(s) e otimizada(s) com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error('Ocorreu um erro ao otimizar e subir fotos.');
    } finally {
      setIsProcessingImages(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0) {
        setNewFotoUrl(updated[0]);
      } else {
        setNewFotoUrl(PRESETS[0].url);
      }
      return updated;
    });
  };

  // Fetch data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch current authentic user metadata & role
      const { data: { user } } = await supabase.auth.getUser();
      let currentRole: 'cliente' | 'proprietario' = 'cliente';
      let nameOfUser = 'Usuário VIP';
      
      if (user) {
        const metadata = user.user_metadata || {};
        currentRole = (metadata.tipo_conta || metadata.role || 'cliente') as 'cliente' | 'proprietario';
        nameOfUser = metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Usuário VIP';
        setRole(currentRole);
        setUserName(nameOfUser);
      }

      // 2. Load user-approved matches from localStorage for inquilino
      const savedMatchesString = localStorage.getItem('casafacil_matches');
      let localMatches: LocalMatch[] = [];
      if (savedMatchesString) {
        localMatches = JSON.parse(savedMatchesString);
        setMyApprovedMatches(localMatches);
      }

      // 3. Fetch properties from SB
      let baseImoveis: Imovel[] = [];
      if (user) {
        if (currentRole === 'proprietario') {
          // Fetch only owner properties
          const { data: dbData, error: dbError } = await supabase
            .from('imoveis')
            .select('*')
            .eq('user_id', user.id);

          if (!dbError && dbData) {
            baseImoveis = dbData;
          } else {
            console.warn('Erro ao buscar imóveis por user_id:', dbError);
            const { data: allData, error: allErr } = await supabase.from('imoveis').select('*');
            if (!allErr && allData) {
              const extendedMetadata = JSON.parse(localStorage.getItem('casafacil_extended_metadata') || '{}');
              baseImoveis = allData.filter(im => extendedMetadata[im.id]?.owner_id === user.id);
            }
          }
        } else {
          // Cliente fetches all properties
          const { data: dbData, error: dbError } = await supabase
            .from('imoveis')
            .select('*');
          if (!dbError && dbData) {
            baseImoveis = dbData;
          }
        }
      }

      // 4. Merge with locally added properties and custom metadata
      const localAddedString = localStorage.getItem('casafacil_local_added_properties') || '[]';
      let localAdded: Imovel[] = JSON.parse(localAddedString);

      // Filter local properties if owner is logged in
      if (user && currentRole === 'proprietario') {
        const extendedMetadata = JSON.parse(localStorage.getItem('casafacil_extended_metadata') || '{}');
        localAdded = localAdded.filter(im => {
          const meta = extendedMetadata[im.id];
          return meta?.owner_id === user.id || im.id.startsWith('prop-');
        });
      }

      // Merge maps uniquely by ID
      const allImoveisMap: { [key: string]: Imovel } = {};
      baseImoveis.forEach(im => {
        allImoveisMap[im.id] = im;
      });
      localAdded.forEach(im => {
        allImoveisMap[im.id] = im;
      });

      // Integrate extended metadata from localStorage
      const extendedMetadata = JSON.parse(localStorage.getItem('casafacil_extended_metadata') || '{}');
      const finalImoveis = Object.values(allImoveisMap).map(imovel => {
        const metadata = extendedMetadata[imovel.id];
        if (metadata) {
          const displayBairro = [metadata.bairro, metadata.cidade, metadata.estado]
            .filter(Boolean)
            .join(', ');
          return {
            ...imovel,
            descricao: metadata.descricao || imovel.descricao,
            cep: metadata.cep || imovel.cep,
            estado: metadata.estado || imovel.estado,
            cidade: metadata.cidade || imovel.cidade,
            bairro: displayBairro || imovel.bairro,
            whatsapp_proprietario: metadata.whatsapp_proprietario || imovel.whatsapp_proprietario,
            status: metadata.status || imovel.status || 'disponivel',
            preco: metadata.price_rent || imovel.preco
          };
        }
        return {
          ...imovel,
          status: imovel.status || 'disponivel'
        };
      });

      setImoveis(finalImoveis);

    } catch (e) {
      console.error('Erro ao montar MatchesScreen:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Default pre-select photo preset
    setNewFotoUrl(PRESETS[0].url);
  }, []);

  // Handler to toggle property status (Ativo <-> Inativo / Disponível <-> Indisponível)
  const handleToggleStatus = (id: string, currentStatus?: 'disponivel' | 'indisponivel') => {
    const targetStatus = currentStatus === 'indisponivel' ? 'disponivel' : 'indisponivel';
    
    // Update local storage extended metadata
    const extendedMetadata = JSON.parse(localStorage.getItem('casafacil_extended_metadata') || '{}');
    if (!extendedMetadata[id]) {
      extendedMetadata[id] = {};
    }
    extendedMetadata[id].status = targetStatus;
    safeLocalStorageSetItem('casafacil_extended_metadata', JSON.stringify(extendedMetadata));

    // Show visual confirmation
    if (targetStatus === 'disponivel') {
      toast.success('Imóvel marcado como ATIVO/DISPONÍVEL!', {
        icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      });
    } else {
      toast.error('Imóvel marcado como INATIVO/INDISPONÍVEL.', {
        icon: <XCircle className="w-4 h-4 text-rose-500" />
      });
    }

    loadData();
  };

  // Handler to permanently delete a property from both database and local cache
  const handleDeleteProperty = async (propertyId: string) => {
    setIsDeleting(true);
    try {
      // 1. Delete from Supabase
      const { error } = await supabase
        .from('imoveis')
        .delete()
        .eq('id', propertyId);

      if (error) {
        console.error('Erro ao excluir no Supabase:', error);
      }

      // 2. Also clean up local storage caches to keep client in sync
      const extendedMetadata = JSON.parse(localStorage.getItem('casafacil_extended_metadata') || '{}');
      if (extendedMetadata[propertyId]) {
        delete extendedMetadata[propertyId];
        safeLocalStorageSetItem('casafacil_extended_metadata', JSON.stringify(extendedMetadata));
      }

      const localAddedString = localStorage.getItem('casafacil_local_added_properties') || '[]';
      try {
        const localAdded: Imovel[] = JSON.parse(localAddedString);
        const filteredLocal = localAdded.filter(im => im.id !== propertyId);
        safeLocalStorageSetItem('casafacil_local_added_properties', JSON.stringify(filteredLocal));
      } catch (e) {
        console.error('Erro ao limpar localAdded em exclusão:', e);
      }

      toast.success('Anúncio excluído com sucesso!');
      setImoveis(prev => prev.filter(im => im.id !== propertyId));
    } catch (err) {
      console.error('Erro ao deletar anúncio:', err);
      toast.error('Erro ao excluir anúncio.');
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  // Handler to publish a new property
  const handlePublishProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBairro || !newPrecoAluguel || !newWhatsapp) {
      toast.error('Preencha os campos obrigatórios (Título, Bairro, Preço do Aluguel e WhatsApp).');
      return;
    }

    setPublishing(true);
    try {
      const generatedId = `prop-${Date.now()}`;
      const rentValue = Number(newPrecoAluguel);
      const combinedBairro = [newBairro, newCidade, newEstado].filter(Boolean).join(', ');
      
      // Determine primary image
      const primaryImage = uploadedImages.length > 0 ? uploadedImages[0] : (newFotoUrl || PRESETS[0].url);

      // 1. Save standard fields in Supabase if allowed, else use custom backend
      let supabaseSuccess = false;
      let remoteId = '';
      const { data: { user } } = await supabase.auth.getUser();

      try {
        const insertPayload: any = {
          titulo: newTitle,
          bairro: combinedBairro || newBairro,
          preco: rentValue,
          foto_url: primaryImage,
        };
        if (user) {
          insertPayload.user_id = user.id;
        }

        const { data, error } = await supabase.from('imoveis').insert([insertPayload]).select();
        
        if (!error && data && data.length > 0) {
          supabaseSuccess = true;
          remoteId = data[0].id;
        }
      } catch (dbErr) {
        console.warn('Supabase insert bypassed or rejected: saving fully locally.', dbErr);
      }

      const activeId = supabaseSuccess ? remoteId : generatedId;

      const newPropertyObject: Imovel = {
        id: activeId,
        titulo: newTitle,
        bairro: combinedBairro,
        preco: rentValue,
        foto_url: primaryImage,
        descricao: newDesc,
        cep: newCEP,
        estado: newEstado,
        cidade: newCidade,
        rua: newRua,
        numero: newNumero,
        whatsapp_proprietario: newWhatsapp,
        status: newStatus,
        quartos: numQuartos,
        banheiros: numBanheiros,
        vagas: numVagas,
        cozinha_equipada: cozinhaEquipada,
        area_servico: areaServico,
        mobiliado: mobiliado,
        uploaded_images: uploadedImages
      };

      // 2. Persist extended metadata dynamically mapped by ID
      const extendedMetadata = JSON.parse(localStorage.getItem('casafacil_extended_metadata') || '{}');
      extendedMetadata[activeId] = {
        descricao: newDesc,
        cep: newCEP,
        estado: newEstado,
        cidade: newCidade,
        bairro: newBairro,
        rua: newRua,
        numero: newNumero,
        price_rent: rentValue,
        whatsapp_proprietario: newWhatsapp,
        status: newStatus,
        quartos: numQuartos,
        banheiros: numBanheiros,
        vagas: numVagas,
        cozinha_equipada: cozinhaEquipada,
        area_servico: areaServico,
        mobiliado: mobiliado,
        uploaded_images: uploadedImages,
        owner_id: user?.id
      };
      safeLocalStorageSetItem('casafacil_extended_metadata', JSON.stringify(extendedMetadata));

      // 3. Fallback for offline completeness: preserve list of local newly created
      if (!supabaseSuccess) {
        const localAddedString = localStorage.getItem('casafacil_local_added_properties') || '[]';
        const localAdded = JSON.parse(localAddedString);
        localAdded.push(newPropertyObject);
        safeLocalStorageSetItem('casafacil_local_added_properties', JSON.stringify(localAdded));
      }

      toast.success('Excelente! Seu imóvel de alto padrão foi salvo, publicado e já está disponível no feed CasaFácil.', {
        icon: <Sparkles className="w-4 h-4 text-gold-500" />
      });

      // Clear the form fields
      setNewTitle('');
      setNewDesc('');
      setNewCEP('');
      setNewEstado('SP');
      setNewCidade('');
      setNewBairro('');
      setNewRua('');
      setNewNumero('');
      setNewPrecoAluguel('');
      setNewWhatsapp('');
      setNewStatus('disponivel');
      setNewFotoUrl(PRESETS[0].url);
      setUploadedImages([]);
      setNumQuartos(2);
      setNumBanheiros(1);
      setNumVagas(1);
      setCozinhaEquipada(true);
      setAreaServico(true);
      setMobiliado(false);
      setShowAddForm(false);

      // Reload the data instantly
      await loadData();

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro inesperado na publicação do imóvel.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-gold-600 animate-spin" />
        <p className="text-navy-400 text-xs uppercase tracking-widest animate-pulse font-semibold">
          Sincronizando Anúncios e Assinatura...
        </p>
      </div>
    );
  }

  // --- RENDERING VIEWS FOR INQUILINO (CLIENTE) ---
  if (role === 'cliente') {
    return (
      <div className="space-y-8 animate-fade-in">
        
        {/* Luxury greeting card for Inquilino */}
        <div className="bg-gradient-to-br from-navy-950 to-navy-900 border border-gold-500/15 p-6 rounded-3xl relative overflow-hidden shadow-xl text-white">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gold-600/5 blur-[60px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-gold-400 text-[10px] uppercase tracking-widest font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Canal do Usuário VIP
              </span>
              <h3 className="font-serif text-xl sm:text-2xl italic font-medium">Histórico de <span className="text-gold-500 not-italic font-bold">Matches Aprovados</span></h3>
              <p className="text-xs text-navy-200 font-light leading-relaxed max-w-lg">
                Seus rendimentos cadastrados foram verificados pela Inteligência Artificial e aprovados para os seguintes imóveis premium. O contato direto está liberado de forma exclusiva.
              </p>
            </div>
            <div className="bg-navy-900/60 border border-navy-800 px-4 py-3 rounded-2xl flex flex-col items-center justify-center self-start sm:self-center">
              <span className="text-[9px] text-navy-400 uppercase tracking-widest">Seu Total</span>
              <span className="font-serif text-gold-500 text-2xl font-black">{myApprovedMatches.length}</span>
            </div>
          </div>
        </div>

        {myApprovedMatches.length === 0 ? (
          <div className="border border-navy-100 bg-white rounded-3xl p-12 text-center max-w-md mx-auto space-y-6">
            <div className="w-16 h-16 bg-navy-50 border border-navy-100 rounded-full flex items-center justify-center mx-auto text-navy-400">
              <Compass className="w-8 h-8 animate-spin-slow text-navy-300" />
            </div>
            <div className="space-y-2">
              <h4 className="font-serif text-lg text-navy-950 font-bold">Ainda nenhum Match Aprovado</h4>
              <p className="text-xs text-navy-400 leading-relaxed font-light">
                Explore as oportunidades de alto padrão no feed inicial, verifique a compatibilidade e encontre o lar excelente adequado à sua renda.
              </p>
            </div>
            <Button
              onClick={() => {
                const homeBtn = document.querySelector('button[label="Início"]');
                if (homeBtn instanceof HTMLButtonElement) homeBtn.click();
              }}
              className="bg-navy-950 hover:bg-navy-900 text-white font-bold tracking-widest uppercase text-[10px] py-4 px-6 rounded-xl cursor-pointer"
            >
              Explorar Mansões Agora
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-navy-500" />
              <h4 className="text-[10px] text-navy-400 uppercase tracking-widest font-bold">Análise Histórica e Contatos</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myApprovedMatches.map((match, idx) => {
                const rentAmount = match.imovel.preco < 100000 ? match.imovel.preco : match.imovel.preco * 0.003;
                const message = `Olá! Fui aprovado no CasaFácil Match e tenho interesse no seu imóvel: ${match.imovel.titulo} (${match.imovel.bairro}).`;
                const ownerPhone = match.imovel.whatsapp_proprietario || '5511999999999';
                const whatsappUrl = `https://api.whatsapp.com/send?phone=${ownerPhone}&text=${encodeURIComponent(message)}`;

                return (
                  <motion.div
                    key={`${match.imovelId}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border border-navy-50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row h-full"
                  >
                    {/* Imagem do Imovel */}
                    <div className="relative w-full sm:w-1/3 h-44 sm:h-auto overflow-hidden shrink-0">
                      <img 
                        src={match.imovel.foto_url} 
                        alt={match.imovel.titulo} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent sm:hidden" />
                      <div className="absolute top-3 left-3 bg-emerald-500 text-white font-black text-[8px] uppercase tracking-wider px-2 py-1 rounded">
                        Aprovado
                      </div>
                    </div>

                    {/* Detalhes do Imovel */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <span className="text-[9px] text-gold-600 font-bold uppercase tracking-widest">{match.imovel.bairro}</span>
                        <h5 className="font-serif text-sm font-bold text-navy-950 line-clamp-1">{match.imovel.titulo}</h5>
                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-xs text-navy-400">Aluguel Estimado:</span>
                          <span className="text-sm font-bold text-navy-950">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(rentAmount)}
                          </span>
                        </div>
                        <p className="text-[10px] text-navy-300 font-light italic">
                          Aprovado em {new Date(match.approvedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-navy-950 font-bold p-3 tracking-[0.15em] uppercase text-[9px] transition-all rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-center"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-navy-950" />
                        Chamar Proprietário
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- RENDERING VIEWS FOR PROPRIETÁRIO ---
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      


      {/* 2. BOTÃO VERDE GRANDE: ➕ Publicar Novo Imóvel */}
      <div className="space-y-4">
        <Button
          onClick={onOpenAddProperty || (() => setShowAddForm(!showAddForm))}
          className="w-full bg-[#25D366] hover:bg-[#1ebd5d] text-navy-950 font-black py-7 tracking-[0.2em] uppercase text-xs sm:text-sm rounded-2xl transition-all shadow-xl shadow-emerald-950/15 flex items-center justify-center gap-3 cursor-pointer"
        >
          <Plus className="w-5 h-5 text-navy-950 stroke-[3px]" />
          ➕ Publicar Novo Imóvel
        </Button>

        {/* Dynamic expanded add property form with smooth entrance */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.98 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="bg-white border-2 border-gold-600/25 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden"
            >
              <form onSubmit={handlePublishProperty} className="space-y-6">
                <div className="flex items-center gap-2.5 border-b border-navy-150 pb-4">
                  <Building className="w-5 h-5 text-gold-500" />
                  <div>
                    <h4 className="font-serif text-base font-bold text-navy-950">Novo Anúncio CasaFácil</h4>
                    <p className="text-[10px] text-navy-400 uppercase tracking-widest font-semibold">Sistema de Alto Padrão - Nível Nacional</p>
                  </div>
                </div>

                {/* 1. UPLOAD DE IMAGENS REAL */}
                <div className="space-y-2">
                  <Label className="text-[10px] text-navy-500 uppercase tracking-widest font-black block">Fotos de Alto Padrão</Label>
                  <input
                    type="file"
                    ref={fileInputRefMulti}
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleMultiImageChange}
                  />
                  
                  <div
                    onClick={() => fileInputRefMulti.current?.click()}
                    className="border-2 border-dashed border-gold-500/35 bg-gold-500/[0.02] hover:bg-gold-500/[0.06] hover:border-gold-500 active:scale-[0.99] transition-all p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer text-center space-y-2 group shadow-sm"
                  >
                    <div className="w-12 h-12 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 stroke-[2.5px]" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-navy-950 block">📷 Adicionar Fotos do Imóvel (Máx 10 fotos)</span>
                      <p className="text-[10px] text-navy-400 font-light">Selecione fotos reais em formato JPG/PNG para engajar os clientes VIP</p>
                    </div>
                  </div>

                  {isProcessingImages && (
                    <div className="flex items-center justify-center gap-2 py-3 bg-gold-50/50 rounded-xl border border-gold-100">
                      <Loader2 className="w-4 h-4 text-gold-500 animate-spin" />
                      <span className="text-[10px] text-gold-600 uppercase tracking-widest font-bold">Processando Fotos...</span>
                    </div>
                  )}

                  {uploadedImages.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[9px] text-[#C5A059] uppercase tracking-wider font-bold">Galeria Selecionada ({uploadedImages.length}/10)</span>
                        <button type="button" onClick={() => setUploadedImages([])} className="text-[9px] text-rose-500 hover:underline font-bold">Limpar tudo</button>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-navy-100 bg-navy-50 shadow-sm">
                            <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1 rounded-full bg-rose-600 text-white hover:scale-110 transition-transform"
                                title="Remover imagem"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {idx === 0 && (
                              <div className="absolute bottom-0 inset-x-0 bg-gold-600 text-navy-950 font-black text-[7px] text-center uppercase tracking-widest py-0.5">
                                Principal
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. BLOCO DE INFORMAÇÕES PRINCIPAIS */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prop-title" className="text-[10px] text-navy-500 uppercase tracking-widest font-black">Título do Anúncio *</Label>
                    <Input
                      id="prop-title"
                      placeholder="Ex: Mansão Esmeralda nos Jardins"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      className="bg-white border border-navy-200 text-navy-950 h-12 rounded-xl text-sm placeholder:text-navy-300 focus-visible:ring-gold-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prop-preco" className="text-[10px] text-navy-500 uppercase tracking-widest font-black">Valor do Aluguel/Venda (R$) *</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-sm font-bold text-navy-400">R$</span>
                        <Input
                          id="prop-preco"
                          type="number"
                          placeholder="5000"
                          value={newPrecoAluguel}
                          onChange={(e) => setNewPrecoAluguel(e.target.value)}
                          required
                          className="bg-white border border-navy-200 text-navy-950 h-12 pl-10 rounded-xl text-sm font-bold placeholder:text-navy-300 focus-visible:ring-gold-500"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="prop-whatsapp" className="text-[10px] text-navy-500 uppercase tracking-widest font-black">WhatsApp do Proprietário *</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-3.5 w-4 h-4 text-navy-400" />
                        <Input
                          id="prop-whatsapp"
                          placeholder="Ex: 5511999999999"
                          value={newWhatsapp}
                          onChange={(e) => setNewWhatsapp(e.target.value)}
                          required
                          className="bg-white border border-navy-200 text-navy-950 h-12 pl-11 rounded-xl text-sm font-semibold placeholder:text-navy-300 focus-visible:ring-gold-500"
                        />
                      </div>
                      <span className="text-[9px] text-navy-400 block px-1 leading-none">Insira DDI + DDD + celular (somente números).</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prop-desc" className="text-[10px] text-navy-500 uppercase tracking-widest font-black">Descrição detalhada do imóvel *</Label>
                    <textarea
                      id="prop-desc"
                      rows={3}
                      placeholder="Descreva as principais características do imóvel, acabamentos, suítes, lazer privativo e por que ele é ideal para um cliente de alto padrão..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      required
                      className="w-full bg-white border border-navy-200 text-navy-950 p-4 rounded-xl text-sm placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 h-28 resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* 3. BLOCO DE ENDEREÇO COMPLETO (FOCO NO BRASIL) */}
                <div className="p-5 bg-navy-50/50 rounded-2xl border border-navy-100/55 space-y-4">
                  <span className="flex items-center gap-1.5 text-navy-950 font-serif text-sm font-semibold mb-2">
                    <MapPin className="w-4 h-4 text-gold-600" /> Endereço Completo (Foco no Brasil)
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                      <Label htmlFor="prop-cep" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">CEP</Label>
                      <Input
                        id="prop-cep"
                        placeholder="Ex: 01424-001"
                        value={newCEP}
                        onChange={(e) => setNewCEP(e.target.value)}
                        className="bg-white border border-navy-100 text-navy-950 h-11 rounded-xl text-xs placeholder:text-navy-300"
                      />
                    </div>
                    <div className="space-y-2 font-sans">
                      <Label htmlFor="prop-estado" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">Estado (UF) *</Label>
                      <select
                        id="prop-estado"
                        value={newEstado}
                        onChange={(e) => setNewEstado(e.target.value)}
                        className="w-full bg-white border border-navy-200 text-navy-950 h-11 px-3 rounded-xl text-xs placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 cursor-pointer"
                      >
                        <option value="SP">SP - São Paulo</option>
                        <option value="RJ">RJ - Rio de Janeiro</option>
                        <option value="SC">SC - Santa Catarina</option>
                        <option value="MG">MG - Minas Gerais</option>
                        <option value="RS">RS - Rio Grande do Sul</option>
                        <option value="PR">PR - Paraná</option>
                        <option value="DF">DF - Distrito Federal</option>
                        <option value="ES">ES - Espírito Santo</option>
                        <option value="BA">BA - Bahia</option>
                        <option value="PE">PE - Pernambuco</option>
                        <option value="CE">CE - Ceará</option>
                        <option value="GO">GO - Goiás</option>
                        <option value="MT">MT - Mato Grosso</option>
                        <option value="MS">MS - Mato Grosso do Sul</option>
                        <option value="AM">AM - Amazonas</option>
                        <option value="PA">PA - Pará</option>
                        <option value="RN">RN - Rio Grande do Norte</option>
                        <option value="PB">PB - Paraíba</option>
                        <option value="AL">AL - Alagoas</option>
                        <option value="SE">SE - Sergipe</option>
                        <option value="MA">MA - Maranhão</option>
                        <option value="PI">PI - Piauí</option>
                        <option value="TO">TO - Tocantins</option>
                        <option value="RO">RO - Rondônia</option>
                        <option value="AC">AC - Acre</option>
                        <option value="AP">AP - Amapá</option>
                        <option value="RR">RR - Roraima</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prop-cidade" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">Cidade *</Label>
                      <select
                        id="prop-cidade"
                        value={newCidade}
                        onChange={(e) => setNewCidade(e.target.value)}
                        className="w-full bg-white border border-navy-200 text-navy-950 h-11 px-3 rounded-xl text-xs placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 cursor-pointer"
                      >
                        <option value="Florianópolis">Florianópolis</option>
                        <option value="São José">São José</option>
                        <option value="Palhoça">Palhoça</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prop-bairro" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">Bairro *</Label>
                      <Input
                        id="prop-bairro"
                        placeholder="Ex: Jardins"
                        value={newBairro}
                        onChange={(e) => setNewBairro(e.target.value)}
                        required
                        className="bg-white border border-navy-200 text-navy-950 h-11 rounded-xl text-xs placeholder:text-navy-300"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2 grid grid-cols-4 gap-2">
                      <div className="col-span-3 space-y-2">
                        <Label htmlFor="prop-rua" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">Rua / Logradouro</Label>
                        <Input
                          id="prop-rua"
                          placeholder="Ex: Av. Brigadeiro Luís Antônio"
                          value={newRua}
                          onChange={(e) => setNewRua(e.target.value)}
                          className="bg-white border border-navy-200 text-navy-950 h-11 rounded-xl text-xs placeholder:text-navy-300"
                        />
                      </div>
                      <div className="col-span-1 space-y-2">
                        <Label htmlFor="prop-numero" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">Número</Label>
                        <Input
                          id="prop-numero"
                          placeholder="1200"
                          value={newNumero}
                          onChange={(e) => setNewNumero(e.target.value)}
                          className="bg-white border border-navy-200 text-navy-950 h-11 rounded-xl text-xs placeholder:text-navy-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. BLOCO DE CARACTERÍSTICAS DA CASA */}
                <div className="p-5 bg-white rounded-2xl border border-navy-100/75 space-y-5">
                  <span className="flex items-center gap-1.5 text-navy-950 font-serif text-sm font-semibold">
                    <Sparkles className="w-4 h-4 text-gold-600" /> Características & Estrutura
                  </span>

                  {/* Numerical selectors (+ and -) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Quartos */}
                    <div className="flex flex-col items-center p-3.5 bg-navy-50/50 rounded-xl border border-navy-100/60 space-y-2">
                      <span className="text-[9px] text-navy-500 uppercase tracking-widest font-bold">Quartos / Suítes</span>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setNumQuartos(prev => Math.max(1, prev - 1))}
                          className="w-8 h-8 rounded-full bg-navy-950 hover:bg-gold-600 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-serif text-lg font-bold text-navy-950 w-6 text-center">{numQuartos}</span>
                        <button
                          type="button"
                          onClick={() => setNumQuartos(prev => Math.min(10, prev + 1))}
                          className="w-8 h-8 rounded-full bg-navy-950 hover:bg-gold-600 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Banheiros */}
                    <div className="flex flex-col items-center p-3.5 bg-navy-50/50 rounded-xl border border-navy-100/60 space-y-2">
                      <span className="text-[9px] text-navy-500 uppercase tracking-widest font-bold">Banheiros</span>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setNumBanheiros(prev => Math.max(1, prev - 1))}
                          className="w-8 h-8 rounded-full bg-navy-950 hover:bg-gold-600 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-serif text-lg font-bold text-navy-950 w-6 text-center">{numBanheiros}</span>
                        <button
                          type="button"
                          onClick={() => setNumBanheiros(prev => Math.min(10, prev + 1))}
                          className="w-8 h-8 rounded-full bg-navy-950 hover:bg-gold-600 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Vagas */}
                    <div className="flex flex-col items-center p-3.5 bg-navy-50/50 rounded-xl border border-navy-100/60 space-y-2">
                      <span className="text-[9px] text-navy-500 uppercase tracking-widest font-bold">Vagas de Garagem</span>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => setNumVagas(prev => Math.max(0, prev - 1))}
                          className="w-8 h-8 rounded-full bg-navy-950 hover:bg-gold-600 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-serif text-lg font-bold text-navy-950 w-6 text-center">{numVagas}</span>
                        <button
                          type="button"
                          onClick={() => setNumVagas(prev => Math.min(15, prev + 1))}
                          className="w-8 h-8 rounded-full bg-navy-950 hover:bg-gold-600 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Yes/No Segmented Buttons */}
                  <div className="space-y-4 pt-1">
                    {/* Cozinha Equipada */}
                    <div className="flex justify-between items-center bg-navy-50/30 p-2.5 px-4 rounded-xl border border-navy-100/40">
                      <span className="text-xs font-bold text-navy-950">Possui Cozinha Equipada?</span>
                      <div className="flex border border-navy-200 rounded-lg overflow-hidden bg-white shrink-0">
                        <button
                          type="button"
                          onClick={() => setCozinhaEquipada(true)}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                            cozinhaEquipada ? 'bg-gold-500 text-navy-950' : 'bg-transparent text-navy-400 hover:text-navy-600'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setCozinhaEquipada(false)}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                            !cozinhaEquipada ? 'bg-navy-950 text-white' : 'bg-transparent text-navy-400 hover:text-navy-600'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    {/* Área de Serviço */}
                    <div className="flex justify-between items-center bg-navy-50/30 p-2.5 px-4 rounded-xl border border-navy-100/40">
                      <span className="text-xs font-bold text-navy-950">Área de Serviço?</span>
                      <div className="flex border border-navy-200 rounded-lg overflow-hidden bg-white shrink-0">
                        <button
                          type="button"
                          onClick={() => setAreaServico(true)}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                            areaServico ? 'bg-gold-500 text-navy-950' : 'bg-transparent text-navy-400 hover:text-navy-600'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setAreaServico(false)}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                            !areaServico ? 'bg-navy-950 text-white' : 'bg-transparent text-navy-400 hover:text-navy-600'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    {/* Mobiliado */}
                    <div className="flex justify-between items-center bg-navy-50/30 p-2.5 px-4 rounded-xl border border-navy-100/40">
                      <span className="text-xs font-bold text-navy-950">Imóvel Mobiliado?</span>
                      <div className="flex border border-navy-200 rounded-lg overflow-hidden bg-white shrink-0">
                        <button
                          type="button"
                          onClick={() => setMobiliado(true)}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                            mobiliado ? 'bg-gold-500 text-navy-950' : 'bg-transparent text-navy-400 hover:text-navy-600'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setMobiliado(false)}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                            !mobiliado ? 'bg-navy-950 text-white' : 'bg-transparent text-navy-400 hover:text-navy-600'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CHAVE SELETORA: DISPONÍVEL OU ALUGADO / INDISPONÍVEL */}
                <div className="space-y-2">
                  <Label className="text-[10px] text-navy-500 uppercase tracking-widest font-black block mb-1">Status de Disponibilidade Inicial</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewStatus('disponivel')}
                      className={`py-3 rounded-xl border flex items-center justify-center gap-2 uppercase tracking-wider text-[10px] font-bold transition-all cursor-pointer ${
                        newStatus === 'disponivel' 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700' 
                          : 'bg-white border-navy-200 text-navy-400 hover:bg-navy-50'
                      }`}
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      Disponível
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewStatus('indisponivel')}
                      className={`py-3 rounded-xl border flex items-center justify-center gap-2 uppercase tracking-wider text-[10px] font-bold transition-all cursor-pointer ${
                        newStatus === 'indisponivel' 
                          ? 'bg-rose-500/10 border-rose-500/50 text-rose-700' 
                          : 'bg-white border-navy-200 text-navy-400 hover:bg-navy-50'
                      }`}
                    >
                      <X className="w-4 h-4 shrink-0" />
                      Alugado / Indisponível
                    </button>
                  </div>
                </div>

                {/* 5. AÇÃO FINAL - BOTÃO VERDE LUMINOSO DE FEIRA NACIONAL DO PAÍS */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-navy-100">
                  <Button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    variant="ghost"
                    disabled={publishing}
                    className="flex-1 text-[10px] uppercase tracking-widest text-navy-400 hover:text-navy-950 font-bold h-12 cursor-pointer rounded-xl border border-navy-200"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={publishing}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-navy-950 font-black text-[10px] uppercase tracking-[0.2em] h-12 cursor-pointer rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-400/20 text-center"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Salvando dados...
                      </>
                    ) : (
                      'PUBLICAR IMÓVEL NO FEED'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. LISTA "MEUS IMÓVEIS PUBLICADOS" */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-navy-150">
          <Layers className="w-4 h-4 text-gold-600" />
          <h4 className="font-serif text-lg text-navy-950 font-black">Meus Imóveis Publicados</h4>
        </div>

        {imoveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto space-y-6">
            <div className="w-16 h-16 bg-navy-50/80 border border-gold-500/40 rounded-full flex items-center justify-center text-gold-500 shadow-sm mx-auto">
              <Home className="w-7 h-7 text-gold-500 shrink-0" />
            </div>
            <div className="space-y-1">
              <p className="font-serif text-lg text-navy-950 font-bold leading-relaxed">
                Você ainda não possui imóveis publicados.
              </p>
              <p className="text-xs text-navy-400 max-w-xs mx-auto leading-relaxed">
                Divulgue o seu primeiro imóvel residencial de alto padrão para clientes com limite de renda certificado e qualificado em nossa base.
              </p>
            </div>
            <Button
              onClick={onOpenAddProperty || (() => setShowAddForm(true))}
              className="bg-navy-950 hover:bg-navy-900 text-white font-bold tracking-widest uppercase text-[10px] py-4 px-6 rounded-xl cursor-pointer"
            >
              Adicionar Primeiro Imóvel
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {imoveis.map((imovel, idx) => {
                const isInactive = imovel.status === 'indisponivel';
                const statusLabel = isInactive ? 'Alugado / Indisponível' : 'Disponível';
                const estimatedRent = imovel.preco < 100000 ? imovel.preco : imovel.preco * 0.003;

                return (
                  <motion.div
                    key={imovel.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full ${
                      isInactive ? 'border-navy-100 bg-gray-50/50 grayscale-[25%]' : 'border-gold-550/15'
                    }`}
                  >
                    {/* Fachada / Foto do imovel */}
                    <div className="relative h-44 overflow-hidden shrink-0">
                      <img 
                        src={imovel.foto_url} 
                        alt={imovel.titulo} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      
                      {/* Active / Inactive badge sticker */}
                      <div className="absolute top-3 left-3 flex gap-1 items-center">
                        {isInactive ? (
                          <span className="bg-rose-600/90 text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded shadow-sm flex items-center gap-1.5 backdrop-blur-sm">
                            <XCircle className="w-3.5 h-3.5 text-white" />
                            {statusLabel}
                          </span>
                        ) : (
                          <span className="bg-emerald-600/90 text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded shadow-sm flex items-center gap-1.5 backdrop-blur-sm animate-pulse">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            {statusLabel}
                          </span>
                        )}
                      </div>

                      {/* Excluir button with elegant high-contrast style */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(imovel.id);
                        }}
                        className="absolute top-3 right-3 bg-white/95 hover:bg-white text-rose-600 hover:text-rose-700 p-2 rounded-full shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center border border-rose-100/50 hover:scale-105 active:scale-95"
                        title="Excluir Anúncio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Detalhes do Imóvel do Proprietário */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-gold-600">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-widest line-clamp-1">{imovel.bairro}</span>
                        </div>
                        <h5 className="font-serif text-sm font-bold text-navy-950 line-clamp-1">{imovel.titulo}</h5>
                        
                        {imovel.descricao && (
                          <p className="text-[11px] text-navy-400 font-light line-clamp-2 leading-relaxed">
                            {imovel.descricao}
                          </p>
                        )}

                        <div className="bg-navy-50/50 p-3 rounded-xl border border-navy-100 flex justify-between items-center text-xs text-navy-950 font-bold">
                          <span className="text-[9px] text-navy-400 uppercase tracking-widest font-black">Preço de Aluguel:</span>
                          <span className="text-gold-600 text-sm font-serif">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(estimatedRent)}/mês
                          </span>
                        </div>

                        {imovel.whatsapp_proprietario && (
                          <div className="flex items-center gap-1.5 text-[10px] text-navy-400 px-1 font-mono">
                            <Smartphone className="w-3.5 h-3.5 text-navy-300" />
                            <span>WhatsApp: {imovel.whatsapp_proprietario}</span>
                          </div>
                        )}
                      </div>

                      {/* Status toggle action trigger button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(imovel.id, imovel.status)}
                        className={`w-full py-3 font-bold tracking-[0.12em] uppercase text-[9px] rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                          isInactive 
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isInactive ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Marcar como Disponível
                          </>
                        ) : (
                          <>
                            <X className="w-3.5 h-3.5" />
                            Marcar como Alugado
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Dynamic Delete Confirmation Dialog modal */}
      <AnimatePresence>
        {deleteTargetId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isDeleting) setDeleteTargetId(null);
              }}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white border border-navy-150 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-4 animate-in fade-in zoom-in duration-200">
                <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-serif text-lg font-black text-navy-950">Excluir Anúncio?</h4>
                  <p className="text-xs text-navy-500 leading-relaxed font-light">
                    Tem certeza que deseja remover este imóvel permanentemente? Essa ação não pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteTargetId(null)}
                  disabled={isDeleting}
                  className="border-navy-200 hover:bg-navy-50 text-navy-700 text-xs font-bold tracking-widest uppercase py-3.5 px-5 rounded-xl cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDeleteProperty(deleteTargetId)}
                  disabled={isDeleting}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold tracking-widest uppercase py-3.5 px-5 rounded-xl cursor-pointer"
                >
                  {isDeleting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Excluindo...</span>
                    </div>
                  ) : (
                    'Excluir'
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Gold Plus Action Button for rapid addition */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={onOpenAddProperty || (() => setShowAddForm(!showAddForm))}
          className="bg-gold-500 hover:bg-gold-600 text-navy-950 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer border border-gold-400 group focus:outline-none"
          title="Adicionar Novo Imóvel"
        >
          <Plus className="w-6 h-6 stroke-[3px] group-hover:rotate-90 transition-transform duration-300 text-navy-950" />
        </button>
      </div>

    </div>
  );
}
