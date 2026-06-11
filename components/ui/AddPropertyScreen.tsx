import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { motion } from 'motion/react';
import { compressImage, safeLocalStorageSetItem } from '@/src/lib/imageCompressor';
import { 
  Building, 
  Camera, 
  Loader2, 
  Trash2, 
  MapPin, 
  Phone, 
  Sparkles, 
  Minus, 
  Plus, 
  ArrowLeft,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface AddPropertyScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}



export default function AddPropertyScreen({ onBack, onSuccess }: AddPropertyScreenProps) {
  const [publishing, setPublishing] = useState(false);
  
  // Expanded Form States 
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCEP, setNewCEP] = useState('');
  const [newEstado, setNewEstado] = useState('');
  const [newCidade, setNewCidade] = useState('');
  const [estadosList, setEstadosList] = useState<{ sigla: string; nome: string }[]>([]);
  const [cidadesList, setCidadesList] = useState<{ id: number; nome: string }[]>([]);
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [loadingCidades, setLoadingCidades] = useState(false);

  useEffect(() => {
    async function loadEstados() {
      setLoadingEstados(true);
      try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
        if (response.ok) {
          const data = await response.json();
          const sorted = data.map((est: any) => ({
            sigla: est.sigla,
            nome: est.nome
          })).sort((a: any, b: any) => a.nome.localeCompare(b.nome));
          setEstadosList(sorted);
        }
      } catch (err) {
        console.error('Erro ao buscar estados da API IBGE:', err);
      } finally {
        setLoadingEstados(false);
      }
    }
    loadEstados();
  }, []);

  useEffect(() => {
    if (!newEstado) {
      setCidadesList([]);
      setNewCidade('');
      return;
    }
    async function loadCidades() {
      setLoadingCidades(true);
      try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${newEstado}/municipios`);
        if (response.ok) {
          const data = await response.json();
          const sorted = data.map((cit: any) => ({
            id: cit.id,
            nome: cit.nome
          })).sort((a: any, b: any) => a.nome.localeCompare(b.nome));
          setCidadesList(sorted);
          if (sorted.length > 0) {
            setNewCidade(sorted[0].nome);
          } else {
            setNewCidade('');
          }
        }
      } catch (err) {
        console.error('Erro ao buscar cidades da API IBGE:', err);
      } finally {
        setLoadingCidades(false);
      }
    }
    loadCidades();
  }, [newEstado]);

  const [newBairro, setNewBairro] = useState('');
  const [newRua, setNewRua] = useState('');
  const [newNumero, setNewNumero] = useState('');
  const [newPrecoAluguel, setNewPrecoAluguel] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newStatus] = useState<'disponivel' | 'indisponivel'>('disponivel');
  const [newFotoUrl, setNewFotoUrl] = useState('');

  // Dynamic multi image upload states
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
        setNewFotoUrl('');
      }
      return updated;
    });
  };

  const handlePublishProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBairro || !newPrecoAluguel || !newWhatsapp) {
      toast.error('Preencha os campos obrigatórios (Título, Bairro, Preço do Aluguel e WhatsApp).');
      return;
    }

    setPublishing(true);
    try {
      const rentValue = Number(newPrecoAluguel);
      const primaryImage = uploadedImages.length > 0 ? uploadedImages[0] : newFotoUrl;
      const todasFotos = uploadedImages.length > 0 ? uploadedImages : (newFotoUrl ? [newFotoUrl] : []);
      const displayBairro = [newBairro, newCidade, newEstado].filter(Boolean).join(', ');

      // Verifica se está logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Você precisa estar logado para publicar um imóvel.');
        setPublishing(false);
        return;
      }

      // ✅ Insert com nomes EXATOS das colunas do Supabase
      const insertPayload = {
        proprietario_id: user.id,
        user_id: user.id,
        titulo: newTitle,
        descricao: newDesc || '',
        preco_aluguel: rentValue,
        estado: newEstado || '',
        cidade: newCidade || '',
        bairro: newBairro || '',
        rua: newRua || '',
        numero: newNumero || '',
        cep: newCEP || '',
        quantidade_quartos: numQuartos,
        quantidade_banheiros: numBanheiros,
        vagas_garagem: numVagas,
        cozinha_equipada: cozinhaEquipada,
        area_servico: areaServico,
        mobiliado: mobiliado,
        fotos_urls: todasFotos,
        whatsapp_proprietario: newWhatsapp || '',
        status_imovel: 'disponivel',
        status: 'disponivel',
      };

      const { data, error } = await supabase
        .from('imoveis')
        .insert([insertPayload])
        .select();

      if (error) {
        console.error('Erro Supabase ao inserir:', error);
        toast.error(`Erro ao publicar: ${error.message}`);
        setPublishing(false);
        return;
      }

      const activeId = data?.[0]?.id || `prop-${Date.now()}`;

      // Salva localmente também para aparecer imediatamente no feed sem recarregar
      const newPropertyObject = {
        id: activeId,
        titulo: newTitle,
        bairro: displayBairro,
        preco: rentValue,
        foto_url: primaryImage,
        uploaded_images: todasFotos,
        descricao: newDesc,
        cep: newCEP,
        estado: newEstado,
        cidade: newCidade,
        rua: newRua,
        numero: newNumero,
        whatsapp_proprietario: newWhatsapp,
        status: 'disponivel',
        quartos: numQuartos,
        banheiros: numBanheiros,
        vagas: numVagas,
        cozinha_equipada: cozinhaEquipada,
        area_servico: areaServico,
        mobiliado: mobiliado,
        curtidas: 0,
      };

      const localAddedString = localStorage.getItem('casafacil_local_added_properties') || '[]';
      const localAdded = JSON.parse(localAddedString);
      // Evita duplicar se já existe
      const alreadyExists = localAdded.find((im: any) => im.id === activeId);
      if (!alreadyExists) localAdded.push(newPropertyObject);
      safeLocalStorageSetItem('casafacil_local_added_properties', JSON.stringify(localAdded));

      toast.success('🏠 Imóvel publicado com sucesso no feed CasaFácil!');

      // Limpa formulário
      setNewTitle(''); setNewDesc(''); setNewCEP(''); setNewBairro('');
      setNewRua(''); setNewNumero(''); setNewPrecoAluguel(''); setNewWhatsapp('');
      setNewEstado(''); setNewCidade(''); setUploadedImages([]); setNewFotoUrl('');
      setNumQuartos(2); setNumBanheiros(1); setNumVagas(1);
      setCozinhaEquipada(true); setAreaServico(true); setMobiliado(false);

      onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Erro inesperado ao publicar o imóvel.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      {/* Header Fixo Translúcido */}
      <header className="bg-white border-b border-navy-100 px-6 py-5 sticky top-0 z-50 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4 max-w-5xl mx-auto w-full">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full border border-navy-200 hover:bg-navy-50 flex items-center justify-center transition-all cursor-pointer active:scale-95 text-navy-700"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5px]" />
          </button>
          <div>
            <h2 className="text-[9px] uppercase tracking-[0.25em] text-navy-400 font-bold mb-0.5">CasaFácil Elite</h2>
            <h1 className="text-xl font-serif text-navy-950 font-semibold">Anunciar <span className="text-gold-600 not-italic font-bold">Imóvel Residencial</span></h1>
          </div>
        </div>
      </header>

      {/* Conteúdo Formuário */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-navy-100 rounded-3xl p-6 sm:p-8 shadow-xl space-y-8"
        >
          <form onSubmit={handlePublishProperty} className="space-y-6">
            <div className="flex items-center gap-2.5 border-b border-navy-50 pb-4">
              <Building className="w-5 h-5 text-gold-500" />
              <div>
                <h4 className="font-serif text-base font-bold text-navy-950">Ficha Completa de Luxo</h4>
                <p className="text-[10px] text-navy-400 uppercase tracking-widest font-semibold">Sistema de Cadastro CasaFácil Premium</p>
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
                  <span className="text-xs font-bold text-navy-950 block">📷 Escolher Fotos do Imovél (Máx 10 fotos)</span>
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
                    <span className="text-[9px] text-[#C5A059] uppercase tracking-wider font-bold font-mono">Galeria Selecionada ({uploadedImages.length}/10)</span>
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
                            className="p-1 rounded-full bg-rose-600 text-white hover:scale-110 transition-transform cursor-pointer"
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
                <Label htmlFor="prop-title-scr" className="text-[10px] text-navy-500 uppercase tracking-widest font-black">Título do Anúncio *</Label>
                <Input
                  id="prop-title-scr"
                  placeholder="Ex: Mansão Esmeralda nos Jardins"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="bg-white border border-navy-200 text-navy-950 h-12 rounded-xl text-sm placeholder:text-navy-300 focus-visible:ring-gold-500"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prop-preco-scr" className="text-[10px] text-navy-500 uppercase tracking-widest font-black">Valor do Aluguel/Venda (R$) *</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-sm font-bold text-navy-400 font-mono">R$</span>
                    <Input
                      id="prop-preco-scr"
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
                  <Label htmlFor="prop-whatsapp-scr" className="text-[10px] text-navy-500 uppercase tracking-widest font-black">WhatsApp do Proprietário *</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-4 h-4 text-navy-400" />
                    <Input
                      id="prop-whatsapp-scr"
                      placeholder="Ex: 5511999999999"
                      value={newWhatsapp}
                      onChange={(e) => setNewWhatsapp(e.target.value)}
                      required
                      className="bg-white border border-navy-200 text-navy-950 h-12 pl-11 rounded-xl text-sm font-semibold placeholder:text-navy-300 focus-visible:ring-gold-500"
                    />
                  </div>
                  <span className="text-[9px] text-navy-400 block px-1 leading-none font-sans mt-0.5">Insira DDI + DDD + celular (somente números).</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prop-desc-scr" className="text-[10px] text-navy-500 uppercase tracking-widest font-black">Descrição detalhada do imóvel *</Label>
                <textarea
                  id="prop-desc-scr"
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
                  <Label htmlFor="prop-cep-scr" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">CEP</Label>
                  <Input
                    id="prop-cep-scr"
                    placeholder="Ex: 01424-001"
                    value={newCEP}
                    onChange={(e) => setNewCEP(e.target.value)}
                    className="bg-white border border-navy-100 text-navy-950 h-11 rounded-xl text-xs placeholder:text-navy-300 pointer-events-auto"
                  />
                </div>
                <div className="space-y-2 font-sans">
                  <Label htmlFor="prop-estado-scr" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">Estado (UF) *</Label>
                  <select
                    id="prop-estado-scr"
                    value={newEstado}
                    onChange={(e) => setNewEstado(e.target.value)}
                    className="w-full bg-white border border-navy-200 text-navy-950 h-11 px-3 rounded-xl text-xs placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 cursor-pointer"
                  >
                    <option value="">Selecione o Estado...</option>
                    {estadosList.map((est) => (
                      <option key={est.sigla} value={est.sigla}>
                        {est.sigla} - {est.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prop-cidade-scr" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">Cidade *</Label>
                  <select
                    id="prop-cidade-scr"
                    value={newCidade}
                    onChange={(e) => setNewCidade(e.target.value)}
                    disabled={!newEstado || loadingCidades}
                    className="w-full bg-white border border-navy-200 text-navy-950 h-11 px-3 rounded-xl text-xs placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-gold-500 focus:border-gold-500 cursor-pointer disabled:bg-[#f2f5f9] disabled:text-navy-300 disabled:cursor-not-allowed"
                  >
                    {!newEstado ? (
                      <option value="">Selecione o Estado primeiro</option>
                    ) : loadingCidades ? (
                      <option value="">Carregando cidades...</option>
                    ) : (
                      <>
                        {cidadesList.map((cit) => (
                          <option key={cit.id} value={cit.nome}>
                            {cit.nome}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prop-bairro-scr" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">Bairro *</Label>
                  <Input
                    id="prop-bairro-scr"
                    placeholder="Ex: Jardins"
                    value={newBairro}
                    onChange={(e) => setNewBairro(e.target.value)}
                    required
                    className="bg-white border border-navy-200 text-navy-950 h-11 rounded-xl text-xs placeholder:text-navy-300"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 grid grid-cols-4 gap-2">
                  <div className="col-span-3 space-y-2">
                    <Label htmlFor="prop-rua-scr" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">Rua / Logradouro</Label>
                    <Input
                      id="prop-rua-scr"
                      placeholder="Ex: Av. Brigadeiro Luís Antônio"
                      value={newRua}
                      onChange={(e) => setNewRua(e.target.value)}
                      className="bg-white border border-navy-200 text-navy-950 h-11 rounded-xl text-xs placeholder:text-navy-300"
                    />
                  </div>
                  <div className="col-span-1 space-y-2">
                    <Label htmlFor="prop-numero-scr" className="text-[9px] text-navy-400 uppercase tracking-widest font-bold">Número</Label>
                    <Input
                      id="prop-numero-scr"
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

            {/* Campo para se colocar Link de Imagem Direta */}
            {uploadedImages.length === 0 && (
              <div className="space-y-2 bg-navy-50/35 border border-navy-100 p-4 rounded-2xl">
                <Label className="text-[10px] text-navy-500 uppercase tracking-widest font-black block">Ou forneça um Link de Imagem Direta</Label>
                <Input
                  type="text"
                  placeholder="https://exemplo.com/sua-imagem.jpg"
                  value={newFotoUrl}
                  onChange={(e) => setNewFotoUrl(e.target.value)}
                  className="bg-white border border-navy-200 text-navy-950 h-11 rounded-xl text-xs placeholder:text-navy-300 focus-visible:ring-gold-500"
                />
              </div>
            )}

            {/* Botões Finais de Envio */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-navy-100">
              <Button
                type="button"
                onClick={onBack}
                variant="outline"
                disabled={publishing}
                className="flex-1 border-navy-200 hover:bg-navy-50 text-navy-800 font-bold h-12 rounded-xl text-xs uppercase tracking-widest"
              >
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={publishing}
                className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.2em] h-12 cursor-pointer rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-400/20 text-center"
              >
                {publishing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publicando...
                  </span>
                ) : (
                  'PUBLICAR IMÓVEL NO FEED'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
