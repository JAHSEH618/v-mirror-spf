import { useState } from "react";
import { X, AlertTriangle, Gift, Check, ChevronRight } from "lucide-react";
import { useSubmit } from "react-router";
import { useLanguage } from "./LanguageContext";

// Styles - Using CSS variables for theme support
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
        maxWidth: '512px',
        width: '100%',
        boxShadow: 'var(--shadow-md)',
        zIndex: 9999,
        position: 'relative',
        overflow: 'hidden'
    },
    header: {
        padding: '24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: '18px',
        fontWeight: 600,
        color: 'var(--text-main)',
        margin: 0
    },
    content: {
        padding: '24px'
    },
    footer: {
        padding: '24px',
        backgroundColor: 'var(--bg-subtle)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
    },
    radioLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        marginBottom: '8px',
        backgroundColor: 'var(--white)'
    },
    activeRadio: {
        borderColor: 'var(--primary-color)',
        backgroundColor: 'var(--p-100)'
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        marginTop: '12px',
        minHeight: '80px',
        fontSize: '14px',
        backgroundColor: 'var(--white)',
        color: 'var(--text-main)'
    },
    button: {
        padding: '10px 16px',
        borderRadius: '8px',
        fontWeight: 500,
        fontSize: '14px',
        cursor: 'pointer',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s'
    },
    btnSecondary: {
        backgroundColor: 'var(--white)',
        border: '1px solid var(--border-color)',
        color: 'var(--text-main)'
    },
    btnPrimary: {
        backgroundColor: 'var(--primary-color)',
        color: 'white'
    },
    btnDanger: {
        backgroundColor: '#DC2626',
        color: 'white'
    },
    btnDisabled: {
        backgroundColor: 'var(--g-200)',
        color: 'var(--g-400)',
        cursor: 'not-allowed'
    }
};

export const CancelSubscriptionModal = ({ isOpen, onClose }) => {
    const submit = useSubmit();
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [reason, setReason] = useState("");
    const [feedback, setFeedback] = useState("");

    if (!isOpen) return null;

    const handleApplyDiscount = () => {
        submit(
            { actionType: "applyDiscount" },
            { method: "POST" }
        );
        onClose();
    };

    const handleConfirmCancel = () => {
        if (!reason) return;
        submit(
            {
                actionType: "cancel",
                reason,
                feedback
            },
            { method: "POST" }
        );
        onClose();
    };

    const reasons = [
        { id: "expensive", label: t('cancelSubscription.reasons.expensive') },
        { id: "not_using", label: t('cancelSubscription.reasons.notUsing') },
        { id: "missing_features", label: t('cancelSubscription.reasons.missingFeatures') },
        { id: "bugs", label: t('cancelSubscription.reasons.bugs') },
        { id: "other", label: t('cancelSubscription.reasons.other') },
    ];

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.title}>
                        {step === 1 && t('cancelSubscription.step1Title')}
                        {step === 2 && t('cancelSubscription.step2Title')}
                        {step === 3 && t('cancelSubscription.step3Title')}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', opacity: 0.7, transition: 'opacity 0.2s' }} onMouseEnter={e => e.target.style.opacity = '1'} onMouseLeave={e => e.target.style.opacity = '0.7'}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={styles.content}>

                    {/* Step 1: Feedback */}
                    {step === 1 && (
                        <div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                {t('cancelSubscription.step1Desc')}
                            </p>

                            <div>
                                {reasons.map((r) => (
                                    <label
                                        key={r.id}
                                        style={{
                                            ...styles.radioLabel,
                                            ...(reason === r.id ? styles.activeRadio : {})
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="cancel_reason"
                                            value={r.id}
                                            checked={reason === r.id}
                                            onChange={(e) => setReason(e.target.value)}
                                            style={{ width: '16px', height: '16px', accentColor: '#7C3AED' }}
                                        />
                                        <span style={{ color: reason === r.id ? 'var(--primary-hover)' : 'var(--text-main)' }}>{r.label}</span>
                                    </label>
                                ))}
                            </div>

                            {reason && (
                                <textarea
                                    placeholder={t('cancelSubscription.feedbackPlaceholder')}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    style={styles.textarea}
                                />
                            )}
                        </div>
                    )}

                    {/* Step 2: Retention Offer */}
                    {step === 2 && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '64px', height: '64px', backgroundColor: 'var(--p-100)', borderRadius: '50%', margin: '0 auto 16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Gift size={32} color="var(--primary-color)" />
                            </div>

                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>
                                {t('cancelSubscription.step2DontLose')}
                            </h3>

                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
                                {t('cancelSubscription.step2Offer')}
                            </p>

                            <div style={{
                                backgroundColor: 'var(--p-50)', border: '1px solid var(--p-100)', borderRadius: '12px', padding: '16px', marginBottom: '24px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--primary-hover)', fontWeight: 500 }}>
                                    <Check size={20} />
                                    {t('cancelSubscription.step2OfferLabel')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Confirmation */}
                    {step === 3 && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '64px', height: '64px', backgroundColor: '#FEE2E2', borderRadius: '50%', margin: '0 auto 16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <AlertTriangle size={32} color="#DC2626" />
                            </div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                {t('cancelSubscription.step3Confirm')}
                            </p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div style={styles.footer}>

                    {/* Step 1 Actions */}
                    {step === 1 && (
                        <>
                            <button onClick={onClose} style={{ ...styles.button, ...styles.btnSecondary }}>
                                {t('cancelSubscription.keepSubscription')}
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                disabled={!reason}
                                style={{
                                    ...styles.button,
                                    ...(!reason ? styles.btnDisabled : styles.btnPrimary)
                                }}
                            >
                                {t('cancelSubscription.continue')}
                                <ChevronRight size={16} />
                            </button>
                        </>
                    )}

                    {/* Step 2 Actions */}
                    {step === 2 && (
                        <>
                            <button onClick={() => setStep(3)} style={{ ...styles.button, background: 'none', color: 'var(--text-secondary)' }}>
                                {t('cancelSubscription.noThanks')}
                            </button>
                            <button onClick={handleApplyDiscount} style={{ ...styles.button, ...styles.btnPrimary }}>
                                {t('cancelSubscription.applyDiscount')}
                            </button>
                        </>
                    )}

                    {/* Step 3 Actions */}
                    {step === 3 && (
                        <>
                            <button onClick={onClose} style={{ ...styles.button, ...styles.btnSecondary }}>
                                {t('cancelSubscription.keepSubscription')}
                            </button>
                            <button onClick={handleConfirmCancel} style={{ ...styles.button, ...styles.btnDanger }}>
                                {t('cancelSubscription.confirmCancel')}
                            </button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

