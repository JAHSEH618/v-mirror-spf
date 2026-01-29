# v-mirror-spf - AI Virtual Try-On for Shopify

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Shopify](https://img.shields.io/badge/Shopify-App-95BF47?logo=shopify&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)

**v-mirror-spf** is a state-of-the-art **Shopify Embedded App** that brings the power of Generative AI to fashion e-commerce. By integrating **KlingAI** and **Google Vertex AI**, it enables customers to virtually "try on" clothing items directly on the product page, significantly boosting engagement and reducing return rates.

Built on the robust **Remix** framework and **Shopify App Bridge**, this application offers a compliant, secure, and high-performance solution for modern Shopify merchants.
> **Now featuring Optimized CDN Delivery and Binary Stream Processing for latency-free interactions.**

[English](./README.md) | [中文说明](./README_zh-CN.md)

---

## 🌟 Key Features

### 🛍️ Client-Side Experience
- **One-Click Try-On Widget**: A lightweight, floating widget that opens a powerful modal.
- **AI-Powered Generation**: Generates realistic try-on images in seconds using advanced diffusion models.
- **Seamless Integration**: Built as a **Shopify App Embed Block**, enabling code-free installation and compatibility with Online Store 2.0 themes.
- **Responsive Design**: Fully optimized for mobile and desktop shoppers.
- **Focus Mode**: Immersive full-screen lightbox preview for examining try-on results in detail.
- **Multi-Language Support**: Automatically detects and serves English, Chinese, Japanese, and Spanish based on user preference.
- **Smart Device Optimization**: Mobile-first design with touch-friendly interactions and layout adaptations.

### 💼 Merchant Dashboard
- **Analytics & Usage**: Track the number of try-ons and subscriber engagement.
- **Advanced Attribution**: Precise session and fingerprint tracking to understand user behavior across devices.
- **Customization Settings**:
    - **Appearance**: Adjust widget colors, button text, and positioning to match brand identity.
    - **Logo**: Upload custom branding for the try-on modal.
- **Subscription Management**: Easy upgrade/downgrade paths with transparent billing history.

### 💳 Billing & Plans
This app includes a fully integrated billing system using the Shopify Billing API.

| Plan | Price | Trial | Usage Limit | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Free Trial** | $0/mo | - | 10 Try-ons | Dev / Testing |
| **Professional** | $49/mo | 14 Days | 1,000 Try-ons | Growing Brands |
| **Enterprise** | $199/mo | 14 Days | 10,000 Try-ons | High Volume Stores |

---

## 🏗️ Architecture

The project follows a modern Remix-based architecture:

- **Frontend**: React components running within Shopify Admin (Polaris) and Storefront (Vanilla JS/CSS injection).
- **Backend API**: Remix Loaders/Actions handling database operations and AI service orchestration.
- **Database**: Prisma ORM (SQLite for dev, easily swappable for PostgreSQL/MySQL) for storing:
    - `BillingInfo`: Subscription status and usage.
    - `BillingHistory`: Record of charges.
    - `WidgetSettings`: Merchant customization preferences.
- **AI Services**: Adapter pattern to switch between KlingAI and Google Vertex AI.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli) installed globaly (`npm install -g @shopify/cli`)
- A Shopify Partner Account
- A Development Store

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/v-mirror-spf.git
    cd v-mirror-spf
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory. You can copy the example:
    ```bash
    cp .env.example .env
    ```
    *Note: When running `npm run dev`, Shopify CLI will automatically update strictly necessary variables.*

4.  **Database Setup**
    Initialize the local SQLite database.
    ```bash
    npm run setup
    ```

### Local Development

1.  Start the development server:
    ```bash
    npm run dev
    ```
2.  Follow the CLI prompts to select your Partner Organization and App.
3.  Once running, press `P` to open the app in your Development Store.

## 📖 Usage Guide

### Enabling the Embed Block
1.  Go to your Shopify Admin > **Online Store** > **Themes**.
2.  Click **Customize** on your current theme.
3.  In the Theme Editor sidebar, click the **App Embeds** icon (third icon).
4.  Toggle **On** for "V-Mirror Widget".
5.  Click **Save**. The widget will now appear on your product pages.

### Configuring AI Credentials
*Note: This is a private app. Ensure your `shopify.server.js` or `.env` is configured with valid API keys for KlingAI/Vertex AI before deploying.*

## 📂 Project Structure

```
v-mirror-spf/
├── app/
│   ├── components/         # Dashboard UI Components (Polaris)
│   ├── routes/             # Remix Routes (Pages & API)
│   │   ├── app._index.jsx  # Main Dashboard
│   │   ├── app.billing.jsx # Subscription Page
│   │   └── api.*.jsx       # Internal API Endpoints
│   ├── shopify.server.js   # Server Config & Auth
│   └── db.server.js        # Prisma Client Instance
├── extensions/             # Theme App Extensions
│   └── v-mirror-theme-ext/ # The Embed Block code (Liquid/JS/CSS)
├── prisma/                 # DB Schema
└── shopify.app.toml        # Application Manifesto
```

## 🛠️ Deployment

This app is designed to be deployed on platforms that support Node.js (e.g., Fly.io, Heroku, Render).

1.  **Build the App**: `npm run build`
2.  **Set Environment Variables**: Ensure `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, and `SCOPES` are set in production.
3.  **Database**: Migrate to a production database (e.g., PostgreSQL) by updating `prisma.schema` and the `DATABASE_URL`.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and submit a Pull Request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
