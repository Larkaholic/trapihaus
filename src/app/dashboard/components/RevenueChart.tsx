"use client";

import { useState } from "react";

interface RevenueChartProps {
  data?: Array<{ label: string; value: number }>;
  period?: "3months" | "6months" | "year";
  onPeriodChange?: (period: "3months" | "6months" | "year") => void;
}

export default function RevenueChart({ data, period = "3months", onPeriodChange }: RevenueChartProps) {

  // Get last 3 months dynamically
  const getLastThreeMonths = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const currentMonth = now.getMonth();
    const result = [];
    
    for (let i = 2; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      result.push(months[monthIndex]);
    }
    
    return result;
  };

  const lastThreeMonths = getLastThreeMonths();
  const hasData = Array.isArray(data) && data.length > 0;
  
  // Mock data for demonstration when no data is provided
  const mockData = lastThreeMonths.map((label, index) => ({
    label,
    value: [28500, 42300, 35600][index] || 0
  }));
  
  const safeData = hasData ? data! : mockData;
  
  // Calculate total revenue
  const totalRevenue = safeData.reduce((sum, d) => sum + d.value, 0);
  
  // Calculate dynamic max scale
  const maxValue = Math.max(...safeData.map((d) => d.value));
  const max = Math.ceil(maxValue / 10000) * 10000 || 50000; // Round up to nearest 10k
  
  // Generate scale labels dynamically
  const generateScaleLabels = (maxVal: number) => {
    const step = maxVal / 5;
    return Array.from({ length: 6 }, (_, i) => {
      const value = maxVal - (step * i);
      if (value >= 1000) {
        return `₱${(value / 1000).toFixed(0)}k`;
      }
      return `₱${value}`;
    });
  };

  const scaleLabels = generateScaleLabels(max);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-lexend font-semibold text-[#1F2937]">Total Revenue</h3>
          <p className="text-sm text-[#6B7280]">
            {period === "3months" ? "For the last 3 months" : period === "6months" ? "For the last 6 months" : "For the last year"}
          </p>
          <div className="mt-2">
            <p className="text-2xl font-bold text-[#1078CF]">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-[#10B981] mt-1">
              {hasData ? "Based on completed bookings" : "Sample data"}
            </p>
          </div>
        </div>
        
        {/* Period selector */}
        <div className="flex gap-2 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => onPeriodChange?.("3months")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              period === "3months"
                ? "bg-white text-[#1078CF] font-semibold shadow-sm"
                : "text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            3M
          </button>
          <button
            onClick={() => onPeriodChange?.("6months")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              period === "6months"
                ? "bg-white text-[#1078CF] font-semibold shadow-sm"
                : "text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            6M
          </button>
          <button
            onClick={() => onPeriodChange?.("year")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              period === "year"
                ? "bg-white text-[#1078CF] font-semibold shadow-sm"
                : "text-[#6B7280] hover:text-[#1F2937]"
            }`}
          >
            1Y
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Y-axis scale on the left */}
        <div className="flex flex-col justify-between h-64 py-2">
          {scaleLabels.map((label) => (
            <div key={label} className="text-xs text-[#6B7280] font-lexend">
              {label}
            </div>
          ))}
        </div>

        {/* Chart bars */}
        <div className={`flex-1 grid items-end h-64 ${
          period === "3months" ? "grid-cols-3 gap-6" :
          period === "6months" ? "grid-cols-6 gap-3" :
          "grid-cols-12 gap-2"
        }`}>
          {safeData.map((d, index) => {
            const heightPercent = (d.value / max) * 100;
            const isHighest = d.value === maxValue;
            
            // Color scheme: Blue (#1078CF), Green (#83C12C), Orange (#F68109)
            const colors = [
              { base: "#1078CF", gradient: "from-[#1078CF] to-[#3B99E8]", text: "#1078CF" }, // Blue
              { base: "#83C12C", gradient: "from-[#83C12C] to-[#9DD947]", text: "#83C12C" }, // Green
              { base: "#F68109", gradient: "from-[#F68109] to-[#FF9A3D]", text: "#F68109" }, // Orange
            ];
            const color = colors[index % 3];
            
            return (
              <div key={d.label} className="flex flex-col items-center gap-3 w-full group">
                <div className="relative w-full">
                  {/* Hover tooltip */}
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {formatCurrency(d.value)}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                  </div>
                  
                  {/* Bar */}
                  <div
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      isHighest 
                        ? `bg-gradient-to-t ${color.gradient}` 
                        : ""
                    } hover:opacity-80`}
                    style={{ 
                      height: `${Math.max(heightPercent, 5)}%`,
                      minHeight: d.value > 0 ? '20px' : '0',
                      backgroundColor: isHighest ? undefined : color.base
                    }}
                    aria-label={`${d.label} revenue: ${formatCurrency(d.value)}`}
                  >
                    {/* Value label on top of bar for highest value */}
                    {isHighest && d.value > 0 && (
                      <div 
                        className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold"
                        style={{ color: color.text }}
                      >
                        {formatCurrency(d.value)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Month label */}
                <p className="text-sm text-[#6B7280] font-lexend font-medium">{d.label}</p>
                
                {/* Value below month (for mobile) */}
                <p className="text-xs text-[#9CA3AF] font-lexend md:hidden">
                  {formatCurrency(d.value)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-[#6B7280]">Average</p>
          <p className="text-sm font-semibold text-[#1F2937]">
            {formatCurrency(Math.round(totalRevenue / safeData.length))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[#6B7280]">Highest</p>
          <p className="text-sm font-semibold text-[#1F2937]">
            {formatCurrency(maxValue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-[#6B7280]">Lowest</p>
          <p className="text-sm font-semibold text-[#1F2937]">
            {formatCurrency(Math.min(...safeData.map(d => d.value)))}
          </p>
        </div>
      </div>
    </section>
  );
}
