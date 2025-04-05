"use client";

import { Node, Edge } from '@xyflow/react';

/**
 * Generates data for a bar chart
 */
export function generateBarChartData(
  categories: string[],
  seriesNames: string[],
  valueRange: { min: number; max: number }
): {
  data: Array<Record<string, any>>;
  config: {
    xAxisDataKey: string;
    bars: Array<{ dataKey: string; fill: string; name: string }>;
    height: number;
  };
} {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];
  
  const data = categories.map((category) => {
    const dataPoint: Record<string, any> = { name: category };
    
    seriesNames.forEach((series) => {
      dataPoint[series] = Math.floor(Math.random() * (valueRange.max - valueRange.min + 1)) + valueRange.min;
    });
    
    return dataPoint;
  });
  
  const bars = seriesNames.map((series, index) => ({
    dataKey: series,
    fill: colors[index % colors.length],
    name: series.charAt(0).toUpperCase() + series.slice(1),
  }));
  
  return {
    data,
    config: {
      xAxisDataKey: 'name',
      bars,
      height: 300,
    },
  };
}

/**
 * Generates data for a pie chart
 */
export function generatePieChartData(
  segments: Array<{ name: string; value: number }>
): {
  data: Array<{ name: string; value: number }>;
  config: {
    height: number;
    colors: string[];
  };
} {
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28DFF', '#FF6B6B'];
  
  return {
    data: segments,
    config: {
      height: 350,
      colors: colors.slice(0, segments.length),
    },
  };
}

/**
 * Generates data for a line chart
 */
export function generateLineChartData(
  categories: string[],
  seriesNames: string[],
  valueRange: { min: number; max: number }
): {
  data: Array<Record<string, any>>;
  config: {
    xAxisDataKey: string;
    lines: Array<{
      dataKey: string;
      stroke: string;
      name: string;
      strokeWidth: number;
      dot: boolean;
    }>;
    height: number;
  };
} {
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042'];
  
  const data = categories.map((category) => {
    const dataPoint: Record<string, any> = { name: category };
    
    seriesNames.forEach((series) => {
      dataPoint[series] = Math.floor(Math.random() * (valueRange.max - valueRange.min + 1)) + valueRange.min;
    });
    
    return dataPoint;
  });
  
  const lines = seriesNames.map((series, index) => ({
    dataKey: series,
    stroke: colors[index % colors.length],
    name: series.charAt(0).toUpperCase() + series.slice(1),
    strokeWidth: 2,
    dot: true,
  }));
  
  return {
    data,
    config: {
      xAxisDataKey: 'name',
      lines,
      height: 300,
    },
  };
}

/**
 * Generates a simple flow chart
 */
export function generateFlowChartData(
  processNodes: string[]
): {
  data: {
    nodes: Node[];
    edges: Edge[];
  };
  config: {
    height: number;
  };
} {
  // Create nodes with proper positioning
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Add start node
  nodes.push({
    id: 'start',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 250, y: 25 },
  });
  
  // Add process nodes
  processNodes.forEach((process, index) => {
    const id = `process-${index}`;
    const x = 150 + (index % 2) * 300; // Alternate left and right
    const y = 100 + Math.floor(index / 2) * 100; // Increase y for every two nodes
    
    nodes.push({
      id,
      data: { label: process },
      position: { x, y },
    });
    
    // Connect from start node to first process nodes
    if (index < 2) {
      edges.push({
        id: `e-start-${id}`,
        source: 'start',
        target: id,
        animated: index === 0,
      });
    } else {
      // Connect from previous process nodes
      const prevNodeIndex = Math.max(0, index - 2);
      const prevId = `process-${prevNodeIndex}`;
      edges.push({
        id: `e-${prevId}-${id}`,
        source: prevId,
        target: id,
        animated: index % 3 === 0,
      });
    }
  });
  
  // Add end node
  const endNodeY = 100 + Math.ceil(processNodes.length / 2) * 100;
  nodes.push({
    id: 'end',
    type: 'output',
    data: { label: 'End' },
    position: { x: 250, y: endNodeY },
  });
  
  // Connect last process nodes to end
  const lastTwoIndices = [processNodes.length - 1, processNodes.length - 2].filter(i => i >= 0);
  lastTwoIndices.forEach(index => {
    edges.push({
      id: `e-process-${index}-end`,
      source: `process-${index}`,
      target: 'end',
      animated: index === processNodes.length - 1,
    });
  });
  
  return {
    data: {
      nodes,
      edges,
    },
    config: {
      height: Math.max(400, endNodeY + 100),
    },
  };
} 