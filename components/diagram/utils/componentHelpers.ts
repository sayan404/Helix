import {
  Database,
  Server,
  Globe,
  Layers,
  Box,
  Network,
  Cloud,
  HardDrive,
  Shield,
  Code2,
  BarChart3,
  Smartphone,
  Monitor,
  Hexagon,
  Container,
  Key,
  Route,
  Wifi,
  Library,
  BrainCircuit,
  GitBranch,
  LucideIcon,
} from "lucide-react";

// Map string icon names to actual components
const iconMap: Record<string, LucideIcon> = {
  Database,
  Server,
  Globe,
  Layers,
  Box,
  Network,
  Cloud,
  HardDrive,
  Shield,
  Code2,
  BarChart3,
  Smartphone,
  Monitor,
  Hexagon,
  Container,
  Key,
  Route,
  Wifi,
  Library,
  BrainCircuit,
  GitBranch,
};

// Helper to get the icon component
export const getComponentIcon = (iconName: string) => {
  return iconMap[iconName] || Server;
};

// Helper to find component definition by type
export const getComponentDef = (type: string, componentLibrary: any[]) => {
  for (const category of componentLibrary) {
    const item = category.items.find((i: any) => i.type === type);
    if (item) return item;
  }
  return null;
};

// Helper to generate Tailwind classes dynamically based on color theme
export const getThemeStyles = (colorTheme: string) => {
  const styles: Record<
    string,
    {
      border: string;
      bg: string;
      shadow: string;
      text: string;
      darkText: string;
    }
  > = {
    green: {
      border: "border-green-500 dark:border-green-500",
      bg: "bg-green-50 dark:bg-slate-800/95",
      shadow: "shadow-green-100 dark:shadow-none",
      text: "text-green-600",
      darkText: "dark:text-green-400",
    },
    blue: {
      border: "border-blue-500 dark:border-blue-500",
      bg: "bg-blue-50 dark:bg-slate-800/95",
      shadow: "shadow-blue-100 dark:shadow-none",
      text: "text-blue-600",
      darkText: "dark:text-blue-400",
    },
    purple: {
      border: "border-purple-500 dark:border-purple-500",
      bg: "bg-purple-50 dark:bg-slate-800/95",
      shadow: "shadow-purple-100 dark:shadow-none",
      text: "text-purple-600",
      darkText: "dark:text-purple-400",
    },
    indigo: {
      border: "border-indigo-500 dark:border-indigo-500",
      bg: "bg-indigo-50 dark:bg-slate-800/95",
      shadow: "shadow-indigo-100 dark:shadow-none",
      text: "text-indigo-600",
      darkText: "dark:text-indigo-400",
    },
    slate: {
      border: "border-slate-500 dark:border-slate-500",
      bg: "bg-slate-50 dark:bg-slate-800/95",
      shadow: "shadow-slate-100 dark:shadow-none",
      text: "text-slate-600",
      darkText: "dark:text-slate-400",
    },
    yellow: {
      border: "border-yellow-500 dark:border-yellow-500",
      bg: "bg-yellow-50 dark:bg-slate-800/95",
      shadow: "shadow-yellow-100 dark:shadow-none",
      text: "text-yellow-600",
      darkText: "dark:text-yellow-400",
    },
    orange: {
      border: "border-orange-500 dark:border-orange-500",
      bg: "bg-orange-50 dark:bg-slate-800/95",
      shadow: "shadow-orange-100 dark:shadow-none",
      text: "text-orange-600",
      darkText: "dark:text-orange-400",
    },
    cyan: {
      border: "border-cyan-500 dark:border-cyan-500",
      bg: "bg-cyan-50 dark:bg-slate-800/95",
      shadow: "shadow-cyan-100 dark:shadow-none",
      text: "text-cyan-600",
      darkText: "dark:text-cyan-400",
    },
    pink: {
      border: "border-pink-500 dark:border-pink-500",
      bg: "bg-pink-50 dark:bg-slate-800/95",
      shadow: "shadow-pink-100 dark:shadow-none",
      text: "text-pink-600",
      darkText: "dark:text-pink-400",
    },
    sky: {
      border: "border-sky-500 dark:border-sky-500",
      bg: "bg-sky-50 dark:bg-slate-800/95",
      shadow: "shadow-sky-100 dark:shadow-none",
      text: "text-sky-600",
      darkText: "dark:text-sky-400",
    },
    red: {
      border: "border-red-500 dark:border-red-500",
      bg: "bg-red-50 dark:bg-slate-800/95",
      shadow: "shadow-red-100 dark:shadow-none",
      text: "text-red-600",
      darkText: "dark:text-red-400",
    },
    emerald: {
      border: "border-emerald-500 dark:border-emerald-500",
      bg: "bg-emerald-50 dark:bg-slate-800/95",
      shadow: "shadow-emerald-100 dark:shadow-none",
      text: "text-emerald-600",
      darkText: "dark:text-emerald-400",
    },
    fuchsia: {
      border: "border-fuchsia-500 dark:border-fuchsia-500",
      bg: "bg-fuchsia-50 dark:bg-slate-800/95",
      shadow: "shadow-fuchsia-100 dark:shadow-none",
      text: "text-fuchsia-600",
      darkText: "dark:text-fuchsia-400",
    },
    teal: {
      border: "border-teal-500 dark:border-teal-500",
      bg: "bg-teal-50 dark:bg-slate-800/95",
      shadow: "shadow-teal-100 dark:shadow-none",
      text: "text-teal-600",
      darkText: "dark:text-teal-400",
    },
  };

  return styles[colorTheme] || styles["green"];
};
