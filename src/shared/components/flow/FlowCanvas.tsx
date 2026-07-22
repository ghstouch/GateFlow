"use client";

import { useCallback, useEffect, useRef, type ReactNode } from "react";
import {
  ReactFlow,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type NodeMouseHandler,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const FIT_VIEW_OPTIONS = { padding: 0.22, duration: 250 } as const;
const MIN_ZOOM = 0.08;
const MAX_ZOOM = 2;
const REFIT_DELAY_MS = 60;

type FlowCanvasProps = {
  nodes: Node[];
  edges: Edge[];
  nodeTypes?: NodeTypes;
  edgeTypes?: EdgeTypes;
  fitKey?: string | number;
  interactive?: boolean;
  className?: string;
  onNodeClick?: NodeMouseHandler;
  children?: ReactNode;
};

export function FlowCanvas({
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  fitKey,
  interactive = false,
  className = "h-full w-full min-w-0 overflow-hidden",
  onNodeClick,
  children,
}: FlowCanvasProps) {
  const rfInstance = useRef<ReactFlowInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef(0);

  const onInit = useCallback((instance: ReactFlowInstance) => {
    const generation = ++generationRef.current;
    rfInstance.current = instance;
    setTimeout(() => {
      if (generationRef.current === generation) {
        instance.fitView(FIT_VIEW_OPTIONS);
      }
    }, REFIT_DELAY_MS);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      rfInstance.current?.fitView(FIT_VIEW_OPTIONS);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const generation = generationRef.current;
    const id = setTimeout(() => {
      if (generationRef.current === generation) {
        rfInstance.current?.fitView(FIT_VIEW_OPTIONS);
      }
    }, REFIT_DELAY_MS);
    return () => clearTimeout(id);
  }, [nodes.length]);

  useEffect(() => {
    return () => {
      rfInstance.current = null;
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <ReactFlow
        key={fitKey}
        className="omniroute-flow"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onInit={onInit}
        proOptions={{ hideAttribution: true }}
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick
        preventScrolling={false}
        nodesDraggable={interactive}
        nodesConnectable={false}
        elementsSelectable={interactive}
      >
        <Controls showInteractive={false} />
        {children}
      </ReactFlow>
    </div>
  );
}

export default FlowCanvas;
