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
      {/* Welcome Header */}
      <div className="header-section">
        <h1 className="title">Get Started with AI Virtual Try-On</h1>
      </div>

      {/* Onboarding Steps */}
      <div className="steps-list">
        {/* Step 1: Install */}
        <div className="step-card">
          <div className="step-content-wrapper">
            <div className="icon-wrapper" style={{ backgroundColor: '#10B981' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div className="step-details">
              <div className="step-header">
                <div className="step-title-group">
                  <span className="step-number">1</span>
                  <h3 className="step-title">Install App Extension</h3>
                </div>
                <span className="badge badge-completed">✓ Completed</span>
              </div>
              <p className="step-description">
                The app is installed in your store
              </p>
            </div>
          </div>
        </div>

        {/* Step 2: Enable */}
        <div className={`step-card ${activeStepId === 2 ? 'active-step' : ''}`}>
          <div className="step-content-wrapper">
            <div className="icon-wrapper" style={{ backgroundColor: activeStepId === 2 ? '#7C3AED' : '#E5E7EB' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={activeStepId === 2 ? 'white' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
            <div className="step-details">
              <div className="step-header">
                <div className="step-title-group">
                  <span className="step-number" style={{ color: activeStepId === 2 ? '#7C3AED' : '#D1D5DB' }}>2</span>
                  <h3 className="step-title">Enable in Theme Editor</h3>
                </div>
                {isEmbedEnabled ? (
                  <span className="badge badge-completed">✓ Completed</span>
                ) : (
                  <span className="badge badge-action">⚠ Action Required</span>
                )}
              </div>
              <p className="step-description">
                {isEmbedEnabled
                  ? "Great! The app block is enabled in your theme."
                  : "Go to your theme customizer and enable the AI Try-On app block."}
              </p>
              {!isEmbedEnabled && (
                <button
                  className="btn btn-primary"
                  onClick={() => window.open(`https://${shop}/admin/themes/current/editor?context=apps`, '_blank')}
                >
                  Open Theme Editor
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Test */}
        <div className={`step-card ${activeStepId === 3 ? 'active-step' : ''}`} style={{ opacity: !isEmbedEnabled ? 0.5 : 1 }}>
          <div className="step-content-wrapper">
            <div className="icon-wrapper" style={{ backgroundColor: activeStepId === 3 ? '#7C3AED' : '#E5E7EB' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={activeStepId === 3 ? 'white' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="step-details">
              <div className="step-header">
                <div className="step-title-group">
                  <span className="step-number" style={{ color: activeStepId === 3 ? '#7C3AED' : '#D1D5DB' }}>3</span>
                  <h3 className="step-title">Test & Go Live</h3>
                </div>
                <span className="badge badge-pending">Pending</span>
              </div>
              <p className="step-description">
                Try the virtual try-on feature on a product page
              </p>
              <button
                className="btn btn-secondary"
                disabled={!isEmbedEnabled}
                onClick={() => window.open(`https://${shop}`, '_blank')}
              >
                View Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="help-section">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827' }}>Need Help?</h3>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Check our documentation or contact support
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="help-link">View Documentation</button>
          <button className="help-link">Contact Support</button>
        </div>
      </div>
    </DashboardLayout>
  );
}
