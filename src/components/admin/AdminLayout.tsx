import { NavLink, Outlet, Link } from "react-router-dom";
import { LayoutDashboard, Users, MessageCircle, DollarSign, Bell, Settings, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", end: true },
  { icon: Users, label: "Usuários", path: "/admin/users" },
  { icon: MessageCircle, label: "WhatsApp", path: "/admin/whatsapp" },
  { icon: DollarSign, label: "Receita", path: "/admin/revenue" },
  { icon: Bell, label: "Notificações", path: "/admin/notifications" },
  { icon: Settings, label: "Configurações", path: "/admin/settings" },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-lg">🐨</div>
            <div>
              <div className="text-sm font-bold leading-tight">KoraFinance</div>
              <div className="text-[11px] text-muted-foreground">Admin Panel</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Link
            to="/app"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao app
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
