import { useMemo, useState } from "react";

export function useDashboardStats(rawUsageStats) {
    const [timeRange, setTimeRange] = useState('weekly');

    const usageTrend = useMemo(() => {
        if (!rawUsageStats || !Array.isArray(rawUsageStats) || rawUsageStats.length === 0) {
            return [];
        }

        const stats = rawUsageStats.map(s => ({ ...s, date: new Date(s.date) }));

        if (timeRange === 'daily') {
            const now = new Date();
            const trend = [];
            for (let i = 23; i >= 0; i--) {
                const d = new Date(now);
                d.setHours(d.getHours() - i);
                d.setMinutes(0, 0, 0);

                const label = d.getHours() + ":00";
                const match = stats.find(s =>
                    s.date.getFullYear() === d.getFullYear() &&
                    s.date.getMonth() === d.getMonth() &&
                    s.date.getDate() === d.getDate() &&
                    s.date.getHours() === d.getHours()
                );
                trend.push({ date: label, tryOns: match ? match.count : 0 });
            }
            return trend;
        } else {
            const rangeDays = timeRange === 'weekly' ? 7 : 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - (rangeDays - 1));
            startDate.setHours(0, 0, 0, 0);

            const dailyMap = new Map();
            stats.filter(s => s.date >= startDate).forEach(stat => {
                const dateStr = stat.date.toISOString().split('T')[0];
                const current = dailyMap.get(dateStr) || 0;
                dailyMap.set(dateStr, current + stat.count);
            });

            const trend = [];
            for (let i = rangeDays - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split('T')[0];
                trend.push({
                    date: dateStr,
                    tryOns: dailyMap.get(dateStr) || 0
                });
            }
            return trend;
        }
    }, [rawUsageStats, timeRange]);

    return {
        timeRange,
        setTimeRange,
        usageTrend
    };
}
