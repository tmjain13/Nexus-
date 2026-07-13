import React from 'react';
import { 
  X, BarChart3, TrendingUp, Users, Eye, 
  MessageCircle, DollarSign, Download, Printer, PieChart as PieIcon 
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { useChannelAnalytics } from '../hooks/useChannelAnalytics';

interface ChannelAnalyticsProps {
  channelId: string;
  onClose: () => void;
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export function ChannelAnalytics({ channelId, onClose }: ChannelAnalyticsProps) {
  const { 
    channel, growth, reach, engagement, audience, revenue, loading, exportCSV, exportPDF 
  } = useChannelAnalytics(channelId);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Loading Analytics Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/95 text-zinc-100 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-6xl bg-zinc-950 border border-zinc-900 rounded-[32px] overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-xl flex items-center justify-center">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                Channel Analytics Matrix
              </h2>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                Performance tracking for @{channel?.handle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportPDF}
              className="px-3.5 py-2 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <Printer size={13} />
              <span>Print/PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 progress-scroll text-left">
          {/* Top Quick Stats Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-900/60 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Total Subscribers</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold text-zinc-100">{channel?.subscribers || 0}</span>
                <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-0.5">
                  <TrendingUp size={10} /> +12%
                </span>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-900/60 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Post Reach Rate</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold text-zinc-100">64.5%</span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">Avg Views</span>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-900/60 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Engagement Ratio</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold text-zinc-100">18.2%</span>
                <span className="text-[9px] font-mono text-amber-500 uppercase">Excellent</span>
              </div>
            </div>

            <div className="bg-zinc-900/40 border border-zinc-900/60 p-4 rounded-2xl flex flex-col justify-between">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Est. Monthly Income</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-xl font-bold text-amber-400">
                  ₹{revenue.projected.toLocaleString()}
                </span>
                <span className="text-[9px] font-mono text-zinc-500 uppercase">INR</span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscriber Growth Chart */}
            <div className="bg-zinc-900/20 border border-zinc-900 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-amber-500" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Subscriber Growth (7 days)</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontStyle="mono" />
                    <YAxis stroke="#52525b" fontSize={10} fontStyle="mono" />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                    <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Post Reach / Views Chart */}
            <div className="bg-zinc-900/20 border border-zinc-900 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-emerald-400" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Recent Post Reach (Views)</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reach}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} />
                    <YAxis stroke="#52525b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                    <Bar dataKey="views" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Post Engagement Chart */}
            <div className="bg-zinc-900/20 border border-zinc-900 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <MessageCircle size={14} className="text-blue-500" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Engagement Matrix (Interactions)</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={engagement}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} />
                    <YAxis stroke="#52525b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a' }} />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'mono', textTransform: 'uppercase' }} />
                    <Bar dataKey="reactions" fill="#3b82f6" name="Reactions" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="comments" fill="#f59e0b" name="Comments" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Audience Demographics Chart */}
            <div className="bg-zinc-900/20 border border-zinc-900 p-5 rounded-3xl space-y-4">
              <div className="flex items-center gap-2">
                <PieIcon size={14} className="text-purple-500" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Geographical Distribution (%)</span>
              </div>
              <div className="h-64 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={audience.countries}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {audience.countries.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-left space-y-1.5 shrink-0">
                  {audience.countries.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-xs text-zinc-300 font-sans">{item.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
