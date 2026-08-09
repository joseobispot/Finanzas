import {
  Home,
  Receipt,
  PieChart,
  Target,
  PiggyBank,
  Landmark,
  Tags,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/transactions", label: "Transacciones", icon: Receipt },
  { href: "/budget", label: "Presupuesto", icon: PieChart },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/savings", label: "Ahorros", icon: PiggyBank },
  { href: "/loans", label: "Deudas", icon: Landmark },
  { href: "/categories", label: "Categorías", icon: Tags },
  { href: "/reports", label: "Reportes", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings },
];

export const bottomNavItems: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/budget", label: "Presup.", icon: PieChart },
  { href: "/goals", label: "Metas", icon: Target },
  { href: "/savings", label: "Ahorros", icon: PiggyBank },
  { href: "/settings", label: "Más", icon: Settings },
];
