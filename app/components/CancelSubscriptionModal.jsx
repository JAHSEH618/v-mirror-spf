import { useState } from "react";
import { X, AlertTriangle, Gift, Check, ChevronRight } from "lucide-react";
import { useSubmit } from "react-router";

// Styles
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
        maxWidth: '512px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        position: 'relative',
        overflow: 'hidden'
    },
    header: {
        padding: '24px',
        borderBottom: '1px solid #F3F4F6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827',
        margin: 0
    },
    content: {
        padding: '24px'
    },
    footer: {
        padding: '24px',
        backgroundColor: '#F9FAFB',
        borderTop: '1px solid #F3F4F6',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px'
    },
    radioLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        marginBottom: '8px'
    },
    activeRadio: {
        borderColor: '#7C3AED',
        backgroundColor: '#F3E8FF'
    },
    textarea: {
        width: '100%',
        padding: '12px',
        border: '1px solid #D1D5DB',
        borderRadius: '8px',
        marginTop: '12px',
        minHeight: '80px',
        fontSize: '14px'
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
        gap: '8px'
    },
    btnSecondary: {
        backgroundColor: 'white',
        border: '1px solid #D1D5DB',
        color: '#374151'
    },
    btnPrimary: {
        backgroundColor: '#7C3AED',
        color: 'white'
    },
    btnDanger: {
        backgroundColor: '#DC2626',
        color: 'white'
    },
    btnDisabled: {
        backgroundColor: '#E5E7EB',
        color: '#9CA3AF',
        cursor: 'not-allowed'
    }
};

export const CancelSubscriptionModal = ({ isOpen, onClose }) => {
    const submit = useSubmit();
    const [step, setStep] = useState(1);
    const [reason, setReason] = useState("");
    const [feedback, setFeedback] = useState("");

    if (!isOpen) return null;

    const handleApplyDiscount = () => {
        // Mock applying discount
        alert("Discount applied! (Mock Action)");
        onClose();
        // In real app: submit({ actionType: "applyDiscount" }, { method: "POST" });
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
        { id: "expensive", label: "Too expensive" },
        { id: "not_using", label: "I'm not using it enough" },
        { id: "missing_features", label: "Missing features" },
        { id: "bugs", label: "Technical issues / Bugs" },
        { id: "other", label: "Other" },
    ];

    return (
        <div style={styles.overlay}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={styles.header}>
                    <h2 style={styles.title}>
                        {step === 1 && "We're sorry to see you go"}
                        {step === 2 && "Wait! Special Offer"}
                        {step === 3 && "Final Confirmation"}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={styles.content}>

                    {/* Step 1: Feedback */}
                    {step === 1 && (
                        <div>
                            <p style={{ color: '#4B5563', marginBottom: '16px' }}>
                                Please tell us why you're cancelling. Your feedback helps us improve.
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
                                        <span style={{ color: reason === r.id ? '#5B21B6' : '#374151' }}>{r.label}</span>
                                    </label>
                                ))}
                            </div>

                            {reason && (
                                <textarea
                                    placeholder="Anything else you'd like to share?"
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
                                width: '64px', height: '64px', backgroundColor: '#F3E8FF', borderRadius: '50%', margin: '0 auto 16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Gift size={32} color="#7C3AED" />
                            </div>

                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '8px' }}>
                                Don't lose your progress!
                            </h3>

                            <p style={{ color: '#4B5563', marginBottom: '24px', lineHeight: 1.5 }}>
                                We'd love to keep you as a customer. Here is a special <strong>20% discount</strong> for the next 3 months if you decide to stay.
                            </p>

                            <div style={{
                                backgroundColor: '#FAF5FF', border: '1px solid #F3E8FF', borderRadius: '12px', padding: '16px', marginBottom: '24px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#6D28D9', fontWeight: 500 }}>
                                    <Check size={20} />
                                    Active Plan: Professional (20% OFF)
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
                            <p style={{ color: '#4B5563', marginBottom: '24px' }}>
                                Are you sure? Your subscription will be cancelled immediately and you will lose access to premium features.
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
                                Keep Subscription
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                disabled={!reason}
                                style={{
                                    ...styles.button,
                                    ...(!reason ? styles.btnDisabled : styles.btnPrimary)
                                }}
                            >
                                Continue
                                <ChevronRight size={16} />
                            </button>
                        </>
                    )}

                    {/* Step 2 Actions */}
                    {step === 2 && (
                        <>
                            <button onClick={() => setStep(3)} style={{ ...styles.button, background: 'none', color: '#6B7280' }}>
                                No thanks, continue to cancel
                            </button>
                            <button onClick={handleApplyDiscount} style={{ ...styles.button, ...styles.btnPrimary }}>
                                Apply Discount
                            </button>
                        </>
                    )}

                    {/* Step 3 Actions */}
                    {step === 3 && (
                        <>
                            <button onClick={onClose} style={{ ...styles.button, ...styles.btnSecondary }}>
                                Keep Subscription
                            </button>
                            <button onClick={handleConfirmCancel} style={{ ...styles.button, ...styles.btnDanger }}>
                                Confirm Cancellation
                            </button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};
