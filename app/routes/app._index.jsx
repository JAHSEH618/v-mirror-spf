import { useLoaderData, useRevalidator } from "react-router";
import { useEffect } from "react";
import { authenticate, apiVersion } from "../shopify.server";
import { DashboardLayout } from "../components/DashboardLayout";
import { useLanguage } from "../components/LanguageContext";

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
      <s-box padding="large-300">
        {/* Hero Section */}
        <s-box paddingBlockEnd="large-300">
          <s-stack gap="small">
            <s-heading>{t('onboarding.title')}</s-heading>
            <s-paragraph>{t('onboarding.subtitle')}</s-paragraph>
          </s-stack>
        </s-box>

        {/* Steps Container */}
        <s-stack gap="base">

          {/* Step 1: Install (Completed) */}
          <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack direction="inline" gap="base">
              <s-badge tone="success">✓</s-badge>
              <s-stack gap="small">
                <s-stack direction="inline" gap="small">
                  <s-text>{t('onboarding.step1.label')}</s-text>
                  <s-badge tone="success">{t('onboarding.status.completed')}</s-badge>
                </s-stack>
                <s-heading>{t('onboarding.step1.title')}</s-heading>
                <s-paragraph>{t('onboarding.step1.desc')}</s-paragraph>
              </s-stack>
            </s-stack>
          </s-box>

          {/* Step 2: Enable App Block */}
          <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack direction="inline" gap="base">
              {isEmbedEnabled ? (
                <s-badge tone="success">✓</s-badge>
              ) : (
                <s-badge tone="caution">2</s-badge>
              )}
              <s-stack gap="small">
                <s-stack direction="inline" gap="small">
                  <s-text>{t('onboarding.step2.label')}</s-text>
                  {isEmbedEnabled ? (
                    <s-badge tone="success">{t('onboarding.status.completed')}</s-badge>
                  ) : (
                    <s-badge tone="warning">{t('onboarding.status.actionRequired')}</s-badge>
                  )}
                </s-stack>
                <s-heading>{t('onboarding.step2.title')}</s-heading>
                <s-paragraph>
                  {isEmbedEnabled
                    ? t('onboarding.step2.descEnabled')
                    : t('onboarding.step2.descDisabled')}
                </s-paragraph>
                {!isEmbedEnabled && (
                  <s-box paddingBlockStart="small">
                    <s-button
                      variant="primary"
                      onClick={() => window.open(`https://${shop}/admin/themes/current/editor?context=apps`, '_blank')}
                    >
                      {t('onboarding.step2.action')} →
                    </s-button>
                  </s-box>
                )}
              </s-stack>
            </s-stack>
          </s-box>

          {/* Step 3: Go Live */}
          <s-box padding="base" background="subdued" borderRadius="base">
            <s-stack direction="inline" gap="base">
              <s-badge tone={activeStepId === 3 ? "info" : "neutral"}>3</s-badge>
              <s-stack gap="small">
                <s-stack direction="inline" gap="small">
                  <s-text>{t('onboarding.step3.label')}</s-text>
                  {activeStepId === 3 && <s-badge>{t('onboarding.status.nextStep')}</s-badge>}
                </s-stack>
                <s-heading>{t('onboarding.step3.title')}</s-heading>
                <s-paragraph>{t('onboarding.step3.desc')}</s-paragraph>
                <s-box paddingBlockStart="small">
                  <s-button
                    disabled={!isEmbedEnabled}
                    onClick={() => window.open(`https://${shop}`, '_blank')}
                  >
                    {t('onboarding.step3.action')}
                  </s-button>
                </s-box>
              </s-stack>
            </s-stack>
          </s-box>

        </s-stack>

        {/* Support Footer */}
        <s-box paddingBlockStart="large-300">
          <s-stack gap="small">
            <s-heading>{t('onboarding.support.title')}</s-heading>
            <s-stack direction="inline" gap="small">
              <s-link>{t('onboarding.support.docs')}</s-link>
              <s-text>•</s-text>
              <s-link>{t('onboarding.support.contact')}</s-link>
            </s-stack>
          </s-stack>
        </s-box>

      </s-box>
    </DashboardLayout>
  );
}
