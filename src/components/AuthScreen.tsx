import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ArrowLeft } from 'lucide-react';

interface AuthScreenProps {
  selectedRole: 'cliente' | 'proprietario';
  onBack: () => void;
}

export default function AuthScreen({ selectedRole, onBack }: AuthScreenProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [income, setIncome] = useState('');
  const [tipoConta, setTipoConta] = useState<'cliente' | 'proprietario'>(selectedRole);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipoConta) {
      toast.error('Por favor, selecione se você é Usuário ou Proprietário/Imobiliária.');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            monthly_income: parseFloat(income),
            tipo_conta: tipoConta,
            role: tipoConta,
          },
        },
      });

      if (error) throw error;
      
      toast.success('Cadastro realizado com sucesso! Verifique seu e-mail.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar cadastro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success(`Bem-vindo de volta, ${data.user?.user_metadata?.full_name || email}!`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen bg-navy-950 font-sans overflow-y-auto lg:overflow-hidden">
      {/* Left Panel: Brand & Imagery */}
      <div className="w-full lg:w-1/2 relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-navy-950 via-navy-800 to-navy-950 border-b lg:border-b-0 lg:border-r border-gold-500/20 min-h-[450px] lg:min-h-0">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-gold-500 flex items-center justify-center rotate-45">
              <span className="-rotate-45 font-serif text-gold-500 font-bold text-xl uppercase tracking-tighter">CF</span>
            </div>
            <span className="tracking-[0.2em] text-sm font-light uppercase text-gold-500">CasaFácil Match</span>
          </div>
        </div>

        <div className="space-y-6 my-10 lg:my-0">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-serif leading-tight italic text-white"
          >
            Encontre a sua <br/>
            <span className="text-gold-500 not-italic font-bold">residência ideal</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-navy-300 text-sm sm:text-base max-w-md font-light leading-relaxed"
          >
            Conectando investidores e moradores a imóveis de alto padrão com inteligência e exclusividade.
          </motion.p>
        </div>

        <div>
          <div className="h-[1px] w-full bg-gradient-to-r from-gold-500/50 to-transparent mb-6"></div>
          <div className="flex gap-6 sm:gap-8 text-[10px] tracking-widest uppercase text-navy-400 font-medium">
            <span className="hover:text-gold-500 transition-colors cursor-default">Elegância</span>
            <span className="hover:text-gold-500 transition-colors cursor-default">Segurança</span>
            <span className="hover:text-gold-500 transition-colors cursor-default">Exclusividade</span>
          </div>
        </div>
      </div>

      {/* Right Panel: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-navy-950 px-6 py-12 lg:py-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <button
            type="button"
            onClick={onBack}
            className="group flex items-center gap-2 mb-6 text-navy-400 hover:text-gold-500 text-[10px] font-bold tracking-widest uppercase transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para Boas-vindas</span>
          </button>

          <div className="mb-10 flex border-b border-navy-800">
            <button 
              onClick={() => setIsLoginView(false)}
              className={`pb-4 px-6 font-medium tracking-wide transition-all duration-300 border-b-2 ${!isLoginView ? 'text-gold-500 border-gold-500' : 'text-navy-400 border-transparent hover:text-navy-200'}`}
            >
              CADASTRO
            </button>
            <button 
              onClick={() => setIsLoginView(true)}
              className={`pb-4 px-6 font-medium tracking-wide transition-all duration-300 border-b-2 ${isLoginView ? 'text-gold-500 border-gold-500' : 'text-navy-400 border-transparent hover:text-navy-200'}`}
            >
              ENTRAR
            </button>
          </div>

          <AnimatePresence mode="wait">
            {!isLoginView ? (
              <motion.form 
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSignUp}
                className="space-y-5"
              >
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-widest text-gold-500 font-semibold mb-1 block">Nome Completo</Label>
                  <Input 
                    type="text" 
                    placeholder="Ex: Ricardo Santos" 
                    className="w-full bg-navy-950 border border-navy-800 focus:border-gold-500 text-white rounded-none outline-none h-12 transition-colors placeholder:text-navy-700"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-widest text-gold-500 font-semibold mb-1 block">Seu melhor e-mail</Label>
                  <Input 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="w-full bg-navy-950 border border-navy-800 focus:border-gold-500 text-white rounded-none outline-none h-12 transition-colors placeholder:text-navy-700"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-widest text-gold-500 font-semibold mb-1 block">Senha</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full bg-navy-950 border border-navy-800 focus:border-gold-500 text-white rounded-none outline-none h-12 transition-colors placeholder:text-navy-700"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] uppercase tracking-widest text-gold-500 font-semibold mb-1 block">Renda Mensal</Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-3.5 text-navy-500 text-sm">R$</span>
                      <Input 
                        type="number" 
                        placeholder="0.000,00" 
                        className="w-full bg-navy-950 border border-navy-800 focus:border-gold-500 text-white rounded-none outline-none h-12 pl-10 transition-colors placeholder:text-navy-700"
                        value={income}
                        onChange={(e) => setIncome(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Perfil Selecionado Informacional de Alta Classe */}
                <div className="space-y-2 pt-1 border-t border-navy-800/60 font-sans">
                  <div className="bg-navy-900/60 border border-gold-500/10 px-4 py-3.5 text-left flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase tracking-wider text-navy-400 block font-semibold">Perfil de Usuário</span>
                      <span className="text-xs font-serif text-gold-500 font-extrabold tracking-wide">
                        {tipoConta === 'cliente' ? '🏠 Usuário (Encontrar Imóvel)' : '🔑 Proprietário (Anunciar de Luxo)'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={onBack}
                      className="text-[9px] font-bold text-gold-500 hover:text-gold-400 uppercase tracking-widest cursor-pointer underline hover:no-underline"
                    >
                      Alterar
                    </button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-7 mt-6 tracking-[0.2em] uppercase text-xs transition-all shadow-lg shadow-gold-500/10 rounded-none group"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Finalizar Cadastro"}
                </Button>

                <p className="text-center text-xs text-navy-500 mt-8 leading-relaxed">
                  Ao continuar, você concorda com nossos <br className="hidden sm:inline" />
                  <a href="#" className="text-gold-500 hover:text-gold-400 border-b border-gold-500/20 hover:border-gold-400 transition-colors mx-1">Termos de Uso</a> e 
                  <a href="#" className="text-gold-500 hover:text-gold-400 border-b border-gold-500/20 hover:border-gold-400 transition-colors mx-1">Privacidade</a>.
                </p>
              </motion.form>
            ) : (
              <motion.form 
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                <div className="space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-widest text-gold-500 font-semibold mb-1 block">Seu melhor e-mail</Label>
                  <Input 
                    type="email" 
                    placeholder="seu@email.com" 
                    className="w-full bg-navy-950 border border-navy-800 focus:border-gold-500 text-white rounded-none outline-none h-12 transition-colors placeholder:text-navy-700"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-end mb-1">
                    <Label className="text-[11px] uppercase tracking-widest text-gold-500 font-semibold block">Senha Acesso</Label>
                    <a href="#" className="text-[10px] uppercase tracking-widest text-navy-500 hover:text-gold-500 transition-colors">Esqueceu?</a>
                  </div>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full bg-navy-950 border border-navy-800 focus:border-gold-500 text-white rounded-none outline-none h-12 transition-colors placeholder:text-navy-700"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold py-7 mt-6 tracking-[0.2em] uppercase text-xs transition-all shadow-lg shadow-gold-500/10 rounded-none group"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Acessar Plataforma"}
                </Button>

                <div className="mt-8 p-4 border border-navy-800 bg-navy-900/20 text-center">
                  <p className="text-[10px] text-navy-400 uppercase tracking-widest mb-2">Novo por aqui?</p>
                  <button 
                    type="button"
                    onClick={() => setIsLoginView(false)}
                    className="text-gold-500 text-xs font-bold uppercase tracking-widest hover:text-gold-400 transition-colors"
                  >
                    Criar conta exclusiva
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-12 text-center">
            <p className="text-[9px] text-navy-600 uppercase tracking-[0.4em]">
              © 2026 CasaFácil Match • Luxury Living Excellence
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
