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
            <div className="appearance-page-layout">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Customize Appearance</h1>
                        <p className="page-subtitle">Design your virtual try-on widget to match your brand identity.</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-secondary" onClick={handleReset}>
                            Reset Default
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

                <div className="appearance-grid">
                    {/* LEFT COLUMN: Settings */}
                    <div className="settings-column">

                        {/* 1. Layout & Position */}
                        <div className="settings-card">
                            <h3 className="card-title">Placement</h3>

                            <div className="form-group">
                                <label className="form-label">Widget Position</label>
                                <div className="position-selector">
                                    {['bottom-left', 'bottom-right'].map((pos) => (
                                        <div
                                            key={pos}
                                            className={`position-option ${settings.position === pos ? 'active' : ''}`}
                                            onClick={() => handleChange("position", pos)}
                                        >
                                            <div className={`mini-screen ${pos}`}>
                                                <div className="mini-widget"></div>
                                            </div>
                                            <span>{pos.replace('-', ' ')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="range-header">
                                    <label className="form-label">Horizontal Offset</label>
                                    <span className="range-value">{settings.horizontalOffset}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={settings.horizontalOffset}
                                    onChange={(e) => handleChange("horizontalOffset", parseInt(e.target.value))}
                                    className="styled-range"
                                    style={{ '--val': `${settings.horizontalOffset}%` }}
                                />
                            </div>

                            <div className="form-group">
                                <div className="range-header">
                                    <label className="form-label">Vertical Offset</label>
                                    <span className="range-value">{settings.verticalOffset}px</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={settings.verticalOffset}
                                    onChange={(e) => handleChange("verticalOffset", parseInt(e.target.value))}
                                    className="styled-range"
                                    style={{ '--val': `${settings.verticalOffset}%` }}
                                />
                            </div>
                        </div>

                        {/* 2. Brand & Colors */}
                        <div className="settings-card">
                            <h3 className="card-title">Brand & Identity</h3>

                            <div className="form-row">
                                <div className="form-group flex-1">
                                    <label className="form-label">Primary Color</label>
                                    <div className="color-picker-wrapper">
                                        <input
                                            type="color"
                                            value={settings.primaryColor}
                                            onChange={(e) => handleChange("primaryColor", e.target.value)}
                                            className="color-swatch-input"
                                        />
                                        <input
                                            type="text"
                                            value={settings.primaryColor}
                                            onChange={(e) => handleChange("primaryColor", e.target.value)}
                                            className="color-text-input"
                                            maxLength={7}
                                        />
                                    </div>
                                </div>
                                <div className="form-group flex-1">
                                    <label className="form-label">Text Color</label>
                                    <div className="color-picker-wrapper">
                                        <input
                                            type="color"
                                            value={settings.textColor}
                                            onChange={(e) => handleChange("textColor", e.target.value)}
                                            className="color-swatch-input"
                                        />
                                        <input
                                            type="text"
                                            value={settings.textColor}
                                            onChange={(e) => handleChange("textColor", e.target.value)}
                                            className="color-text-input"
                                            maxLength={7}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Widget Text</label>
                                <input
                                    type="text"
                                    value={settings.buttonText}
                                    onChange={(e) => handleChange("buttonText", e.target.value)}
                                    className="styled-input"
                                    maxLength={30}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Modal Title</label>
                                <input
                                    type="text"
                                    value={settings.modalTitle}
                                    onChange={(e) => handleChange("modalTitle", e.target.value)}
                                    className="styled-input"
                                    maxLength={50}
                                />
                            </div>
                        </div>

                        {/* 3. Behavior */}
                        <div className="settings-card">
                            <h3 className="card-title">Behavior</h3>
                            <div className="toggle-row">
                                <div className="toggle-info">
                                    <span className="toggle-label">Mobile Display</span>
                                    <span className="toggle-desc">Show widget on mobile devices</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.showOnMobile}
                                        onChange={(e) => handleChange("showOnMobile", e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="toggle-row">
                                <div className="toggle-info">
                                    <span className="toggle-label">Smart Detection</span>
                                    <span className="toggle-desc">Only show on 'Clothing' products</span>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={settings.smartDetection}
                                        onChange={(e) => handleChange("smartDetection", e.target.checked)}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Animation Style</label>
                                <select
                                    className="styled-select"
                                    value={settings.animationStyle}
                                    onChange={(e) => handleChange("animationStyle", e.target.value)}
                                >
                                    <option value="fade-in">Fade In</option>
                                    <option value="slide-up">Slide Up</option>
                                    <option value="scale">Scale</option>
                                    <option value="bounce">Bounce</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Live Preview */}
                    <div className="preview-container-wrapper">
                        <div className="preview-sticky-container">
                            <div className="preview-toolbar">
                                <div className="preview-title">
                                    <span className="pulse-dot"></span> Live Preview
                                </div>
                                <div className="device-switcher">
                                    <button
                                        className={`device-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
                                        onClick={() => setPreviewDevice('desktop')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                                    </button>
                                    <button
                                        className={`device-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
                                        onClick={() => setPreviewDevice('mobile')}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="device-stage">
                                <div className={`device-frame ${previewDevice}`}>
                                    {/* Mobile Notch / Bezel Elements */}
                                    {previewDevice === 'mobile' && (
                                        <>
                                            <div className="iphone-notch"></div>
                                            <div className="iphone-power"></div>
                                            <div className="iphone-volume"></div>
                                        </>
                                    )}

                                    {/* Screen Output */}
                                    <div className="device-screen">
                                        <div className="mock-store-ui">
                                            {/* Store Header */}
                                            <div className="mock-nav">
                                                <div className="mock-brand">VOGUE</div>
                                                <div className="mock-menu-icon"></div>
                                            </div>

                                            <div className="mock-product-layout">
                                                <div className="mock-product-image">
                                                    <div className="product-tag">New Season</div>
                                                </div>
                                                <div className="mock-product-info">
                                                    <div className="mock-title-line"></div>
                                                    <div className="mock-price-line"></div>
                                                    <div className="mock-desc-block">
                                                        <div className="line l1"></div>
                                                        <div className="line l2"></div>
                                                        <div className="line l3"></div>
                                                    </div>
                                                    <div className="mock-atc-btn">Add to Cart</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* THE WIDGET */}
                                        <div
                                            className={`preview-widget animate-${settings.animationStyle}`}
                                            style={{
                                                backgroundColor: settings.primaryColor,
                                                color: settings.textColor,
                                                ...getPositionStyle()
                                            }}
                                        >
                                            <svg className="preview-widget-icon" viewBox="0 0 24 24" fill="none" stroke={settings.textColor} strokeWidth="2">
                                                <path d="M20.5 18a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0z" />
                                                <path d="M4 18a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z" />
                                                <rect x="2" y="10" width="20" height="4" rx="1" stroke="none" fill={settings.textColor} />
                                            </svg>
                                            <span className="preview-widget-text">{settings.buttonText}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
