import { X, Check, Star, Zap, Shield } from "lucide-react";
import { useLanguage } from "./LanguageContext";

// Inline Styles - Using CSS variables for theme support
const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
    },
    modal: {
        backgroundColor: 'var(--white)',
        borderRadius: '16px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '90vh',
        boxShadow: 'var(--shadow-md)',
        zIndex: 9999,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
    },
    header: {
        textAlign: 'center',
        padding: '32px 32px 16px',
        position: 'relative'
    },
    title: {
        fontSize: '24px',
        fontWeight: 700,
        color: 'var(--text-main)',
        marginBottom: '8px'
    },
    subtitle: {
        color: 'var(--text-secondary)',
        fontSize: '16px'
    },
    closeBtn: {
        position: 'absolute',
        top: '24px',
        right: '24px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        opacity: 0.7,
        transition: 'opacity 0.2s'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        padding: '32px',
        overflowY: 'auto'
    },
    card: {
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'var(--white)',
        transition: 'all 0.2s'
    },
    cardFeatured: {
        border: '2px solid var(--primary-color)',
        boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.2)'
    },
    badge: {
        position: 'absolute',
        top: '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--primary-color)',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '99px',
        fontSize: '12px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
    },
    planName: {
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--text-main)',
        marginBottom: '8px'
    },
    price: {
        fontSize: '36px',
        fontWeight: 700,
        color: 'var(--text-main)',
        marginBottom: '4px'
    },
    period: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        fontWeight: 400
    },
    desc: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        marginBottom: '24px',
        minHeight: '40px'
    },
    features: {
        listStyle: 'none',
        padding: 0,
        margin: '0 0 24px',
        flex: 1
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        color: 'var(--text-main)',
        marginBottom: '12px'
    },
    button: {
        width: '100%',
        padding: '12px',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s'
    },
    btnPrimary: {
        backgroundColor: 'var(--primary-color)',
        color: 'white',
    },
    btnOutline: {
        backgroundColor: 'var(--white)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-main)'
    },
    btnCurrent: {
        backgroundColor: 'var(--g-100)',
        color: 'var(--g-400)',
        cursor: 'default'
    }
};

export const UpgradePlanModal = ({ isOpen, onClose, currentPlanName, onUpgrade }) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const plans = [
        {
            id: "free",
            name: t('subscription.plans.free.name'),
            price: "$0",
            priceNum: 0,
            desc: t('subscription.plans.free.desc'),
            features: [
                t('subscription.plans.free.features.tryOns'),
                t('subscription.plans.free.features.speed'),
                t('subscription.plans.free.features.support'),
                t('subscription.plans.free.features.catalog')
            ],
            icon: <Star size={24} style={{ color: 'var(--text-secondary)' }} />
        },
        {
            id: "professional",
            name: t('subscription.plans.professional.name'),
            price: "$49",
            priceNum: 49,
            desc: t('subscription.plans.professional.desc'),
            features: [
                t('subscription.plans.professional.features.tryOns'),
                t('subscription.plans.professional.features.processing'),
                t('subscription.plans.professional.features.support'),
                t('subscription.plans.professional.features.analytics'),
                t('subscription.plans.professional.features.branding')
            ],
            featured: true,
            icon: <Zap size={24} style={{ color: 'var(--primary-color)' }} />
        },
        {
            id: "enterprise",
            name: t('subscription.plans.enterprise.name'),
            price: "$199",
            priceNum: 199,
            desc: t('subscription.plans.enterprise.desc'),
            features: [
                t('subscription.plans.enterprise.features.api'),
                t('subscription.plans.enterprise.features.support'),
                t('subscription.plans.enterprise.features.integration'),
                t('subscription.plans.enterprise.features.sla'),
                t('subscription.plans.enterprise.features.manager')
            ],
            icon: <Shield size={24} style={{ color: 'var(--text-main)' }} />
        }
    ];

    // Helper to find current price index
    // Treat "Free Plan" (backend) same as "Free Trial" (frontend)
    const normalizedCurrentName = currentPlanName === "Free Plan" ? t('subscription.plans.free.name') : currentPlanName;
    const currentPlanObj = plans.find(p => p.name === normalizedCurrentName) || plans[0];
    const currentPrice = currentPlanObj.priceNum;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>

                <button style={styles.closeBtn} onClick={onClose} onMouseEnter={e => e.target.style.opacity = '1'} onMouseLeave={e => e.target.style.opacity = '0.7'}>
                    <X size={24} />
                </button>

                <div style={styles.header}>
                    <h2 style={styles.title}>{t('subscription.title')}</h2>
                    <p style={styles.subtitle}>{t('subscription.subtitle')}</p>
                </div>

                <div style={styles.grid}>
                    {plans.map((plan) => {
                        const isCurrent = normalizedCurrentName === plan.name;
                        const isFeatured = plan.featured;

                        let btnText = t('subscription.selectPlan');
                        if (isCurrent) {
                            btnText = t('subscription.currentPlan');
                        } else {
                            if (plan.priceNum > currentPrice) btnText = t('subscription.upgrade');
                            else if (plan.priceNum < currentPrice) btnText = t('subscription.downgrade');
                            else btnText = t('subscription.selectPlan');
                        }

                        return (
                            <div
                                key={plan.id}
                                style={{
                                    ...styles.card,
                                    ...(isFeatured ? styles.cardFeatured : {})
                                }}
                            >
                                {isFeatured && (
                                    <div style={styles.badge}>{t('subscription.mostPopular')}</div>
                                )}

                                <div style={{ marginBottom: '16px' }}>
                                    {plan.icon}
                                </div>

                                <h3 style={styles.planName}>{plan.name}</h3>
                                <div style={styles.price}>
                                    {plan.price}<span style={styles.period}>{t('common.perMonth')}</span>
                                </div>
                                <p style={styles.desc}>{plan.desc}</p>

                                <ul style={styles.features}>
                                    {plan.features.map((f, i) => (
                                        <li key={i} style={styles.featureItem}>
                                            <Check size={16} style={{ color: isFeatured ? 'var(--primary-color)' : 'var(--g-400)', flexShrink: 0 }} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    disabled={isCurrent}
                                    onClick={() => {
                                        if (!isCurrent) {
                                            if (plan.priceNum < currentPrice) {
                                                if (confirm(t('subscription.confirmDowngrade', { plan: plan.name }))) {
                                                    onUpgrade(plan.id);
                                                    onClose();
                                                }
                                            } else {
                                                onUpgrade(plan.id);
                                                onClose();
                                            }
                                        }
                                    }}
                                    style={{
                                        ...styles.button,
                                        ...(isCurrent ? styles.btnCurrent : (isFeatured ? styles.btnPrimary : styles.btnOutline))
                                    }}
                                >
                                    {btnText}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--bg-subtle)', borderTop: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        {t('subscription.footer')}
                    </p>
                </div>

            </div>
        </div>
    );
};

