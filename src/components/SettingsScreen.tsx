import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ChevronRight, 
  User, 
  Lock, 
  Bell, 
  FileText, 
  HelpCircle, 
  Trash2, 
  LogOut, 
  Check, 
  ShieldCheck,
  Loader2,
  LockKeyhole
} from 'lucide-react';
import { toast } from 'sonner';

interface SettingsScreenProps {
  onBack: () => void;
}

export default function SettingsScreen({ onBack }: SettingsScreenProps) {
  // Switch configuration for elegant gold switch toggling
  const [notifications, setNotifications] = useState(true);
  
  // Modal controllers for premium interactivity
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [loadingName, setLoadingName] = useState(false);
  const [newName, setNewName] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [showLegalModal, setShowLegalModal] = useState<{ isOpen: boolean; title: string; content: string }>({
    isOpen: false,
    title: '',
    content: ''
  });

  // Load name and notifications settings initially
  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setNewName(user.user_metadata?.full_name || user.user_metadata?.name || '');
        }
        
        // Persistent switch from localStorage
        const storedNotifications = localStorage.getItem('casafacil_push_notifications');
        if (storedNotifications !== null) {
          setNotifications(storedNotifications === 'true');
        }
      } catch (err) {
        console.error('Erro ao ler dados do usuário:', err);
      }
    }
    loadUserData();
  }, []);

  /**
   * Toggles the mobile notifications push feature
   */
  const handleToggleNotifications = () => {
    const nextState = !notifications;
    setNotifications(nextState);
    localStorage.setItem('casafacil_push_notifications', String(nextState));
    toast.success(nextState ? 'Notificações ativadas!' : 'Notificações desativadas.', {
      description: 'Preferência de comunicação atualizada no dispositivo.'
    });
  };

  /**
   * Triggers real account sign out from Supabase
   * and takes the user back to the auth welcome state immediately
   */
  const handleLogout = async () => {
    try {
      // Clear credentials
      await supabase.auth.signOut();
      toast.success('Desconectado com sucesso!');
    } catch (err) {
      console.error('Erro ao efetuar saída:', err);
      toast.error('Ocorreu um erro ao desconectar.');
    }
  };

  /**
   * Updates user name on Supabase database
   */
  const handleUpdateName = async () => {
    if (!newName.trim()) {
      toast.warning('O nome não pode estar em branco.');
      return;
    }
    setLoadingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: newName }
      });
      if (error) throw error;
      toast.success('Nome alterado com sucesso!');
      setShowEditNameModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar nome');
    } finally {
      setLoadingName(false);
    }
  };

  /**
   * Updates user password securely in Supabase
   */
  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.warning('A senha precisa ter no mínimo 6 caracteres.');
      return;
    }
    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      toast.success('Sua senha foi alterada com sucesso!');
      setNewPassword('');
      setShowPasswordModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao redefinir senha.');
    } finally {
      setLoadingPassword(false);
    }
  };

  /**
   * FLUXO DE LIMPEZA TOTAL (STATE):
   * Executa a limpeza geral do aplicativo e prepara o Supabase para a exclusão.
   */
  const _executarExclusaoGeral = async () => {
    setLoadingDelete(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Exclui os imóveis publicados pelo usuário
        await supabase.from('imoveis').delete().eq('user_id', user.id);
      }

      // =======================================================================
      // FUTURA LINHA DE COMANDO DO SUPABASE PARA DELETAR O USUÁRIO DA AUTENTICAÇÃO:
      // Como os clients normais de front-end do Supabase não podem deletar usuários
      // diretamente da tabela auth.users por motivos óbvios de segurança, no backend/edge functions
      // deve-se rodar o comando administrativo de exclusão:
      // 
      // await supabase.auth.admin.deleteUser(userID);
      // 
      // E no banco de dados PostgreSQL, ative o delete cascade na sua tabela vinculada:
      // ALTER TABLE public.usuarios 
      // ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      // =======================================================================

      // Desconectar o usuário do Supabase Auth
      await supabase.auth.signOut();

      // Limpar todos os dados locais salvos na memória do celular / navegador
      localStorage.clear();

      // Mostrar um SnackBar (toast) na parte inferior avisando o sucesso
      toast.success('Sua conta e todos os seus dados foram removidos com sucesso.', {
        position: 'bottom-center',
        duration: 4000
      });

      // Navegar limpando a pilha de telas de volta para a tela de Boas-Vindas (WelcomeScreen)
      // Recarregamos a aplicação após um leve delay para limpar todo as pilhas de estado e voltar à WelcomeScreen
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);

    } catch (err) {
      console.error('Erro ao deletar conta totalmente:', err);
      toast.error('Ocorreu um erro ao excluir sua conta.');
    } finally {
      setLoadingDelete(false);
      setShowDeleteModal(false);
    }
  };

  /**
   * Open Help WhatsApp contact channels
   */
  const handleOpenWhatsAppSuporte = () => {
    toast.success('Redirecionando para nossa Central de Atendimento VIP via WhatsApp...', {
      description: 'Atendimento disponível 24h para membros VIP.'
    });
    setTimeout(() => {
      window.open('https://wa.me/5511999999999?text=Ol%C3%A1%2C%20gostaria%20de%20atendimento%20VIP%20CasaF%C3%A1cil', '_blank');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-navy-950 font-sans pb-28 relative">
      {/* AppBar style luxury header */}
      <header className="bg-white border-b border-navy-100/80 px-6 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 border border-navy-100 rounded-full hover:bg-navy-50 text-navy-500 hover:text-navy-950 transition-all duration-200 cursor-pointer"
            title="Voltar ao Perfil"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-gold-600 block font-bold">Painel de Segurança</span>
            <h1 className="text-xl font-serif text-navy-950 font-extrabold">Configurações Gerais</h1>
          </div>
        </div>
      </header>

      {/* Main Settings Menu Container */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* SECTION 1: MINHA CONTA */}
        <section className="bg-white rounded-3xl border border-navy-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-navy-50 bg-navy-50/20">
            <h3 className="text-xs uppercase tracking-widest text-navy-400 font-extrabold">Minha Conta</h3>
          </div>
          <div className="divide-y divide-navy-50">
            {/* Editar Dados */}
            <button
              onClick={() => setShowEditNameModal(true)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-navy-50/40 transition-colors duration-200 group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center text-navy-600 group-hover:text-gold-600 group-hover:bg-gold-50 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-950">Editar Dados Pessoais</h4>
                  <p className="text-[11px] text-navy-400">Atualize seu nome completo exibido na plataforma</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gold-500 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Alterar Senha */}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-navy-50/40 transition-colors duration-200 group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center text-navy-600 group-hover:text-gold-600 group-hover:bg-gold-50 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-950">Alterar Senha</h4>
                  <p className="text-[11px] text-navy-400">Modifique sua palavra-passe de acesso seguro</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gold-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* SECTION 2: PREFERÈNCIAS */}
        <section className="bg-white rounded-3xl border border-navy-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-navy-50 bg-navy-50/20">
            <h3 className="text-xs uppercase tracking-widest text-navy-400 font-extrabold">Preferências</h3>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center text-navy-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy-950">Notificações no Celular</h4>
                <p className="text-[11px] text-navy-400">Fique sabendo imediatamente sobre novos matches</p>
              </div>
            </div>

            {/* Elegant Golden Switch Component */}
            <button
              id="push-notifications-toggle"
              type="button"
              onClick={handleToggleNotifications}
              className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none ${
                notifications ? 'bg-gold-500' : 'bg-navy-200'
              }`}
            >
              <span
                className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                  notifications ? 'translate-x-6.5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </section>

        {/* SECTION 3: SUPORTE & LEGAL */}
        <section className="bg-white rounded-3xl border border-navy-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-navy-50 bg-navy-50/20">
            <h3 className="text-xs uppercase tracking-widest text-navy-400 font-extrabold">Suporte &amp; Legal</h3>
          </div>
          <div className="divide-y divide-navy-50">
            {/* Whatsapp */}
            <button
              onClick={handleOpenWhatsAppSuporte}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-navy-50/40 transition-colors duration-200 group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#25D366]">Suporte via WhatsApp</h4>
                  <p className="text-[11px] text-navy-400">Atendimento humanizado 24 horas por dia</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gold-500 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Termos de Uso */}
            <button
              onClick={() => setShowLegalModal({
                isOpen: true,
                title: 'Termos de Uso',
                content: 'Bem-vindo ao CasaFácil Match. Ao acessar nossa plataforma, você concorda em agir em plena conformidade com a legislação civil local, declarando que todas as informações relativas a rendas familiares, WhatsApp e dados físicos de imóveis são verdadeiras e autenticadas. A plataforma reserva-se o direito de remover anúncios comprovadamente fraudulentos ou que violem os preceitos de luxo e alto padrão estabelecidos nesta comunidade VIP de locatários e proprietários.'
              })}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-navy-50/40 transition-colors duration-200 group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center text-navy-600 group-hover:bg-gold-50 group-hover:text-gold-600 transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-950">Termos de Uso</h4>
                  <p className="text-[11px] text-navy-400">Diretrizes e deveres de ética na comunidade</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gold-500 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Politicas */}
            <button
              onClick={() => setShowLegalModal({
                isOpen: true,
                title: 'Políticas de Privacidade',
                content: 'Valorizamos imensamente sua privacidade. Os dados inseridos na plataforma CasaFácil Match — como renda famílias, fotografias residenciais compactadas e dados de contato de telefones celulares — são transmitidos de forma segura através de conexões encriptadas HTTPS diretamente para os servidores do Supabase. Nenhuma informação pessoal confidencial é vendida ou repassada para terceiros, sendo utilizada estritamente para propósitos internos automáticos de matchmaking.'
              })}
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-navy-50/40 transition-colors duration-200 group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-navy-50 flex items-center justify-center text-navy-600 group-hover:bg-gold-50 group-hover:text-gold-600 transition-colors">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-navy-950">Políticas de Privacidade</h4>
                  <p className="text-[11px] text-navy-400">Descubra como protegemos suas informações</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gold-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* SECTION 4: SEGURANÇA */}
        <section className="bg-white rounded-3xl border border-navy-100 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-navy-50 bg-navy-50/20">
            <h3 className="text-xs uppercase tracking-widest text-navy-400 font-extrabold">Segurança do Aplicativo</h3>
          </div>
          <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-navy-950">Excluir Conta Permanentemente</h4>
              <p className="text-xs text-navy-400 leading-relaxed max-w-md">
                Elimina suas credenciais associadas no Supabase e expira todos os anúncios publicados vinculados. Requisito das diretrizes de App Store.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150/50 hover:border-rose-300 font-bold text-[10px] tracking-widest uppercase py-4 px-5 rounded-2xl cursor-pointer self-start sm:self-center transition-all hover:scale-102 duration-300 active:scale-98"
            >
              Excluir Conta
            </button>
          </div>
        </section>

        {/* LOGOUT FOOTER ACTION BUTTON */}
        <div className="pt-8 text-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2.5 text-rose-600 hover:text-rose-700 font-extrabold text-xs uppercase tracking-[0.25em] py-3.5 px-8 rounded-full hover:bg-rose-50/70 border border-transparent hover:border-rose-100/50 transition-all duration-300 cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Minha Conta</span>
          </button>
          <div className="text-[9px] text-navy-400 mt-5 uppercase tracking-widest">
            CasaFácil Match • build 2026.5.23
          </div>
        </div>

      </main>

      {/* MODAL DIALOG 1: EDIT PROFILE DADOS */}
      <AnimatePresence>
        {showEditNameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
              onClick={() => setShowEditNameModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white border border-navy-150 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-5 z-10 text-navy-950"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-extrabold text-navy-950">Dados VIP</h3>
                  <p className="text-[10px] uppercase text-navy-400 font-bold tracking-widest">Editar Perfil</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-black text-navy-500">Nome Completo</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full h-11 border border-navy-100 px-4 rounded-xl text-xs font-bold bg-navy-50/30 text-navy-950 placeholder-navy-300 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowEditNameModal(false)}
                  disabled={loadingName}
                  className="py-3 px-4.5 border border-navy-200 rounded-xl hover:bg-navy-50 text-[10px] font-black uppercase tracking-widest text-navy-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateName}
                  disabled={loadingName}
                  className="py-3 px-5 bg-gold-500 hover:bg-gold-600 text-navy-950 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-md shadow-gold-500/10"
                >
                  {loadingName ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : 'Salvar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DIALOG 2: PASSWORD REDEFINE */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
              onClick={() => setShowPasswordModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white border border-navy-150 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-5 z-10 text-navy-950"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-50 border border-gold-200 flex items-center justify-center text-gold-600">
                  <LockKeyhole className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-extrabold text-navy-950">Privacidade</h3>
                  <p className="text-[10px] uppercase text-navy-400 font-bold tracking-widest">Alterar Senha</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-black text-navy-500">Nova Senha (Mín. 6 dígitos)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 border border-navy-100 px-4 rounded-xl text-xs font-bold bg-navy-50/30 text-navy-950 placeholder-navy-300 focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  disabled={loadingPassword}
                  className="py-3 px-4.5 border border-navy-200 rounded-xl hover:bg-navy-50 text-[10px] font-black uppercase tracking-widest text-navy-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdatePassword}
                  disabled={loadingPassword}
                  className="py-3 px-5 bg-gold-500 hover:bg-gold-600 text-navy-950 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-md shadow-gold-500/10"
                >
                  {loadingPassword ? <Loader2 className="w-4.5 h-4.5 animate-spin w-4 h-4" /> : 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DIALOG 3: LEGAL CONTENT VIEW */}
      <AnimatePresence>
        {showLegalModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
              onClick={() => setShowLegalModal({ isOpen: false, title: '', content: '' })}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white border border-navy-150 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-5 z-10 text-navy-950"
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-widest font-black text-gold-600 block">Canal Regulamentar</span>
                <h3 className="font-serif text-xl font-extrabold text-navy-950">{showLegalModal.title}</h3>
              </div>
              
              <div className="text-xs text-navy-600 leading-relaxed font-light mt-2 max-h-60 overflow-y-auto pr-2">
                {showLegalModal.content}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowLegalModal({ isOpen: false, title: '', content: '' })}
                  className="py-3.5 px-6 bg-navy-950 hover:bg-navy-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer"
                >
                  Li e concordo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DIALOG 4: DELETE CONFIRMATION DIALOG (ACCOUNT DELETION) */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
              onClick={() => {
                if (!loadingDelete) setShowDeleteModal(false);
              }}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white border border-rose-200 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 z-10 text-navy-950"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-rose-50 border-2 border-rose-500/30 flex items-center justify-center shrink-0 text-rose-600 animate-pulse">
                  <Trash2 className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-bold text-rose-600">Alerta Vermelho!</h3>
                  <p className="text-xs text-rose-700/90 font-medium leading-relaxed bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                    AVISO IMPORTANTE: Tem certeza absoluta que deseja excluir sua conta? Isso apagará permanentemente seu e-mail de acesso, suas fotos, suas publicações e todos os seus dados. Essa ação NÃO pode ser desfeita.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={loadingDelete}
                  className="py-3 px-5 border border-navy-200 rounded-xl hover:bg-navy-50 text-[10px] font-black uppercase tracking-widest text-navy-600 cursor-pointer transition-all active:scale-95 duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={_executarExclusaoGeral}
                  disabled={loadingDelete}
                  className="py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest cursor-pointer shadow-lg shadow-rose-600/20 hover:shadow-rose-600/30 transition-all hover:-translate-y-0.5 active:translate-y-0 duration-200 focus:ring-2 focus:ring-rose-500/20"
                >
                  {loadingDelete ? (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Excluindo...</span>
                    </div>
                  ) : (
                    'Excluir Permanentemente'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
