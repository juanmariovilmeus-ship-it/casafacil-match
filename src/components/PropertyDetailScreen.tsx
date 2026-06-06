import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  Sparkles, 
  CheckCircle, 
  Loader2, 
  DollarSign, 
  Info,
  ShieldCheck,
  Building,
  KeyRound,
  Maximize,
  BedDouble,
  Bath,
  Car,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import MatchResultScreen from './MatchResultScreen';

interface Imovel {
  id: string;
  titulo: string;
  bairro: string;
  preco: number;
  foto_url: string;
  descricao?: string;
  // Premium details
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
  area?: number;
}

interface PropertyDetailScreenProps {
  imovel: Imovel;
  onBack: () => void;
}

export default function PropertyDetailScreen({ imovel, onBack }: PropertyDetailScreenProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showResultScreen, setShowResultScreen] = useState(false);
  const [userIncome, setUserIncome] = useState<number | null>(null);

  // Images slideshow collection
  const imagesToDisplay = imovel.uploaded_images && imovel.uploaded_images.length > 0 
    ? imovel.uploaded_images 
    : [imovel.foto_url];
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Buscar informações de renda do usuário atual para realizar o match simulado
  useEffect(() => {
    async function getUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.user_metadata?.monthly_income) {
          setUserIncome(Number(user.user_metadata.monthly_income));
        }
      } catch (err) {
        console.error('Erro ao recuperar renda do usuário:', err);
      }
    }
    getUserData();
  }, []);

  if (showResultScreen) {
    return (
      <MatchResultScreen 
        imovel={imovel} 
        userIncome={userIncome} 
        onBack={() => setShowResultScreen(false)} 
      />
    );
  }

  // Descrição luxuosa padrão baseada no imóvel
  const defaultDesc = imovel.descricao || `Esta magnífico obra-prima da arquitetura moderna, localizada no cobiçado bairro ${imovel.bairro}, redefine o conceito de bem-viver de alto padrão. Projetada para proporcionar máxima privacidade, sofisticação e conforto, a residência entrega acabamentos em pedras nobres importadas, automação residencial de última geração, aspiração central, e uma vista panorâmica panorâmica de tirar o fôlego. Um refúgio absoluto de elegância e distinção urbana refinada.`;

  // Simulação interativa e de alta fidelidade do Match de Aluguel
  const handleCheckMatch = () => {
    setShowResultScreen(true);
  };

  return (
    <div className="min-h-screen bg-navy-950 text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Background radial sutil de luxo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-gold-500/30 blur-[150px] rounded-full" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-navy-500/30 blur-[150px] rounded-full" />
      </div>

      {/* Seção da Imagem (Galeria seletora de luxo) */}
      <div className="relative w-full p-4 z-10 flex flex-col shrink-0 gap-3">
        <div className="relative h-[42vh] w-full rounded-3xl overflow-hidden shadow-2xl border border-gold-500/10">
          <img 
            src={imagesToDisplay[activeImageIndex]} 
            alt={imovel.titulo} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/20 to-transparent" />
          
          {/* Botão de Voltar Translúcido */}
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 w-11 h-11 rounded-full bg-navy-950/60 backdrop-blur-md border border-white/10 hover:border-gold-500/50 hover:bg-navy-950/90 text-white flex items-center justify-center transition-all duration-300 active:scale-90 z-20"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
            <span className="bg-gold-600/90 hover:bg-gold-600 text-navy-950 text-[10px] uppercase tracking-[0.2em] font-black px-4 py-1.5 rounded-none shadow-lg backdrop-blur-sm">
              Private Collection
            </span>
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 bg-gold-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-gold-300">Disponibilidade Exclusiva</span>
            </div>
          </div>
        </div>

        {/* Dynamic miniature index row when there are multiple photos */}
        {imagesToDisplay.length > 1 && (
          <div className="flex gap-2 overflow-x-auto py-1 px-1 justify-start sm:justify-center no-scrollbar">
            {imagesToDisplay.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-11 h-11 rounded-lg overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                  activeImageIndex === idx ? 'border-gold-500 scale-105 shadow-md shadow-gold-500/20' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Conteúdo de Informações */}
      <div className="flex-1 px-6 pt-4 pb-28 max-w-2xl mx-auto w-full z-10 space-y-6">
        
        {/* Bloco de Preço, Título e Localização */}
        <div className="border-b border-navy-900 pb-6 space-y-3">
          <p className="text-[10px] text-gold-500 uppercase tracking-[0.3em] font-semibold">Valor Comercial Estimado</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-none">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.preco)}
          </h2>
          <h1 className="text-xl sm:text-2xl font-serif font-medium text-navy-100 mt-2">{imovel.titulo}</h1>
          
          {/* Address with full details */}
          {imovel.rua ? (
            <div className="flex flex-col gap-1 text-navy-300 text-xs mt-1.5 font-light">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-navy-900 border border-navy-800">
                  <MapPin className="w-3.5 h-3.5 text-gold-500" />
                </div>
                <span className="font-semibold text-white">{imovel.bairro}</span>
              </div>
              <p className="px-1.5 opacity-85">{imovel.rua}{imovel.numero ? `, Nº ${imovel.numero}` : ''} {imovel.cep ? `- CEP ${imovel.cep}` : ''}</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-navy-400 text-xs mt-1 font-light">
              <div className="p-1 rounded bg-navy-900 border border-navy-800">
                <MapPin className="w-3.5 h-3.5 text-gold-500" />
              </div>
              <span className="font-semibold text-white">{imovel.bairro}</span>
            </div>
          )}
        </div>

        {/* Fichas Técnicas Premium */}
        <div className="grid grid-cols-3 gap-3 bg-navy-900/40 border border-navy-800 p-4 rounded-xl">
          <div className="text-center space-y-1">
            <BedDouble className="w-5 h-5 text-gold-500 mx-auto" />
            <p className="text-[9px] text-navy-400 uppercase tracking-widest font-semibold">Dormitórios</p>
            <p className="text-xs font-bold text-white">{imovel.quartos !== undefined ? imovel.quartos : 3} Quartos</p>
          </div>
          <div className="text-center space-y-1 border-x border-navy-800">
            <Bath className="w-5 h-5 text-gold-500 mx-auto" />
            <p className="text-[9px] text-navy-400 uppercase tracking-widest font-semibold">Banheiros</p>
            <p className="text-xs font-bold text-white">{imovel.banheiros !== undefined ? imovel.banheiros : 2} Banheiros</p>
          </div>
          <div className="text-center space-y-1">
            <Car className="w-5 h-5 text-gold-500 mx-auto" />
            <p className="text-[9px] text-navy-400 uppercase tracking-widest font-semibold">Garagem</p>
            <p className="text-xs font-bold text-white">{imovel.vagas !== undefined ? imovel.vagas : 1} Vaga(s)</p>
          </div>
        </div>

        {/* Comodidades VIP section */}
        <div className="border-t border-b border-navy-900/65 py-6 space-y-3.5">
          <h3 className="text-xs uppercase tracking-widest text-[#C5A059] font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold-500" /> Detalhes & Comodidades VIP
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 rounded-2xl flex items-center gap-3 transition-all border ${
              imovel.cozinha_equipada !== false 
                ? 'bg-gold-500/[0.03] border-gold-500/20 text-gold-400 font-bold' 
                : 'bg-navy-950 border-navy-900 text-navy-400 font-normal opacity-40'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${imovel.cozinha_equipada !== false ? 'bg-gold-500/10 text-gold-500' : 'bg-navy-900 text-navy-500'}`}>
                {imovel.cozinha_equipada !== false ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <X className="w-3.5 h-3.5 stroke-[2.5px]" />}
              </div>
              <span className="text-[11px] leading-none uppercase tracking-wide">Cozinha Equipada</span>
            </div>

            <div className={`p-4 rounded-2xl flex items-center gap-3 transition-all border ${
              imovel.area_servico !== false 
                ? 'bg-gold-500/[0.03] border-gold-500/20 text-gold-400 font-bold' 
                : 'bg-navy-950 border-navy-900 text-navy-400 font-normal opacity-40'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${imovel.area_servico !== false ? 'bg-gold-500/10 text-gold-500' : 'bg-navy-900 text-navy-500'}`}>
                {imovel.area_servico !== false ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <X className="w-3.5 h-3.5 stroke-[2.5px]" />}
              </div>
              <span className="text-[11px] leading-none uppercase tracking-wide">Área de Serviço</span>
            </div>

            <div className={`p-4 rounded-2xl flex items-center gap-3 transition-all border ${
              imovel.mobiliado === true 
                ? 'bg-gold-500/[0.03] border-gold-500/20 text-gold-400 font-bold' 
                : 'bg-navy-950 border-navy-900 text-navy-400 font-normal opacity-40'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${imovel.mobiliado === true ? 'bg-gold-500/10 text-gold-500' : 'bg-navy-900 text-navy-500'}`}>
                {imovel.mobiliado === true ? <Check className="w-3.5 h-3.5 stroke-[3px]" /> : <X className="w-3.5 h-3.5 stroke-[2.5px]" />}
              </div>
              <span className="text-[11px] leading-none uppercase tracking-wide">Mobiliado</span>
            </div>
          </div>
        </div>

        {/* Descrição em Destaque */}
        <div className="space-y-3 pb-8">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-gold-500" />
            <h3 className="text-xs uppercase tracking-widest text-[#C5A059] font-bold">Descrição do Imóvel</h3>
          </div>
          <p className="text-sm text-navy-300 font-light leading-relaxed text-justify">
            {defaultDesc}
          </p>
        </div>
      </div>

      {/* Botão de Ação no Rodapé Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-navy-950 border-t border-navy-900 px-6 py-4 z-50 flex items-center justify-center sm:max-w-xl sm:mx-auto">
        <Button 
          onClick={handleCheckMatch}
          className="w-full bg-[#C5A059] hover:bg-[#D4AF37] text-[#001226] font-bold py-7 tracking-[0.2em] uppercase text-xs transition-all shadow-lg shadow-gold-500/20 rounded-none cursor-pointer"
        >
          Verificar Match de Aluguel
        </Button>
      </div>
    </div>
  );
}
