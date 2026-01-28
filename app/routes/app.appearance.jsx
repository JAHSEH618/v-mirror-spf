import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { DashboardLayout } from "../components/DashboardLayout";
import adminStyles from "../styles/admin.css?url";

export const links = () => [
    { rel: "stylesheet", href: adminStyles },
];

const defaultSettings = {
    position: "bottom-right",
    horizontalOffset: 20,
    verticalOffset: 20,
    primaryColor: "#7C3AED",
    textColor: "#FFFFFF",
    logoUrl: "",
    buttonText: "Try It On",
    tooltipText: "See how it looks on you!",
    modalTitle: "AI Virtual Try-On",
    uploadInstructions: "Upload a full-body photo for best results",
    smartDetection: false,
    showOnMobile: true,
    animationStyle: "fade-in",
};

export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    let settings = await prisma.widgetSettings.findUnique({
        where: { shop: session.shop },
    });

    if (!settings) {
        settings = { ...defaultSettings, shop: session.shop };
    }

    return { shop: session.shop, settings };
};

export const action = async ({ request }) => {
    const { session } = await authenticate.admin(request);

    try {
        const formData = await request.formData();

        const data = {
            position: formData.get("position"),
            horizontalOffset: parseInt(formData.get("horizontalOffset")) || 20,
            verticalOffset: parseInt(formData.get("verticalOffset")) || 20,
            primaryColor: formData.get("primaryColor"),
            textColor: formData.get("textColor"),
            logoUrl: formData.get("logoUrl") || null,
            buttonText: formData.get("buttonText"),
            tooltipText: formData.get("tooltipText"),
            modalTitle: formData.get("modalTitle"),
            uploadInstructions: formData.get("uploadInstructions"),
            smartDetection: formData.get("smartDetection") === "true",
            showOnMobile: formData.get("showOnMobile") === "true",
            animationStyle: formData.get("animationStyle"),
        };

        const settings = await prisma.widgetSettings.upsert({
            where: { shop: session.shop },
            update: data,
            create: { shop: session.shop, ...data },
        });

        return { success: true, settings };
    } catch (error) {
        console.error("Failed to save settings:", error);
        return { success: false, error: error.message };
    }
};

export default function Appearance() {
    const { shop, settings: initialSettings } = useLoaderData();
    const fetcher = useFetcher();

    const [settings, setSettings] = useState(initialSettings);
    const [isDirty, setIsDirty] = useState(false);
    const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' or 'mobile'

    const isSaving = fetcher.state === "submitting" || fetcher.state === "loading";
    const saveSuccess = fetcher.data?.success;

    useEffect(() => {
        if (fetcher.data?.settings && fetcher.state === "idle") {
            setSettings(fetcher.data.settings);
            setIsDirty(false);
        }
    }, [fetcher.data, fetcher.state]);

    useEffect(() => {
        if (saveSuccess) {
            window.shopify?.toast?.show("Settings saved successfully");
        }
    }, [saveSuccess]);

    const handleChange = useCallback((field, value) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    }, []);

    const handleSave = () => {
        const formData = new FormData();
        Object.entries(settings).forEach(([key, value]) => {
            if (!['id', 'shop', 'createdAt', 'updatedAt'].includes(key)) {
                formData.append(key, String(value));
            }
        });
        fetcher.submit(formData, { method: "POST" });
    };

    const handleReset = () => {
        if (confirm("Reset to Default Settings?")) {
            setSettings({ ...defaultSettings, shop: settings.shop });
            setIsDirty(true);
        }
    };

    const getPositionStyle = () => {
        const style = { position: 'absolute', zIndex: 10 };
        const hOffset = `${settings.horizontalOffset}px`;
        const vOffset = `${settings.verticalOffset}px`;

        if (settings.position === 'bottom-right') {
            style.bottom = vOffset;
            style.right = hOffset;
        } else if (settings.position === 'bottom-left') {
            style.bottom = vOffset;
            style.left = hOffset;
        }
        return style;
    };

    return (
        <DashboardLayout merchantName={shop.split('.')[0]}>
            {/* Page Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>
                    Customize Appearance
                </h1>
            </div>

            {/* Two Column Layout */}
            <div className="appearance-container">
                {/* Left Column: Settings */}
                <div className="config-column">
                    {/* Widget Position Section */}
                    <div className="config-section">
                        <h3 className="section-title">Widget Position</h3>
                        <div className="config-items">
                            <div className="config-item">
                                <div>
                                    <div className="config-item-name">Floating Button Position</div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="position"
                                            value="bottom-right"
                                            checked={settings.position === 'bottom-right'}
                                            onChange={(e) => handleChange("position", e.target.value)}
                                        />
                                        <span>Bottom Right</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="position"
                                            value="bottom-left"
                                            checked={settings.position === 'bottom-left'}
                                            onChange={(e) => handleChange("position", e.target.value)}
                                        />
                                        <span>Bottom Left</span>
                                    </label>
                                </div>
                            </div>
                            <div className="config-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span className="config-item-name">Horizontal Offset</span>
                                    <span style={{ color: '#7C3AED', fontWeight: 600 }}>{settings.horizontalOffset}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={settings.horizontalOffset}
                                    onChange={(e) => handleChange("horizontalOffset", parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#7C3AED' }}
                                />
                            </div>
                            <div className="config-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span className="config-item-name">Vertical Offset</span>
                                    <span style={{ color: '#7C3AED', fontWeight: 600 }}>{settings.verticalOffset}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={settings.verticalOffset}
                                    onChange={(e) => handleChange("verticalOffset", parseInt(e.target.value))}
                                    style={{ width: '100%', accentColor: '#7C3AED' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Colors Section */}
                    <div className="config-section">
                        <h3 className="section-title">Colors</h3>
                        <div className="config-items">
                            <div className="config-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <span className="config-item-name" style={{ marginBottom: '0.5rem' }}>Primary Color</span>
                                <div className="color-input">
                                    <input
                                        type="color"
                                        value={settings.primaryColor}
                                        onChange={(e) => handleChange("primaryColor", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={settings.primaryColor}
                                        onChange={(e) => handleChange("primaryColor", e.target.value)}
                                        maxLength={7}
                                        style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                                    />
                                </div>
                            </div>
                            <div className="config-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <span className="config-item-name" style={{ marginBottom: '0.5rem' }}>Button Text</span>
                                <div className="color-input">
                                    <input
                                        type="color"
                                        value={settings.textColor}
                                        onChange={(e) => handleChange("textColor", e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={settings.textColor}
                                        onChange={(e) => handleChange("textColor", e.target.value)}
                                        maxLength={7}
                                        style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Customization */}
                    <div className="config-section">
                        <h3 className="section-title">Text Customization</h3>
                        <div className="config-items">
                            <div className="config-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <span className="config-item-name" style={{ marginBottom: '0.5rem' }}>Button Text</span>
                                <input
                                    type="text"
                                    value={settings.buttonText}
                                    onChange={(e) => handleChange("buttonText", e.target.value)}
                                    maxLength={30}
                                    placeholder="Try It On"
                                    style={{ padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem' }}
                                />
                            </div>
                            <div className="config-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <span className="config-item-name" style={{ marginBottom: '0.5rem' }}>Modal Title</span>
                                <input
                                    type="text"
                                    value={settings.modalTitle}
                                    onChange={(e) => handleChange("modalTitle", e.target.value)}
                                    maxLength={50}
                                    placeholder="AI Virtual Try-On"
                                    style={{ padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem' }}
                                />
                            </div>
                            <div className="config-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <span className="config-item-name" style={{ marginBottom: '0.5rem' }}>Upload Instructions</span>
                                <textarea
                                    value={settings.uploadInstructions}
                                    onChange={(e) => handleChange("uploadInstructions", e.target.value)}
                                    maxLength={200}
                                    rows={2}
                                    placeholder="Upload a full-body photo for best results"
                                    style={{ padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', resize: 'vertical' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Options */}
                    <div className="config-section">
                        <h3 className="section-title">Advanced Options</h3>
                        <div className="config-items">
                            <div className="config-item">
                                <div>
                                    <div className="config-item-name">Show on Mobile</div>
                                    <div className="config-item-desc">Display on mobile devices</div>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.showOnMobile}
                                        onChange={(e) => handleChange("showOnMobile", e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="config-item">
                                <div>
                                    <div className="config-item-name">Auto-detect Clothing Products</div>
                                    <div className="config-item-desc">Only show on clothing items</div>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.smartDetection}
                                        onChange={(e) => handleChange("smartDetection", e.target.checked)}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="config-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                <span className="config-item-name" style={{ marginBottom: '0.5rem' }}>Animation Style</span>
                                <select
                                    value={settings.animationStyle}
                                    onChange={(e) => handleChange("animationStyle", e.target.value)}
                                    style={{ padding: '0.5rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem' }}
                                >
                                    <option value="fade-in">Fade In</option>
                                    <option value="slide-up">Slide Up</option>
                                    <option value="scale">Scale</option>
                                    <option value="bounce">Bounce</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                        <button className="btn btn-secondary" onClick={handleReset}>
                            Reset to Default
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={!isDirty || isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>

                {/* Right Column: Preview */}
                <div className="preview-column">
                    <div className="preview-card" style={{ border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)' }}>
                        <div className="preview-header" style={{
                            background: '#FFF1F2',
                            padding: '1rem',
                            borderBottom: 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#111827' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                Preview
                            </div>
                            <div style={{
                                display: 'flex',
                                background: '#E5E7EB',
                                padding: '4px',
                                borderRadius: '8px',
                                gap: '2px'
                            }}>
                                <button
                                    onClick={() => setPreviewDevice('desktop')}
                                    style={{
                                        padding: '4px 16px',
                                        background: previewDevice === 'desktop' ? 'white' : 'transparent',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: previewDevice === 'desktop' ? '#111827' : '#6B7280',
                                        boxShadow: previewDevice === 'desktop' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Desktop
                                </button>
                                <button
                                    onClick={() => setPreviewDevice('mobile')}
                                    style={{
                                        padding: '4px 16px',
                                        background: previewDevice === 'mobile' ? 'white' : 'transparent',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: previewDevice === 'mobile' ? '#111827' : '#6B7280',
                                        boxShadow: previewDevice === 'mobile' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Mobile
                                </button>
                            </div>
                        </div>
                        <div className="preview-window" style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            background: '#F9FAFB', // Changed to neutral gray/white per request (using F9FAFB for slight contrast against white card)
                            padding: '40px 20px',
                            transition: 'all 0.3s ease'
                        }}>
                            <div style={{
                                width: previewDevice === 'desktop' ? '100%' : 'auto', // Auto width for mobile to maintain aspect ratio with height constraint
                                height: previewDevice === 'desktop' ? 'auto' : '100%',
                                maxWidth: '100%',
                                maxHeight: previewDevice === 'mobile' ? '700px' : 'none', // Constrain height for mobile
                                aspectRatio: previewDevice === 'desktop' ? '16/10' : '9/19.5',
                                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                background: 'white',
                                borderRadius: previewDevice === 'mobile' ? '48px' : '12px',
                                boxShadow: previewDevice === 'mobile'
                                    ? '0 0 0 10px #27272a, 0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                                    : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {/* Desktop Window Header (Mac Style) */}
                                {previewDevice === 'desktop' && (
                                    <div style={{
                                        height: '32px',
                                        background: '#F3F4F6',
                                        borderTopLeftRadius: '12px',
                                        borderTopRightRadius: '12px',
                                        borderBottom: '1px solid #E5E7EB',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 12px',
                                        gap: '8px'
                                    }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }}></div>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></div>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></div>
                                        <div style={{
                                            flex: 1,
                                            margin: '0 20px',
                                            background: 'white',
                                            height: '22px',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0 8px',
                                            fontSize: '11px',
                                            color: '#9CA3AF'
                                        }}>
                                            myshopify.com
                                        </div>
                                    </div>
                                )}

                                {/* iPhone Dynamic Island / Notch */}
                                {previewDevice === 'mobile' && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '90px',
                                        height: '24px',
                                        background: '#000',
                                        borderRadius: '12px',
                                        zIndex: 20
                                    }}></div>
                                )}

                                {/* Screen Content */}
                                <div style={{
                                    flex: 1,
                                    overflow: 'hidden',
                                    borderRadius: previewDevice === 'mobile' ? '40px' : '0 0 12px 12px',
                                    position: 'relative',
                                    background: 'white'
                                }}>
                                    {/* Mock Product Page */}
                                    <div className="mock-page" style={{ height: '100%', overflowY: 'auto' }}>
                                        {/* Content based on previewDevice */}
                                        <div className="mock-nav" style={{
                                            height: '50px',
                                            borderBottom: '1px solid #F3F4F6',
                                            marginBottom: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '0 20px',
                                            marginTop: previewDevice === 'mobile' ? '20px' : '0'
                                        }}>
                                            <div style={{ width: '24px', height: '2px', background: '#E5E7EB', boxShadow: '0 6px 0 #E5E7EB, 0 -6px 0 #E5E7EB' }}></div>
                                            <div style={{ marginLeft: 'auto', width: '24px', height: '24px', borderRadius: '50%', background: '#E5E7EB' }}></div>
                                        </div>

                                        <div className="mock-content" style={{
                                            padding: '0 20px',
                                            display: 'flex',
                                            flexDirection: previewDevice === 'mobile' ? 'column' : 'row',
                                            gap: '24px'
                                        }}>
                                            <div className="mock-image" style={{
                                                flex: 1,
                                                height: previewDevice === 'mobile' ? '320px' : '400px',
                                                background: '#FFF1F2',
                                                borderRadius: '12px',
                                                marginBottom: previewDevice === 'mobile' ? '0' : '0',
                                                position: 'relative',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
                                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
                                                </div>
                                            </div>

                                            <div className="mock-details" style={{ flex: 1 }}>
                                                <div style={{ width: '40%', height: '12px', background: '#F3F4F6', borderRadius: '4px', marginBottom: '8px' }}></div>
                                                <div style={{ width: '80%', height: '24px', background: '#E5E7EB', borderRadius: '4px', marginBottom: '16px' }}></div>
                                                <div style={{ width: '30%', height: '18px', background: '#E5E7EB', borderRadius: '4px', marginBottom: '24px' }}></div>

                                                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #E5E7EB' }}></div>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F3F4F6' }}></div>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F3F4F6' }}></div>
                                                </div>

                                                <div style={{ width: '100%', height: '12px', background: '#F3F4F6', borderRadius: '4px', marginBottom: '8px' }}></div>
                                                <div style={{ width: '100%', height: '12px', background: '#F3F4F6', borderRadius: '4px', marginBottom: '8px' }}></div>
                                                <div style={{ width: '70%', height: '12px', background: '#F3F4F6', borderRadius: '4px', marginBottom: '32px' }}></div>

                                                <div style={{
                                                    width: '100%',
                                                    height: '48px',
                                                    background: '#111827',
                                                    borderRadius: '8px',
                                                    marginBottom: '12px'
                                                }}></div>
                                                <div style={{
                                                    width: '100%',
                                                    height: '48px',
                                                    border: '1px solid #E5E7EB',
                                                    borderRadius: '8px'
                                                }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Widget */}
                                    <div
                                        className={`preview-widget animate-${settings.animationStyle}`}
                                        style={{
                                            backgroundColor: settings.primaryColor,
                                            color: settings.textColor,
                                            padding: '12px 20px',
                                            borderRadius: '30px',
                                            ...getPositionStyle()
                                        }}
                                    >
                                        <svg className="preview-widget-icon" viewBox="0 0 24 24" fill="none" stroke={settings.textColor} strokeWidth="2">
                                            <path d="M20.5 18a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0z" />
                                            <path d="M4 18a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z" />
                                            <rect x="2" y="10" width="20" height="4" rx="1" stroke="none" fill={settings.textColor} />
                                        </svg>
                                        <span className="preview-widget-text" style={{ marginLeft: '8px', fontWeight: 600 }}>{settings.buttonText}</span>
                                    </div>
                                </div>

                                {/* iPhone Home Indicator */}
                                {previewDevice === 'mobile' && (
                                    <div style={{
                                        position: 'absolute',
                                        bottom: '8px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '120px',
                                        height: '4px',
                                        background: '#E5E7EB',
                                        borderRadius: '2px',
                                        zIndex: 20
                                    }}></div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
