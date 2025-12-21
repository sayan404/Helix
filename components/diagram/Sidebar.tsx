import React from "react";
import { getComponentIcon, getThemeStyles } from "./utils/componentHelpers";

interface SidebarProps {
  componentLibrary: any[];
}

export const Sidebar = ({ componentLibrary }: SidebarProps) => {
  const onDragStart = (
    event: React.DragEvent,
    nodeType: string,
    nodeLabel: string
  ) => {
    event.dataTransfer.setData("application/reactflow/type", nodeType);
    event.dataTransfer.setData("application/reactflow/label", nodeLabel);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-full h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300 overflow-hidden">
      <div className="p-2 flex flex-col gap-4 overflow-y-auto flex-1 custom-scrollbar min-h-0  mb-6">
        {/* Component Library Section */}
        <div> 
          <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
            Component Library
          </h3>
        </div>
        {componentLibrary.map((category) => (
          <div key={category.id}>
            <h3 className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              {category.label}
            </h3>
            <div className="flex flex-col gap-3">
              {category.items.map((item: any) => {
                const Icon = getComponentIcon(item.icon);
                const styles = getThemeStyles(item.colorTheme);

                return (
                  <div
                    key={item.type}
                    className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500 cursor-grab transition-all active:cursor-grabbing group"
                    onDragStart={(event) =>
                      onDragStart(event, item.type, item.label)
                    }
                    draggable
                  >
                    <Icon
                      className={`w-5 h-5 ${styles.text} ${styles.darkText} group-hover:scale-110 transition-transform`}
                    />
                    <span className="text-[9px] font-medium text-gray-700 dark:text-gray-200">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
