import { ChartType, ChartData } from './ChartRenderer';
import { Node, Edge } from '@xyflow/react';

interface DataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface FlowChartData {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Auto-generate chart data from markdown content based on textual patterns
 * This function is kept for backward compatibility but most of its functionality
 * has been enhanced and moved to ChartRenderer.tsx
 */
export const detectChartDataFromContent = (content: string): ChartData | null => {
  // Detect lists with numeric data for bar/line charts
  const hasList = /[-*]\s+[^:]+:\s*\d+/.test(content);
  const hasComparison = /(?:comparison|versus|vs\.|compare)/i.test(content);
  const hasTimeSeries = /(?:over time|trend|growth|decline|increase|decrease)/i.test(content);
  const hasCategories = /(?:category|categories|types|classification)/i.test(content);
  const hasSteps = /(?:step|steps|process|phase|stages|procedure)/i.test(content);
  
  // Extract data from bullet points with values
  if (hasList) {
    const lines = content.match(/[-*]\s+([^:]+):\s*(\d+)/g) || [];
    if (lines.length > 1) {
      const data = lines.map(line => {
        const match = line.match(/[-*]\s+([^:]+):\s*(\d+)/);
        if (match) {
          return { name: match[1].trim(), value: parseInt(match[2]) };
        }
        return null;
      }).filter(Boolean) as DataPoint[];
      
      if (data.length > 0) {
        if (hasTimeSeries) {
          return {
            type: 'line',
            data,
            config: {
              xAxisDataKey: 'name',
              lines: [{ dataKey: 'value', stroke: '#8884d8' }],
            },
            id: 'auto-line-chart',
          };
        } else if (hasCategories || hasComparison) {
          return {
            type: 'bar',
            data,
            config: {
              xAxisDataKey: 'name',
              bars: [{ dataKey: 'value', fill: '#8884d8' }],
            },
            id: 'auto-bar-chart',
          };
        } else {
          return {
            type: 'pie',
            data,
            config: {
              dataKey: 'value',
              nameKey: 'name',
            },
            id: 'auto-pie-chart',
          };
        }
      }
    }
  }
  
  // Create a flow chart for step-by-step content
  if (hasSteps) {
    const steps = content.match(/#+\s+(.+)/g) || [];
    if (steps.length > 1) {
      const nodes = steps.map((step, index) => {
        const title = step.replace(/#+\s+/, '').trim();
        return {
          id: `node-${index}`,
          type: 'default',
          data: { label: title },
          position: { x: 100, y: 100 + index * 100 },
        };
      }) as Node[];
      
      const edges = nodes.slice(0, -1).map((_, index) => ({
        id: `edge-${index}`,
        source: `node-${index}`,
        target: `node-${index + 1}`,
        type: 'smoothstep',
        animated: true,
      })) as Edge[];
      
      return {
        type: 'flow',
        data: { nodes, edges } as FlowChartData,
        config: {
          className: 'h-[400px]',
        },
        id: 'auto-flow-chart',
      };
    }
  }
  
  return null;
};

/**
 * Analyze text content to suggest appropriate chart type
 * @param content Text content to analyze
 * @returns Recommended chart type
 */
export const recommendChartType = (content: string): ChartType => {
  const hasTimeSeries = /(?:over time|trend|growth|decline|increase|decrease)/i.test(content);
  const hasComparison = /(?:comparison|versus|vs\.|compare)/i.test(content);
  const hasDistribution = /(?:distribution|percentage|proportion|share)/i.test(content);
  const hasProcess = /(?:flow|process|sequence|step|procedure)/i.test(content);
  
  if (hasProcess) return 'flow';
  if (hasTimeSeries) return 'line';
  if (hasComparison) return 'bar';
  if (hasDistribution) return 'pie';
  
  return 'bar'; // Default to bar chart
}; 