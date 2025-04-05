"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, PieChart, LineChart, FlowChart } from './index';
import { Node, Edge } from '@xyflow/react';
import { Button } from '../../components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, PresentationIcon, BarChart as ChartBarIcon } from 'lucide-react';
import { detectChartDataFromContent } from './utils';

interface ChartRendererProps {
  markdown: string;
  className?: string;
}

// Define chart type explicitly
export type ChartType = 'bar' | 'pie' | 'line' | 'flow';

export interface ChartData {
  type: ChartType;
  data: any;
  config: any;
  id: string;
}

// Interface for sections returned from the API
interface SectionWithChartType {
  content: string;
  chartType: ChartType;
}

export function ChartRenderer({ markdown, className = '' }: ChartRendererProps) {
  // A special method to ensure we have a chart selection no matter what
  const ensureChartType = (recommendedType: ChartType): ChartType => {
    // If flow chart was recommended but we are having issues, fall back to bar chart
    if (recommendedType === "flow") {
      return "bar";
    }
    return recommendedType || "bar";
  };
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<SectionWithChartType[]>([]);
  
  // Extract items with values from text
  const extractItemsFromText = (text: string): { name: string, value: number }[] => {
    const items: { name: string, value: number }[] = [];
    
    // Try to extract bullet points with values
    const bulletRegex = /[-*]\s+([^:]+):\s*(\d+)/g;
    let bulletMatch;
    while ((bulletMatch = bulletRegex.exec(text)) !== null) {
      items.push({
        name: bulletMatch[1].trim(),
        value: parseInt(bulletMatch[2])
      });
    }
    
    // If no bullet points with values, try extracting key phrases or sentences
    if (items.length === 0) {
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
      sentences.slice(0, 5).forEach((sentence, index) => {
        const cleanSentence = sentence.trim();
        if (cleanSentence.length > 10 && cleanSentence.length < 50) {
          items.push({
            name: cleanSentence,
            value: 100 - index * 20
          });
        }
      });
    }
    
    return items;
  };
  
  // Create placeholder data for charts
  const createPlaceholderData = (text: string, count: number): { name: string, value: number }[] => {
    const titleMatch = text.match(/^(#+)\s+(.+)$/m);
    const title = titleMatch ? titleMatch[2] : 'Data';
    
    const data: { name: string, value: number }[] = [];
    for (let i = 1; i <= count; i++) {
      data.push({
        name: `${title} ${i}`,
        value: Math.floor(Math.random() * 50) + 50
      });
    }
    
    return data;
  };

  // Adapt chart data to a different chart type
  const adaptChartData = (originalChart: ChartData, targetType: ChartType): ChartData | null => {
    if (originalChart.type === targetType) return originalChart;
    
    // Simple data transformation between chart types
    switch (targetType) {
      case 'bar':
        return {
          ...originalChart,
          type: 'bar',
          config: {
            xAxisDataKey: 'name',
            bars: [{ dataKey: 'value', fill: '#8884d8' }],
            height: 300
          },
          id: `adapted-bar-chart`
        };
        
      case 'pie':
        return {
          ...originalChart,
          type: 'pie',
          config: {
            dataKey: 'value',
            nameKey: 'name',
            height: 300
          },
          id: `adapted-pie-chart`
        };
        
      case 'line':
        return {
          ...originalChart,
          type: 'line',
          config: {
            xAxisDataKey: 'name',
            lines: [{ dataKey: 'value', stroke: '#8884d8' }],
            height: 300
          },
          id: `adapted-line-chart`
        };
        
      case 'flow':
        // Flow charts typically need special data structure
        // Only attempt to convert if there's clear sequential data
        if (originalChart.data && originalChart.data.length > 1) {
          const nodes = originalChart.data.map((item: any, index: number) => ({
            id: `node-${index}`,
            type: 'default',
            data: { label: item.name || `Step ${index + 1}` },
            position: { x: 100, y: 100 + index * 100 },
          })) as Node[];
          
          const edges = nodes.slice(0, -1).map((_, index) => ({
            id: `edge-${index}`,
            source: `node-${index}`,
            target: `node-${index + 1}`,
            type: 'smoothstep',
            animated: true,
          })) as Edge[];
          
          return {
            type: 'flow',
            data: { nodes, edges },
            config: {
              className: 'h-[400px]',
            },
            id: 'adapted-flow-chart',
          };
        }
        return null;
    }
    
    return null;
  };
  
  // Create a basic chart of the specified type
  const createBasicChartOfType = (content: string, chartType: ChartType): ChartData | null => {
    // Extract any data we can find in the content
    const extractedItems = extractItemsFromText(content);
    
    if (extractedItems.length === 0) {
      // If no data could be extracted, create placeholder data
      switch (chartType) {
        case 'flow':
          // Create a simple flow chart from section headings
          const headings = content.match(/#{1,3}\s+(.+)$/gm) || [];
          if (headings.length > 0) {
            const nodes = headings.map((heading, index) => {
              const title = heading.replace(/#{1,3}\s+/, '').trim();
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
              data: { nodes, edges },
              config: {
                className: 'h-[400px]',
              },
              id: 'basic-flow-chart',
            };
          }
          
          // If no headings, create placeholder flow steps from the section title
          const titleMatch = content.match(/^(#+)\s+(.+)$/m);
          const title = titleMatch ? titleMatch[2] : 'Process';
          
          return {
            type: 'flow',
            data: {
              nodes: [
                { id: 'node-1', type: 'default', data: { label: `Start: ${title}` }, position: { x: 100, y: 100 } },
                { id: 'node-2', type: 'default', data: { label: 'Process' }, position: { x: 100, y: 200 } },
                { id: 'node-3', type: 'default', data: { label: 'Complete' }, position: { x: 100, y: 300 } }
              ],
              edges: [
                { id: 'edge-1', source: 'node-1', target: 'node-2', type: 'smoothstep', animated: true },
                { id: 'edge-2', source: 'node-2', target: 'node-3', type: 'smoothstep', animated: true }
              ]
            },
            config: {
              className: 'h-[400px]',
            },
            id: 'placeholder-flow-chart',
          };
          
        case 'bar':
        case 'line':
        case 'pie':
          // For data charts, create placeholder data if nothing was extracted
          const placeholderData = createPlaceholderData(content, 5);
          
          if (chartType === 'bar') {
            return {
              type: 'bar',
              data: placeholderData,
              config: {
                xAxisDataKey: 'name',
                bars: [{ dataKey: 'value', fill: '#8884d8' }],
                height: 300
              },
              id: 'placeholder-bar-chart'
            };
          } else if (chartType === 'line') {
            return {
              type: 'line',
              data: placeholderData,
              config: {
                xAxisDataKey: 'name',
                lines: [{ dataKey: 'value', stroke: '#8884d8' }],
                height: 300
              },
              id: 'placeholder-line-chart'
            };
          } else {
            return {
              type: 'pie',
              data: placeholderData,
              config: {
                dataKey: 'value',
                nameKey: 'name',
                height: 300
              },
              id: 'placeholder-pie-chart'
            };
          }
      }
    } else {
      // Use the extracted items to create a chart of the requested type
      if (chartType === 'flow') {
        const nodes = extractedItems.map((item, index) => ({
          id: `node-${index}`,
          type: 'default',
          data: { label: item.name },
          position: { x: 100, y: 100 + index * 100 },
        })) as Node[];
        
        const edges = nodes.slice(0, -1).map((_, index) => ({
          id: `edge-${index}`,
          source: `node-${index}`,
          target: `node-${index + 1}`,
          type: 'smoothstep',
          animated: true,
        })) as Edge[];
        
        return {
          type: 'flow',
          data: { nodes, edges },
          config: {
            className: 'h-[400px]',
          },
          id: 'extracted-flow-chart',
        };
      } else if (chartType === 'bar') {
        return {
          type: 'bar',
          data: extractedItems,
          config: {
            xAxisDataKey: 'name',
            bars: [{ dataKey: 'value', fill: '#8884d8' }],
            height: 300
          },
          id: 'extracted-bar-chart'
        };
      } else if (chartType === 'line') {
        return {
          type: 'line',
          data: extractedItems,
          config: {
            xAxisDataKey: 'name',
            lines: [{ dataKey: 'value', stroke: '#8884d8' }],
            height: 300
          },
          id: 'extracted-line-chart'
        };
      } else {
        return {
          type: 'pie',
          data: extractedItems,
          config: {
            dataKey: 'value',
            nameKey: 'name',
            height: 300
          },
          id: 'extracted-pie-chart'
        };
      }
    }
    
    return null;
  };
  
  // Generate a chart based on a specific recommended type
  const generateChartForType = (content: string, chartType: ChartType): ChartData | null => {
    // First try to detect a chart from content patterns
    const detectedChart = detectChartDataFromContent(content);
    if (detectedChart) {
      // If the detected chart type matches the recommended type, use it
      if (detectedChart.type === chartType) {
        return detectedChart;
      }
      
      // Otherwise, try to adapt the data to the recommended chart type
      const adaptedChart = adaptChartData(detectedChart, chartType);
      if (adaptedChart) {
        return adaptedChart;
      }
    }
    
    // If no chart could be detected or adapted, create a basic one based on the recommendation
    return createBasicChartOfType(content, chartType);
  };
  
  // Split markdown into sections on first render
  useMemo(async () => {
    if (!markdown) return;
    
    setLoading(true);
    try {
      // Create AbortController with a longer timeout (60 seconds instead of default)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch('/api/markdown-splitter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdown }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if request completes
      
      if (!response.ok) {
        throw new Error('Failed to split markdown');
      }
      
      const data = await response.json();
      
      if (data.sections) {
        // Check if API returned content+chartType structure
        if (data.sections[0] && 'content' in data.sections[0]) {
          setSections(data.sections);
        } else {
          // Legacy format - convert string array to SectionWithChartType
          const convertedSections = data.sections.map((content: string) => ({
            content,
            chartType: 'bar' as ChartType
          }));
          setSections(convertedSections);
        }
      } else {
        setSections([{ content: markdown, chartType: 'bar' }]);
      }
    } catch (error) {
      console.error('Error splitting markdown:', error);
      setSections([{ content: markdown, chartType: 'bar' }]);
    } finally {
      setLoading(false);
    }
  }, [markdown]);

  const getCurrentSectionCharts = useMemo(() => {
    if (!sections.length) return [];
    
    const currentSection = sections[currentSectionIndex];
    if (!currentSection) return [];
    
    const content = currentSection.content;
    const recommendedChartType = currentSection.chartType || 'bar';
    
    const chartData: ChartData[] = [];

    // Regular expression to match chart code blocks
    // Format: ```chart-<type>\n<JSON data>\n```
    const chartRegex = /```chart-(\w+)\n([\s\S]+?)\n```/g;
    let match;

    while ((match = chartRegex.exec(content)) !== null) {
      try {
        const chartType = match[1] as ChartType;
        const chartContent = match[2];
        const chartJson = JSON.parse(chartContent);
        
        chartData.push({
          type: chartType,
          data: chartJson.data || [],
          config: chartJson.config || {},
          id: `chart-${chartData.length}`,
        });
      } catch (error) {
        console.error('Error parsing chart data:', error);
      }
    }

    // If no charts found, create one based on the recommended chart type
    if (chartData.length === 0) {
      // Always make sure we have a valid chart type
      const safeChartType = ensureChartType(recommendedChartType);
      const dynamicChart = generateChartForType(content, safeChartType);
      if (dynamicChart) {
        chartData.push(dynamicChart);
      } else {
        // If no chart could be generated, provide a default bar chart
        chartData.push({
          type: 'bar',
          data: [
            { name: 'Item 1', value: 40 },
            { name: 'Item 2', value: 60 },
            { name: 'Item 3', value: 30 },
            { name: 'Item 4', value: 70 },
            { name: 'Item 5', value: 50 }
          ],
          config: {
            xAxisDataKey: 'name',
            bars: [{ dataKey: 'value', fill: '#8884d8' }],
            height: 300
          },
          id: 'default-bar-chart'
        });
      }
    }

    return chartData;
  }, [sections, currentSectionIndex]);

  const navigateToPrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  };

  const navigateToNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="text-sm text-gray-500">Preparing slides and visualizations...</p>
      </div>
    );
  }

  // Display message if no sections found
  if (!sections.length) {
    return (
      <div className="flex flex-col items-center justify-center h-40 space-y-3 text-gray-500">
        <PresentationIcon className="h-10 w-10" />
        <p>No content available for slides</p>
      </div>
    );
  }

  const currentSection = sections[currentSectionIndex];
  if (!currentSection) return null;
  
  // Extract title from the current section (first heading)
  const titleMatch = currentSection.content.match(/^(#+)\s+(.+)$/m);
  const title = titleMatch ? titleMatch[2] : `Slide ${currentSectionIndex + 1}`;
  
  // Remove chart code blocks from content for display
  const contentWithoutCharts = currentSection.content.replace(/```chart-(\w+)\n([\s\S]+?)\n```/g, '');
  
  // Check if there are any charts for the current section
  const hasCharts = getCurrentSectionCharts.length > 0;
  
  // Get the recommended chart type for this section
  const recommendedChartType = currentSection.chartType || 'bar';

  // Add a SafeChartRenderer component to handle errors
  const SafeChartRenderer = ({ chart }) => {
    const [hasError, setHasError] = useState(false);
    const [errorType, setErrorType] = useState<string | null>(null);

    // Fallback chart data
    const fallbackData = useMemo(() => {
      // Create simple fallback data
      return [
        { name: "Item 1", value: 75 },
        { name: "Item 2", value: 55 },
        { name: "Item 3", value: 65 },
        { name: "Item 4", value: 85 },
        { name: "Item 5", value: 60 }
      ];
    }, []);

    // If there was an error rendering, show a fallback UI
    if (hasError) {
      return (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-amber-50 text-amber-800">
            <p className="font-medium">Unable to render {errorType || chart.type} chart</p>
            <p className="text-sm mt-1">Showing fallback chart instead.</p>
          </div>
          
          {/* Render fallback bar chart */}
          <div className="border rounded p-4 bg-white">
            <BarChart
              data={fallbackData}
              xAxisDataKey="name"
              bars={[{ dataKey: "value", fill: "#8884d8" }]}
              height={300}
            />
          </div>
        </div>
      );
    }

    try {
      // Render the appropriate chart based on type with safety checks
      switch (chart.type) {
        case 'bar':
          // Verify chart data has required structure
          if (!Array.isArray(chart.data) || chart.data.length === 0) {
            throw new Error('Bar chart data is not an array or is empty');
          }
          return (
            <BarChart
              data={chart.data}
              xAxisDataKey={chart.config?.xAxisDataKey || 'name'}
              bars={chart.config?.bars || [{ dataKey: 'value', fill: '#8884d8' }]}
              height={chart.config?.height || 300}
            />
          );
        
        case 'pie':
          // Verify chart data has required structure
          if (!Array.isArray(chart.data) || chart.data.length === 0) {
            throw new Error('Pie chart data is not an array or is empty');
          }
          return (
            <PieChart
              data={chart.data}
              height={chart.config?.height || 300}
              dataKey={chart.config?.dataKey || 'value'}
              nameKey={chart.config?.nameKey || 'name'}
              colors={chart.config?.colors}
            />
          );
        
        case 'line':
          // Verify chart data has required structure
          if (!Array.isArray(chart.data) || chart.data.length === 0) {
            throw new Error('Line chart data is not an array or is empty');
          }
          return (
            <LineChart
              data={chart.data}
              xAxisDataKey={chart.config?.xAxisDataKey || 'name'}
              lines={chart.config?.lines || [{ dataKey: 'value', stroke: '#8884d8' }]}
              height={chart.config?.height || 300}
            />
          );
        
        case 'flow':
          try {
            // Make sure nodes and edges are properly formatted arrays
            const initialNodes = Array.isArray(chart.data?.nodes) ? chart.data.nodes : [];
            const initialEdges = Array.isArray(chart.data?.edges) ? chart.data.edges : [];
            
            // If no nodes, throw error to use fallback
            if (initialNodes.length === 0) {
              throw new Error('No nodes found for flow chart');
            }
            
            return (
              <FlowChart
                initialNodes={initialNodes}
                initialEdges={initialEdges}
                className={chart.config?.className}
              />
            );
          } catch (flowError) {
            console.error('Flow chart error:', flowError);
            setErrorType('flow');
            throw flowError; // Re-throw to trigger the fallback
          }
        
        default:
          // Default to bar chart for unknown types
          setErrorType(chart.type);
          throw new Error(`Unsupported chart type: ${chart.type}`);
      }
    } catch (error) {
      console.error('Error rendering chart:', error);
      setHasError(true);
      return null;
    }
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Navigation controls */}
      <div className="flex justify-between items-center mb-4 border-b pb-3">
        <Button 
          variant="outline" 
          onClick={navigateToPrevSection}
          disabled={currentSectionIndex === 0}
          size="sm"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
        </Button>
        
        <div className="text-sm font-medium">
          Slide {currentSectionIndex + 1} of {sections.length}
        </div>
        
        <Button 
          variant="outline" 
          onClick={navigateToNextSection}
          disabled={currentSectionIndex >= sections.length - 1}
          size="sm"
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      {/* Section title */}
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      
      {/* Section content */}
      <div className="prose dark:prose-invert mb-6 max-w-none">
        {contentWithoutCharts}
      </div>
      
      {/* Charts */}
      <div className="space-y-8">
        {hasCharts ? (
          getCurrentSectionCharts.map((chart) => (
            <div key={chart.id} className="border rounded-lg shadow-sm p-4 bg-white">
              <div className="mb-3 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Recommended chart type: <span className="font-medium">{recommendedChartType}</span>
                </p>
                {chart.id.includes('placeholder') && (
                  <p className="text-xs text-amber-600">* Using placeholder data for visualization</p>
                )}
              </div>
              
              <SafeChartRenderer chart={chart} />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-dashed text-gray-500">
            <ChartBarIcon className="h-8 w-8 mb-2" />
            <p className="mb-1">No charts available for this section</p>
            <p className="text-xs">Automatic chart generation will happen when appropriate data is detected</p>
          </div>
        )}
      </div>
    </div>
  );
}