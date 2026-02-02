import { useLoaderData, useRevalidator } from "react-router";
import { useEffect } from "react";
import { authenticate, apiVersion } from "../shopify.server";
import { DashboardLayout } from "../components/DashboardLayout";
import { useLanguage } from "../components/LanguageContext";
import {
  Page,
  Layout,
  LegacyCard,
  CalloutCard,
  Text,
  BlockStack,
  InlineStack,
  Badge,
  Button,
  FooterHelp,
  Link,
  Icon
} from "@shopify/polaris";
import {
  CheckIcon,
  AppsIcon
} from "@shopify/polaris-icons";

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
          `https://${session.shop}/admin/api/${apiVersion}/themes/${themeId}/assets.json?asset[key]=config/settings_data.json&_t=${Date.now()}`,
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

  return (
    <DashboardLayout merchantName={shop.split('.')[0]}>
      <Page fullWidth title={t('onboarding.title')} subtitle={t('onboarding.subtitle')}>
        <Layout>
          {/* Step 1: Install (Completed) */}
          <Layout.Section>
            <LegacyCard sectioned>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="400" blockAlign="center">
                    <div style={{ padding: '8px', background: 'var(--p-color-bg-surface-success)', borderRadius: '50%' }}>
                      <Icon source={CheckIcon} tone="success" />
                    </div>
                    <BlockStack gap="100">
                      <Text variant="headingMd" as="h2">{t('onboarding.step1.title')}</Text>
                      <Text variant="bodyMd" as="p" tone="subdued">{t('onboarding.step1.desc')}</Text>
                    </BlockStack>
                  </InlineStack>
                  <Badge tone="success">{t('onboarding.status.completed')}</Badge>
                </InlineStack>
              </BlockStack>
            </LegacyCard>
          </Layout.Section>

          {/* Step 2: Enable App Block */}
          <Layout.Section>
            {isEmbedEnabled ? (
              <LegacyCard sectioned>
                <BlockStack gap="400">
                  <InlineStack align="space-between" blockAlign="center">
                    <InlineStack gap="400" blockAlign="center">
                      <div style={{ padding: '8px', background: 'var(--p-color-bg-surface-success)', borderRadius: '50%' }}>
                        <Icon source={CheckIcon} tone="success" />
                      </div>
                      <BlockStack gap="100">
                        <Text variant="headingMd" as="h2">{t('onboarding.step2.title')}</Text>
                        <Text variant="bodyMd" as="p" tone="subdued">{t('onboarding.step2.descEnabled')}</Text>
                      </BlockStack>
                    </InlineStack>
                    <Badge tone="success">{t('onboarding.status.completed')}</Badge>
                  </InlineStack>
                </BlockStack>
              </LegacyCard>
            ) : (
              <CalloutCard
                title={t('onboarding.step2.title')}
                illustration="https://cdn.shopify.com/s/assets/admin/checkout/settings-customizecart-705f57c725ac05be5a34ec20c05b94298cb8afd10aac7bd9c7ad02030f48cfa0.svg"
                primaryAction={{
                  content: t('onboarding.step2.action'),
                  url: `https://${shop}/admin/themes/current/editor?context=apps`,
                  target: "_blank",
                }}
              >
                <BlockStack gap="200">
                  <Text variant="bodyMd" as="p">
                    {t('onboarding.step2.descDisabled')}
                  </Text>
                  <InlineStack gap="200">
                    <Badge tone="attention">{t('onboarding.status.actionRequired')}</Badge>
                    <Text variant="bodySm" as="span" tone="subdued">
                      {t('onboarding.step2.label')}
                    </Text>
                  </InlineStack>
                </BlockStack>
              </CalloutCard>
            )}
          </Layout.Section>

          {/* Step 3: Go Live */}
          <Layout.Section>
            <LegacyCard sectioned>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="400" blockAlign="center">
                    <div style={{
                      padding: '8px',
                      background: isEmbedEnabled ? 'var(--p-color-bg-surface-info)' : 'var(--p-color-bg-fill)',
                      borderRadius: '50%'
                    }}>
                      <Icon source={AppsIcon} tone={isEmbedEnabled ? "info" : "base"} />
                    </div>
                    <BlockStack gap="100">
                      <Text variant="headingMd" as="h2" tone={!isEmbedEnabled ? "subdued" : "base"}>{t('onboarding.step3.title')}</Text>
                      <Text variant="bodyMd" as="p" tone="subdued">{t('onboarding.step3.desc')}</Text>
                    </BlockStack>
                  </InlineStack>
                  <Button
                    variant="primary"
                    disabled={!isEmbedEnabled}
                    onClick={() => window.open(`https://${shop}`, '_blank')}
                  >
                    {t('onboarding.step3.action')}
                  </Button>
                </InlineStack>
              </BlockStack>
            </LegacyCard>
          </Layout.Section>

          <Layout.Section>
            <FooterHelp>
              {t('onboarding.support.title')} {' '}
              <Link url="#">{t('onboarding.support.docs')}</Link> • {' '}
              <Link url="#">{t('onboarding.support.contact')}</Link>
            </FooterHelp>
          </Layout.Section>
        </Layout>
      </Page>
    </DashboardLayout>
  );
}
