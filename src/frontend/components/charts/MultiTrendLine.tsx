'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { ScoreHistory } from '@/types/index';

const COLORS = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#dc2626', // red-600
  '#d97706', // amber-600
  '#7c3aed', // violet-600
  '#0891b2', // cyan-600
];

export interface SiteTrend {
  siteId: string;
  name: string;
  data: ScoreHistory[];
}

interface MultiTrendLineProps {
  sites: SiteTrend[];
}

export function MultiTrendLine({ sites }: MultiTrendLineProps) {
  // Collect all unique dates across all sites
  const dateSet = new Set<string>();
  sites.forEach((s) =>
    s.data.forEach((d) =>
      dateSet.add(
        new Date(d.recordedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      ),
    ),
  );
  const sortedDates = Array.from(dateSet).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  // Build merged chart data: [{ date, siteId1: score, siteId2: score, ... }]
  const chartData = sortedDates.map((date) => {
    const entry: Record<string, string | number> = { date };
    sites.forEach((s) => {
      const match = s.data.find(
        (d) =>
          new Date(d.recordedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }) === date,
      );
      if (match !== undefined) {
        entry[s.siteId] = Math.round(match.avgScore);
      }
    });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={chartData}
        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <Legend />
        {sites.map((s, i) => (
          <Line
            key={s.siteId}
            type="monotone"
            dataKey={s.siteId}
            name={s.name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ fill: COLORS[i % COLORS.length], r: 4 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
