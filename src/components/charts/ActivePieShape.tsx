"use client";

import React from "react";
import { Sector } from "recharts";
import { useTranslation } from "react-i18next";

export interface ActivePieShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: {
    name?: string;
    vendor_name?: string;
    total_amount?: number;
    amount?: number;
    [key: string]: unknown;
  };
  formatCurrency: (value: number) => string;
  onCenterClick?: () => void;
}

import { useTheme } from "@/components/theme-provider";

export const ActivePieShape: React.FC<ActivePieShapeProps> = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    formatCurrency,
    onCenterClick,
  } = props;
  const { t } = useTranslation();
  const name =
    payload.name ||
    payload.vendor_name ||
    t("analytics.chart.unknown", { defaultValue: "Unknown" });
  const amount = payload.total_amount || payload.amount || 0;
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const textColorName = isDark ? "#94a3b8" : "#475569";
  const textColorAmount = isDark ? "#f8fafc" : "#0f172a";
  const gradientStart = isDark ? "#1e293b" : "#f8fafc";
  const gradientEnd = isDark ? "#0f172a" : "#e2e8f0";
  const strokeColor = isDark ? "#334155" : "#cbd5e1";

  return (
    <g style={{ cursor: "pointer" }}>
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="2" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient
          id="centerGradient"
          cx="50%"
          cy="50%"
          r="50%"
          fx="50%"
          fy="50%"
        >
          <stop offset="0%" stopColor={gradientStart} />
          <stop offset="100%" stopColor={gradientEnd} />
        </radialGradient>
      </defs>

      {/* Main Sector highlight */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        filter="url(#shadow)"
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 15}
        fill={fill}
      />

      {/* Label Text - More prominent */}
      <text
        x={cx}
        y={cy - 20}
        textAnchor="middle"
        fill={textColorName}
        style={{ fontSize: "14px", fontWeight: 600 }}
      >
        {name}
      </text>
      <text
        x={cx}
        y={cy + 15}
        textAnchor="middle"
        fill={textColorAmount}
        style={{ fontSize: "18px", fontWeight: 800 }}
      >
        {formatCurrency(amount)}
      </text>

      {/* Center Button-like element */}
      {onCenterClick && (
        <g
          onClick={(e) => {
            e.stopPropagation();
            onCenterClick();
          }}
          className="group"
        >
          <circle
            cx={cx}
            cy={cy}
            r={innerRadius - 5}
            fill="url(#centerGradient)"
            stroke={strokeColor}
            strokeWidth="1"
            filter="url(#shadow)"
          />
          <text
            x={cx}
            y={cy + 40}
            textAnchor="middle"
            fill="#64748b"
            style={{
              fontSize: "10px",
              fontWeight: 700,
              pointerEvents: "none",
              textTransform: "uppercase",
            }}
          >
            {t("analytics.chart.reset", { defaultValue: "Reset" })}
          </text>
        </g>
      )}
    </g>
  );
};
