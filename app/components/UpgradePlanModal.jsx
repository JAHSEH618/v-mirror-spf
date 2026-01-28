import { useState } from "react";
import { X, Check, Star, Zap, Shield } from "lucide-react";

// Inline Styles
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
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '90vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
        color: '#111827',
        marginBottom: '8px'
    },
    subtitle: {
        color: '#6B7280',
        fontSize: '16px'
    },
    closeBtn: {
        position: 'absolute',
        top: '24px',
        right: '24px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#9CA3AF'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        padding: '32px',
        overflowY: 'auto'
    },
    card: {
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'white',
        transition: 'all 0.2s'
    },
    cardFeatured: {
        border: '2px solid #7C3AED',
        boxShadow: '0 10px 15px -3px rgba(124, 58, 237, 0.1)'
    },
    badge: {
        position: 'absolute',
        top: '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#7C3AED',
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
        color: '#111827',
        marginBottom: '8px'
    },
    price: {
        fontSize: '36px',
        fontWeight: 700,
        color: '#111827',
        marginBottom: '4px'
    },
    period: {
        fontSize: '14px',
        color: '#6B7280',
        fontWeight: 400
    },
    desc: {
        fontSize: '14px',
        color: '#4B5563',
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
        color: '#374151',
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
        transition: 'background-color 0.2s'
    },
    btnPrimary: {
        backgroundColor: '#7C3AED',
        color: 'white',
    },
    btnOutline: {
        backgroundColor: 'white',
        border: '1px solid #D1D5DB',
        color: '#374151'
    },
    btnCurrent: {
        backgroundColor: '#F3F4F6',
        color: '#9CA3AF',
        cursor: 'default'
    }
};

export const UpgradePlanModal = ({ isOpen, onClose, currentPlanName, onUpgrade }) => {
    if (!isOpen) return null;

    const plans = [
        {
            id: "free",
            name: "Free Trial",
            price: "$0",
            priceNum: 0,
            desc: "Perfect for testing the waters and personal use.",
            features: [
                "10 Try-Ons / month",
                "Standard Speed",
                "Community Support",
                "Basic Catalog"
            ],
            icon: <Star size={24} color="#6B7280" />
        },
        {
            id: "professional",
            name: "Professional Plan",
            price: "$49",
            priceNum: 49,
            desc: "For growing businesses that need power and flexibility.",
            features: [
                "Unlimited Try-Ons",
                "High-Priority Processing",
                "Email Support",
                "Advanced Analytics",
                "Custom Branding"
            ],
            featured: true,
            icon: <Zap size={24} color="#7C3AED" />
        },
        {
            id: "enterprise",
            name: "Enterprise",
            price: "$199",
            priceNum: 199,
            desc: "Full-scale solution for high volume merchants.",
            features: [
                "Dedicated API Access",
                "24/7 Phone Support",
                "Custom Integration",
                "SLA Guarantee",
                "Dedicated Success Manager"
            ],
            icon: <Shield size={24} color="#111827" />
        }
    ];

    // Helper to find current price index
    // Treat "Free Plan" (backend) same as "Free Trial" (frontend)
    const normalizedCurrentName = currentPlanName === "Free Plan" ? "Free Trial" : currentPlanName;
    const currentPlanObj = plans.find(p => p.name === normalizedCurrentName) || plans[0];
    const currentPrice = currentPlanObj.priceNum;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>

                <button style={styles.closeBtn} onClick={onClose}>
                    <X size={24} />
                </button>

                <div style={styles.header}>
                    <h2 style={styles.title}>Manage Subscription</h2>
                    <p style={styles.subtitle}>Choose the plan that fits your needs. Upgrade or downgrade anytime.</p>
                </div>

                <div style={styles.grid}>
                    {plans.map((plan) => {
                        const isCurrent = normalizedCurrentName === plan.name;
                        const isFeatured = plan.featured;

                        let btnText = "Select Plan";
                        if (isCurrent) {
                            btnText = "Current Plan";
                        } else {
                            if (plan.priceNum > currentPrice) btnText = "Upgrade";
                            else if (plan.priceNum < currentPrice) btnText = "Downgrade";
                            else btnText = "Select";
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
                                    <div style={styles.badge}>Most Popular</div>
                                )}

                                <div style={{ marginBottom: '16px' }}>
                                    {plan.icon}
                                </div>

                                <h3 style={styles.planName}>{plan.name}</h3>
                                <div style={styles.price}>
                                    {plan.price}<span style={styles.period}>/month</span>
                                </div>
                                <p style={styles.desc}>{plan.desc}</p>

                                <ul style={styles.features}>
                                    {plan.features.map((f, i) => (
                                        <li key={i} style={styles.featureItem}>
                                            <Check size={16} color={isFeatured ? "#7C3AED" : "#9CA3AF"} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    disabled={isCurrent}
                                    onClick={() => {
                                        if (!isCurrent) {
                                            if (plan.priceNum < currentPrice) {
                                                if (confirm(`Are you sure you want to downgrade to ${plan.name}? Benefits will be lost.`)) {
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

                <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB' }}>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                        All plans include a 14-day free trial. Cancel anytime.
                    </p>
                </div>

            </div>
        </div>
    );
};
