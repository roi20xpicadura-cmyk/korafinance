import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WhatsAppPromoWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.functions.invoke('whatsapp-verify', {
      body: { userId: user.id, action: 'status' },
    }).then(({ data }) => {
      setConnected(!!data?.connection);
    }).catch(() => setConnected(false));
  }, [user]);

  if (connected === null || connected) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      onClick={() => navigate('/app/settings')}
      className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all hover:brightness-95 active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.2)' }}>
        <MessageCircle size={20} color="white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-extrabold text-white">Registre gastos pelo WhatsApp</p>
        <p className="text-[11px] text-white/70">"gastei 50 no mercado" → registrado automaticamente</p>
      </div>
      <ArrowRight size={16} color="rgba(255,255,255,0.7)" className="flex-shrink-0" />
    </motion.button>
  );
}
