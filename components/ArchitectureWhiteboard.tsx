"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArchitectureBlueprint, SystemNode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Brush,
  Link2,
  MousePointer2,
  PanelsTopLeft,
  Plus,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  ZoomIn,
  ZoomOut,
  Focus,
} from "lucide-react";

type WhiteboardNode = {
  id: string;
  name: string;
  type: SystemNode["type"];
  technology?: string;
  x: number;
  y: number;
};

type WhiteboardEdge = {
  id: string;
  source: string;
  target: string;
  protocol?: string;
  type: "sync" | "async" | "pub-sub";
};

interface ArchitectureWhiteboardProps {
  architecture: ArchitectureBlueprint | null;
  onSave?: (arch: ArchitectureBlueprint) => void;
}

type ComponentTemplate = {
  id: string;
  type: SystemNode["type"];
  label: string;
  icon: string;
  technology?: string;
  description?: string;
};

type ComponentCategory = {
  id: string;
  name: string;
  description?: string;
  items: ComponentTemplate[];
};

const componentLibrary: ComponentCategory[] = [
  {
    id: "edge",
    name: "Edge & Routing",
    description: "Entry points, load balancers, and global delivery",
    items: [
      {
        id: "api-gateway",
        type: "gateway",
        label: "API Gateway",
        technology: "Envoy",
        icon: "🚪",
        description: "Central ingress for external traffic",
      },
      {
        id: "edge-router",
        type: "gateway",
        label: "Edge Router",
        technology: "NGINX",
        icon: "🧭",
        description: "Smart routing and reverse proxy",
      },
      {
        id: "load-balancer",
        type: "load-balancer",
        label: "Load Balancer",
        technology: "AWS ALB",
        icon: "⚖️",
        description: "Distribute traffic across services",
      },
      {
        id: "cdn",
        type: "cdn",
        label: "CDN",
        technology: "Cloudflare",
        icon: "🌐",
        description: "Cache static assets globally",
      },
    ],
  },
  {
    id: "compute",
    name: "Compute & Services",
    description: "Business logic and APIs",
    items: [
      {
        id: "node-service",
        type: "service",
        label: "Node.js Service",
        technology: "Node.js (Express)",
        icon: "🟩",
        description: "REST/GraphQL API service",
      },
      {
        id: "go-service",
        type: "service",
        label: "Go Service",
        technology: "Go (Fiber)",
        icon: "💠",
        description: "High throughput microservice",
      },
      {
        id: "python-service",
        type: "service",
        label: "Python Service",
        technology: "Python (FastAPI)",
        icon: "🐍",
        description: "Async API or worker",
      },
      {
        id: "java-service",
        type: "service",
        label: "Java Service",
        technology: "Java (Spring Boot)",
        icon: "☕",
        description: "Enterprise-grade service",
      },
      {
        id: "edge-worker",
        type: "service",
        label: "Edge Worker",
        technology: "Cloudflare Workers",
        icon: "🛰️",
        description: "Low-latency edge compute",
      },
    ],
  },
  {
    id: "data",
    name: "Data Stores",
    description: "Primary system of record and analytics",
    items: [
      {
        id: "postgres",
        type: "database",
        label: "PostgreSQL",
        technology: "PostgreSQL",
        icon: "🗄️",
        description: "Relational database",
      },
      {
        id: "mysql",
        type: "database",
        label: "MySQL",
        technology: "MySQL",
        icon: "🐬",
        description: "Relational database",
      },
      {
        id: "dynamodb",
        type: "database",
        label: "DynamoDB",
        technology: "AWS DynamoDB",
        icon: "🧮",
        description: "NoSQL key-value store",
      },
      {
        id: "elastic",
        type: "database",
        label: "Elasticsearch",
        technology: "Elastic Cloud",
        icon: "🔎",
        description: "Search and indexing",
      },
      {
        id: "warehouse",
        type: "database",
        label: "Data Warehouse",
        technology: "Snowflake",
        icon: "❄️",
        description: "Analytics and BI workloads",
      },
    ],
  },
  {
    id: "messaging",
    name: "Messaging & Events",
    description: "Async processing and streaming",
    items: [
      {
        id: "kafka",
        type: "queue",
        label: "Kafka Topic",
        technology: "Apache Kafka",
        icon: "🌀",
        description: "Distributed event streaming",
      },
      {
        id: "rabbitmq",
        type: "queue",
        label: "RabbitMQ",
        technology: "RabbitMQ",
        icon: "🐇",
        description: "Message broker with routing",
      },
      {
        id: "pubsub",
        type: "queue",
        label: "Pub/Sub",
        technology: "Google Pub/Sub",
        icon: "📡",
        description: "Managed pub/sub messaging",
      },
      {
        id: "sqs",
        type: "queue",
        label: "SQS Queue",
        technology: "AWS SQS",
        icon: "📬",
        description: "Managed queue service",
      },
    ],
  },
  {
    id: "cache",
    name: "Caching Layers",
    description: "Low-latency data access",
    items: [
      {
        id: "redis",
        type: "cache",
        label: "Redis Cache",
        technology: "Redis",
        icon: "⚡",
        description: "Hot data and pub/sub cache",
      },
      {
        id: "memcached",
        type: "cache",
        label: "Memcached",
        technology: "Memcached",
        icon: "🧊",
        description: "Simple key-value cache",
      },
      {
        id: "edge-cache",
        type: "cache",
        label: "Edge Cache",
        technology: "Varnish",
        icon: "🎯",
        description: "Edge HTTP caching",
      },
    ],
  },
  {
    id: "observability",
    name: "Observability & Ops",
    description: "Insights, logging, and reliability tooling",
    items: [
      {
        id: "monitoring-service",
        type: "service",
        label: "Monitoring Service",
        technology: "Prometheus + Grafana",
        icon: "📈",
        description: "Collect metrics and power dashboards",
      },
      {
        id: "logging-service",
        type: "service",
        label: "Logging Service",
        technology: "ELK Stack",
        icon: "🪵",
        description: "Aggregate structured and unstructured logs",
      },
      {
        id: "alerting-engine",
        type: "service",
        label: "Alerting Engine",
        technology: "PagerDuty",
        icon: "🚨",
        description: "Escalate incidents with on-call schedules",
      },
    ],
  },
  {
    id: "security",
    name: "Identity & Security",
    description: "Authentication, authorization, and compliance",
    items: [
      {
        id: "auth-service",
        type: "service",
        label: "Auth Service",
        technology: "Auth0",
        icon: "🔐",
        description: "Centralized identity and access control",
      },
      {
        id: "policy-service",
        type: "service",
        label: "Policy Service",
        technology: "OPA",
        icon: "📜",
        description: "Fine-grained authorization policies",
      },
      {
        id: "secrets-manager",
        type: "service",
        label: "Secrets Manager",
        technology: "AWS Secrets Manager",
        icon: "🧰",
        description: "Secure storage for credentials and tokens",
      },
    ],
  },
];

const libraryItems = componentLibrary.flatMap((category) => category.items);
const typeOptions = Array.from(new Set(libraryItems.map((item) => item.type)));

const DEFAULT_PROTO_BY_TYPE: Record<string, string> = {
  sync: "HTTP",
  async: "AMQP",
  "pub-sub": "Kafka",
};

const clampZoom = (value: number) => Math.min(1.5, Math.max(0.35, value));

export function ArchitectureWhiteboard({
  architecture,
  onSave,
}: ArchitectureWhiteboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeWidth = 220;
  const nodeHeight = 120;
  const [nodes, setNodes] = useState<WhiteboardNode[]>([]);
  const [edges, setEdges] = useState<WhiteboardEdge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    componentLibrary[0].id
  );
  const [selectedTemplate, setSelectedTemplate] = useState<ComponentTemplate>(
    componentLibrary[0].items[0]
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [connectMode, setConnectMode] = useState<boolean>(false);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<"sync" | "async" | "pub-sub">(
    "sync"
  );
  const [zoomState, setZoomState] = useState(0.85);
  const zoomRef = useRef(zoomState);
  const setZoom = useCallback((value: number | ((prev: number) => number)) => {
    setZoomState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      zoomRef.current = next;
      return next;
    });
  }, []);
  const zoom = zoomState;
  const [panState, setPanState] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const panRef = useRef(panState);
  const setPan = useCallback(
    (
      value:
        | { x: number; y: number }
        | ((prev: { x: number; y: number }) => { x: number; y: number })
    ) => {
      setPanState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        panRef.current = next;
        return next;
      });
    },
    []
  );
  const pan = panState;
  const draggingNodeRef = useRef<string | null>(null);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    nodeX: number;
    nodeY: number;
  } | null>(null);
  const pendingPositionRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const bodyStyleRef = useRef<{ userSelect: string; cursor: string } | null>(
    null
  );
  const panDragRef = useRef<{
    pointerX: number;
    pointerY: number;
    panX: number;
    panY: number;
  } | null>(null);
  const pendingFitRef = useRef<boolean>(false);
  const selectedCategoryMeta = useMemo(() => {
    return (
      componentLibrary.find((category) => category.id === selectedCategory) ||
      componentLibrary[0]
    );
  }, [selectedCategory]);

  const templatesToDisplay = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term) {
      return componentLibrary.flatMap((category) =>
        category.items.filter((item) => {
          const label = item.label.toLowerCase();
          const tech = item.technology?.toLowerCase() || "";
          const categoryName = category.name.toLowerCase();
          return (
            label.includes(term) ||
            tech.includes(term) ||
            categoryName.includes(term)
          );
        })
      );
    }
    return selectedCategoryMeta?.items || [];
  }, [searchTerm, selectedCategoryMeta]);

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = componentLibrary.find((cat) => cat.id === categoryId);
    if (category?.items?.length) {
      setSelectedTemplate(category.items[0]);
    }
  }, []);

  const handleSelectTemplate = useCallback((template: ComponentTemplate) => {
    setSelectedTemplate(template);
    const category = componentLibrary.find((cat) =>
      cat.items.some((item) => item.id === template.id)
    );
    if (category) {
      setSelectedCategory(category.id);
    }
  }, []);

  useEffect(() => {
    if (!architecture) return;
    const initialNodes: WhiteboardNode[] = architecture.services.map(
      (service, index) => ({
        id: service.id,
        name: service.name,
        type: service.type,
        technology: service.technology,
        x: 150 + (index % 4) * 220,
        y: 120 + Math.floor(index / 4) * 200,
      })
    );

    const initialEdges: WhiteboardEdge[] = architecture.connections.map(
      (conn, index) => ({
        id: conn.source + "-" + conn.target + "-" + index,
        source: conn.source,
        target: conn.target,
        protocol: conn.protocol || DEFAULT_PROTO_BY_TYPE["sync"],
        type: (conn.type as any) || "sync",
      })
    );
    setNodes(initialNodes);
    setEdges(initialEdges);
    pendingFitRef.current = true;
  }, [architecture]);

  const computeEdgeEndpoints = useCallback(
    (source: WhiteboardNode, target: WhiteboardNode) => {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      let length = Math.hypot(dx, dy);
      if (length < 1) {
        return {
          start: { x: source.x, y: source.y },
          end: { x: target.x, y: target.y },
        };
      }

      const unitX = dx / length;
      const unitY = dy / length;

      const halfWidth = Math.max(nodeWidth / 2 - 14, 16);
      const halfHeight = Math.max(nodeHeight / 2 - 14, 16);

      const baseSource = Math.min(
        unitX !== 0 ? halfWidth / Math.abs(unitX) : Infinity,
        unitY !== 0 ? halfHeight / Math.abs(unitY) : Infinity
      );
      const baseTarget = Math.min(
        unitX !== 0 ? halfWidth / Math.abs(unitX) : Infinity,
        unitY !== 0 ? halfHeight / Math.abs(unitY) : Infinity
      );

      let startDistance =
        baseSource + Math.min(18, Math.max(6, length * 0.035));
      let endDistance = baseTarget + Math.min(28, Math.max(12, length * 0.06));

      const maxSpan = Math.max(length - 40, 8);
      if (startDistance + endDistance > maxSpan) {
        const scale = maxSpan / (startDistance + endDistance);
        startDistance *= scale;
        endDistance *= scale;
      }

      const start = {
        x: source.x + unitX * startDistance,
        y: source.y + unitY * startDistance,
      };

      const end = {
        x: target.x - unitX * endDistance,
        y: target.y - unitY * endDistance,
      };

      return { start, end };
    },
    [nodeHeight, nodeWidth]
  );

  const svgEdges = useMemo(() => {
    return edges
      .map((edge) => {
        const source = nodes.find((n) => n.id === edge.source);
        const target = nodes.find((n) => n.id === edge.target);
        if (!source || !target) return null;

        const { start, end } = computeEdgeEndpoints(source, target);
        return { edge, source, target, start, end };
      })
      .filter(Boolean) as {
      edge: WhiteboardEdge;
      source: WhiteboardNode;
      target: WhiteboardNode;
      start: { x: number; y: number };
      end: { x: number; y: number };
    }[];
  }, [computeEdgeEndpoints, edges, nodes]);

  const addNode = useCallback(() => {
    if (!containerRef.current || !selectedTemplate) return;
    const rect = containerRef.current.getBoundingClientRect();
    const id = `${selectedTemplate.id}-${Date.now()}`;
    const currentZoom = zoomRef.current || 1;
    const currentPan = panRef.current;
    const centerX = (rect.width / 2 - currentPan.x) / currentZoom;
    const centerY = (rect.height / 2 - currentPan.y) / currentZoom;
    setNodes((prev) => [
      ...prev,
      {
        id,
        name: selectedTemplate.label,
        type: selectedTemplate.type,
        technology: selectedTemplate.technology,
        x: centerX,
        y: centerY,
      },
    ]);
  }, [selectedTemplate]);

  const handleNodeMouseDown = useCallback(
    (event: React.MouseEvent, nodeId: string) => {
      if (connectMode) {
        setConnectSource((prev) =>
          prev === null ? nodeId : prev === nodeId ? null : prev
        );
        return;
      }

      if (event.button !== 0) return;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      event.preventDefault();
      event.stopPropagation();

      draggingNodeRef.current = nodeId;
      dragStartRef.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        nodeX: node.x,
        nodeY: node.y,
      };
      pendingPositionRef.current = { x: node.x, y: node.y };

      if (!bodyStyleRef.current) {
        bodyStyleRef.current = {
          userSelect: document.body.style.userSelect,
          cursor: document.body.style.cursor,
        };
      }

      if (typeof window !== "undefined") {
        const selection = window.getSelection();
        selection?.removeAllRanges();
      }

      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    },
    [connectMode, nodes]
  );

  const handleBackgroundMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (event.button !== 0 && event.button !== 1) return;
      if (event.target !== event.currentTarget) return;

      event.preventDefault();
      event.stopPropagation();

      if (!bodyStyleRef.current) {
        bodyStyleRef.current = {
          userSelect: document.body.style.userSelect,
          cursor: document.body.style.cursor,
        };
      }

      if (typeof window !== "undefined") {
        window.getSelection()?.removeAllRanges();
      }

      panDragRef.current = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
      setConnectSource(null);
    },
    [setConnectSource]
  );

  const applyZoom = useCallback(
    (nextZoom: number, focal?: { clientX: number; clientY: number }) => {
      const container = containerRef.current;
      const previousZoom = zoomRef.current || 1;
      const clamped = clampZoom(nextZoom);

      if (!container) {
        setZoom(clamped);
        return;
      }

      const rect = container.getBoundingClientRect();
      const focalPoint = focal || {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      };

      const cursorX = focalPoint.clientX - rect.left;
      const cursorY = focalPoint.clientY - rect.top;
      const currentPan = panRef.current;

      const scaleRatio = clamped / previousZoom;
      const nextPan = {
        x: cursorX - (cursorX - currentPan.x) * scaleRatio,
        y: cursorY - (cursorY - currentPan.y) * scaleRatio,
      };

      setZoom(clamped);
      setPan(nextPan);
    },
    [setPan, setZoom]
  );

  const applyPendingPosition = useCallback(() => {
    animationFrameRef.current = null;
    const nodeId = draggingNodeRef.current;
    const position = pendingPositionRef.current;
    if (!nodeId || !position) return;

    setNodes((prev) => {
      let changed = false;
      const next = prev.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }
        if (
          Math.abs(node.x - position.x) < 0.1 &&
          Math.abs(node.y - position.y) < 0.1
        ) {
          return node;
        }
        changed = true;
        return { ...node, x: position.x, y: position.y };
      });

      return changed ? next : prev;
    });
  }, [setNodes]);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (panDragRef.current) {
        const { pointerX, pointerY, panX, panY } = panDragRef.current;
        const nextPan = {
          x: panX + (event.clientX - pointerX),
          y: panY + (event.clientY - pointerY),
        };
        setPan(nextPan);
      }

      if (!draggingNodeRef.current || !dragStartRef.current) return;

      const { pointerX, pointerY, nodeX, nodeY } = dragStartRef.current;
      const scale = zoomRef.current || 1;
      pendingPositionRef.current = {
        x: nodeX + (event.clientX - pointerX) / scale,
        y: nodeY + (event.clientY - pointerY) / scale,
      };

      if (animationFrameRef.current === null) {
        animationFrameRef.current =
          window.requestAnimationFrame(applyPendingPosition);
      }
    },
    [applyPendingPosition, setPan]
  );

  const handleMouseUp = useCallback(() => {
    const wasDragging = draggingNodeRef.current !== null;
    const wasPanning = panDragRef.current !== null;

    if (!wasDragging && !wasPanning) {
      return;
    }

    draggingNodeRef.current = null;
    dragStartRef.current = null;
    pendingPositionRef.current = null;
    panDragRef.current = null;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (bodyStyleRef.current) {
      document.body.style.userSelect = bodyStyleRef.current.userSelect;
      document.body.style.cursor = bodyStyleRef.current.cursor;
      bodyStyleRef.current = null;
    } else {
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("cursor");
    }
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        const factor = Math.pow(1.0015, -event.deltaY);
        applyZoom(zoomRef.current * factor, {
          clientX: event.clientX,
          clientY: event.clientY,
        });
        return;
      }

      event.preventDefault();
      setPan((prev) => ({
        x: prev.x - event.deltaX,
        y: prev.y - event.deltaY,
      }));
    },
    [applyZoom, setPan]
  );

  const fitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container || !nodes.length) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.x - nodeWidth / 2);
      maxX = Math.max(maxX, node.x + nodeWidth / 2);
      minY = Math.min(minY, node.y - nodeHeight / 2);
      maxY = Math.max(maxY, node.y + nodeHeight / 2);
    });

    if (
      !isFinite(minX) ||
      !isFinite(maxX) ||
      !isFinite(minY) ||
      !isFinite(maxY)
    ) {
      return;
    }

    const contentWidth = Math.max(maxX - minX, nodeWidth);
    const contentHeight = Math.max(maxY - minY, nodeHeight);
    const padding = 160;
    const availableWidth = Math.max(container.clientWidth - padding, 200);
    const availableHeight = Math.max(container.clientHeight - padding, 200);

    const scale = Math.min(
      availableWidth / contentWidth,
      availableHeight / contentHeight,
      1.2
    );
    const targetZoom = clampZoom(Math.max(scale * 0.95, 0.2));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(targetZoom);
    setPan({
      x: container.clientWidth / 2 - targetZoom * centerX,
      y: container.clientHeight / 2 - targetZoom * centerY,
    });
  }, [nodes, nodeHeight, nodeWidth, setPan, setZoom]);

  const handleZoomIn = useCallback(() => {
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    const focal = rect
      ? {
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        }
      : undefined;
    applyZoom(zoomRef.current * 1.1, focal);
  }, [applyZoom]);

  const handleZoomOut = useCallback(() => {
    const container = containerRef.current;
    const rect = container?.getBoundingClientRect();
    const focal = rect
      ? {
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2,
        }
      : undefined;
    applyZoom(zoomRef.current * 0.9, focal);
  }, [applyZoom]);

  const handleFitToView = useCallback(() => {
    fitToView();
  }, [fitToView]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!pendingFitRef.current) return;

    if (!nodes.length) {
      pendingFitRef.current = false;
      setZoom(0.85);
      setPan({ x: 0, y: 0 });
      return;
    }

    pendingFitRef.current = false;
    requestAnimationFrame(() => fitToView());
  }, [fitToView, nodes, setPan, setZoom]);

  const handleConnectClick = useCallback(
    (nodeId: string) => {
      if (!connectMode) return;
      if (!connectSource) {
        setConnectSource(nodeId);
        return;
      }

      if (connectSource === nodeId) {
        setConnectSource(null);
        return;
      }

      const id = `${connectSource}-${nodeId}-${Date.now()}`;
      setEdges((prev) => [
        ...prev,
        {
          id,
          source: connectSource,
          target: nodeId,
          type: linkType,
          protocol: DEFAULT_PROTO_BY_TYPE[linkType],
        },
      ]);
      setConnectSource(null);
    },
    [connectMode, connectSource, linkType]
  );

  const removeEdge = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((edge) => edge.id !== edgeId));
  }, []);

  const removeNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== nodeId));
      setEdges((prev) =>
        prev.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      if (connectSource === nodeId) {
        setConnectSource(null);
      }
    },
    [connectSource]
  );

  const resetBoard = useCallback(() => {
    if (!architecture) return;
    const initialNodes: WhiteboardNode[] = architecture.services.map(
      (service, index) => ({
        id: service.id,
        name: service.name,
        type: service.type,
        technology: service.technology,
        x: 150 + (index % 4) * 220,
        y: 120 + Math.floor(index / 4) * 200,
      })
    );

    const initialEdges: WhiteboardEdge[] = architecture.connections.map(
      (conn, index) => ({
        id: conn.source + "-" + conn.target + "-" + index,
        source: conn.source,
        target: conn.target,
        protocol: conn.protocol || DEFAULT_PROTO_BY_TYPE["sync"],
        type: (conn.type as any) || "sync",
      })
    );
    setNodes(initialNodes);
    setEdges(initialEdges);
    setConnectSource(null);
    pendingFitRef.current = true;
  }, [architecture]);

  const handleSave = useCallback(() => {
    if (!architecture || !onSave) return;
    const services = nodes.map((node) => ({
      id: node.id,
      name: node.name,
      type: node.type as any,
      technology: node.technology,
    }));

    const connections = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      type: edge.type,
      protocol: edge.protocol,
    }));

    onSave({
      ...architecture,
      services,
      connections,
    });
  }, [architecture, edges, nodes, onSave]);

  const resolveNodeIcon = useCallback((node: WhiteboardNode) => {
    if (node.technology) {
      const techMatch = libraryItems.find(
        (item) =>
          item.technology &&
          item.technology.toLowerCase() === node.technology?.toLowerCase()
      );
      if (techMatch) {
        return techMatch.icon;
      }
    }
    const typeMatch = libraryItems.find((item) => item.type === node.type);
    return typeMatch?.icon || "🧠";
  }, []);

  const zoomDisplay = Math.round(zoom * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 bg-slate-900/70 border border-slate-800/60 rounded-xl px-4 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <PanelsTopLeft className="w-5 h-5 text-slate-400" />
            <div>
              <h3 className="text-slate-200 font-semibold text-lg">
                Interactive Whiteboard
              </h3>
              <p className="text-xs text-slate-500">
                Drag, connect and curate your architecture by hand.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={addNode}
              className="border-blue-500/40 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {selectedTemplate?.label || "Component"}
            </Button>
            <div className="flex items-center gap-2 border-l border-slate-800/60 pl-3">
              <Button
                variant={connectMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setConnectMode((prev) => !prev);
                  setConnectSource(null);
                }}
                className={
                  connectMode
                    ? "bg-purple-500 hover:bg-purple-500/90"
                    : "border-slate-700 text-slate-300"
                }
              >
                <Link2 className="w-4 h-4 mr-2" />
                {connectMode ? "Connecting…" : "Connect"}
              </Button>
              {connectMode && (
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-2 py-1"
                >
                  <option value="sync">Sync Request</option>
                  <option value="async">Async Queue</option>
                  <option value="pub-sub">Pub/Sub</option>
                </select>
              )}
            </div>
            <div className="flex items-center gap-2 border-l border-slate-800/60 pl-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomOut}
                className="border-slate-700 text-slate-300 hover:border-blue-500/50 hover:bg-blue-500/10"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center text-xs font-medium text-slate-300">
                {zoomDisplay}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleZoomIn}
                className="border-slate-700 text-slate-300 hover:border-blue-500/50 hover:bg-blue-500/10"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFitToView}
                className="border-slate-700 text-slate-300 hover:border-emerald-500/50 hover:bg-emerald-500/10"
              >
                <Focus className="w-4 h-4 mr-2" />
                Fit
              </Button>
            </div>
            <div className="flex items-center gap-2 border-l border-slate-800/60 pl-3">
              <Button variant="outline" size="sm" onClick={resetBoard}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-emerald-500 hover:bg-emerald-500/90"
              >
                <Save className="w-4 h-4 mr-2" />
                Save to Architecture
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-800/60 pt-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search components or tech…"
                className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-700 bg-slate-950/80 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Palette</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {componentLibrary.map((category) => (
              <button
                key={category.id}
                onClick={() => handleSelectCategory(category.id)}
                className={`px-3 py-1.5 rounded-full text-xs border transition ${
                  selectedCategory === category.id && !searchTerm
                    ? "border-blue-500 bg-blue-500/15 text-blue-200"
                    : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {selectedCategoryMeta?.description && !searchTerm && (
            <p className="text-xs text-slate-500">
              {selectedCategoryMeta.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {templatesToDisplay.length > 0 ? (
              templatesToDisplay.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-left transition w-60 ${
                    selectedTemplate?.id === template.id
                      ? "border-blue-500 bg-blue-500/15 text-blue-100"
                      : "border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-center text-2xl">
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-100">
                      {template.label}
                    </p>
                    {template.technology && (
                      <p className="text-[11px] text-slate-500">
                        {template.technology}
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="text-sm text-slate-500">
                No components match your search. Try another keyword.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[280px,1fr] gap-4">
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 space-y-4 backdrop-blur">
          <div>
            <h4 className="text-slate-200 font-semibold text-sm mb-2 flex items-center gap-2">
              <Brush className="w-4 h-4 text-slate-400" />
              Quick Tips
            </h4>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Drag nodes to reposition them on the canvas</li>
              <li>
                • Drag the empty canvas to pan; use Ctrl/Cmd + scroll or the
                zoom controls
              </li>
              <li>• Switch to connect mode to draw new relationships</li>
              <li>• Click an edge label to remove the connection</li>
              <li>
                • Use the dropdowns to change type/technology, trash icon to
                delete
              </li>
              <li>• Save writes changes back to the AI-generated design</li>
            </ul>
          </div>

          <div>
            <h4 className="text-slate-200 font-semibold text-sm mb-2 flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-slate-400" />
              Current Selection
            </h4>
            <p className="text-xs text-slate-400 space-y-1">
              <span className="block">
                Adding:{" "}
                <span className="text-slate-200 font-medium">
                  {selectedTemplate?.label}
                </span>
              </span>
              {selectedTemplate?.technology && (
                <span className="block">
                  Tech:{" "}
                  <span className="text-slate-200">
                    {selectedTemplate.technology}
                  </span>
                </span>
              )}
              {connectMode && (
                <>
                  <br />
                  Connection Mode:{" "}
                  <span className="text-slate-200 font-medium">
                    {linkType.toUpperCase()}
                  </span>
                  {connectSource && (
                    <>
                      <br />
                      From Node:{" "}
                      <span className="text-blue-300 font-medium">
                        {nodes.find((node) => node.id === connectSource)?.name}
                      </span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>
        </div>

        <div
          ref={containerRef}
          className="relative border border-slate-800/60 rounded-2xl bg-slate-950/60 overflow-hidden min-h-[640px] backdrop-blur group"
          onWheel={handleWheel}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `matrix(${zoom}, 0, 0, ${zoom}, ${pan.x}, ${pan.y})`,
              transformOrigin: "0 0",
            }}
            onMouseDown={handleBackgroundMouseDown}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker
                  id="whiteboard-arrow-sync"
                  viewBox="0 0 16 16"
                  markerWidth="16"
                  markerHeight="16"
                  refX="14"
                  refY="8"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M2,2 L14,8 L2,14 Z" fill="#64748b" opacity="0.95" />
                </marker>
                <marker
                  id="whiteboard-arrow-async"
                  viewBox="0 0 16 16"
                  markerWidth="16"
                  markerHeight="16"
                  refX="14"
                  refY="8"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M2,2 L14,8 L2,14 Z" fill="#94a3b8" opacity="0.95" />
                </marker>
                <marker
                  id="whiteboard-arrow-pubsub"
                  viewBox="0 0 16 16"
                  markerWidth="16"
                  markerHeight="16"
                  refX="14"
                  refY="8"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M2,2 L14,8 L2,14 Z" fill="#f59e0b" opacity="0.95" />
                </marker>
                <marker
                  id="whiteboard-origin"
                  viewBox="0 0 12 12"
                  markerWidth="12"
                  markerHeight="12"
                  refX="6"
                  refY="6"
                  markerUnits="userSpaceOnUse"
                >
                  <circle
                    cx="6"
                    cy="6"
                    r="4"
                    fill="#1e293b"
                    stroke="#334155"
                    strokeWidth="1.5"
                  />
                </marker>
              </defs>
              {svgEdges.map(({ edge, start, end }) => {
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                return (
                  <g key={edge.id}>
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={
                        edge.type === "pub-sub"
                          ? "#f59e0b"
                          : edge.type === "async"
                          ? "#94a3b8"
                          : "#64748b"
                      }
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeDasharray={
                        edge.type === "async"
                          ? "8 6"
                          : edge.type === "pub-sub"
                          ? "4 2"
                          : undefined
                      }
                      markerStart="url(#whiteboard-origin)"
                      markerEnd={`url(#whiteboard-arrow-${
                        edge.type === "pub-sub"
                          ? "pubsub"
                          : edge.type === "async"
                          ? "async"
                          : "sync"
                      })`}
                      opacity={0.85}
                    />
                    <rect
                      x={midX - 36}
                      y={midY - 12}
                      width={72}
                      height={24}
                      rx={6}
                      fill="#1e293b"
                      stroke="#334155"
                      strokeWidth={1}
                      opacity={0.95}
                      onClick={() => removeEdge(edge.id)}
                      className="cursor-pointer"
                    />
                    <text
                      x={midX}
                      y={midY + 4}
                      textAnchor="middle"
                      fontSize={10}
                      fontWeight={600}
                      fill="#e2e8f0"
                      className="select-none cursor-pointer"
                      onClick={() => removeEdge(edge.id)}
                    >
                      {edge.protocol || DEFAULT_PROTO_BY_TYPE[edge.type]}
                    </text>
                  </g>
                );
              })}
            </svg>

            {nodes.map((node) => {
              const templateMatch =
                libraryItems.find(
                  (item) =>
                    item.technology &&
                    node.technology &&
                    item.technology.toLowerCase() ===
                      node.technology.toLowerCase()
                ) ||
                libraryItems.find((item) => item.label === node.name) ||
                libraryItems.find((item) => item.type === node.type);

              return (
                <div
                  key={node.id}
                  style={{
                    left: node.x - nodeWidth / 2,
                    top: node.y - nodeHeight / 2,
                    width: nodeWidth,
                  }}
                  className={`absolute bg-slate-900/90 border border-slate-800/80 rounded-2xl px-4 py-3 shadow-lg transition-all cursor-grab active:cursor-grabbing ${
                    connectSource === node.id
                      ? "ring-2 ring-purple-400"
                      : "hover:border-blue-500/50 hover:shadow-blue-500/10"
                  }`}
                  onMouseDown={(event) => handleNodeMouseDown(event, node.id)}
                  onClick={() => handleConnectClick(node.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-center text-2xl">
                      {resolveNodeIcon(node)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-2">
                        <input
                          className="bg-transparent border-0 text-sm text-slate-100 font-semibold focus:outline-none focus:ring-0 w-full"
                          value={node.name}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === node.id
                                  ? { ...n, name: e.target.value }
                                  : n
                              )
                            )
                          }
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeNode(node.id);
                          }}
                          className="text-slate-500 hover:text-red-400 transition"
                          aria-label="Remove component"
                          onMouseDown={(event) => event.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
                        <select
                          value={node.type}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === node.id
                                  ? {
                                      ...n,
                                      type: e.target
                                        .value as SystemNode["type"],
                                    }
                                  : n
                              )
                            )
                          }
                          className="bg-slate-950/70 border border-slate-700 rounded-full px-2 py-0.5 text-[10px] uppercase"
                        >
                          {typeOptions.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                        <input
                          value={node.technology || ""}
                          onChange={(e) =>
                            setNodes((prev) =>
                              prev.map((n) =>
                                n.id === node.id
                                  ? { ...n, technology: e.target.value }
                                  : n
                              )
                            )
                          }
                          placeholder="Technology"
                          className="bg-slate-950/70 border border-slate-700 rounded-full px-2 py-0.5 text-[10px] uppercase focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={(event) => event.stopPropagation()}
                        />
                      </div>
                      {templateMatch?.description && (
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {templateMatch.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {!nodes.length && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 text-sm gap-2">
                <Brush className="w-10 h-10 text-slate-700" />
                <p>Run the AI generator or add components from the palette.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
