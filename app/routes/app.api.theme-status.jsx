import { authenticate, apiVersion } from "../shopify.server";

export const loader = async ({ request }) => {
    const { session, admin } = await authenticate.admin(request);

    try {
        const themesResponse = await admin.graphql(
            `#graphql
            query getThemes {
                themes(first: 5, roles: MAIN) {
                    nodes { id }
                }
            }`
        );
        const themesData = await themesResponse.json();
        const mainThemeId = themesData.data?.themes?.nodes?.[0]?.id;

        if (mainThemeId) {
            const themeId = mainThemeId.split('/').pop();
            const response = await fetch(
                `https://${session.shop}/admin/api/${apiVersion}/themes/${themeId}/assets.json?asset[key]=config/settings_data.json`,
                { headers: { "X-Shopify-Access-Token": session.accessToken } }
            );
            const json = await response.json();
            const asset = json.asset;

            if (asset?.value) {
                const settingsData = JSON.parse(asset.value);
                const blocks = settingsData.current?.blocks || {};
                const isEnabled = Object.values(blocks).some((block) => {
                    return block.type.includes("try-on-widget") && String(block.disabled) !== "true";
                });

                return { isEmbedEnabled: isEnabled };
            }
        }
    } catch (error) {
        console.warn("[Theme Check API] Failed:", error);
    }

    return { isEmbedEnabled: false };
};
