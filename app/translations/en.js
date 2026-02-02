// English translations (default)
export const en = {
    // Common
    common: {
        save: "Save Changes",
        cancel: "Cancel",
        loading: "Loading...",
        success: "Success",
        error: "Error",
        viewAll: "View All",
        learnMore: "Learn More",
        used: "USED",
        exceeded: "EXCEEDED",
        freeTrial: "Free Trial",
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
        resetDefault: "Reset Default",
        perMonth: "/month",
        back: "Back",
    },

    // Navigation
    nav: {
        home: "Home",
        dashboard: "Dashboard",
        appearance: "Appearance",
    },

    // Onboarding Page
    onboarding: {
        title: "Welcome to Virtual Try-On",
        subtitle: "You're just a few steps away from transforming your customer experience.",
        step1: {
            label: "Step 1",
            title: "App Installation",
            desc: "The app has been successfully installed on your store.",
        },
        step2: {
            label: "Step 2",
            title: "Enable App Block",
            descEnabled: "The widget is active on your theme.",
            descDisabled: "Enable the 'Virtual Try-On' block in your theme editor to make it visible.",
            action: "Open Theme Editor",
        },
        step3: {
            label: "Step 3",
            title: "Preview & Launch",
            desc: "Check your product pages to see the magic in action.",
            action: "Visit Store",
        },
        status: {
            completed: "Completed",
            actionRequired: "Action Required",
            nextStep: "Next Step",
        },
        support: {
            title: "Need assistance?",
            docs: "Read Documentation",
            contact: "Contact Support",
        },
    },

    // Dashboard Page
    dashboard: {
        welcomeTitle: "Welcome back, {name} 👋",
        welcomeSubtitle: "Here is what's happening with your store today.",
        viewGuide: "View Installation Guide",
        usageBilling: {
            title: "Usage & Billing",
            monthly: "Monthly",
            tryOns: "try-ons",
            remaining: "remaining",
            currentPlan: "CURRENT PLAN",
            renewsOn: "Renews on",
            changePlan: "Change Plan",
            upgradePlan: "Upgrade Plan",
        },
        stats: {
            totalTryOns: "Total Try-Ons",
            uniqueVisitors: "Unique Visitors",
            conversionRate: "Conversion Rate",
            revenueImpact: "Revenue Impact",
        },
        products: {
            title: "Popular Products",
            viewAll: "View All",
            product: "Product",
            tryOns: "Try-Ons",
            conversions: "Conversions",
            noProducts: "No product data yet",
        },
        trend: {
            title: "Usage Trend",
            daily: "Daily",
            weekly: "Weekly",
            monthly: "Monthly",
            tryOnsLabel: "Try-Ons",
        },
        deviceDistribution: {
            title: "Device Distribution",
            desktop: "Desktop",
            mobile: "Mobile",
            tablet: "Tablet",
            unknown: "Unknown",
            tryOns: "Try-Ons",
            noData: "No device data collected yet. Try-ons will appear here.",
        },
        billing: {
            title: "Billing",
            shopifySettings: "Shopify Billing Settings",
            subscriptionActive: "Subscription Active",
            managedVia: "Managed via Shopify Billing",
            invoicesTitle: "Invoices & Payments",
            invoicesDesc: "All charges for this app are consolidated into your monthly Shopify invoice. You can view detailed payment history and download invoices directly from your",
            shopifyAdmin: "Shopify Admin",
            viewHistory: "View All History",
            expires: "Expires",
        },
    },

    // Subscription Modal
    subscription: {
        title: "Manage Subscription",
        subtitle: "Choose the plan that fits your needs. Upgrade or downgrade anytime.",
        mostPopular: "Most Popular",
        currentPlan: "Current Plan",
        upgrade: "Upgrade",
        downgrade: "Downgrade",
        selectPlan: "Select Plan",
        footer: "All plans include a 14-day free trial. Cancel anytime.",
        confirmDowngrade: "Are you sure you want to downgrade to {plan}? Benefits will be lost.",
        plans: {
            free: {
                name: "Free Trial",
                desc: "Perfect for testing the waters and personal use.",
                features: {
                    tryOns: "10 Try-Ons / month",
                    speed: "Standard Speed",
                    support: "Community Support",
                    catalog: "Basic Catalog",
                },
            },
            professional: {
                name: "Professional Plan",
                desc: "For growing businesses that need power and flexibility.",
                features: {
                    tryOns: "Unlimited Try-Ons",
                    processing: "High-Priority Processing",
                    support: "Email Support",
                    analytics: "Advanced Analytics",
                    branding: "Custom Branding",
                },
            },
            enterprise: {
                name: "Enterprise",
                desc: "Full-scale solution for high volume merchants.",
                features: {
                    api: "Dedicated API Access",
                    support: "24/7 Phone Support",
                    integration: "Custom Integration",
                    sla: "SLA Guarantee",
                    manager: "Dedicated Success Manager",
                },
            },
        },
    },

    // Cancel Subscription Modal
    cancelSubscription: {
        cancel: "Cancel",
        step1Title: "We're sorry to see you go",
        step1Desc: "Please tell us why you're cancelling. Your feedback helps us improve.",
        step2Title: "Wait! Special Offer",
        step3Title: "Final Confirmation",
        reasons: {
            expensive: "Too expensive",
            notUsing: "I'm not using it enough",
            missingFeatures: "Missing features",
            bugs: "Technical issues / Bugs",
            other: "Other",
        },
        feedbackPlaceholder: "Anything else you'd like to share?",
        step2Offer: "We'd love to keep you as a customer. Here is a special 20% discount for the next 3 months if you decide to stay.",
        step2OfferLabel: "Active Plan: Professional (20% OFF)",
        step2DontLose: "Don't lose your progress!",
        step3Confirm: "Are you sure? Your subscription will be cancelled immediately and you will lose access to premium features.",
        keepSubscription: "Keep Subscription",
        continue: "Continue",
        noThanks: "No thanks, continue to cancel",
        applyDiscount: "Apply Discount",
        confirmCancel: "Confirm Cancellation",
        // Discount Confirmation
        discountConfirmTitle: "Confirm Discount Application",
        discountConfirmDesc: "By applying this discount, the following will happen:",
        discountConfirmItem1: "Your current subscription will be replaced",
        discountConfirmItem2: "20% discount applied for 3 months",
        discountConfirmItem3: "You will be redirected to Shopify to confirm",
        confirmAndApply: "Confirm & Apply",
    },

    // Appearance Page
    appearance: {
        title: "Customize Appearance",
        subtitle: "Design your virtual try-on widget to match your brand identity.",
        saveChanges: "Save Changes",
        saving: "Saving...",
        sections: {
            position: {
                title: "PLACEMENT",
                placement: "Widget Position",
                bottomLeft: "bottom left",
                bottomRight: "bottom right",
                horizontalOffset: "Horizontal Offset",
                verticalOffset: "Vertical Offset",
            },
            brand: {
                title: "BRAND & IDENTITY",
                primaryColor: "Primary Color",
                textColor: "Text Color",
                widgetText: "Widget Text",
                modalTitle: "Modal Title",
            },
            behavior: {
                title: "BEHAVIOR",
                smartDetection: "Smart Detection",
                smartDetectionDesc: "Only show on clothing product pages",
                showOnMobile: "Mobile Display",
                showOnMobileDesc: "Show widget on mobile devices",
                animationStyle: "Animation Style",
                fadeIn: "Fade In",
                slideUp: "Slide Up",
                scale: "Scale",
                bounce: "Bounce",
            },
        },
        preview: {
            title: "Live Preview",
            desktop: "Desktop",
            mobile: "Mobile",
        },
    },

    // Products Analytics Page
    products: {
        title: "Product Analytics",
        subtitle: "Detailed performance metrics for your try-on products",
        allProducts: "All Products",
        totalTryOns: "Total Try-Ons",
        totalAddToCarts: "Add to Carts",
        totalOrders: "Orders",
        totalRevenue: "Revenue Impact",
        product: "Product",
        tryOns: "Try-Ons",
        addToCarts: "Add to Cart",
        orders: "Orders",
        revenue: "Revenue",
        conversion: "Conversion",
        lastTryOn: "Last Try-On",
        emptyTitle: "No product data yet",
        emptyText: "Product analytics will appear here after customers use the try-on feature.",
        searchPlaceholder: "Search by product name",
        sortBy: "Sort by",
        sort: {
            tryOnsDesc: "Try-Ons (High to Low)",
            tryOnsAsc: "Try-Ons (Low to High)",
            revenueDesc: "Revenue (High to Low)",
            revenueAsc: "Revenue (Low to High)",
            ordersDesc: "Orders (High to Low)",
            ordersAsc: "Orders (Low to High)",
        },
        pagination: {
            label: "Pagination",
            pageOf: "Page {current} of {total}",
        }
    },

    // Usage Details Modal
    usageModal: {
        title: "Usage Details",
        period: "Last 30 Days",
        exportReport: "Export Report",
        tabs: {
            daily: "Daily Breakdown",
            product: "Usage by Product",
        },
        metrics: {
            totalTryOns: "Total Try-Ons",
            activeProducts: "Active Products",
            successRate: "Success Rate",
            avgDuration: "Avg. Duration",
        },
        dailyHeaders: {
            date: "Date",
            tryOns: "Try-Ons",
            uniqueUsers: "Unique Users",
            conversionEst: "Conversion Est.",
        },
        productHeaders: {
            productName: "Product Name",
            sku: "SKU",
            totalTryOns: "Total Try-Ons",
            activeWidget: "Active Widget",
        },
        pagination: {
            previous: "Previous",
            next: "Next",
            pageOf: "Page {page} of {total}",
        },
    },
};
