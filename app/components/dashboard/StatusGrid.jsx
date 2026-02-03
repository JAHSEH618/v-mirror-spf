import { useLanguage } from "../LanguageContext";

export function StatusGrid({ quickStats }) {
    const { t } = useLanguage();

    const formatChange = (change) => {
        const pct = (change * 100).toFixed(1);
        return change >= 0 ? `+${pct}%` : `${pct}%`;
    };

    const stats = [
        {
            key: 'totalTryOns',
            label: t('dashboard.stats.totalTryOns'),
            value: quickStats.totalTryOns.value,
            change: quickStats.totalTryOns.change,
            icon: '📊'
        },
        {
            key: 'uniqueVisitors',
            label: t('dashboard.stats.uniqueVisitors'),
            value: quickStats.uniqueVisitors.value,
            change: quickStats.uniqueVisitors.change,
            icon: '👥'
        },
        {
            key: 'conversionRate',
            label: t('dashboard.stats.conversionRate'),
            value: `${(quickStats.conversionRate.value * 100).toFixed(1)}%`,
            change: quickStats.conversionRate.change,
            icon: '🎯'
        },
        {
            key: 'revenueImpact',
            label: t('dashboard.stats.revenueImpact'),
            value: `$${quickStats.revenueImpact.value.toLocaleString()}`,
            change: quickStats.revenueImpact.change,
            icon: '💰'
        }
    ];

    return (
        <div className="quick-stats">
            {stats.map((stat) => (
                <div key={stat.key} className="stat-card">
                    <div className="stat-header">
                        <span className="stat-icon" style={{ fontSize: '20px' }}>{stat.icon}</span>
                        <div className={`stat-change ${stat.change >= 0 ? 'positive' : 'negative'}`}>
                            {stat.change !== undefined && (
                                <>
                                    {stat.change >= 0 ? '↗' : '↘'} {formatChange(stat.change)}
                                </>
                            )}
                        </div>
                    </div>
                    <div className="stat-value">{stat.value}</div>
                    <div className="stat-label">{stat.label}</div>
                </div>
            ))}
        </div>
    );
}
