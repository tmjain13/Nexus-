import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Sparkles, Calendar, Zap, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface HeatmapDataItem {
  day: number; // 0: Sunday, 1: Monday, etc.
  hour: number; // 0-23
  value: number; // activity level (0-100)
}

export function WeeklyHeatmap() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: string; value: number } | null>(null);
  const [data, setData] = useState<HeatmapDataItem[]>([]);
  const [totalInteractions, setTotalInteractions] = useState(0);

  // Generate mock realistic weekly interaction level data
  const generateMockData = () => {
    const newData: HeatmapDataItem[] = [];
    let sum = 0;
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        // Base low traffic
        let base = Math.floor(Math.random() * 15);
        
        // Commute/Morning peaks (8 AM - 10 AM)
        if (hour >= 8 && hour <= 10) {
          base += Math.floor(Math.random() * 45) + 30;
        }
        // Afternoon work peak (2 PM - 5 PM)
        if (hour >= 14 && hour <= 17) {
          base += Math.floor(Math.random() * 55) + 40;
        }
        // Late night winddown peak on weekdays
        if (hour >= 20 && hour <= 22 && day >= 1 && day <= 5) {
          base += Math.floor(Math.random() * 30) + 15;
        }
        // Weekend general mid-day traffic
        if ((day === 0 || day === 6) && hour >= 10 && hour <= 18) {
          base += Math.floor(Math.random() * 35) + 10;
        }
        
        const val = Math.min(100, Math.max(0, base));
        newData.push({ day, hour, value: val });
        sum += val;
      }
    }
    setData(newData);
    setTotalInteractions(sum);
  };

  useEffect(() => {
    generateMockData();
  }, []);

  useEffect(() => {
    if (data.length === 0 || !svgRef.current) return;

    // Clear previous drawing
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 35, right: 15, bottom: 35, left: 45 };
    const width = 640 - margin.left - margin.right;
    const height = 240 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => `${i}h`);

    // Build Scales
    const xScale = d3.scaleBand()
      .range([0, width])
      .domain(hours)
      .padding(0.08);

    const yScale = d3.scaleBand()
      .range([0, height])
      .domain(days)
      .padding(0.08);

    // Dynamic color scale mapped to our wa-primary / emerald activity theme
    const colorScale = d3.scaleLinear<string>()
      .range(['rgba(244, 244, 245, 0.45)', '#059669']) // Zinc-100 to Emerald-600
      .domain([0, 100]);

    // X-Axis
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).tickSize(0).tickValues(hours.filter((_, i) => i % 2 === 0)))
      .select('.domain').remove();

    svg.selectAll('text')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '8px')
      .style('fill', '#71717a');

    // Y-Axis
    svg.append('g')
      .call(d3.axisLeft(yScale).tickSize(0))
      .select('.domain').remove();

    svg.selectAll('.tick text')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '9px')
      .style('font-weight', '600')
      .style('fill', '#3f3f46');

    // Heatmap Cells
    svg.selectAll()
      .data(data, (d: any) => `${d.day}:${d.hour}`)
      .enter()
      .append('rect')
      .attr('x', (d) => xScale(`${d.hour}h`) || 0)
      .attr('y', (d) => yScale(days[d.day]) || 0)
      .attr('rx', 3)
      .attr('ry', 3)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('fill', (d) => colorScale(d.value))
      .style('cursor', 'pointer')
      .style('stroke', 'transparent')
      .style('stroke-width', '1px')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .style('stroke', '#10b981')
          .style('stroke-width', '1.5px');
        
        setHoveredCell({
          day: days[d.day],
          hour: `${d.hour}:00`,
          value: d.value
        });
      })
      .on('mouseleave', function () {
        d3.select(this)
          .style('stroke', 'transparent')
          .style('stroke-width', '1px');
        setHoveredCell(null);
      });

  }, [data]);

  return (
    <div ref={containerRef} className="bg-white dark:bg-[#060814] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 relative shadow-sm text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <Sparkles size={10} className="animate-pulse text-amber-500" /> Interaction Heatmap
          </span>
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider font-mono mt-0.5">
            Weekly Peak Communication Flow
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateMockData}
            className="p-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-500 dark:text-zinc-400 rounded-lg transition-all flex items-center gap-1 text-[9px] font-mono uppercase font-bold cursor-pointer"
            style={{ border: 'none' }}
          >
            <RefreshCw size={10} />
            Refresh Log
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative bg-zinc-50/50 dark:bg-zinc-950/30 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-900">
        <svg ref={svgRef} className="w-full h-auto max-h-[220px]" />

        {/* Hover Tooltip display */}
        <div className="absolute top-2.5 right-2.5 pointer-events-none transition-all duration-150">
          {hoveredCell ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-2 px-3 text-left shadow-lg flex items-center gap-2">
              <Zap size={11} className="text-emerald-400 animate-pulse" />
              <div>
                <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider">
                  {hoveredCell.day} @ {hoveredCell.hour}
                </p>
                <p className="text-[10px] font-bold text-white">
                  {hoveredCell.value} interactions/hr
                </p>
              </div>
            </div>
          ) : (
            <div className="text-[8px] font-mono text-zinc-400 dark:text-zinc-500 flex items-center gap-1 p-1 bg-zinc-100/50 dark:bg-zinc-900/50 rounded-lg px-2 border border-zinc-200/20">
              <Calendar size={10} />
              Hover matrix for peak metrics
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-900 flex flex-col gap-0.5">
          <span className="text-[8px] font-mono uppercase text-zinc-400">Total communication load</span>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">{(totalInteractions * 3.5).toLocaleString(undefined, { maximumFractionDigits: 0 })} ops</span>
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-900 flex flex-col gap-0.5">
          <span className="text-[8px] font-mono uppercase text-zinc-400">Optimum Peak window</span>
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">14:00 - 17:00</span>
        </div>
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-900 flex flex-col gap-0.5 col-span-2 sm:col-span-1">
          <span className="text-[8px] font-mono uppercase text-zinc-400">Activity coefficient</span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">0.82 Stable</span>
        </div>
      </div>
    </div>
  );
}
