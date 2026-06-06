import { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  MessageSquare, 
  Loader2, 
  ArrowLeft, 
  Building, 
  DollarSign, 
  Briefcase, 
  UserCheck, 
  Smartphone,
  Sparkles,
  ChevronRight,
  Code,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Imovel {
  id: string;
  titulo: string;
  bairro: string;
  preco: number;
  foto_url: string;
}

interface MatchResultScreenProps {
  imovel: Imovel;
  userIncome: number | null;
  onBack: () => void;
}

export default function MatchResultScreen({ imovel, userIncome, onBack }: MatchResultScreenProps) {
  const [phase, setPhase] = useState<'loading' | 'approved' | 'denied'>('loading');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(userIncome || 2666);
  const [userRole, setUserRole] = useState<string>('cliente');

  // Calcular o valor estimado de aluguel (0.3% do valor de venda comercial ou valor direto cadastrado)
  const estimatedRent = imovel.preco < 100000 ? imovel.preco : imovel.preco * 0.003;
  
  // Limite seguro é 30% da renda mensal obtida
  const allowedRentLimit = monthlyIncome * 0.3;

  useEffect(() => {
    async function evaluateMatch() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let currentIncome = userIncome || 2666;
        let currentRole = 'cliente';

        if (user) {
          const metadata = user.user_metadata || {};
          currentRole = metadata.tipo_conta || metadata.role || 'cliente';
          if (metadata.monthly_income) {
            currentIncome = Number(metadata.monthly_income);
          } else if (metadata.max_rent) {
            currentIncome = Number(metadata.max_rent) / 0.3;
          }
        }
        setMonthlyIncome(currentIncome);
        setUserRole(currentRole);

        // Inteligência Artificial está analisando o Match durante 2.5 segundos
        await new Promise((resolve) => setTimeout(resolve, 2500));

        // Regra de validação matemática real: O valor do aluguel não pode ultrapassar 30% da renda mensal
        const currentAllowedLimit = currentIncome * 0.3;
        if (estimatedRent <= currentAllowedLimit) {
          setPhase('approved');
          try {
            const savedMatchesString = localStorage.getItem('casafacil_matches') || '[]';
            const savedMatches = JSON.parse(savedMatchesString);
            if (!savedMatches.some((m: any) => m.imovelId === imovel.id)) {
              savedMatches.push({
                imovelId: imovel.id,
                approvedAt: new Date().toISOString(),
                imovel: imovel
              });
              localStorage.setItem('casafacil_matches', JSON.stringify(savedMatches));
            }
          } catch (e) {
            console.error('Erro ao salvar match localmente:', e);
          }
        } else {
          setPhase('denied');
        }
      } catch (error) {
        console.error('Erro ao processar compatibilidade do Match:', error);
        setPhase('denied');
      }
    }

    evaluateMatch();
  }, [estimatedRent, userIncome]);

  // Obter número de WhatsApp real do Proprietário a partir dos metadados estendidos salvos localmente
  const getOwnerPhone = () => {
    try {
      const savedMetadataStr = localStorage.getItem('casafacil_extended_metadata');
      if (savedMetadataStr) {
        const metadataMap = JSON.parse(savedMetadataStr);
        if (metadataMap[imovel.id]?.whatsapp_proprietario) {
          return metadataMap[imovel.id].whatsapp_proprietario;
        }
      }
    } catch (e) {
      console.warn("Não foi possível recuperar o celular do proprietário:", e);
    }
    return (imovel as any).whatsapp_proprietario || '5511999999999';
  };

  const ownerPhoneNumber = getOwnerPhone();
  const message = `Olá! Fui aprovado no CasaFácil Match e tenho interesse no seu imóvel: ${imovel.titulo} em ${imovel.bairro}!`;
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${ownerPhoneNumber}&text=${encodeURIComponent(message)}`;

  return (
    <div className="min-h-screen bg-navy-950 text-white flex flex-col font-sans relative overflow-x-hidden">
      {/* Background radial luxury gold */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none opacity-10">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gold-500/30 blur-[130px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 blur-[150px] rounded-full" />
      </div>

      {phase === 'loading' ? (
        // FASE 4 LOADING: Inteligência Artificial analisando o Match
         <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 space-y-8">
          <div className="relative">
            {/* Pulsing ring around loader */}
            <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-xl scale-125 animate-pulse" />
            <div className="w-24 h-24 rounded-full border-2 border-gold-600/30 flex items-center justify-center bg-navy-900 border-dashed">
              <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
            </div>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
              className="absolute -top-1 -right-1 bg-gold-600 text-[9px] uppercase tracking-widest font-black px-2 py-0.5"
            >
              AI Live
            </motion.div>
          </div>

          <div className="space-y-3 max-w-sm">
            <h2 className="text-xl font-serif text-gold-500 italic">Análise de Compatibilidade</h2>
            <p className="text-sm text-navy-200 font-light leading-relaxed animate-pulse">
              A Inteligência Artificial está analisando o seu orçamento vs o valor do imóvel...
            </p>
          </div>

          <div className="text-[10px] uppercase tracking-[0.3em] text-navy-400 font-semibold max-w-xs pt-8 border-t border-navy-900">
            Avaliando Orçamento de Aluguel e Regras de Compatibilidade
          </div>
        </div>
      ) : phase === 'approved' ? (
        // FASE 4 SUCESSO: Tela de Resultado do Match com o Check Verde
        <div className="flex-1 flex flex-col z-10">
          
          {/* Header Compacto */}
          <header className="px-6 py-4 flex items-center justify-between border-b border-navy-900">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-navy-400 hover:text-white transition-colors text-xs uppercase tracking-widest cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <span className="text-[10px] text-gold-500 uppercase tracking-[0.3em] font-bold">Verificação Completa</span>
          </header>

          {/* Body de Sucesso */}
          <div className="flex-1 px-6 py-8 max-w-md mx-auto w-full space-y-6">
            
            {/* Ícone grande de check verde brilhante */}
            <div className="flex flex-col items-center text-center space-y-4">
              <motion.div 
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.2)]"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </motion.div>
              
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-serif text-white font-semibold leading-snug">Parabéns! Sua renda é compatível com este imóvel.</h1>
                <p className="text-xs text-emerald-400 uppercase tracking-widest font-bold">Renda Aprovada Comercialmente</p>
              </div>
            </div>

            {/* Card de Aprovação */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-navy-900/50 border border-navy-800 p-6 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-navy-800/80 pb-3">
                <span className="text-xs text-navy-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-gold-500" /> Imóvel Selecionado
                </span>
                <span className="text-[10px] text-gold-500 bg-gold-950 px-2.5 py-1 uppercase tracking-widest font-black">
                  Código #{imovel.id}
                </span>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-white line-clamp-1">{imovel.titulo}</p>
                <p className="text-xs text-navy-400">{imovel.bairro}</p>
              </div>

              {/* Renda vs Aluguel */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-navy-950/80 border border-navy-800">
                  <p className="text-[9px] text-navy-400 uppercase tracking-widest font-semibold flex items-center gap-1 mb-1">
                    <Briefcase className="w-3 h-3 text-gold-500" /> Sua Renda Mensal
                  </p>
                  <p className="text-sm font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyIncome)}
                  </p>
                </div>
                <div className="p-3 bg-navy-950/80 border border-navy-800">
                  <p className="text-[9px] text-navy-400 uppercase tracking-widest font-semibold flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" /> Aluguel Estimado
                  </p>
                  <p className="text-sm font-bold text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedRent)}
                  </p>
                </div>
              </div>

              {/* Mensagem de felicidades */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/50 text-xs text-emerald-300 font-light flex gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  O aluguel estimado equivale a <strong>{((estimatedRent / monthlyIncome) * 100).toFixed(0)}%</strong> da sua renda mensal de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyIncome)}, posicionando-se de forma segura dentro da regra recomendada de 30% ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(allowedRentLimit)}).
                </span>
              </div>
            </motion.div>

          </div>

          {/* Botão Estilo WhatsApp no Rodapé Fixo */}
          <div className="fixed bottom-0 left-0 right-0 bg-navy-950 border-t border-navy-900 px-6 py-4 z-50 flex items-center justify-center sm:max-w-md sm:mx-auto">
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#128C7E] text-navy-950 font-bold py-4 tracking-[0.2em] uppercase text-xs transition-all shadow-lg shadow-emerald-500/20 rounded-none flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-navy-950" />
              Falar com o Proprietário Agora
            </a>
          </div>

        </div>
      ) : (
        // FASE 4 REPROVADO: Tela de Falha do Match (Interface Vermelha/Laranja luxuosa de incompatibilidade)
        <div className="flex-1 flex flex-col z-10 pb-20">
          
          {/* Header Compacto */}
          <header className="px-6 py-4 flex items-center justify-between border-b border-navy-900">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-navy-400 hover:text-white transition-colors text-xs uppercase tracking-widest cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
            <span className="text-[10px] text-[#FF4D4D] uppercase tracking-[0.3em] font-bold">Incompatibilidade</span>
          </header>

          {/* Body de Reprovação */}
          <div className="flex-1 px-6 py-8 max-w-md mx-auto w-full space-y-6">
            
            {/* Ícone grande de check de falha ou alerta laranja/vermelho suntuoso */}
            <div className="flex flex-col items-center text-center space-y-4">
              <motion.div 
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="w-20 h-20 bg-red-500/20 border-2 border-[#FF4D4D] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,77,77,0.2)]"
              >
                <XCircle className="w-10 h-10 text-[#FF4D4D]" />
              </motion.div>
              
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-serif text-white font-semibold">Match Reprovado</h1>
                <p className="text-xs text-[#FF4D4D] uppercase tracking-widest font-bold">Limite de Parcela Excedido</p>
              </div>
            </div>

            {/* Mensagem de Incompatibilidade explicitando o orçamento do usuário */}
            <div className="p-4 bg-red-950/20 border border-red-900/50 text-sm text-[#FF8080] font-light leading-relaxed rounded-none text-center">
              Match Reprovado. Para a sua segurança financeira, o aluguel deste imóvel compromete mais de 30% da sua renda mensal informada.
            </div>

            {/* Card com detalhes comparativos para dar um tom profissional de alto padrão */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-navy-900/50 border border-navy-800 p-6 space-y-5"
            >
              <div className="flex justify-between items-center border-b border-navy-800/80 pb-3">
                <span className="text-xs text-navy-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-[#FF8080]" /> Informações Financeiras
                </span>
                <span className="text-[10px] text-red-400 bg-red-950 px-2.5 py-1 uppercase tracking-widest font-black">
                  Incompatível
                </span>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-white line-clamp-1">{imovel.titulo}</p>
                <p className="text-xs text-navy-400">{imovel.bairro}</p>
              </div>

              {/* Renda vs Aluguel */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-3 bg-navy-950/80 border border-red-550/10 border-b-2 border-red-500">
                  <p className="text-[9px] text-navy-400 uppercase tracking-widest font-semibold flex items-center gap-1 mb-1">
                    Sua Renda Mensal
                  </p>
                  <p className="text-sm font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyIncome)}
                  </p>
                </div>
                <div className="p-3 bg-navy-950/80 border border-navy-800">
                  <p className="text-[9px] text-navy-400 uppercase tracking-widest font-semibold flex items-center gap-1 mb-1">
                    Aluguel Estimado
                  </p>
                  <p className="text-sm font-bold text-[#FF8080]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(estimatedRent)}
                  </p>
                </div>
              </div>

              {/* Parágrafo adicional detalhando a regra de 30% */}
              <div className="text-[11px] text-navy-300 leading-normal flex gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  O valor do aluguel comprometeria <strong>{((estimatedRent / monthlyIncome) * 100).toFixed(0)}%</strong> da sua renda mensal. O limite máximo de segurança é de 30% (<strong className="text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(allowedRentLimit)}</strong>).
                </span>
              </div>
            </motion.div>

          </div>

          {/* Botão de "Voltar e buscar outros" no Rodapé Fixo */}
          <div className="fixed bottom-0 left-0 right-0 bg-navy-950 border-t border-navy-900 px-6 py-4 z-50 flex items-center justify-center sm:max-w-md sm:mx-auto">
            <Button 
              onClick={onBack}
              className="w-full bg-gold-600 hover:bg-gold-550 text-navy-950 font-bold py-4 tracking-[0.2em] uppercase text-xs transition-all shadow-lg rounded-none flex items-center justify-center cursor-pointer"
            >
              Voltar e buscar outros
            </Button>
          </div>

        </div>
      )}
    </div>
  );
}
