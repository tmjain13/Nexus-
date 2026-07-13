import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';

interface Call {
  id: string;
  createdAt: any;
  duration?: number;
}

interface CallTrendChartProps {
  calls: Call[];
}

export default function CallTrendChart({ calls }: CallTrendChartProps) {
  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }).map((_, i) => subDays(new Date(), i)).reverse();
    
    return last30Days.map(day => {
      const dayCalls = calls.filter(call => {
        const callDate = call.createdAt?.toDate ? call.createdAt.toDate() : new Date(call.createdAt);
        return isSameDay(callDate, day);
      });
      
      return {
        date: format(day, 'MMM d'),
        frequency: dayCalls.length,
        duration: dayCalls.reduce((acc, call) => acc + (call.duration || 0), 0) / 60 // minutes
      };
    });
  }, [calls]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm">
      <h3 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-4">Call Frequency & Duration (30 Days)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" strokeOpacity={0.5} />
            <XAxis dataKey="date" fontSize={10} stroke="#71717a" interval={4} />
            <YAxis yAxisId="left" fontSize={10} stroke="#71717a" />
            <YAxis yAxisId="right" orientation="right" fontSize={10} stroke="#25d366" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '8px', fontSize: '10px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
            <Line yAxisId="left" type="monotone" dataKey="frequency" stroke="#3b82f6" strokeWidth={2} name="Frequency" dot={false} />
            <Line yAxisId="right" type="monotone" dataKey="duration" stroke="#25d366" strokeWidth={2} name="Duration (min)" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
