import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Compass, LayoutDashboard } from "lucide-react";
import icon from "@/assets/korafinance-icon.png";

/**
 * Página 404 da Kora — usa identidade roxa da marca, copy em PT-BR e oferece
 * caminhos úteis (voltar, ir pro app, ir pra home) em vez de só um link genérico.
 */
const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.warn("[404] rota não encontrada:", location.pathname);
  }, [location.pathname]);

  // Heurística: se o usuário estava dentro de /app, sugerimos voltar pro dashboard.
  // Caso contrário, sugerimos a landing.
  const wasInsideApp = location.pathname.startsWith("/app");
  const primaryHref = wasInsideApp ? "/app" : "/";
  const primaryLabel = wasInsideApp ? "Voltar pro dashboard" : "Voltar pra home";
  const PrimaryIcon = wasInsideApp ? LayoutDashboard : Home;

  return (
    <div
      className="flex min-h-[100dvh] items-center justify-center px-6 py-12"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(263 70% 18%) 0%, hsl(263 60% 8%) 60%, hsl(0 0% 0%) 100%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md text-center"
      >
        <div className="mb-8 flex justify-center">
          <img
            src={icon}
            alt="KoraFinance"
            width={56}
            height={56}
            className="rounded-2xl object-cover shadow-[0_8px_30px_rgba(124,58,237,0.45)]"
          />
        </div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-3 font-black tracking-tight text-white"
          style={{
            fontSize: "clamp(72px, 18vw, 120px)",
            lineHeight: 1,
            background:
              "linear-gradient(180deg, #fff 0%, #c4b5fd 60%, #7c3aed 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </motion.h1>

        <h2 className="mb-3 text-xl font-bold text-white sm:text-2xl">
          Essa página fugiu do orçamento 💸
        </h2>
        <p className="mb-2 text-[15px] leading-relaxed text-white/70">
          A rota que você tentou acessar não existe ou foi movida.
        </p>
        {location.pathname && (
          <p className="mb-8 break-all font-mono text-xs text-white/40">
            {location.pathname}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={primaryHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-[14px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)",
              boxShadow: "0 8px 24px rgba(124,58,237,0.45)",
            }}
          >
            <PrimaryIcon className="h-4 w-4" />
            {primaryLabel}
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-[14px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Página anterior
          </button>
        </div>

        {wasInsideApp && (
          <Link
            to="/app/transactions"
            className="mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-white/60 hover:text-white"
          >
            <Compass className="h-3.5 w-3.5" />
            Ou explore seus lançamentos
          </Link>
        )}
      </motion.div>
    </div>
  );
};

export default NotFound;
