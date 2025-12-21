import React, { memo, useMemo, useContext, createContext } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Cpu } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { getComponentDef, getComponentIcon, getThemeStyles } from './utils/componentHelpers';

export const ComponentLibraryContext = createContext<any[]>([]);

export const useComponentLibrary = () => useContext(ComponentLibraryContext);

interface CustomNodeProps extends NodeProps {
  componentLibrary?: any[];
}

const CustomNode = ({ data, selected }: CustomNodeProps) => {
  const componentLibrary = useComponentLibrary();
  // Dynamic lookup of component definition and styles
  const { def, styles, Icon } = useMemo(() => {
    const def = getComponentDef(data.type, componentLibrary) || { icon: 'Server', colorTheme: 'green', label: 'Unknown' };
    const styles = getThemeStyles(def.colorTheme);
    const Icon = getComponentIcon(def.icon);
    return { def, styles, Icon };
  }, [data.type, componentLibrary]);

  return (
    <div
      className={twMerge(
        "px-4 py-3 shadow-md rounded-lg border-2 w-[220px] transition-all duration-200 group relative",
        styles.border,
        styles.bg,
        styles.shadow,
        selected 
          ? "ring-2 ring-offset-2 ring-indigo-500 shadow-xl dark:ring-offset-gray-900" 
          : "border-opacity-60 hover:border-opacity-100 dark:border-opacity-60 dark:hover:border-opacity-100"
      )}
    >
      {/* Top Handle (Target) */}
      <Handle 
        id="target-top" 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-gray-400 group-hover:!bg-indigo-500 transition-colors dark:!bg-gray-500 dark:group-hover:!bg-indigo-400" 
      />
      
      {/* Right Handle (Source) */}
      <Handle 
        id="source-right" 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-gray-400 group-hover:!bg-indigo-500 transition-colors dark:!bg-gray-500 dark:group-hover:!bg-indigo-400" 
      />

      {/* Left Handle (Target) */}
      <Handle 
        id="target-left" 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 !bg-gray-400 group-hover:!bg-indigo-500 transition-colors dark:!bg-gray-500 dark:group-hover:!bg-indigo-400" 
      />

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-white/60 dark:bg-black/40 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10">
            <Icon className={twMerge("w-4 h-4", styles.text, styles.darkText)} />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {data.type}
          </span>
        </div>
      </div>

      <div className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate" title={data.name}>
        {data.name}
      </div>
      
      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <Cpu className="w-3 h-3" />
        <span className="truncate">{data.technology}</span>
      </div>

      {/* Bottom Handle (Source) */}
      <Handle 
        id="source-bottom" 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-gray-400 group-hover:!bg-indigo-500 transition-colors dark:!bg-gray-500 dark:group-hover:!bg-indigo-400" 
      />
    </div>
  );
};

export default memo(CustomNode);

