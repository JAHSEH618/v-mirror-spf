import { useMemo, useState } from "react";
import { useLanguage } from "../LanguageContext";

export function UsageChart({ usageTrend }) {
    const { t } = useLanguage();
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const chartHeight = 200;
    const chartWidth = 1200;

    const maxTryOns = useMemo(() => Math.max(...usageTrend.map(d => d.tryOns), 1), [usageTrend]);

    const points = useMemo(() => usageTrend.map((d, i) => {
        const x = (i / (usageTrend.length - 1)) * chartWidth;
        const y = chartHeight - (d.tryOns / maxTryOns) * (chartHeight - 20);
        return `${x},${y}`;
    }).join(' L'), [usageTrend, maxTryOns]);

    const linePath = `M${points}`;
    const areaPath = `M0,${chartHeight} L${points} L${chartWidth},${chartHeight} Z`;

    return (
        <div className="trend-chart-container" style={{ position: 'relative', height: '230px' }} onMouseLeave={() => setHoveredIndex(null)}>
            <svg className="trend-chart" viewBox={`0 0 ${chartWidth} ${chartHeight + 30}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary-color)" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="var(--primary-color)" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {[0, 50, 100, 150, 200].map(y => (
                    <line key={y} x1="0" y1={y} x2={chartWidth} y2={y} className="grid-line" />
                ))}
                <path d={areaPath} fill="url(#chartGradient)" className="chart-area-path" />
                <path d={linePath} className="chart-line-path" />
            </svg>

            <div
                style={{ position: 'absolute', inset: 0, zIndex: 10, cursor: 'crosshair' }}
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const width = rect.width;
                    const count = usageTrend.length;
                    if (count < 2) return;
                    const index = Math.round((x / width) * (count - 1));
                    const safeIndex = Math.max(0, Math.min(count - 1, index));
                    setHoveredIndex(safeIndex);
                }}
            >
                {hoveredIndex !== null && usageTrend[hoveredIndex] && (() => {
                    const d = usageTrend[hoveredIndex];
                    const i = hoveredIndex;
                    const count = usageTrend.length;
                    const xPct = (i / (count - 1)) * 100;
                    const valRatio = (d.tryOns / maxTryOns);
                    const bottomPx = 30 + (valRatio * 180);
                    const bottomPct = (bottomPx / 230) * 100;

                    return (
                        <>
                            <div style={{
                                position: 'absolute',
                                left: `${xPct}%`,
                                bottom: '30px',
                                top: 0,
                                width: '1px',
                                borderRight: '1px dashed #9ca3af',
                                transform: 'translateX(-50%)',
                                pointerEvents: 'none'
                            }} />
                            <div style={{
                                position: 'absolute',
                                left: `${xPct}%`,
                                bottom: `${bottomPct}%`,
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#8b5cf6',
                                border: '2px solid white',
                                zIndex: 20,
                                transform: 'translate(-50%, 50%)',
                                pointerEvents: 'none'
                            }} />
                            <div style={{
                                position: 'absolute',
                                left: `${xPct}%`,
                                bottom: `${bottomPct + 5}%`,
                                transform: 'translateX(-50%)',
                                background: '#1f2937',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                zIndex: 30
                            }}>
                                <div style={{ fontSize: '10px', opacity: 0.8 }}>{d.date}</div>
                                <div>{d.tryOns} {t('dashboard.trend.tryOnsLabel')}</div>
                            </div>
                        </>
                    );
                })()}
            </div>

            <div className="chart-x-labels" style={{ position: 'absolute', bottom: 0, width: '100%', height: '30px', pointerEvents: 'none' }}>
                {usageTrend.map((d, i) => {
                    const totalPoints = usageTrend.length;
                    const showLabel = (totalPoints <= 7) || (totalPoints > 7 && totalPoints <= 24 && i % 4 === 0) || (totalPoints > 24 && i % 5 === 0);
                    if (showLabel) {
                        const xPct = (i / (totalPoints - 1)) * 100;
                        return (
                            <div key={i} style={{
                                position: 'absolute',
                                left: `${xPct}%`,
                                transform: 'translateX(-50%)',
                                bottom: '2px',
                                fontSize: '10px',
                                color: '#9ca3af'
                            }}>{d.date.split('-')[2] || d.date}</div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
}
