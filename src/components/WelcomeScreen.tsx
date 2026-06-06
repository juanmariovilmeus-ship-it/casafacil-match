import React from 'react';
import { motion } from 'motion/react';
import { Home, Key, ShieldCheck, HelpCircle } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectRole: (role: 'cliente' | 'proprietario') => void;
}

export default function WelcomeScreen({ onSelectRole }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col min-h-screen bg-navy-950 text-white font-sans relative overflow-hidden select-none">
      {/* Absolute Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-gold-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-gold-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header with Luxury Brand */}
      <header className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-gold-500 flex items-center justify-center rotate-45">
            <span className="-rotate-45 font-serif text-gold-500 font-bold text-xl uppercase tracking-tighter">CF</span>
          </div>
          <span className="tracking-[0.25em] text-xs font-light uppercase text-gold-500">CasaFácil Match</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] tracking-widest text-navy-400 font-medium uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-500/80" />
          <span>Ambiente Autenticado</span>
        </div>
      </header>

      {/* Main Hero & Options */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 flex flex-col justify-center items-center text-center z-10 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="space-y-4 max-w-2xl mb-12"
        >
          <div className="inline-block px-3 py-1 bg-navy-900/60 border border-gold-500/20 rounded-full text-[9px] uppercase tracking-[0.25em] text-gold-400 font-semibold mb-2">
            Plataforma Exclusiva de Matching Imobiliário
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif text-white font-normal leading-tight italic">
            Seja bem-vindo ao <br />
            <span className="text-gold-500 not-italic font-bold">luxo da simplicidade</span>
          </h1>
          <div className="w-12 h-[2px] bg-gold-500 mx-auto my-6" />
          <p className="text-xl sm:text-2xl font-serif text-gold-200/90 font-medium tracking-wide">
            O que você deseja fazer hoje?
          </p>
        </motion.div>

        {/* Action Buttons Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Option 1: Inquilino */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -4 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onClick={() => onSelectRole('cliente')}
            className="group relative bg-navy-900/40 hover:bg-navy-900/80 transition-all duration-300 border border-navy-800 hover:border-gold-500/70 p-8 sm:p-10 rounded-2xl cursor-pointer text-left flex flex-col justify-between h-72 shadow-xl hover:shadow-gold-500/5 focus:outline-none focus:ring-1 focus:ring-gold-500/50"
          >
            <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center text-gold-500 group-hover:bg-gold-500 group-hover:text-navy-950 transition-colors duration-300">
              <Home className="w-6 h-6" />
            </div>
            
            <div className="space-y-3 pt-6">
              <h3 className="text-lg font-serif font-black text-white group-hover:text-gold-500 transition-colors duration-300">
                🏠 Quero encontrar um imóvel (Usuário)
              </h3>
              <p className="text-xs text-navy-300/80 leading-relaxed font-light">
                Busque residências ideais pré-validadas de alto padrão com suporte sob medida para sua locação ou compra.
              </p>
              <div className="text-[9px] uppercase tracking-widest text-gold-500 font-semibold pt-2 flex items-center gap-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                <span>Perfil Usuário</span>
                <span>→</span>
              </div>
            </div>
          </motion.button>

          {/* Option 2: Proprietario */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -4 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onClick={() => onSelectRole('proprietario')}
            className="group relative bg-navy-900/40 hover:bg-navy-900/80 transition-all duration-300 border border-navy-800 hover:border-gold-500/70 p-8 sm:p-10 rounded-2xl cursor-pointer text-left flex flex-col justify-between h-72 shadow-xl hover:shadow-gold-500/5 focus:outline-none focus:ring-1 focus:ring-gold-500/50"
          >
            <div className="w-12 h-12 bg-gold-500/10 border border-gold-500/20 rounded-xl flex items-center justify-center text-gold-500 group-hover:bg-gold-500 group-hover:text-navy-950 transition-colors duration-300">
              <Key className="w-6 h-6" />
            </div>

            <div className="space-y-3 pt-6">
              <h3 className="text-lg font-serif font-black text-white group-hover:text-gold-500 transition-colors duration-300">
                🔑 Quero anunciar meus imóveis
              </h3>
              <p className="text-xs text-navy-300/80 leading-relaxed font-light">
                Publique suas propriedades residenciais com fotos otimizadas de luxo e acompanhe interessados.
              </p>
              <div className="text-[9px] uppercase tracking-widest text-gold-500 font-semibold pt-2 flex items-center gap-1 opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                <span>Perfil Proprietário</span>
                <span>→</span>
              </div>
            </div>
          </motion.button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-navy-900/60 text-center z-10 text-[9px] text-navy-500 uppercase tracking-[0.4em] flex flex-col sm:flex-row justify-between items-center gap-3">
        <span>© 2026 CasaFácil Match • Luxury Living Excellence</span>
        <div className="flex gap-4 tracking-widest text-navy-600 font-light lowercase">
          <span>elegância</span>
          <span>•</span>
          <span>segurança</span>
          <span>•</span>
          <span>exclusividade</span>
        </div>
      </footer>
    </div>
  );
}
