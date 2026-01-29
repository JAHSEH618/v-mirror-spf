// Chinese translations (简体中文)
export const zh = {
    // Common
    common: {
        save: "保存更改",
        cancel: "取消",
        loading: "加载中...",
        success: "成功",
        error: "错误",
        viewAll: "查看全部",
        learnMore: "了解更多",
        used: "已使用",
        exceeded: "已超出",
        freeTrial: "免费试用",
        daily: "每日",
        weekly: "每周",
        monthly: "每月",
        resetDefault: "重置默认",
        perMonth: "/月",
        back: "返回",
    },

    // Navigation
    nav: {
        home: "首页",
        dashboard: "仪表盘",
        appearance: "外观设置",
    },

    // Onboarding Page
    onboarding: {
        title: "欢迎使用虚拟试穿",
        subtitle: "只需几步，即可为您的客户带来全新体验。",
        step1: {
            label: "步骤 1",
            title: "应用安装",
            desc: "应用已成功安装到您的商店。",
        },
        step2: {
            label: "步骤 2",
            title: "启用应用模块",
            descEnabled: "小部件已在您的主题中激活。",
            descDisabled: "在主题编辑器中启用「虚拟试穿」模块以使其可见。",
            action: "打开主题编辑器",
        },
        step3: {
            label: "步骤 3",
            title: "预览并上线",
            desc: "查看您的产品页面，体验神奇效果。",
            action: "访问商店",
        },
        status: {
            completed: "已完成",
            actionRequired: "需要操作",
            nextStep: "下一步",
        },
        support: {
            title: "需要帮助？",
            docs: "阅读文档",
            contact: "联系支持",
        },
    },

    // Dashboard Page
    dashboard: {
        welcomeTitle: "欢迎回来, {name} 👋",
        welcomeSubtitle: "以下是您商店今天的情况。",
        viewGuide: "查看安装指南",
        usageBilling: {
            title: "用量与账单",
            monthly: "月度",
            tryOns: "次试穿",
            remaining: "剩余",
            currentPlan: "当前套餐",
            renewsOn: "续费日期",
            changePlan: "更换套餐",
            upgradePlan: "升级套餐",
        },
        stats: {
            totalTryOns: "总试穿次数",
            uniqueVisitors: "独立访客",
            conversionRate: "转化率",
            revenueImpact: "收入影响",
        },
        products: {
            title: "热门产品",
            viewAll: "查看全部",
            product: "产品",
            tryOns: "试穿次数",
            conversions: "转化率",
            noProducts: "暂无产品数据",
        },
        trend: {
            title: "使用趋势",
            daily: "每日",
            weekly: "每周",
            monthly: "每月",
            tryOnsLabel: "次试穿",
        },
        deviceDistribution: {
            title: "设备分布",
            desktop: "桌面端",
            mobile: "移动端",
            tablet: "平板",
            unknown: "未知",
            tryOns: "次试穿",
            noData: "暂无设备数据。客户使用试穿功能后将在此显示。",
        },
        billing: {
            title: "账单",
            shopifySettings: "Shopify 账单设置",
            subscriptionActive: "订阅已激活",
            managedVia: "通过 Shopify 账单管理",
            invoicesTitle: "发票与付款",
            invoicesDesc: "此应用的所有费用将合并到您的月度 Shopify 发票中。您可以直接从",
            shopifyAdmin: "Shopify 管理后台",
            viewHistory: "查看全部记录",
            expires: "到期",
        },
    },

    // Subscription Modal
    subscription: {
        title: "管理订阅",
        subtitle: "选择适合您需求的套餐。随时升级或降级。",
        mostPopular: "最受欢迎",
        currentPlan: "当前套餐",
        upgrade: "升级",
        downgrade: "降级",
        selectPlan: "选择套餐",
        footer: "所有套餐均包含14天免费试用。随时可取消。",
        confirmDowngrade: "确定要降级到 {plan} 吗？部分权益将失效。",
        plans: {
            free: {
                name: "免费试用",
                desc: "非常适合测试和个人使用。",
                features: {
                    tryOns: "每月10次试穿",
                    speed: "标准速度",
                    support: "社区支持",
                    catalog: "基础目录",
                },
            },
            professional: {
                name: "专业版",
                desc: "适合需要更强大功能的成长型企业。",
                features: {
                    tryOns: "无限次试穿",
                    processing: "高优先级处理",
                    support: "邮件支持",
                    analytics: "高级分析",
                    branding: "自定义品牌",
                },
            },
            enterprise: {
                name: "企业版",
                desc: "为高流量商户提供的全面解决方案。",
                features: {
                    api: "专属API访问",
                    support: "7×24小时电话支持",
                    integration: "定制集成",
                    sla: "SLA保障",
                    manager: "专属客户成功经理",
                },
            },
        },
    },

    // Cancel Subscription Modal
    cancelSubscription: {
        cancel: "取消订阅",
        step1Title: "很遗憾看到您离开",
        step1Desc: "请告诉我们您取消的原因，您的反馈有助于我们改进。",
        step2Title: "等等！特别优惠",
        step3Title: "最终确认",
        reasons: {
            expensive: "太贵了",
            notUsing: "使用频率不高",
            missingFeatures: "缺少功能",
            bugs: "技术问题/Bug",
            other: "其他",
        },
        feedbackPlaceholder: "还有其他想分享的吗？",
        step2Offer: "我们非常希望留住您。如果您决定留下，接下来3个月将享受20%特别折扣。",
        step2OfferLabel: "当前套餐：专业版（8折优惠）",
        step2DontLose: "不要失去您的进度！",
        step3Confirm: "确定要取消吗？您的订阅将立即取消，您将失去高级功能的访问权限。",
        keepSubscription: "保留订阅",
        continue: "继续",
        noThanks: "不用了，继续取消",
        applyDiscount: "应用折扣",
        confirmCancel: "确认取消",
    },

    // Appearance Page
    appearance: {
        title: "自定义外观",
        subtitle: "设计您的虚拟试穿小部件，匹配您的品牌形象。",
        saveChanges: "保存更改",
        saving: "保存中...",
        sections: {
            position: {
                title: "位置设置",
                placement: "小部件位置",
                bottomLeft: "左下角",
                bottomRight: "右下角",
                horizontalOffset: "水平偏移",
                verticalOffset: "垂直偏移",
            },
            brand: {
                title: "品牌与标识",
                primaryColor: "主色调",
                textColor: "文字颜色",
                widgetText: "按钮文字",
                modalTitle: "弹窗标题",
            },
            behavior: {
                title: "行为设置",
                smartDetection: "智能检测",
                smartDetectionDesc: "仅在服装产品页面显示",
                showOnMobile: "移动端显示",
                showOnMobileDesc: "在移动设备上显示小部件",
                animationStyle: "动画样式",
                fadeIn: "淡入",
                slideUp: "上滑",
                scale: "缩放",
                bounce: "弹跳",
            },
        },
        preview: {
            title: "实时预览",
            desktop: "桌面端",
            mobile: "移动端",
        },
    },

    // Products Analytics Page
    products: {
        title: "产品分析",
        allProducts: "全部产品",
        totalTryOns: "总试穿次数",
        totalAddToCarts: "加入购物车",
        totalOrders: "订单数",
        totalRevenue: "收入影响",
        product: "产品",
        tryOns: "试穿次数",
        addToCarts: "加购",
        orders: "订单",
        revenue: "收入",
        conversion: "转化率",
        lastTryOn: "最后试穿",
        emptyTitle: "暂无产品数据",
        emptyText: "客户使用试穿功能后，产品分析数据将在此显示。",
    },
};

