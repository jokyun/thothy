"use client";

import React, { useState } from 'react';
import { Node, Edge } from '@xyflow/react';

interface FlowChartProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  className?: string;
}

// A simple fallback flow chart renderer that doesn't rely on ReactFlow
// This avoids the complex ReactFlow rendering issues
export function FlowChart({ initialNodes = [], initialEdges = [], className = '' }: FlowChartProps) {
  const [error, setError] = useState<string | null>(null);
  
  // Validate input
  if (!initialNodes || initialNodes.length === 0) {
    return (
      <div className="border rounded-md p-4 bg-slate-50">
        <h3 className="font-medium text-center mb-2">Process Flow</h3>
        <div className="flex flex-col items-center justify-center space-y-2 py-4">
          <div className="border rounded-full bg-blue-100 text-blue-800 px-4 py-2">Start</div>
          <div className="h-8 border-l-2 border-gray-300"></div>
          <div className="border rounded-md bg-white p-3 shadow-sm">Process Step</div>
          <div className="h-8 border-l-2 border-gray-300"></div>
          <div className="border rounded-full bg-green-100 text-green-800 px-4 py-2">Complete</div>
        </div>
      </div>
    );
  }

  try {
    // Render a simple flow chart based on the nodes
    return (
      <div className={`w-full ${className || 'h-[400px]'} border rounded-md bg-slate-50 p-4`}>
        <h3 className="font-medium text-center mb-4">Process Flow</h3>
        <div className="flex flex-col items-center justify-center space-y-6">
          {initialNodes.map((node, index) => (
            <React.Fragment key={node.id || index}>
              <div 
                className={`
                  border rounded-md p-3 shadow-sm w-64 text-center
                  ${index === 0 ? 'bg-blue-100 text-blue-800 rounded-full' : ''}
                  ${index === initialNodes.length - 1 ? 'bg-green-100 text-green-800 rounded-full' : 'bg-white'}
                `}
              >
                {node.data && typeof node.data === 'object' && 'label' in node.data 
                  ? String(node.data.label) 
                  : `Step ${index + 1}`}
              </div>
              {index < initialNodes.length - 1 && (
                <div className="h-8 border-l-2 border-gray-300 relative">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  } catch (e) {
    console.error('Error rendering flow chart:', e);
    
    // Return a very simple fallback on error
    return (
      <div className="border rounded-lg p-4 bg-amber-50 text-amber-800">
        <p className="font-medium">Unable to render flow chart</p>
        <p className="text-sm mt-1">Using simplified view instead.</p>
        <div className="mt-4 p-4 border rounded bg-white">
          <div className="space-y-2">
            {initialNodes.map((node, index) => (
              <div key={index} className="p-2 border-b">
                {node.data && typeof node.data === 'object' && 'label' in node.data 
                  ? String(node.data.label) 
                  : `Step ${index + 1}`}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
} 