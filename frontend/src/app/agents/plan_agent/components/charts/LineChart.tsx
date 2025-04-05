"use client";

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export interface LineChartProps {
  data: Array<Record<string, any>>;
  xAxisDataKey: string;
  lines: Array<{
    dataKey: string;
    stroke: string;
    name?: string;
    strokeWidth?: number;
    dot?: boolean;
  }>;
  className?: string;
  height?: number;
}

export function LineChart({
  data,
  xAxisDataKey,
  lines,
  className = '',
  height = 300
}: LineChartProps) {
  return (
    <div className={`w-full ${className}`} style={{ height: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxisDataKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              name={line.name || line.dataKey}
              strokeWidth={line.strokeWidth || 2}
              dot={line.dot !== undefined ? line.dot : true}
              activeDot={{ r: 8 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
} 