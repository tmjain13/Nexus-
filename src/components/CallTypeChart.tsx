import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function CallTypeChart({ calls }: { calls: any[] }) {
    const ref = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!ref.current) return;

        const voiceCount = calls.filter(c => c.type === 'voice').length;
        const videoCount = calls.filter(c => c.type === 'video').length;
        
        const data = [
            { type: 'Voice', count: voiceCount },
            { type: 'Video', count: videoCount }
        ];

        const svg = d3.select(ref.current);
        svg.selectAll('*').remove();

        const width = 200;
        const height = 150;
        const margin = { top: 20, right: 30, bottom: 30, left: 40 };

        svg.attr('width', width).attr('height', height);

        const x = d3.scaleBand()
            .domain(data.map(d => d.type))
            .range([margin.left, width - margin.right])
            .padding(0.1);

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count) || 10])
            .range([height - margin.bottom, margin.top]);

        // Bars
        svg.selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', d => x(d.type)!)
            .attr('y', d => y(d.count))
            .attr('width', x.bandwidth())
            .attr('height', d => height - margin.bottom - y(d.count))
            .attr('fill', d => d.type === 'Voice' ? '#25d366' : '#18181b');

        // Axis
        svg.append('g')
            .attr('transform', `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x));

        svg.append('g')
            .attr('transform', `translate(${margin.left},0)`)
            .call(d3.axisLeft(y).ticks(5));

    }, [calls]);

    return <svg ref={ref} className="w-full h-full" />;
}
