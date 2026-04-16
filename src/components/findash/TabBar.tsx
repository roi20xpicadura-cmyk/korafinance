import { TAB_NAMES } from "@/types/findash";
import { LayoutDashboard, Receipt, Target, TrendingUp, FileText, CreditCard, PiggyBank, BarChart3, Download } from "lucide-react";

const ICONS = [LayoutDashboard, Receipt, Target, TrendingUp, FileText, CreditCard, PiggyBank, BarChart3, Download];

interface TabBarProps {
  active: number;
  onChange: (i: number) => void;
}

export default function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div className="bg-surface border-b border-border/40 overflow-x-auto scrollbar-hide">
      <div className="flex min-w-max px-5 md:px-8 gap-1">
        {TAB_NAMES.map((name, i) => {
          const Icon = ICONS[i];
          const isActive = active === i;
          return (
            <button
              key={name}
              onClick={() => onChange(i)}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-semibold border-b-2 transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : ''}`} />
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
