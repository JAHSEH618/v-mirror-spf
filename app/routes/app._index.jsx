import { useLoaderData } from "react-router";
import { useState, useEffect } from "react";
import { authenticate } from "../shopify.server";
import adminStyles from "../styles/admin.css?url";

export const links = () => [
  { rel: "stylesheet", href: adminStyles },
];

export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);

  let isEmbedEnabled = false;

  try {
    // 1. Get the main theme (requires read_themes scope)
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
    const mainTheme = themesData.data?.themes?.nodes?.[0];

    if (mainTheme) {
      // 2. Get settings_data.json
      const assetResponse = await admin.rest.resources.Asset.all({
        session,
        theme_id: mainTheme.id.replace('gid://shopify/Theme/', ''),
        asset: { key: 'config/settings_data.json' },
      });

      if (assetResponse && assetResponse.length > 0) {
        try {
          const settingsData = JSON.parse(assetResponse[0].value);
          const blocks = settingsData.current?.blocks || {};

          // Check for our block
          const TARGET_EXTENSION_ID = "a9abfcc3-b879-ddaf-269f-945459adb64d416252b7";
          isEmbedEnabled = Object.values(blocks).some((block) => {
            return block.type.includes(TARGET_EXTENSION_ID) && block.disabled !== true;
          });
        } catch (e) {
          console.error("Failed to parse settings_data.json", e);
        }
      }
    }
  } catch (error) {
    // If read_themes scope is not available, we'll default to isEmbedEnabled = false
    console.warn("Could not check theme status (read_themes scope may be missing):", error.message);
  }

  return { shop: session.shop, isEmbedEnabled };
};

export default function Index() {
  const { shop, isEmbedEnabled } = useLoaderData();
  const [manualConfirmed, setManualConfirmed] = useState(false);

  // Load manual confirmation state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('v-mirror-embed-confirmed');
    if (saved === 'true') {
      setManualConfirmed(true);
    }
  }, []);

  const handleManualConfirm = () => {
    setManualConfirmed(true);
    localStorage.setItem('v-mirror-embed-confirmed', 'true');
  };

  const handleOpenThemeEditor = () => {
    // Deep link to Theme Editor App embeds section
    const url = `https://${shop}/admin/themes/current/editor?context=apps`;
    window.open(url, '_blank');
  };

  const handleViewDemo = () => {
    window.open(`https://${shop}`, '_blank');
  };

  const handleViewDocumentation = () => {
    window.open('https://docs.shopify.com', '_blank');
  };

  // Combined status: either auto-detected or manually confirmed
  const isStep2Complete = isEmbedEnabled || manualConfirmed;

  const steps = [
    {
      id: 1,
      title: 'Install App Extension',
      description: 'The app is installed. We require access to your Online Store theme to inject the floating widget.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.5 18a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0z" />
          <path d="M4 18a2.5 2.5 0 1 0 5 0 2.5 2.5 0 0 0-5 0z" />
          <path d="M15.5 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
          <path d="M8.5 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
          <rect x="2" y="10" width="20" height="4" rx="1" />
        </svg>
      ),
      status: 'completed',
    },
    {
      id: 2,
      title: 'Enable in Theme Editor',
      description: 'Go to your theme customizer and enable the AI Try-On app block.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M2 12h20" />
          <path d="M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0" />
        </svg>
      ),
      status: isStep2Complete ? 'completed' : 'action-required',
      actionButton: {
        label: 'Open Theme Editor',
        onClick: handleOpenThemeEditor,
        variant: 'primary',
      },
      showConfirmButton: !isStep2Complete,
    },
    {
      id: 3,
      title: 'Test & Go Live',
      description: 'Try the virtual try-on feature on a product page.',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      ),
      status: isStep2Complete ? 'action-required' : 'pending',
      actionButton: {
        label: 'View Store',
        onClick: handleViewDemo,
        variant: isStep2Complete ? 'primary' : 'secondary',
      },
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="badge badge-completed">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Completed
          </span>
        );
      case 'action-required':
        return (
          <span className="badge badge-action">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Action Required
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-pending">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <s-page heading="Get Started with AI Virtual Try-On">
      <div className="onboarding-container">
        <div className="header-section">
          <p className="subtitle">Follow these steps to set up your virtual try-on experience</p>
        </div>

        <div className="steps-list">
          {steps.map((step) => (
            <div key={step.id} className="step-card">
              <div className="step-content-wrapper">
                <div className="icon-wrapper">
                  {step.icon}
                </div>

                <div className="step-details">
                  <div className="step-header">
                    <div className="step-title-group">
                      <span className="step-number">{step.id}</span>
                      <h3 className="step-title">{step.title}</h3>
                    </div>
                    {getStatusBadge(step.status)}
                  </div>

                  <p className="step-description">{step.description}</p>

                  <div className="btn-group">
                    {step.actionButton && (
                      <button
                        onClick={step.actionButton.onClick}
                        className={`btn ${step.actionButton.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {step.actionButton.label}
                      </button>
                    )}

                    {step.showConfirmButton && (
                      <button
                        onClick={handleManualConfirm}
                        className="confirm-btn"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        I've Enabled It
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="help-section">
          <div className="step-content-wrapper">
            <div className="icon-wrapper" style={{ width: '3rem', height: '3rem', backgroundColor: '#F3F4F6', color: '#6B7280' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3 className="step-title" style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Need Help?</h3>
              <p className="subtitle" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Check our documentation or contact support.
              </p>
              <button onClick={handleViewDocumentation} className="help-link">
                View Documentation →
              </button>
            </div>
          </div>
        </div>
      </div>
    </s-page>
  );
}
