import { useLoaderData, useRevalidator } from "react-router";
import { useEffect } from "react";
import { authenticate, apiVersion } from "../shopify.server";
import { DashboardLayout } from "../components/DashboardLayout";
import { useLanguage } from "../components/LanguageContext";
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
    if (mainThemeId) {
      // 2. Get Asset (settings_data.json)
      try {
        // Extract numeric ID from GID (handles both Theme and OnlineStoreTheme formats)
        const themeId = mainThemeId.split('/').pop();
        const response = await fetch(
          `https://${session.shop}/admin/api/${apiVersion}/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`,
          {
            headers: {
              "X-Shopify-Access-Token": session.accessToken
            }
          }
        );
        const json = await response.json();
        const asset = json.asset;
        if (asset && asset.value) {
          const settingsData = JSON.parse(asset.value);
          const blocks = settingsData.current?.blocks || {};
          // Check for the extension by handle "try-on-widget" in the block type URI
          // Format usually: shopify://apps/<app-id>/blocks/<handle>/<uuid>
          isEmbedEnabled = Object.values(blocks).some((block) => {
            const typeMatch = block.type.includes("try-on-widget");
            const notDisabled = String(block.disabled) !== "true";
            return typeMatch && notDisabled;
          });
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
  const { t } = useLanguage();

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
          <h1 className="hero-title">{t('onboarding.title')}</h1>
          <p className="hero-subtitle">{t('onboarding.subtitle')}</p>
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
                <span className="step-label">{t('onboarding.step1.label')}</span>
                <span className="status-badge success">{t('onboarding.status.completed')}</span>
              </div>
              <h3 className="step-heading">{t('onboarding.step1.title')}</h3>
              <p className="step-desc">{t('onboarding.step1.desc')}</p>
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
                <span className="step-label">{t('onboarding.step2.label')}</span>
                {isEmbedEnabled ? (
                  <span className="status-badge success">{t('onboarding.status.completed')}</span>
                ) : (
                  <span className="status-badge action">{t('onboarding.status.actionRequired')}</span>
                )}
              </div>
              <h3 className="step-heading">{t('onboarding.step2.title')}</h3>
              <p className="step-desc">
                {isEmbedEnabled
                  ? t('onboarding.step2.descEnabled')
                  : t('onboarding.step2.descDisabled')}
              </p>
              {!isEmbedEnabled && (
                <div className="step-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => window.open(`https://${shop}/admin/themes/current/editor?context=apps`, '_blank')}
                  >
                    {t('onboarding.step2.action')} &rarr;
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
                <span className="step-label">{t('onboarding.step3.label')}</span>
                {activeStepId === 3 && <span className="status-badge pending">{t('onboarding.status.nextStep')}</span>}
              </div>
              <h3 className="step-heading">{t('onboarding.step3.title')}</h3>
              <p className="step-desc">{t('onboarding.step3.desc')}</p>
              <div className="step-actions">
                <button
                  className="btn btn-secondary"
                  disabled={!isEmbedEnabled}
                  onClick={() => window.open(`https://${shop}`, '_blank')}
                >
                  {t('onboarding.step3.action')}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Support Footer */}
        <div className="onboarding-support">
          <h3>{t('onboarding.support.title')}</h3>
          <div className="support-links">
            <a href="#" className="support-link">{t('onboarding.support.docs')}</a>
            <span className="divider">•</span>
            <a href="#" className="support-link">{t('onboarding.support.contact')}</a>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
