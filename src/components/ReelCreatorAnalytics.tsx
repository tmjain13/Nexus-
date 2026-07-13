import React from 'react';
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, Eye, Heart, Share2, Bookmark, Users, Clock, Award, FileText, ChevronRight, X 
} from 'lucide-react';
import { useReelAnalytics } from '../hooks/useReelAnalytics';

interface ReelCreatorAnalyticsProps {
  onClose: () => void;
}

export const ReelCreatorAnalytics: React.FC<ReelCreatorAnalyticsProps> = ({ onClose }) => {
  const { stats, insights, export: exportData, loading } = useReelAnalytics();

  if (loading || !stats || !insights) {
    return (
      <div className="fixed inset-0 bg-zinc-950 text-white z-50 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-zinc-400">Loading Creator Analytics Protocol...</p>
      </div>
    );
  }

  // Demographics data formatting
  const genderData = [
    { name: 'Female', value: stats.demographics.gender[0] || 62, color: '#f59e0b' },
    { name: 'Male', value: stats.demographics.gender[1] || 35, color: '#d97706' },
    { name: 'Non-binary', value: stats.demographics.gender[2] || 3, color: '#4b5563' }
  ];

  return (
    <div id="reel_analytics_dashboard" className="fixed inset-0 bg-zinc-950 text-white z-50 flex flex-col select-none overflow-y-auto pb-8 scrollbar-none">
      
      {/* Fixed Sticky Header */}
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-md z-10 flex items-center justify-between p-4 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Award className="text-amber-500" size={20} />
          <div>
            <h2 className="font-bold text-sm">Enclave Creator Studio</h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Performance Node: ACTIVE</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={exportData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[11px] font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
          >
            <FileText size={12} className="text-amber-500" />
            Export JSON
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        
        {/* Core Stats Overview */}
        <div className="grid grid-cols-2 gap-3">
          
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400">Total Views</span>
              <Eye size={14} className="text-amber-500" />
            </div>
            <p className="text-lg font-bold mt-1.5">{stats.views.toLocaleString()}</p>
            <p className="text-[9px] text-emerald-500 font-semibold mt-0.5">↑ 14.2% this week</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400">Avg Watch Time</span>
              <Clock size={14} className="text-amber-500" />
            </div>
            <p className="text-lg font-bold mt-1.5">{insights.averageWatchTime}</p>
            <p className="text-[9px] text-emerald-500 font-semibold mt-0.5">↑ 4.2% vs average</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400">Video Engagements</span>
              <Heart size={14} className="text-rose-500" />
            </div>
            <p className="text-lg font-bold mt-1.5">{(stats.likes + stats.shares + stats.saves).toLocaleString()}</p>
            <p className="text-[9px] text-emerald-500 font-semibold mt-0.5">↑ 22.8% engagement</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400">Follower Gain</span>
              <Users size={14} className="text-amber-500" />
            </div>
            <p className="text-lg font-bold mt-1.5">+{stats.followerGain}</p>
            <p className="text-[9px] text-zinc-500 mt-0.5">Durable audience</p>
          </div>

        </div>

        {/* Engagement Trend Chart */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-zinc-200">Reels Engagement Timeline</h3>
              <p className="text-[10px] text-zinc-500">Hourly & daily watch/like traffic trends</p>
            </div>
            <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-bold border border-amber-500/20 flex items-center gap-1">
              <TrendingUp size={10} />
              REAL-TIME
            </span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={insights.timelineData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#52525b" fontSize={9} />
                <YAxis stroke="#52525b" fontSize={9} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                <Area type="monotone" dataKey="views" stroke="#f59e0b" fillOpacity={1} fill="url(#viewsGradient)" strokeWidth={2} name="Views" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Highlights */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl space-y-3.5">
          <h3 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
            💡 Enclave Optimization Insights
          </h3>
          
          <div className="flex gap-3 items-start">
            <span className="text-lg">🕒</span>
            <div>
              <p className="text-[11px] font-bold text-zinc-200">Optimal Publishing Window</p>
              <p className="text-[10px] text-amber-500 mt-0.5 font-semibold">{insights.bestPostingTime}</p>
              <p className="text-[9px] text-zinc-500">Posting in this slot increases initial watch time loops by up to 24%</p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-[11px] font-bold text-zinc-200">Top Performing Genre Focus</p>
              <p className="text-[10px] text-amber-500 mt-0.5 font-semibold">{insights.topPerformingType}</p>
              <p className="text-[9px] text-zinc-500">Your audience prefers synthetic and cyberpunk aesthetics</p>
            </div>
          </div>
        </div>

        {/* Audience Demographics */}
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-3xl">
          <h3 className="text-xs font-bold text-zinc-200 mb-3">Audience Demographics</h3>
          
          <div className="grid grid-cols-2 gap-4">
            
            {/* Gender Distribution */}
            <div className="space-y-2 border-r border-zinc-850 pr-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Gender Split</p>
              {genderData.map(gender => (
                <div key={gender.name} className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: gender.color }} />
                    {gender.name}
                  </span>
                  <span className="font-bold text-zinc-200">{gender.value}%</span>
                </div>
              ))}
            </div>

            {/* Top Countries */}
            <div className="space-y-2 pl-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Top Countries</p>
              {stats.demographics.countries.map((country, idx) => (
                <div key={country} className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 truncate max-w-[85px]">{idx + 1}. {country}</span>
                  <span className="font-bold text-amber-500">{(35 - (idx * 6))}%</span>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
export default ReelCreatorAnalytics;
