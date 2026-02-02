// Japanese translations (日本語)
export const ja = {
    // Common
    common: {
        save: "変更を保存",
        cancel: "キャンセル",
        loading: "読み込み中...",
        success: "成功",
        error: "エラー",
        viewAll: "すべて表示",
        learnMore: "詳細を見る",
        used: "使用済み",
        exceeded: "超過",
        freeTrial: "無料トライアル",
        daily: "日次",
        weekly: "週次",
        monthly: "月次",
        resetDefault: "デフォルトに戻す",
        perMonth: "/月",
        back: "戻る",
    },

    // Navigation
    nav: {
        home: "ホーム",
        dashboard: "ダッシュボード",
        appearance: "外観設定",
    },

    // Onboarding Page
    onboarding: {
        title: "バーチャル試着へようこそ",
        subtitle: "あと数ステップで、お客様の体験を変革できます。",
        step1: {
            label: "ステップ 1",
            title: "アプリのインストール",
            desc: "アプリがストアに正常にインストールされました。",
        },
        step2: {
            label: "ステップ 2",
            title: "アプリブロックを有効化",
            descEnabled: "ウィジェットがテーマで有効になっています。",
            descDisabled: "テーマエディターで「バーチャル試着」ブロックを有効にしてください。",
            action: "テーマエディターを開く",
        },
        step3: {
            label: "ステップ 3",
            title: "プレビューと公開",
            desc: "商品ページで魔法のような体験をご確認ください。",
            action: "ストアを表示",
        },
        status: {
            completed: "完了",
            actionRequired: "対応が必要",
            nextStep: "次のステップ",
        },
        support: {
            title: "サポートが必要ですか？",
            docs: "ドキュメントを読む",
            contact: "サポートに連絡",
        },
    },

    // Dashboard Page
    dashboard: {
        welcomeTitle: "おかえりなさい、{name} 👋",
        welcomeSubtitle: "本日のストアの状況です。",
        viewGuide: "インストールガイドを見る",
        usageBilling: {
            title: "使用量と請求",
            monthly: "月間",
            tryOns: "回の試着",
            remaining: "残り",
            currentPlan: "現在のプラン",
            renewsOn: "更新日",
            changePlan: "プランを変更",
            upgradePlan: "プランをアップグレード",
        },
        stats: {
            totalTryOns: "総試着回数",
            uniqueVisitors: "ユニーク訪問者",
            conversionRate: "コンバージョン率",
            revenueImpact: "売上への影響",
        },
        products: {
            title: "人気商品",
            viewAll: "すべて表示",
            product: "商品",
            tryOns: "試着回数",
            conversions: "コンバージョン",
            noProducts: "商品データがありません",
        },
        trend: {
            title: "使用傾向",
            daily: "日次",
            weekly: "週次",
            monthly: "月次",
            tryOnsLabel: "回の試着",
        },
        deviceDistribution: {
            title: "デバイス分布",
            desktop: "デスクトップ",
            mobile: "モバイル",
            tablet: "タブレット",
            unknown: "不明",
            tryOns: "回の試着",
            noData: "デバイスデータがまだありません。試着後にここに表示されます。",
        },
        billing: {
            title: "請求",
            shopifySettings: "Shopify請求設定",
            subscriptionActive: "サブスクリプション有効",
            managedVia: "Shopify請求で管理",
            invoicesTitle: "請求書と支払い",
            invoicesDesc: "このアプリの料金はすべて月次のShopify請求書に統合されます。詳細な支払い履歴の確認と請求書のダウンロードは",
            shopifyAdmin: "Shopify管理画面",
            viewHistory: "すべての履歴を表示",
            expires: "有効期限",
        },
    },

    // Subscription Modal
    subscription: {
        title: "サブスクリプション管理",
        subtitle: "ニーズに合ったプランをお選びください。いつでもアップグレード・ダウングレード可能です。",
        mostPopular: "一番人気",
        currentPlan: "現在のプラン",
        upgrade: "アップグレード",
        downgrade: "ダウングレード",
        selectPlan: "プランを選択",
        footer: "すべてのプランに14日間の無料トライアルが含まれます。いつでもキャンセル可能。",
        confirmDowngrade: "{plan}にダウングレードしてもよろしいですか？特典が失われます。",
        plans: {
            free: {
                name: "無料トライアル",
                desc: "お試しや個人利用に最適です。",
                features: {
                    tryOns: "月10回の試着",
                    speed: "標準速度",
                    support: "コミュニティサポート",
                    catalog: "基本カタログ",
                },
            },
            professional: {
                name: "プロフェッショナル",
                desc: "成長中のビジネスに必要なパワーと柔軟性を提供。",
                features: {
                    tryOns: "無制限の試着",
                    processing: "優先処理",
                    support: "メールサポート",
                    analytics: "高度な分析",
                    branding: "カスタムブランディング",
                },
            },
            enterprise: {
                name: "エンタープライズ",
                desc: "大規模商店向けのフルスケールソリューション。",
                features: {
                    api: "専用APIアクセス",
                    support: "24時間電話サポート",
                    integration: "カスタム統合",
                    sla: "SLA保証",
                    manager: "専任サクセスマネージャー",
                },
            },
        },
    },

    // Cancel Subscription Modal
    cancelSubscription: {
        cancel: "キャンセル",
        step1Title: "ご解約いただくのは残念です",
        step1Desc: "解約の理由をお聞かせください。いただいたフィードバックはサービス改善に役立てます。",
        step2Title: "お待ちください！特別オファー",
        step3Title: "最終確認",
        reasons: {
            expensive: "料金が高い",
            notUsing: "あまり使用していない",
            missingFeatures: "必要な機能がない",
            bugs: "技術的な問題・バグ",
            other: "その他",
        },
        feedbackPlaceholder: "その他ご意見があればお聞かせください",
        step2Offer: "ぜひお客様としてお付き合いを続けたいと思っています。ご継続いただける場合、今後3ヶ月間20%割引を適用いたします。",
        step2OfferLabel: "現在のプラン：プロフェッショナル（20%オフ）",
        step2DontLose: "進捗を失わないでください！",
        step3Confirm: "本当によろしいですか？サブスクリプションは即時解約され、プレミアム機能へのアクセスが失われます。",
        keepSubscription: "サブスクリプションを継続",
        continue: "続行",
        noThanks: "結構です、解約を続ける",
        applyDiscount: "割引を適用",
        confirmCancel: "解約を確定",
        // 割引確認
        discountConfirmTitle: "割引適用の確認",
        discountConfirmDesc: "この割引を適用すると、以下が行われます：",
        discountConfirmItem1: "現在のサブスクリプションが置き換えられます",
        discountConfirmItem2: "20%割引が3ヶ月間適用されます",
        discountConfirmItem3: "確認のためShopifyにリダイレクトされます",
        confirmAndApply: "確認して適用",
    },

    // Appearance Page
    appearance: {
        title: "外観をカスタマイズ",
        subtitle: "ブランドアイデンティティに合わせてバーチャル試着ウィジェットをデザイン。",
        saveChanges: "変更を保存",
        saving: "保存中...",
        sections: {
            position: {
                title: "配置",
                placement: "ウィジェットの位置",
                bottomLeft: "左下",
                bottomRight: "右下",
                horizontalOffset: "水平オフセット",
                verticalOffset: "垂直オフセット",
            },
            brand: {
                title: "ブランドとアイデンティティ",
                primaryColor: "メインカラー",
                textColor: "テキストカラー",
                widgetText: "ウィジェットテキスト",
                modalTitle: "モーダルタイトル",
            },
            behavior: {
                title: "動作設定",
                smartDetection: "スマート検出",
                smartDetectionDesc: "衣料品ページのみに表示",
                showOnMobile: "モバイル表示",
                showOnMobileDesc: "モバイルデバイスでウィジェットを表示",
                animationStyle: "アニメーションスタイル",
                fadeIn: "フェードイン",
                slideUp: "スライドアップ",
                scale: "スケール",
                bounce: "バウンス",
            },
        },
        preview: {
            title: "ライブプレビュー",
            desktop: "デスクトップ",
            mobile: "モバイル",
        },
    },

    // Products Analytics Page
    products: {
        title: "人気商品",
        subtitle: "ご試着いただいた製品の詳細なパフォーマンス指標を確認できます",
        allProducts: "全商品",
        totalTryOns: "総試着回数",
        totalAddToCarts: "カート追加",
        totalOrders: "注文数",
        totalRevenue: "売上影響額",
        product: "商品",
        tryOns: "試着回数",
        addToCarts: "カート追加",
        orders: "注文",
        revenue: "売上",
        conversion: "コンバージョン",
        lastTryOn: "最終試着日",
        emptyTitle: "商品データがありません",
        emptyText: "お客様が試着機能を使用すると、ここに商品分析が表示されます。",
        searchPlaceholder: "製品名で検索",
        sortBy: "並べ替え",
        sort: {
            tryOnsDesc: "試着回数 (多い順)",
            tryOnsAsc: "試着回数 (少ない順)",
            revenueDesc: "収益 (高い順)",
            revenueAsc: "収益 (低い順)",
            ordersDesc: "注文数 (多い順)",
            ordersAsc: "注文数 (少ない順)",
        },
        pagination: {
            label: "ページネーション",
            pageOf: "ページ {current} / {total}",
        }
    },

    // Usage Details Modal
    usageModal: {
        title: "使用状況の詳細",
        period: "過去30日間",
        exportReport: "レポートをエクスポート",
        tabs: {
            daily: "日次内訳",
            product: "商品別使用状況",
        },
        metrics: {
            totalTryOns: "総試着数",
            activeProducts: "アクティブな商品",
            successRate: "成功率",
            avgDuration: "平均時間",
        },
        dailyHeaders: {
            date: "日付",
            tryOns: "試着数",
            uniqueUsers: "ユニークユーザー",
            conversionEst: "推定CV",
        },
        productHeaders: {
            productName: "商品名",
            sku: "SKU",
            totalTryOns: "総試着数",
            activeWidget: "ウィジェット稼働",
        },
        pagination: {
            previous: "前へ",
            next: "次へ",
            pageOf: "{page} / {total} ページ",
        },
    },
};
