import type { ComponentType } from "react";
import { forwardRef, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { lazyWithRetry } from "@/lib/lazyWithRetry";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute, PublicRoute } from "@/components/auth/ProtectedRoute";
import NativeOAuthForwarder from "@/components/auth/NativeOAuthForwarder";
import LogoLoader from "@/components/app/LogoLoader";
import InnerPageSkeleton from "@/components/app/InnerPageSkeleton";
import Paywall from "@/components/app/Paywall";
import { useProfile } from "@/hooks/useProfile";

const lazy = <T extends ComponentType<any>>(imp: () => Promise<{ default: T }>) =>
  lazyWithRetry(imp, { fallbackToEmpty: false });

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AppLayout = lazy(() => import("@/components/app/AppLayout"));
const OverviewPage = lazy(() => import("@/pages/app/OverviewPage"));
const TransactionsPage = lazy(() => import("@/pages/app/TransactionsPage"));
const GoalsPage = lazy(() => import("@/pages/app/GoalsPage"));
const DebtsPage = lazy(() => import("@/pages/app/DebtsPage"));
const CardsPage = lazy(() => import("@/pages/app/CardsPage"));
const BudgetPage = lazy(() => import("@/pages/app/BudgetPage"));
const AchievementsPage = lazy(() => import("@/pages/app/AchievementsPage"));
const ReferralPage = lazy(() => import("@/pages/app/ReferralPage"));
const SettingsPage = lazy(() => import("@/pages/app/SettingsPage"));
const BillingPage = lazy(() => import("@/pages/app/BillingPage"));
const PlanoSucessoPage = lazy(() => import("@/pages/app/PlanoSucessoPage"));
const IntegrationsPage = lazy(() => import("@/pages/app/IntegrationsPage"));
const SimulatorPage = lazy(() => import("@/pages/app/SimulatorPage"));
const PredictionsPage = lazy(() => import("@/pages/app/PredictionsPage"));
const ExportPage = lazy(() => import("@/pages/app/ExportPage").then((m) => ({ default: m.ExportPage })));
const ChartsPage = lazy(() => import("@/pages/app/ChartsPage"));
const CategoriesPage = lazy(() => import("@/pages/app/CategoriesPage"));
const InvestmentsPage = lazy(() => import("@/pages/app/InvestmentsPage"));
const SubscriptionsPage = lazy(() => import("@/pages/app/SubscriptionsPage"));
const DREPage = lazy(() => import("@/pages/app/DREPage"));
const SecuritySettingsPage = lazy(() => import("@/pages/app/SecuritySettingsPage"));
const AdminGuard = lazy(() => import("@/components/admin/AdminGuard"));
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminDashboardPage = lazy(() => import("@/pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminWhatsAppPage = lazy(() => import("@/pages/admin/AdminWhatsAppPage"));
const AdminRevenuePage = lazy(() => import("@/pages/admin/AdminRevenuePage"));
const AdminNotificationsPage = lazy(() => import("@/pages/admin/AdminNotificationsPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));

function PageSkeleton() {
  return <LogoLoader fullScreen />;
}

function RouteSkeleton() {
  return <InnerPageSkeleton delay={120} />;
}

function TransactionsRouter() {
  const { config, loading } = useProfile();
  if (loading) return <RouteSkeleton />;
  const profileType = config?.profile_type || 'personal';
  if (profileType === 'business') return <Navigate to="/app/transactions/business" replace />;
  return <Navigate to="/app/transactions/personal" replace />;
}

const AuthenticatedRoutes = forwardRef<HTMLDivElement>(function AuthenticatedRoutes(_, ref) {
  return (
    <div ref={ref} style={{ minHeight: '100dvh' }}>
      <AuthProvider>
        <NativeOAuthForwarder />
        <ThemeProvider>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Estas rotas agora ficam sob um único wildcard no nível raiz,
                então paths relativos cuidam de login/register e os absolutos
                continuam cobrindo /app e /admin. */}
            <Route path="" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            {/* Aliases defensivos pra variações comuns de auth */}
            <Route path="signup" element={<Navigate to="/register" replace />} />
            <Route path="sign-up" element={<Navigate to="/register" replace />} />
            <Route path="signin" element={<Navigate to="/login" replace />} />
            <Route path="sign-in" element={<Navigate to="/login" replace />} />
            <Route path="entrar" element={<Navigate to="/login" replace />} />
            <Route path="cadastro" element={<Navigate to="/register" replace />} />
            <Route path="registrar" element={<Navigate to="/register" replace />} />
            <Route path="esqueci-senha" element={<Navigate to="/forgot-password" replace />} />
            <Route path="recuperar-senha" element={<Navigate to="/forgot-password" replace />} />
            <Route path="redefinir-senha" element={<Navigate to="/reset-password" replace />} />

            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<OverviewPage />} />
              <Route path="transactions" element={<TransactionsRouter />} />
              <Route path="transactions/personal" element={<TransactionsPage profile="personal" />} />
              <Route path="goals" element={<GoalsPage />} />
              <Route path="debts" element={<Paywall feature="debts" requiredPlan="pro" title="Gestão de Dívidas" description="Organize, priorize e quite suas dívidas com estratégias inteligentes (Snowball / Avalanche)."><DebtsPage /></Paywall>} />
              <Route path="budget" element={<Paywall feature="budget" requiredPlan="pro" title="Orçamentos" description="Crie orçamentos por categoria e receba alertas antes de estourar."><BudgetPage /></Paywall>} />
              <Route path="cards" element={<CardsPage />} />
              <Route path="export" element={<Paywall feature="export" requiredPlan="pro" title="Exportar dados" description="Exporte seus dados em PDF, Excel e CSV a qualquer momento."><Suspense fallback={<InnerPageSkeleton />}><ExportPage /></Suspense></Paywall>} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/security" element={<SecuritySettingsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="plano/sucesso" element={<PlanoSucessoPage />} />
              <Route path="integrations" element={<IntegrationsPage />} />
              <Route path="achievements" element={<AchievementsPage />} />
              <Route path="referral" element={<ReferralPage />} />
              <Route path="simulator" element={<Paywall feature="simulator" requiredPlan="pro" title="Simulador Financeiro" description="Teste cenários de receita, despesa e investimentos antes de tomar decisões."><SimulatorPage /></Paywall>} />
              <Route path="predictions" element={<Paywall feature="kora_ia" requiredPlan="pro" title="Previsões com IA" description="Veja projeções inteligentes do seu fluxo de caixa para os próximos meses."><PredictionsPage /></Paywall>} />
              <Route path="charts" element={<Paywall feature="advanced_charts" requiredPlan="pro" title="Gráficos avançados" description="Analise tendências e padrões com gráficos detalhados."><ChartsPage /></Paywall>} />
              <Route path="categorias" element={<CategoriesPage />} />
              <Route path="investments" element={<InvestmentsPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="dre" element={<Paywall feature="dre" requiredPlan="business" title="DRE Empresarial" description="Demonstrativo de Resultado completo para empresas e MEIs."><DREPage /></Paywall>} />
              <Route path="transactions/business" element={<Paywall feature="business_transactions" requiredPlan="business" title="Lançamentos Negócio" description="Separe finanças pessoais e empresariais em um único painel."><TransactionsPage profile="business" /></Paywall>} />
              {/* Aliases defensivos: variações PT/EN comuns que usuários podem
                  digitar ou ter salvo de versões antigas. Redirecionam pra rota
                  canônica em vez de cair em 404. */}
              <Route path="dashboard" element={<Navigate to="/app" replace />} />
              <Route path="home" element={<Navigate to="/app" replace />} />
              <Route path="overview" element={<Navigate to="/app" replace />} />
              <Route path="transacoes" element={<Navigate to="/app/transactions" replace />} />
              <Route path="lancamentos" element={<Navigate to="/app/transactions" replace />} />
              <Route path="categories" element={<Navigate to="/app/categorias" replace />} />
              <Route path="metas" element={<Navigate to="/app/goals" replace />} />
              <Route path="dividas" element={<Navigate to="/app/debts" replace />} />
              <Route path="orcamento" element={<Navigate to="/app/budget" replace />} />
              <Route path="cartoes" element={<Navigate to="/app/cards" replace />} />
              <Route path="conquistas" element={<Navigate to="/app/achievements" replace />} />
              <Route path="configuracoes" element={<Navigate to="/app/settings" replace />} />
              <Route path="config" element={<Navigate to="/app/settings" replace />} />
              <Route path="plano" element={<Navigate to="/app/billing" replace />} />
              <Route path="planos" element={<Navigate to="/app/billing" replace />} />
              <Route path="indicar" element={<Navigate to="/app/referral" replace />} />
              <Route path="assinaturas" element={<Navigate to="/app/subscriptions" replace />} />
              <Route path="investimentos" element={<Navigate to="/app/investments" replace />} />
              <Route path="graficos" element={<Navigate to="/app/charts" replace />} />
              <Route path="simulador" element={<Navigate to="/app/simulator" replace />} />
              <Route path="previsoes" element={<Navigate to="/app/predictions" replace />} />
              <Route path="integracoes" element={<Navigate to="/app/integrations" replace />} />
              {/* Catch-all interno do /app — usa a tela 404 da marca */}
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="whatsapp" element={<AdminWhatsAppPage />} />
              <Route path="revenue" element={<AdminRevenuePage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
});

export default AuthenticatedRoutes;