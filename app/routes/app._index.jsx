import { useLoaderData, useRevalidator } from "react-router";
import { useEffect } from "react";
import { authenticate, apiVersion } from "../shopify.server";
import { DashboardLayout } from "../components/DashboardLayout";
import adminStyles from "../styles/admin.css?url";

export const links = () => [
  { rel: "stylesheet", href: adminStyles },
];

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  let isEmbedEnabled = false;

  try {
    // 1. Get Main Theme ID
    const themesResponse = await admin.graphql(
      `#graphql
            query getThemes {
                themes(first: 5, roles: MAIN) {
                    nodes {
                        id
                    }
                }
            }`
    );
    const themesData = await themesResponse.json();
    const mainThemeId = themesData.data?.themes?.nodes?.[0]?.id;

    console.log("=== Theme Detection Start ===");
    console.log("mainThemeId:", mainThemeId);

    if (mainThemeId) {
      // 2. Get Asset (settings_data.json)
      try {
        // Extract numeric ID from GID (handles both Theme and OnlineStoreTheme formats)
        const themeId = mainThemeId.split('/').pop();
        console.log("Fetching settings_data.json for themeId:", themeId);

        const response = await fetch(
          `https://${session.shop}/admin/api/${apiVersion}/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`,
          {
            headers: {
              "X-Shopify-Access-Token": session.accessToken
            }
          }
        );

        console.log("REST API response status:", response.status);
        const json = await response.json();
        const asset = json.asset;
        console.log("Asset found:", !!asset, "Has value:", !!asset?.value);

        if (asset && asset.value) {
          const settingsData = JSON.parse(asset.value);
          const blocks = settingsData.current?.blocks || {};

          console.log("=== App Block Detection Debug ===");
          console.log("Blocks found:", Object.keys(blocks).length);

          // Check for the extension by handle "try-on-widget" in the block type URI
          // Format usually: shopify://apps/<app-id>/blocks/<handle>/<uuid>
          isEmbedEnabled = Object.values(blocks).some((block) => {
            const typeMatch = block.type.includes("try-on-widget");
            const notDisabled = String(block.disabled) !== "true";
            console.log(`Block type: ${block.type}, typeMatch: ${typeMatch}, disabled: ${block.disabled}, notDisabled: ${notDisabled}`);
            return typeMatch && notDisabled;
          });

          console.log("isEmbedEnabled result:", isEmbedEnabled);
          console.log("================================");
        }
      } catch (restError) {
        console.warn("REST Asset check failed:", restError);
        // Fallback or ignore if REST is unavailable
      }
    }
  } catch (error) {
    console.warn("Theme check failed:", error);
  }

  return { shop: session.shop, isEmbedEnabled };
};

export default function Dashboard() {
  const { shop, isEmbedEnabled } = useLoaderData();
  const revalidator = useRevalidator();

  // Poll for status change if not enabled
  useEffect(() => {
    if (!isEmbedEnabled) {
      const interval = setInterval(() => {
        revalidator.revalidate();
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isEmbedEnabled, revalidator]);

  const activeStepId = !isEmbedEnabled ? 2 : 3;

  return (
    <DashboardLayout merchantName={shop.split('.')[0]}>
      <div className="onboarding-page-layout">

        {/* Hero Section */}
        <div className="onboarding-hero">
          <h1 className="hero-title">Welcome to Virtual Try-On</h1>
          <p className="hero-subtitle">You're just a few steps away from transforming your customer experience.</p>
        </div>

        {/* Steps Container */}
        <div className="onboarding-steps-container">

          {/* Step 1: Install (Completed) */}
          <div className="onboarding-step-card completed">
            <div className="step-icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="step-content">
              <div className="step-top">
                <span className="step-label">Step 1</span>
                <span className="status-badge success">Completed</span>
              </div>
              <h3 className="step-heading">App Installation</h3>
              <p className="step-desc">The app has been successfully installed on your store.</p>
            </div>
          </div>

          {/* Step 2: Enable App Block */}
          <div className={`onboarding-step-card ${activeStepId === 2 ? 'active' : 'completed'}`}>
            <div className="step-icon-box">
              {isEmbedEnabled ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              ) : (
                <span>2</span>
              )}
            </div>
            <div className="step-content">
              <div className="step-top">
                <span className="step-label">Step 2</span>
                {isEmbedEnabled ? (
                  <span className="status-badge success">Completed</span>
                ) : (
                  <span className="status-badge action">Action Required</span>
                )}
              </div>
              <h3 className="step-heading">Enable App Block</h3>
              <p className="step-desc">
                {isEmbedEnabled
                  ? "The widget is active on your theme."
                  : "Enable the 'Virtual Try-On' block in your theme editor to make it visible."}
              </p>
              {!isEmbedEnabled && (
                <div className="step-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => window.open(`https://${shop}/admin/themes/current/editor?context=apps`, '_blank')}
                  >
                    Open Theme Editor &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Go Live */}
          <div className={`onboarding-step-card ${activeStepId === 3 ? 'active' : ''}`}>
            <div className="step-icon-box">
              <span>3</span>
            </div>
            <div className="step-content">
              <div className="step-top">
                <span className="step-label">Step 3</span>
                {activeStepId === 3 && <span className="status-badge pending">Next Step</span>}
              </div>
              <h3 className="step-heading">Preview & Launch</h3>
              <p className="step-desc">Check your product pages to see the magic in action.</p>
              <div className="step-actions">
                <button
                  className="btn btn-secondary"
                  disabled={!isEmbedEnabled}
                  onClick={() => window.open(`https://${shop}`, '_blank')}
                >
                  Visit Store
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Support Footer */}
        <div className="onboarding-support">
          <h3>Need assistance?</h3>
          <div className="support-links">
            <a href="#" className="support-link">Read Documentation</a>
            <span className="divider">•</span>
            <a href="#" className="support-link">Contact Support</a>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
