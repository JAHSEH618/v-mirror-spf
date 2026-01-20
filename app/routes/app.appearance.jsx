import { useLoaderData, useFetcher } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import adminStyles from "../styles/admin.css?url";

export const links = () => [
    { rel: "stylesheet", href: adminStyles },
];

// Default settings
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

    // Get or create settings for this shop
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
};

export default function Appearance() {
    const { shop, settings: initialSettings } = useLoaderData();
    const fetcher = useFetcher();
    const [settings, setSettings] = useState(initialSettings);
    const [isDirty, setIsDirty] = useState(false);

    const isSaving = fetcher.state === "submitting";
    const saveSuccess = fetcher.data?.success;

    // Update settings when fetcher returns new data
    useEffect(() => {
        if (fetcher.data?.settings) {
            setSettings(fetcher.data.settings);
            setIsDirty(false);
        }
    }, [fetcher.data]);

    // Show toast on save success
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
            if (key !== 'id' && key !== 'shop' && key !== 'createdAt' && key !== 'updatedAt') {
                formData.append(key, String(value));
            }
        });
        fetcher.submit(formData, { method: "POST" });
    };

    const handleDiscard = () => {
        setSettings(initialSettings);
        setIsDirty(false);
    };

    return (
        <>
            {isDirty && (
                <s-save-bar id="save-bar">
                    <button onClick={handleDiscard} slot="discard-button">Discard</button>
                    <button onClick={handleSave} slot="save-button" disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </s-save-bar>
            )}

            <s-page heading="Appearance Settings">
                <s-button slot="primary-action" onClick={handleSave} disabled={!isDirty || isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                </s-button>

                <div className="appearance-container">
                    {/* Position Section */}
                    <div className="config-section">
                        <h3 className="section-title">Button Position</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Position</label>
                                <select
                                    value={settings.position}
                                    onChange={(e) => handleChange("position", e.target.value)}
                                >
                                    <option value="bottom-right">Bottom Right</option>
                                    <option value="bottom-left">Bottom Left</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Horizontal Offset</label>
                                <div className="range-input">
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={settings.horizontalOffset}
                                        onChange={(e) => handleChange("horizontalOffset", parseInt(e.target.value))}
                                    />
                                    <span>{settings.horizontalOffset}px</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Vertical Offset</label>
                                <div className="range-input">
                                    <input
                                        type="range"
                                        min="10"
                                        max="100"
                                        value={settings.verticalOffset}
                                        onChange={(e) => handleChange("verticalOffset", parseInt(e.target.value))}
                                    />
                                    <span>{settings.verticalOffset}px</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="config-section">
                        <h3 className="section-title">Appearance</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Primary Color</label>
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
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Text Color</label>
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
                                    />
                                </div>
                            </div>
                            <div className="form-group full-width">
                                <label>Logo URL (optional)</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/logo.png"
                                    value={settings.logoUrl || ""}
                                    onChange={(e) => handleChange("logoUrl", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Text Content Section */}
                    <div className="config-section">
                        <h3 className="section-title">Text Content</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Button Text</label>
                                <input
                                    type="text"
                                    value={settings.buttonText}
                                    onChange={(e) => handleChange("buttonText", e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Tooltip Text</label>
                                <input
                                    type="text"
                                    value={settings.tooltipText}
                                    onChange={(e) => handleChange("tooltipText", e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Modal Title</label>
                                <input
                                    type="text"
                                    value={settings.modalTitle}
                                    onChange={(e) => handleChange("modalTitle", e.target.value)}
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Upload Instructions</label>
                                <textarea
                                    rows="2"
                                    value={settings.uploadInstructions}
                                    onChange={(e) => handleChange("uploadInstructions", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Advanced Section */}
                    <div className="config-section">
                        <h3 className="section-title">Advanced</h3>
                        <div className="form-grid">
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={settings.smartDetection}
                                        onChange={(e) => handleChange("smartDetection", e.target.checked)}
                                    />
                                    Only show on clothing products
                                </label>
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={settings.showOnMobile}
                                        onChange={(e) => handleChange("showOnMobile", e.target.checked)}
                                    />
                                    Show on mobile devices
                                </label>
                            </div>
                            <div className="form-group">
                                <label>Animation Style</label>
                                <select
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
                </div>
            </s-page>
        </>
    );
}
