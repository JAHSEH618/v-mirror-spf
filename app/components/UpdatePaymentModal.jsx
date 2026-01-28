import { useState, useEffect } from "react";
import { X, CreditCard, Lock, ShieldCheck, CheckCircle } from "lucide-react";
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
        padding: '1rem'
    },
    modal: {
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '560px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        zIndex: 9999,
        position: 'relative',
        overflow: 'hidden'
    },
    header: {
        padding: '24px',
        borderBottom: '1px solid #F3F4F6',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    content: {
        padding: '24px',
        overflowY: 'auto',
        flex: 1
    },
    footer: {
        padding: '24px',
        borderTop: '1px solid #E5E7EB',
        backgroundColor: '#F9FAFB',
        display: 'flex',
        gap: '12px'
    },
    inputGroup: {
        marginBottom: '20px'
    },
    inputContainer: {
        backgroundColor: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '4px',
        display: 'flex',
        alignItems: 'center'
    },
    label: {
        display: 'block',
        fontSize: '12px',
        color: '#6B7280',
        fontWeight: 500,
        marginBottom: '4px',
        paddingLeft: '12px',
        paddingTop: '8px'
    },
    input: {
        width: '100%',
        border: 'none',
        background: 'transparent',
        padding: '0 12px 4px 12px',
        fontSize: '16px',
        fontWeight: 500,
        color: '#111827',
        outline: 'none',
        height: '32px'
    },
    radioLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: 'pointer',
        padding: '12px',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        marginBottom: '8px'
    },
    badge: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: '#F3F4F6',
        borderRadius: '999px',
        fontSize: '12px',
        color: '#6B7280',
        fontWeight: 500
    },
    button: {
        flex: 1,
        padding: '12px',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        textAlign: 'center',
        border: 'none'
    },
    btnCancel: {
        backgroundColor: 'white',
        border: '1px solid #D1D5DB',
        color: '#374151'
    },
    btnSave: {
        backgroundColor: '#7C3AED',
        color: 'white'
    },
    btnDisabled: {
        backgroundColor: '#C4B5FD',
        color: 'white',
        cursor: 'not-allowed'
    }
};

export const UpdatePaymentModal = ({ isOpen, onClose, paymentMethods = [] }) => {
    const submit = useSubmit();

    // State
    const [paymentType, setPaymentType] = useState("card"); // card, paypal
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvc, setCvc] = useState("");
    const [cardHolder, setCardHolder] = useState("");
    const [saveAddress, setSaveAddress] = useState(true);

    // Debug logging
    useEffect(() => {
        if (isOpen) {
            console.log("UpdatePaymentModal Opened. Methods:", paymentMethods);
        }
    }, [isOpen, paymentMethods]);

    if (!isOpen) return null;

    // Safe Access
    const safeMethods = Array.isArray(paymentMethods) ? paymentMethods : [];
    const currentMethod = safeMethods.find(m => m.isDefault) || safeMethods[0];

    const detectBrand = (num) => {
        if (!num) return "card";
        if (num.startsWith("4")) return "visa";
        if (num.startsWith("5")) return "mastercard";
        return "card";
    };

    const handleSave = (e) => {
        e.preventDefault();
        console.log("Saving payment method...");

        if (paymentType === "paypal") {
            console.log("Redirecting to PayPal...");

            // 1. Open PayPal
            window.open("https://www.paypal.com", "_blank");

            // 2. Mock Bind: Add 'paypal' method to local DB
            submit(
                {
                    actionType: "addPaymentMethod",
                    brand: "paypal",
                    last4: "test@paypal.com",
                    expiry: "N/A"
                },
                { method: "POST" }
            );

            onClose();
            return;
        }

        const last4 = cardNumber.replace(/\s/g, '').slice(-4) || "4242";

        submit(
            {
                actionType: "addPaymentMethod",
                brand: detectBrand(cardNumber),
                last4,
                expiry
            },
            { method: "POST" }
        );

        // Reset
        setCardNumber("");
        setExpiry("");
        setCvc("");
        setCardHolder("");
        onClose();
    };

    const handleRemove = (id) => {
        if (confirm("Remove this payment method?")) {
            console.log("Removing payment method:", id);
            submit({ actionType: "removePaymentMethod", methodId: id }, { method: "POST" });
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={styles.header}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{
                            width: '48px', height: '48px', backgroundColor: '#F3E8FF', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED'
                        }}>
                            <Lock size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: '0 0 4px', fontSize: '20px', fontWeight: 700, color: '#111827' }}>Update Payment Method</h2>
                            <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>Your payment information is encrypted and secure</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={styles.content}>

                    {/* Current Method */}
                    {currentMethod && (
                        <div style={{ marginBottom: '32px' }}>
                            <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Current Payment Method</h3>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px',
                                backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '8px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '4px 8px' }}>
                                        <CreditCard size={24} color="#374151" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 500, color: '#111827' }}>•••• •••• •••• {currentMethod.last4}</div>
                                        <div style={{ fontSize: '14px', color: '#6B7280' }}>Expires: {currentMethod.expiry}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemove(currentMethod.id)}
                                    style={{ fontSize: '14px', color: '#DC2626', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Add New Method Header */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>Add New Payment Method</h3>

                        {/* Type Selector */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="payment_type"
                                    value="card"
                                    checked={paymentType === "card"}
                                    onChange={() => setPaymentType("card")}
                                    style={{ accentColor: '#7C3AED', width: '20px', height: '20px' }}
                                />
                                <span style={{ fontSize: '16px', fontWeight: paymentType === "card" ? 600 : 400, color: '#111827' }}>Credit/Debit Card</span>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', opacity: 0.7 }}>
                                    <span style={{ fontSize: '10px', background: '#F3F4F6', padding: '2px 4px', borderRadius: '2px', border: '1px solid #E5E7EB' }}>VISA</span>
                                    <span style={{ fontSize: '10px', background: '#F3F4F6', padding: '2px 4px', borderRadius: '2px', border: '1px solid #E5E7EB' }}>MC</span>
                                </div>
                            </label>

                            <label style={styles.radioLabel}>
                                <input
                                    type="radio"
                                    name="payment_type"
                                    value="paypal"
                                    checked={paymentType === "paypal"}
                                    onChange={() => setPaymentType("paypal")}
                                    style={{ accentColor: '#7C3AED', width: '20px', height: '20px' }}
                                />
                                <span style={{ fontSize: '16px', fontWeight: paymentType === "paypal" ? 600 : 400, color: '#111827' }}>PayPal</span>
                            </label>
                        </div>
                    </div>

                    {/* Card Form */}
                    {paymentType === "card" && (
                        <form onSubmit={handleSave}>

                            {/* Card Number */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={styles.inputContainer}>
                                    <div style={{ width: '100%' }}>
                                        <label style={styles.label}>Card Number</label>
                                        <input
                                            type="text"
                                            placeholder="0000 0000 0000 0000"
                                            value={cardNumber}
                                            onChange={e => setCardNumber(e.target.value)}
                                            style={styles.input}
                                            required
                                        />
                                    </div>
                                    <div style={{ paddingRight: '12px' }}><CreditCard size={20} color="#9CA3AF" /></div>
                                </div>
                            </div>

                            {/* Expiry & CVC */}
                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ ...styles.inputContainer, flex: 1, display: 'block' }}>
                                    <label style={styles.label}>Expiry Date</label>
                                    <input
                                        type="text"
                                        placeholder="MM / YY"
                                        value={expiry}
                                        onChange={e => setExpiry(e.target.value)}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                                <div style={{ ...styles.inputContainer, flex: 1, display: 'block' }}>
                                    <label style={styles.label}>CVV</label>
                                    <input
                                        type="text"
                                        placeholder="123"
                                        value={cvc}
                                        onChange={e => setCvc(e.target.value)}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Cardholder */}
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ ...styles.inputContainer, display: 'block' }}>
                                    <label style={styles.label}>Cardholder Name</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        value={cardHolder}
                                        onChange={e => setCardHolder(e.target.value)}
                                        style={styles.input}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Billing Address Toggle */}
                            <div style={{ paddingTop: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
                                    <div style={{
                                        width: '20px', height: '20px', borderRadius: '4px', border: saveAddress ? '1px solid #7C3AED' : '1px solid #D1D5DB',
                                        backgroundColor: saveAddress ? '#7C3AED' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                                    }}
                                        onClick={() => setSaveAddress(!saveAddress)}
                                    >
                                        {saveAddress && <CheckCircle size={14} color="white" />}
                                    </div>
                                    <span style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }} onClick={() => setSaveAddress(!saveAddress)}>Same as billing address</span>
                                </label>
                            </div>
                        </form>
                    )}

                    {paymentType === "paypal" && (
                        <div style={{ textAlign: 'center', padding: '24px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                            <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>
                                Select <strong>"Continue with PayPal"</strong> below. You might be asked to log in to verify your account.
                            </p>
                        </div>
                    )}

                    {/* Security Badges */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
                        marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #F3F4F6'
                    }}>
                        <div style={styles.badge}>
                            <Lock size={12} />
                            SSL Secure
                        </div>
                        <div style={styles.badge}>
                            <ShieldCheck size={12} />
                            PCI Compliant
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div style={styles.footer}>
                    <button
                        onClick={onClose}
                        style={{ ...styles.button, ...styles.btnCancel }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={paymentType === "card" && !cardNumber}
                        style={{
                            ...styles.button,
                            ...((paymentType === "card" && !cardNumber) ? styles.btnDisabled : styles.btnSave)
                        }}
                    >
                        {paymentType === "paypal" ? "Continue with PayPal" : "Save Payment Method"}
                    </button>
                </div>

            </div>
        </div>
    );
};
