import React, { useEffect, useState } from 'react';
import { X, Save, Trash2, ArrowLeftRight } from 'lucide-react';

interface PropertiesPanelProps {
  selectedElement: { type: 'node' | 'edge', data: any } | null;
  onUpdateNode: (id: string, data: any) => void;
  onUpdateEdge: (id: string, data: any) => void;
  onDeleteElement: (id: string) => void;
  onClose: () => void;
  componentLibrary: any[];
}

export const PropertiesPanel = ({ 
  selectedElement, 
  onUpdateNode, 
  onUpdateEdge,
  onDeleteElement, 
  onClose,
  componentLibrary
}: PropertiesPanelProps) => {
  
  // Node Form State
  const [nodeData, setNodeData] = useState({
    name: '',
    technology: '',
    description: '',
    type: ''
  });

  // Edge Form State
  const [edgeData, setEdgeData] = useState({
    label: '',
    animated: false,
    type: 'smoothstep'
  });

  useEffect(() => {
    if (selectedElement?.type === 'node') {
      setNodeData({
        name: selectedElement.data.data.name || '',
        technology: selectedElement.data.data.technology || '',
        description: selectedElement.data.data.description || '',
        type: selectedElement.data.data.type || 'service'
      });
    } else if (selectedElement?.type === 'edge') {
      setEdgeData({
        label: selectedElement.data.label || '',
        animated: selectedElement.data.animated || false,
        type: selectedElement.data.type || 'smoothstep'
      });
    }
  }, [selectedElement]);

  if (!selectedElement) return null;

  const handleNodeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNodeData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdgeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setEdgeData(prev => ({ ...prev, [name]: val }));
  };

  const handleSave = () => {
    if (selectedElement.type === 'node') {
      onUpdateNode(selectedElement.data.id, nodeData);
    } else {
      onUpdateEdge(selectedElement.data.id, edgeData);
    }
  };

  const handleReverseEdge = () => {
    if (selectedElement.type === 'edge') {
      onUpdateEdge(selectedElement.data.id, { reverse: true });
    }
  };

  const handleDelete = () => {
    const type = selectedElement.type === 'node' ? 'component' : 'connection';
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      onDeleteElement(selectedElement.data.id);
    }
  };

  return (
    <div className="h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shadow-xl transition-colors duration-300">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">
          {selectedElement.type === 'node' ? 'Component Properties' : 'Connection Properties'}
        </h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
        {/* Common ID Field */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1.5">ID</label>
          <div className="text-xs font-mono bg-gray-100 dark:bg-gray-900 p-2 rounded text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 truncate">
            {selectedElement.data.id}
          </div>
        </div>

        {/* NODE SPECIFIC FIELDS */}
        {selectedElement.type === 'node' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={nodeData.name}
                onChange={handleNodeChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select
                name="type"
                value={nodeData.type}
                onChange={handleNodeChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 dark:text-white"
              >
                {componentLibrary.map((category) => (
                  <optgroup key={category.id} label={category.label}>
                    {category.items.map((item: any) => (
                      <option key={item.type} value={item.type}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Technology</label>
              <input
                type="text"
                name="technology"
                value={nodeData.technology}
                onChange={handleNodeChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                name="description"
                value={nodeData.description}
                onChange={handleNodeChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm resize-none"
              />
            </div>
          </>
        )}

        {/* EDGE SPECIFIC FIELDS */}
        {selectedElement.type === 'edge' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label / Protocol</label>
              <input
                type="text"
                name="label"
                value={edgeData.label}
                onChange={handleEdgeChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                placeholder="e.g. HTTP, gRPC"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Line Style</label>
              <select
                name="type"
                value={edgeData.type}
                onChange={handleEdgeChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white dark:bg-gray-700 dark:text-white"
              >
                <option value="default">Bezier (Curved)</option>
                <option value="straight">Straight</option>
                <option value="step">Step (Right Angle)</option>
                <option value="smoothstep">Smooth Step</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="animated"
                id="animated"
                checked={edgeData.animated}
                onChange={handleEdgeChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
              />
              <label htmlFor="animated" className="text-sm text-gray-700 dark:text-gray-300 select-none">
                Animated Flow
              </label>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleReverseEdge}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-md transition-colors font-medium text-sm"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Reverse Direction
              </button>
            </div>
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors font-medium text-sm"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
        
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 py-2 px-4 rounded-md transition-colors font-medium text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete {selectedElement.type === 'node' ? 'Component' : 'Connection'}
        </button>
      </div>
    </div>
  );
};

