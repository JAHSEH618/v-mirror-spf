import { Outlet, useLoaderData, useRouteError, Link } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { ThemeProvider, useTheme } from "../components/ThemeContext";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageProvider } from "../components/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import translations from "@shopify/polaris/locales/en.json";
import adminStyles from "../styles/admin.css?url";

export const links = () => [{ rel: "stylesheet", href: adminStyles }];

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

// Internal component to consume theme context and render Polaris provider
function AppContent() {
  const { theme } = useTheme();

  return (
    <PolarisAppProvider
      i18n={translations}
      features={{ polarisSummerEditions2023: true }}
      colorScheme={theme === 'dark' ? 'dark' : 'light'}
    >
      <NavMenu>
        <Link to="/app" rel="home">Home</Link>
        <Link to="/app/dashboard">Dashboard</Link>
        <Link to="/app/appearance">Appearance</Link>
      </NavMenu>
      <div className="top-controls">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <Outlet />
    </PolarisAppProvider>
  );
}

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <LanguageProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </LanguageProvider>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
