import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/src/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { compressImage, safeLocalStorageSetItem } from '@/src/lib/imageCompressor';
import { 
  User, 
  Smartphone, 
  Building, 
  DollarSign, 
  PlusCircle, 
  Save, 
  CheckCircle, 
  Loader2,
  Sparkles,
  Camera,
  LogOut,
  Sliders,
  Store,
  Compass,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import SettingsScreen from './SettingsScreen';

interface ProfileScreenProps {
  onOpenAddProperty: () => void;
}

export default function ProfileScreen({ onOpenAddProperty }: ProfileScreenProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [role, setRole] = useState<'cliente' | 'proprietario'>('cliente');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Client inputs
  const [income, setIncome] = useState('2666');

  // Owner inputs
  const [whatsapp, setWhatsapp] = useState('');
  const [imobiliaria, setImobiliaria] = useState('');

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          const metadata = user.user_metadata || {};
          setUserName(metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Usuário VIP');
          setRole(metadata.tipo_conta || metadata.role || 'cliente');
          
          // Load custom avatar from metadata or local storage cache
          const cachedAvatar = localStorage.getItem(`casafacil_avatar_${user.id}`);
          setAvatarUrl(metadata.avatar_url || cachedAvatar || '');
          
          if (metadata.monthly_income) {
            setIncome(String(metadata.monthly_income));
          } else if (metadata.max_rent) {
            setIncome(String(Math.round(Number(metadata.max_rent) / 0.3)));
          }
          if (metadata.whatsapp) {
            setWhatsapp(metadata.whatsapp);
          }
          if (metadata.imobiliaria) {
            setImobiliaria(metadata.imobiliaria);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Database-ready skeletal & active upload handler
  const _uploadFotoParaSupabase = async (file: File) => {
    setUploadingAvatar(true);
    try {
      // Compress avatar to low size e.g. 250x250, JPEG, quality 0.55
      const compressedAvatar = await compressImage(file, 250, 250, 0.55);
      
      // Immediate visual feedback
      setAvatarUrl(compressedAvatar);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Persist in local storage cache safely
        safeLocalStorageSetItem(`casafacil_avatar_${user.id}`, compressedAvatar);
        
        // Persist in Supabase auth user metadata for cross-device synchronization
        await supabase.auth.updateUser({
          data: { avatar_url: compressedAvatar }
        });
      }
      
      toast.success('Sua foto de perfil foi atualizada com sucesso no Supabase!', {
        icon: <CheckCircle className="w-4 h-4 text-emerald-500" />
      });
      setUploadingAvatar(false);
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao ler ou otimizar arquivo da galeria.');
      setUploadingAvatar(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      // Start the upload routine immediately
      _uploadFotoParaSupabase(selectedFile);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Nenhum usuário autenticado.');
        return;
      }

      const updates = {
        role,
        tipo_conta: role,
        ...(role === 'cliente' 
          ? { 
              monthly_income: Number(income),
              max_rent: Number(income) * 0.3 
            } 
          : { whatsapp, imobiliaria }
        )
      };

      const { error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) throw error;
      toast.success('Configurações salvas com sucesso no Supabase!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
        <p className="text-navy-400 text-xs uppercase tracking-widest animate-pulse font-medium">Carregando credenciais...</p>
      </div>
    );
  }

  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }

  return (
    <div className="max-w-2xl mx-auto w-full space-y-8 pb-32">
      {/* DESIGN DE ALTO PADRÃO: AVATAR GRANDE E LUXUOSO NO TOPO */}
      <div className="bg-navy-950 text-white rounded-3xl p-8 relative overflow-hidden border border-gold-500/10 shadow-2xl flex flex-col items-center text-center">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-72 bg-gold-500/5 blur-[90px] rounded-full pointer-events-none" />
        
        {/* Botão de Engrenagem Elegante no canto superior direito */}
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          className="absolute top-6 right-6 p-2 rounded-full border border-gold-500/20 bg-navy-900/40 hover:bg-gold-500/10 text-gold-500 hover:text-gold-400 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer z-30 animate-fade-in"
          title="Abrir Configurações"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
        
        <div className="relative z-10 flex flex-col items-center space-y-5">
          {/* CircleAvatar Grande, Luxuoso e Interativo com Input Oculto */}
          <div className="relative">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-gold-500 to-[#C5A059] rounded-full blur-md opacity-40 animate-pulse" />
            
            {/* InkWell Interactive Circle Container */}
            <div 
              onClick={handleAvatarClick}
              className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gold-500 bg-navy-900 flex items-center justify-center cursor-pointer transition-all hover:scale-105 hover:border-gold-400 group active:scale-95 shadow-lg"
              title="Clique para escolher uma imagem da galeria"
            >
              {uploadingAvatar && (
                <div className="flex flex-col items-center justify-center space-y-1 z-10 bg-navy-950/85 absolute inset-0">
                  <Loader2 className="w-6 h-6 text-gold-500 animate-spin" />
                  <span className="text-[8px] text-gold-400 uppercase tracking-widest font-black">Processando</span>
                </div>
              )}

              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Foto do Usuário VIP" 
                  className={`w-full h-full object-cover transition-all ${uploadingAvatar ? 'blur-sm' : ''}`}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-serif text-gold-500 text-4xl font-extrabold tracking-tighter group-hover:text-gold-400 transition-colors">
                  {userName.substring(0, 2).toUpperCase()}
                </span>
              )}
              
              {/* Subtle hover overlay hint */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[10px] text-white tracking-[0.2em] font-black uppercase text-center leading-none px-2">Alterar Foto</span>
              </div>
            </div>
            
            {/* Botão circular de câmera Dourada sobreposto */}
            <button 
              type="button"
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-1 bg-gold-500 hover:bg-gold-400 text-navy-950 hover:scale-110 active:scale-95 w-9 h-9 rounded-full flex items-center justify-center shadow-lg border-2 border-navy-950 transition-all cursor-pointer z-20"
              title="Upload Foto de Perfil"
            >
              <Camera className="w-4 h-4 text-navy-950 stroke-[2.5px]" />
            </button>
          </div>

          {/* Nome exibido abaixo da foto */}
          <div className="space-y-1.5">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">{userName}</h2>
            <p className="text-navy-400 text-xs font-mono">{userEmail}</p>
          </div>

          <div className="flex flex-wrap gap-2.5 justify-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.2 bg-gold-950 border border-gold-600/30 text-gold-400 text-[10px] uppercase tracking-widest font-black">
              <Sparkles className="w-3.5 h-3.5" /> Membro VIP
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.2 bg-navy-900 border border-navy-800 text-navy-300 text-[10px] uppercase tracking-widest font-bold">
              {role === 'cliente' ? 'Perfil: Usuário' : 'Perfil: Proprietário'}
            </span>
          </div>
        </div>
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL BASEADA NA SELEÇÃO */}
      <AnimatePresence mode="wait">
        {role === 'cliente' ? (
          <motion.div
            key="client-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-2 border-b border-navy-50 pb-4">
              <Sliders className="w-5 h-5 text-gold-600" />
              <h3 className="font-serif text-lg text-navy-950 font-bold">Configuração de Aluguel</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="income" className="text-[11px] uppercase tracking-widest text-[#001226]/80 font-bold block">
                Renda Mensal (R$)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-navy-400 font-bold text-sm">R$</span>
                <Input
                  id="income"
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="2.666,00"
                  className="pl-11 h-12 bg-navy-50/50 border-navy-100 text-navy-950 font-bold rounded-xl focus:ring-gold-500"
                />
              </div>
              <p className="text-[11px] text-navy-400 mt-1 leading-normal">
                Com base na sua renda declarada, nossa Inteligência Artificial calcula automaticamente o seu limite seguro de aluguel (30% da renda) para aprovação imediata do Match comercial.
              </p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-[#001226] hover:bg-navy-900 text-white font-bold py-6 tracking-[0.2em] uppercase text-xs rounded-xl transition-all shadow-lg cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando dados...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Preferências de Renda
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="owner-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm space-y-6"
          >
            <div className="flex items-center gap-2 border-b border-navy-50 pb-4">
              <Store className="w-5 h-5 text-gold-600" />
              <h3 className="font-serif text-lg text-navy-950 font-bold">Canal do Proprietário</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp" className="text-[11px] uppercase tracking-widest text-[#001226]/80 font-bold block">
                  Número do WhatsApp Real
                </Label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-3.5 w-4 h-4 text-navy-400" />
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="Ex: 5511999999999"
                    className="pl-11 h-12 bg-navy-50/50 border-navy-100 text-navy-950 rounded-xl focus:ring-gold-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imobiliaria" className="text-[11px] uppercase tracking-widest text-[#001226]/80 font-bold block">
                  Nome da Imobiliária
                </Label>
                <div className="relative">
                  <Building className="absolute left-4 top-3.5 w-4 h-4 text-navy-400" />
                  <Input
                    id="imobiliaria"
                    type="text"
                    value={imobiliaria}
                    onChange={(e) => setImobiliaria(e.target.value)}
                    placeholder="Ex: Supreme Imóveis"
                    className="pl-11 h-12 bg-navy-50/50 border-navy-100 text-navy-950 rounded-xl focus:ring-gold-500"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full bg-[#001226] hover:bg-navy-900 text-white font-bold py-6 tracking-[0.2em] uppercase text-xs rounded-xl transition-all shadow-lg cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando dados...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Dados Exclusivos
                </>
              )}
            </Button>

            {/* BOTÃO VERDE DOURADO GRANDE: "Cadastrar Novo Imóvel" */}
            <div className="pt-4 border-t border-navy-50">
              <Button
                onClick={onOpenAddProperty}
                className="w-full bg-[#25D366] hover:bg-[#1ebd5d] text-navy-950 font-black py-6 tracking-[0.2em] uppercase text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5 text-navy-950 stroke-[2.5px]" />
                ➕ Publicar Novo Imóvel (Completo)
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
