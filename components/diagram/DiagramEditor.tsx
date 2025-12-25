"use client";

import React, { useCallback, useEffect, useState, useRef } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  ReactFlowProvider,
  MarkerType,
  NodeChange,
  applyNodeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import {
  Layout,
  Menu,
  X,
  HelpCircle,
  ArrowRight,
  Activity,
  Code,
  Download,
  Loader2,
  Save,
  Undo,
  Redo,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScalabilityMetrics, CodeTemplate } from "@/lib/types";
import { useToast } from "@/components/ui/use-toast";

import CustomNode, { ComponentLibraryContext } from "./CustomNode";
import { Sidebar } from "./Sidebar";
import { PropertiesPanel } from "./PropertiesPanel";
import { getLayoutedElements } from "./utils/layout";
import { ArchitectureBlueprint } from "@/lib/types";

const nodeTypes = {
  custom: CustomNode,
};

interface DiagramEditorProps {
  architecture: ArchitectureBlueprint | null;
  componentLibrary: any[];
  onSave?: (arch: ArchitectureBlueprint) => void | Promise<void>;
  onSimulate?: () => Promise<void>;
  onGenerateCode?: () => Promise<void>;
  onExport?: (arch: ArchitectureBlueprint) => Promise<void>;
  isSimulating?: boolean;
  isGeneratingCode?: boolean;
}

const DiagramEditor = ({
  architecture,
  componentLibrary,
  onSave,
  onSimulate,
  onGenerateCode,
  onExport,
  isSimulating = false,
  isGeneratingCode = false,
}: DiagramEditorProps) => {
  const { toast } = useToast();
  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      return (
        saved === "dark" ||
        (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    }
    return false;
  });

  // Help Modal State
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Apply Dark Mode Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Initial Data Processing with Safety Checks
  const processInitialData = useCallback(() => {
    const services = architecture?.services || [];
    const connections = architecture?.connections || [];

    const nodes: Node[] = services.map((svc) => ({
      id: svc.id,
      type: "custom",
      data: { ...svc },
      position: { x: 0, y: 0 }, // Will be set by layout
    }));

    const edges: Edge[] = connections.map((conn, idx) => ({
      id: `e-${idx}`,
      source: conn.source,
      target: conn.target,
      sourceHandle: "source-bottom", // Default to bottom source
      targetHandle: "target-top", // Default to top target
      label: conn.protocol,
      type: "smoothstep",
      animated: conn.type === "async",
      style: {
        stroke: conn.type === "async" ? "#f97316" : "#64748b",
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: conn.type === "async" ? "#f97316" : "#64748b",
      },
      data: { ...conn },
    }));

    return getLayoutedElements(nodes, edges);
  }, [architecture]);

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Selection State
  const [selectedElement, setSelectedElement] = useState<{
    type: "node" | "edge";
    data: any;
  } | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const reactFlowWrapperRef = useRef<HTMLDivElement>(null);

  // Mobile/Responsive States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Undo/Redo History
  type HistoryState = {
    nodes: Node[];
    edges: Edge[];
  };
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const MAX_HISTORY_SIZE = 50;

  // Save state to history
  const saveToHistory = useCallback(
    (nodesToSave: Node[], edgesToSave: Edge[]) => {
      const newState: HistoryState = {
        nodes: JSON.parse(JSON.stringify(nodesToSave)),
        edges: JSON.parse(JSON.stringify(edgesToSave)),
      };

      setHistoryIndex((currentIndex) => {
        setHistory((prev) => {
          // If history is empty, initialize it
          if (prev.length === 0) {
            return [newState];
          }
          // Remove any states after current index (when we're in the middle of history)
          const newHistory = prev.slice(0, currentIndex + 1);
          // Add new state
          const updated = [...newHistory, newState];
          // Limit history size
          return updated.slice(-MAX_HISTORY_SIZE);
        });
        const newIndex = currentIndex + 1;
        return Math.min(newIndex, MAX_HISTORY_SIZE - 1);
      });
    },
    []
  );

  // Undo function
  const handleUndo = useCallback(() => {
    setHistory((prevHistory) => {
      if (!prevHistory || prevHistory.length === 0) {
        return prevHistory;
      }

      setHistoryIndex((currentIndex) => {
        if (currentIndex > 0 && prevHistory.length > currentIndex - 1) {
          const prevState = prevHistory[currentIndex - 1];
          if (prevState && prevState.nodes && prevState.edges) {
            setNodes(prevState.nodes);
            setEdges(prevState.edges);
            return currentIndex - 1;
          }
        }
        return currentIndex;
      });
      return prevHistory;
    });
  }, [setNodes, setEdges]);

  // Redo function
  const handleRedo = useCallback(() => {
    setHistory((prevHistory) => {
      if (!prevHistory || prevHistory.length === 0) {
        return prevHistory;
      }

      setHistoryIndex((currentIndex) => {
        if (
          currentIndex < prevHistory.length - 1 &&
          prevHistory.length > currentIndex + 1
        ) {
          const nextState = prevHistory[currentIndex + 1];
          if (nextState && nextState.nodes && nextState.edges) {
            setNodes(nextState.nodes);
            setEdges(nextState.edges);
            return currentIndex + 1;
          }
        }
        return currentIndex;
      });
      return prevHistory;
    });
  }, [setNodes, setEdges]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "z" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        handleUndo();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        (event.key === "y" || (event.key === "z" && event.shiftKey))
      ) {
        event.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Update nodes and edges when architecture changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = processInitialData();
    setNodes(newNodes);
    setEdges(newEdges);

    // Initialize history with initial state
    if (newNodes.length > 0 || newEdges.length > 0) {
      const initialState: HistoryState = {
        nodes: JSON.parse(JSON.stringify(newNodes)),
        edges: JSON.parse(JSON.stringify(newEdges)),
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }

    // Fit view after a short delay to ensure layout is complete
    if (newNodes.length > 0 && reactFlowInstance) {
      const timeoutId = setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.25,
          maxZoom: 0.85,
          minZoom: 0.2,
          duration: 500,
        });
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [processInitialData, setNodes, setEdges, reactFlowInstance]);

  // Handle Window Resize for Responsive Layout
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
        setIsPropertiesOpen(false);
      } else {
        setIsSidebarOpen(true);
        setIsPropertiesOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Save state before adding edge
      setNodes((nds) => {
        setEdges((eds) => {
          saveToHistory(nds, eds);
          return addEdge(
            {
              ...params,
              type: "smoothstep",
              markerEnd: { type: MarkerType.ArrowClosed },
              style: { strokeWidth: 2, stroke: "#64748b" },
            },
            eds
          );
        });
        return nds;
      });
    },
    [setNodes, setEdges, saveToHistory]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!reactFlowInstance) return;

      const type = event.dataTransfer.getData("application/reactflow/type");
      const label = event.dataTransfer.getData("application/reactflow/label");

      if (typeof type === "undefined" || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: uuidv4(),
        type: "custom",
        position,
        data: {
          name: `New ${label}`,
          type: type,
          technology: "Pending...",
          description: "New component",
        },
      };

      // Save state before adding node
      setNodes((nds) => {
        setEdges((eds) => {
          saveToHistory(nds, eds);
          return eds;
        });
        return nds.concat(newNode);
      });
    },
    [reactFlowInstance, setNodes, setEdges, saveToHistory]
  );

  // Node Selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedElement({ type: "node", data: node });
    if (window.innerWidth < 1024) {
      setIsPropertiesOpen(true);
      setIsSidebarOpen(false);
    }
  }, []);

  // Edge Selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedElement({ type: "edge", data: edge });
    if (window.innerWidth < 1024) {
      setIsPropertiesOpen(true);
      setIsSidebarOpen(false);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedElement(null);
    if (window.innerWidth < 1024) {
      setIsPropertiesOpen(false);
    }
  }, []);

  // Update Node Logic
  const updateNodeData = (id: string, newData: any) => {
    // Save state before updating
    setNodes((nds) => {
      setEdges((eds) => {
        saveToHistory(nds, eds);
        return eds;
      });
      return nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      });
    });
    setSelectedElement((prev) =>
      prev && prev.type === "node" && prev.data.id === id
        ? {
            ...prev,
            data: { ...prev.data, data: { ...prev.data.data, ...newData } },
          }
        : prev
    );
  };

  // Update Edge Logic
  const updateEdgeData = (id: string, newData: any) => {
    // Save state before updating
    setNodes((nds) => {
      setEdges((eds) => {
        saveToHistory(nds, eds);
        const updatedEdges = eds.map((edge) => {
          if (edge.id === id) {
            // Handle reversing edge
            if (newData.reverse) {
              return {
                ...edge,
                source: edge.target,
                target: edge.source,
                // Swap handles if they exist, otherwise default to sensible opposites
                sourceHandle:
                  edge.targetHandle === "target-top"
                    ? "source-bottom"
                    : "source-right",
                targetHandle:
                  edge.sourceHandle === "source-bottom"
                    ? "target-top"
                    : "target-left",
              };
            }
            // Handle other updates
            return {
              ...edge,
              label: newData.label !== undefined ? newData.label : edge.label,
              animated:
                newData.animated !== undefined
                  ? newData.animated
                  : edge.animated,
              type: newData.type !== undefined ? newData.type : edge.type,
              style: {
                ...edge.style,
                stroke: newData.animated ? "#f97316" : "#64748b",
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: newData.animated ? "#f97316" : "#64748b",
              },
            };
          }
          return edge;
        });
        // Re-select the edge to update UI
        const updatedEdge = updatedEdges.find((e) => e.id === id);
        if (updatedEdge) {
          setSelectedElement({ type: "edge", data: updatedEdge });
        }
        return updatedEdges;
      });
      return nds;
    });
  };

  const onDeleteElement = useCallback(
    (id: string) => {
      // Save state before deleting
      setNodes((nds) => {
        setEdges((eds) => {
          saveToHistory(nds, eds);
          if (selectedElement?.type === "node") {
            return eds.filter(
              (edge) => edge.source !== id && edge.target !== id
            );
          } else if (selectedElement?.type === "edge") {
            return eds.filter((edge) => edge.id !== id);
          }
          return eds;
        });
        if (selectedElement?.type === "node") {
          return nds.filter((node) => node.id !== id);
        }
        return nds;
      });
      setSelectedElement(null);
      if (window.innerWidth < 1024) {
        setIsPropertiesOpen(false);
      }
    },
    [selectedElement, setNodes, setEdges, saveToHistory]
  );

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(nodes, edges, direction);
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges, setNodes, setEdges]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    if (!onSave) return;

    // If no nodes, nothing to save
    if (nodes.length === 0) {
      toast({
        title: "No architecture to save",
        description: "Please add components to the diagram.",
        variant: "default",
      });
      return;
    }

    setIsSaving(true);
    try {
      const services = nodes.map((node) => ({
        id: node.id,
        name: node.data.name,
        type: node.data.type as any,
        technology: node.data.technology,
        description: node.data.description,
      }));

      const connections = edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        type: edge.animated ? "async" : ("sync" as any),
        protocol: typeof edge.label === "string" ? edge.label : "HTTP",
      }));

      // Build architecture from current state, or merge with existing architecture
      const currentArchitecture: ArchitectureBlueprint = architecture
        ? {
            ...architecture,
            services,
            connections,
          }
        : {
            id: `manual-${Date.now()}`,
            prompt: "Manually created architecture",
            services,
            connections,
            patterns: [],
            scaling_model: "horizontal",
            summary: "Manually created architecture diagram",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

      await onSave(currentArchitecture);

      // Reset history after successful save
      const savedState: HistoryState = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      };
      setHistory((prev) => {
        if (prev.length > 0) {
          return [savedState];
        }
        return prev;
      });
      setHistoryIndex(() => 0);
    } catch (error) {
      console.error("Error in handleSave:", error);
      toast({
        title: "Failed to save",
        description: "Failed to save architecture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [architecture, nodes, edges, onSave]);

  // Handle export - creates clean AI-ready product design metadata
  const handleExport = useCallback(async () => {
    // If no nodes, nothing to export
    if (nodes.length === 0) {
      toast({
        title: "No architecture to export",
        description: "Please add components to the diagram.",
        variant: "default",
      });
      return;
    }

    try {
      const services = nodes.map((node) => ({
        id: node.id,
        name: node.data.name,
        type: node.data.type as any,
        technology: node.data.technology || undefined,
        description: node.data.description || undefined,
      }));

      const connections = edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        type: edge.animated ? "async" : ("sync" as any),
        protocol: typeof edge.label === "string" ? edge.label : "HTTP",
      }));

      // Build architecture from current state, or merge with existing architecture
      const currentArchitecture: ArchitectureBlueprint = architecture
        ? {
            ...architecture,
            services,
            connections,
          }
        : {
            id: `manual-${Date.now()}`,
            prompt: "Manually created architecture",
            services,
            connections,
            patterns: [],
            scaling_model: "horizontal",
            summary: "Manually created architecture diagram",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

      // Create clean product design metadata for AI agents
      // Remove unnecessary fields like cost, timestamps, internal IDs
      const productDesignMetadata = {
        // Metadata
        metadata: {
          version: "1.0",
          format: "product-design-metadata",
          generated_at: new Date().toISOString(),
          purpose:
            "Complete product design specification for AI-assisted development",
        },

        // Product Information
        product: {
          name: currentArchitecture.prompt || "Product Architecture",
          description:
            currentArchitecture.product_description ||
            currentArchitecture.summary ||
            "A complete system architecture",
          architecture_pattern:
            currentArchitecture.patterns?.[0] || "microservices",
          patterns: currentArchitecture.patterns || [],
          scaling_model: currentArchitecture.scaling_model || "horizontal",
          summary: currentArchitecture.summary,
        },

        // System Components
        components: currentArchitecture.services.map((service) => ({
          id: service.id,
          name: service.name,
          type: service.type,
          technology: service.technology,
          description: service.description,
        })),

        // Component Connections
        connections: currentArchitecture.connections.map((conn) => ({
          from: conn.source,
          to: conn.target,
          type: conn.type,
          protocol: conn.protocol,
        })),

        // Workflow Documentation
        workflows: currentArchitecture.workflow_documentation?.workflows || [],

        // Component Endpoints (from workflow documentation)
        endpoints:
          currentArchitecture.workflow_documentation?.components?.flatMap(
            (comp) =>
              (comp.endpoints || []).map((endpoint) => ({
                component: comp.id,
                component_name: comp.name,
                method: endpoint.method,
                path: endpoint.path,
                description: endpoint.description,
                request: endpoint.request,
                response: endpoint.response,
              }))
          ) || [],

        // AI Agent Instructions
        instructions: {
          purpose:
            "This document contains complete product design metadata for building the application end-to-end.",
          usage: [
            "Use the product description to understand the overall system purpose",
            "Use components to identify all services, databases, frontends, and infrastructure needed",
            "Use connections to understand data flow and communication patterns",
            "Use workflows to understand user journeys and system interactions",
            "Use endpoints to understand API contracts and implement backend services",
            "Follow the architecture pattern and scaling model when implementing",
          ],
        },
      };

      // Remove undefined fields
      const cleanMetadata = JSON.parse(
        JSON.stringify(productDesignMetadata, (key, value) =>
          value === undefined ? undefined : value
        )
      );

      // Download as JSON file
      const blob = new Blob([JSON.stringify(cleanMetadata, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const timestamp = new Date().toISOString().split("T")[0];
      a.download = `Helix-designed-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log("Exported product design metadata:", cleanMetadata);
    } catch (error) {
      console.error("Error in handleExport:", error);
      toast({
        title: "Export failed",
        description:
          "Failed to export architecture. Please check the console for details.",
        variant: "destructive",
      });
    }
  }, [architecture, nodes, edges, toast]);

  // Handle snapshot - capture diagram as image and download
  const takeSnapshot = useCallback(async () => {
    if (!reactFlowWrapperRef.current || !reactFlowInstance) {
      toast({
        title: "Unable to capture snapshot",
        description: "Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Dynamically import html2canvas
      let html2canvas: any;
      try {
        html2canvas = (await import("html2canvas")).default;
      } catch (importError) {
        toast({
          title: "Library required",
          description:
            "html2canvas library is required for snapshots. Please install it: npm install html2canvas",
          variant: "destructive",
        });
        return;
      }

      // Get the ReactFlow pane element - this contains the actual diagram
      const reactFlowPane = reactFlowWrapperRef.current.querySelector(
        ".react-flow__pane"
      ) as HTMLElement;
      if (!reactFlowPane) {
        toast({
          title: "Capture failed",
          description: "Could not find diagram pane to capture.",
          variant: "destructive",
        });
        return;
      }

      // Temporarily hide UI elements for clean capture
      const controls = reactFlowWrapperRef.current.querySelector(
        ".react-flow__controls"
      ) as HTMLElement;
      const minimap = reactFlowWrapperRef.current.querySelector(
        ".react-flow__minimap"
      ) as HTMLElement;
      const panel = reactFlowWrapperRef.current.querySelector(
        ".react-flow__panel"
      ) as HTMLElement;
      const attribution = reactFlowWrapperRef.current.querySelector(
        ".react-flow__attribution"
      ) as HTMLElement;

      const hiddenElements: Array<{
        element: HTMLElement;
        originalDisplay: string;
      }> = [];

      [controls, minimap, panel, attribution].forEach((el) => {
        if (el) {
          hiddenElements.push({
            element: el,
            originalDisplay: el.style.display,
          });
          el.style.display = "none";
        }
      });

      // Wait a bit for UI to update
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Calculate the bounds of all nodes to capture only the diagram area
      const nodeElements = reactFlowPane.querySelectorAll(".react-flow__node");
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      if (nodeElements.length > 0) {
        nodeElements.forEach((node) => {
          const rect = node.getBoundingClientRect();
          const paneRect = reactFlowPane.getBoundingClientRect();
          const relativeX = rect.left - paneRect.left;
          const relativeY = rect.top - paneRect.top;

          minX = Math.min(minX, relativeX);
          minY = Math.min(minY, relativeY);
          maxX = Math.max(maxX, relativeX + rect.width);
          maxY = Math.max(maxY, relativeY + rect.height);
        });

        // Add padding
        const padding = 50;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(reactFlowPane.scrollWidth, maxX + padding);
        maxY = Math.min(reactFlowPane.scrollHeight, maxY + padding);
      } else {
        // If no nodes, capture the entire viewport
        minX = 0;
        minY = 0;
        maxX = reactFlowPane.scrollWidth;
        maxY = reactFlowPane.scrollHeight;
      }

      // Capture the canvas with calculated bounds
      const canvas = await html2canvas(reactFlowPane, {
        backgroundColor: isDarkMode ? "#111827" : "#f9fafb",
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        windowWidth: reactFlowPane.scrollWidth,
        windowHeight: reactFlowPane.scrollHeight,
      });

      // Restore hidden elements
      hiddenElements.forEach(({ element, originalDisplay }) => {
        element.style.display = originalDisplay;
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
          toast({
            title: "Failed to create image",
            description: "Please try again.",
            variant: "destructive",
          });
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `diagram-snapshot-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (error) {
      console.error("Error taking snapshot:", error);
      toast({
        title: "Failed to capture snapshot",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }, [reactFlowInstance, isDarkMode, toast]);

  return (
    <ComponentLibraryContext.Provider value={componentLibrary}>
      <div className="flex h-full w-full overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Header / Toolbar */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50 flex items-center justify-between px-4 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-gray-800 dark:text-white text-lg hidden sm:block">
              Diagram Editor
            </h1>
            {historyIndex > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-md text-amber-800 dark:text-amber-200 text-xs font-medium animate-pulse">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                <span className="hidden sm:inline">Unsaved changes</span>
                <span className="sm:hidden">Unsaved</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onLayout("TB")}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 text-xs flex items-center gap-1 transition-colors"
              title="Auto Layout Vertical"
            >
              <Layout className="w-4 h-4" />
              <span className="hidden sm:inline">Auto Layout</span>
            </button>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            <button
              onClick={handleUndo}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
              disabled={!history || history.length === 0 || historyIndex <= 0}
            >
              <Undo className="w-5 h-5" />
            </button>

            <button
              onClick={handleRedo}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
              disabled={
                !history ||
                history.length === 0 ||
                historyIndex >= history.length - 1
              }
            >
              <Redo className="w-5 h-5" />
            </button>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            <button
              onClick={() => setIsHelpOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
              title="Help & Instructions"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <button
              onClick={handleSave}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save Architecture"
              disabled={!onSave || nodes.length === 0 || isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={handleExport}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export Product Design Metadata (AI-Ready)"
              disabled={nodes.length === 0}
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={takeSnapshot}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Take Snapshot"
              disabled={!onExport || nodes.length === 0}
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
              title="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button> */}

            <button
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 transition-colors"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle Sidebar"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex pt-14 relative h-full overflow-hidden">
          {/* Sidebar */}
          <div
            className={`
              absolute lg:relative z-40 h-full bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out shadow-lg lg:shadow-none
              ${
                isSidebarOpen
                  ? "w-40 translate-x-0"
                  : "w-0 -translate-x-full lg:w-0 lg:translate-x-0"
              }
              overflow-hidden border-r border-gray-200 dark:border-gray-700 flex-shrink-0
            `}
          >
            <div className="w-40 h-full overflow-hidden">
              <Sidebar componentLibrary={componentLibrary} />
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={reactFlowWrapperRef}
            className="flex-1 h-full relative bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-hidden"
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              attributionPosition="bottom-right"
              defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
              className="transition-colors duration-300"
            >
              <Background color={isDarkMode ? "#374151" : "#e2e8f0"} gap={16} />
              <Controls className="bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 rounded-md fill-gray-600 dark:fill-gray-300" />
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.data.type === "database") return "#3b82f6";
                  if (n.data.type === "gateway") return "#a855f7";
                  return "#22c55e";
                }}
                nodeColor={(n) => {
                  if (isDarkMode) return "#1f2937";
                  if (n.data.type === "database") return "#eff6ff";
                  return "#fff";
                }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md rounded-md"
                maskColor={
                  isDarkMode ? "rgba(0,0,0,0.6)" : "rgba(240, 240, 240, 0.6)"
                }
              />

              <Panel
                position="top-right"
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-xs text-gray-500 dark:text-gray-400"
              >
                {nodes.length} Services • {edges.length} Connections
              </Panel>
            </ReactFlow>
          </div>

          {/* Properties Panel */}
          <div
            className={`
            absolute right-0 top-0 lg:relative z-40 h-full bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out shadow-lg lg:shadow-none
            ${
              isPropertiesOpen && selectedElement
                ? "w-80 translate-x-0"
                : "w-0 translate-x-full lg:w-0 lg:translate-x-0"
            }
            overflow-hidden
          `}
          >
            <div className="w-80 h-full">
              <PropertiesPanel
                selectedElement={selectedElement}
                onUpdateNode={updateNodeData}
                onUpdateEdge={updateEdgeData}
                onDeleteElement={onDeleteElement}
                onClose={() => setIsPropertiesOpen(false)}
                componentLibrary={componentLibrary}
              />
            </div>
          </div>
        </div>

        {/* Help Modal */}
        {isHelpOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto border border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Instructions
                  </h2>
                </div>
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 text-sm text-gray-600 dark:text-gray-300">
                {/* Connection Legend Section */}
                <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-indigo-500" />
                    Connection Types & Arrows
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-0.5 bg-slate-500"></div>
                      <div>
                        <span className="block font-medium text-gray-800 dark:text-gray-200 text-xs">
                          Sync (Solid Gray)
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Direct HTTP/gRPC calls (Blocking)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-0.5 border-t-2 border-dashed border-orange-500 relative">
                        <div className="absolute -right-1 -top-1.5 w-0 h-0 border-l-[6px] border-l-orange-500 border-y-[4px] border-y-transparent"></div>
                      </div>
                      <div>
                        <span className="block font-medium text-gray-800 dark:text-gray-200 text-xs">
                          Async (Dashed Orange)
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Event-driven/Queue messages (Non-blocking)
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                      * Click any line to reverse direction or change type in
                      the properties panel.
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
                      1
                    </span>
                    Add Components
                  </h3>
                  <p className="pl-8">
                    Drag items from the left sidebar onto the canvas to add new
                    services, databases, or infrastructure elements.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
                      2
                    </span>
                    Connect Nodes
                  </h3>
                  <p className="pl-8">
                    Hover over any node to see connection handles (dots). Drag
                    from one handle to another to create a relationship.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
                      3
                    </span>
                    Edit Properties
                  </h3>
                  <p className="pl-8">
                    Click on any node or connection line to open the properties
                    panel on the right. You can change names, technologies,
                    connection types, and more.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">
                      4
                    </span>
                    Delete Items
                  </h3>
                  <p className="pl-8">
                    Select an item and click the "Delete" button at the bottom
                    of the properties panel to remove it.
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end sticky bottom-0">
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ComponentLibraryContext.Provider>
  );
};

export default function DiagramEditorWrapper(props: DiagramEditorProps) {
  return (
    <ReactFlowProvider>
      <DiagramEditor {...props} />
    </ReactFlowProvider>
  );
}
