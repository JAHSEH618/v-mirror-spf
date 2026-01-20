# Shopify AI Virtual Try-On - UI 组件示例代码

本项目包含 Shopify 一键试穿插件的完整 UI 组件示例代码,基于 React + TypeScript + TailwindCSS 开发。

## 📁 文件结构

```
.
├── TryOnModal.tsx              # 前端试穿弹窗组件
├── AdminDashboard.tsx          # 商家后台 Dashboard 主界面
├── OnboardingPage.tsx          # 安装引导页面
├── AppearanceSettings.tsx      # 外观配置页面
└── README.md                   # 本文档
```

## 🎨 组件说明

### 1. TryOnModal.tsx - 前端试穿弹窗

**功能特性:**
- 响应式模态框设计(PC端居中弹窗,移动端全屏)
- 商品颜色选择器(支持多种颜色切换)
- 用户照片上传(支持文件上传和示例模特选择)
- 三种视图状态:上传、加载中、结果展示
- Before/After 对比滑块
- 下载、加购、收藏、分享功能

**Props 接口:**
```typescript
interface TryOnModalProps {
  isOpen: boolean;              // 控制弹窗显示/隐藏
  onClose: () => void;          // 关闭弹窗回调
  productImage: string;         // 商品主图 URL
  productName: string;          // 商品名称
  availableColors: Array<{      // 可选颜色列表
    name: string;               // 颜色名称
    hex: string;                // 颜色十六进制值
    image: string;              // 该颜色对应的商品图片 URL
  }>;
}
```

**使用示例:**
```tsx
import TryOnModal from './TryOnModal';

function ProductPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const colors = [
    { name: 'Olive Green', hex: '#6B7F5A', image: '/images/jacket-green.jpg' },
    { name: 'Black', hex: '#000000', image: '/images/jacket-black.jpg' },
    { name: 'Navy Blue', hex: '#1E3A5F', image: '/images/jacket-navy.jpg' },
  ];

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>
        Try It On
      </button>
      
      <TryOnModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productImage="/images/jacket-green.jpg"
        productName="Bomber Jacket"
        availableColors={colors}
      />
    </>
  );
}
```

### 2. AdminDashboard.tsx - 商家后台主界面

**功能特性:**
- 顶部导航栏(Dashboard、Settings、Appearance、Analytics)
- 欢迎横幅
- 用量与计费卡片(圆形进度环、套餐信息、升级按钮)
- 快速统计卡片(总试穿次数、转化率、收益影响)
- 月度使用趋势图表(基于 recharts)
- 热门商品排行表

**Props 接口:**
```typescript
interface DashboardProps {
  merchantName: string;         // 商家名称
}
```

**依赖安装:**
```bash
npm install recharts lucide-react
```

**使用示例:**
```tsx
import AdminDashboard from './AdminDashboard';

function App() {
  return <AdminDashboard merchantName="Fashion Store" />;
}
```

### 3. OnboardingPage.tsx - 安装引导页面

**功能特性:**
- 三步安装引导流程
- 步骤状态标识(已完成、需要操作、待处理)
- 可配置的操作按钮
- 帮助文档入口

**核心数据结构:**
```typescript
interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'action-required' | 'pending';
  actionButton?: {
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary';
  };
}
```

**使用示例:**
```tsx
import OnboardingPage from './OnboardingPage';

function App() {
  return <OnboardingPage />;
}
```

### 4. AppearanceSettings.tsx - 外观配置页面

**功能特性:**
- 浮球位置配置(左下/右下)
- 偏移量滑块调整
- 颜色选择器(主色调、按钮文字颜色)
- 文案自定义(按钮文字、弹窗标题、上传说明)
- 高级选项(移动端显示、自动检测服装、动画样式)
- 实时预览
- 保存/重置功能

**配置接口:**
```typescript
interface AppearanceConfig {
  position: 'bottom-right' | 'bottom-left';
  horizontalOffset: number;
  verticalOffset: number;
  primaryColor: string;
  buttonTextColor: string;
  buttonText: string;
  modalTitle: string;
  uploadInstructions: string;
  showOnMobile: boolean;
  autoDetectClothing: boolean;
  animationStyle: 'fade-in' | 'slide-up' | 'scale';
}
```

**使用示例:**
```tsx
import AppearanceSettings from './AppearanceSettings';

function App() {
  return <AppearanceSettings />;
}
```

## 🛠️ 技术栈

- **React 18+** - UI 框架
- **TypeScript** - 类型安全
- **TailwindCSS** - 样式框架
- **Lucide React** - 图标库
- **Recharts** - 图表库(仅 Dashboard 使用)

## 📦 安装依赖

```bash
# 安装核心依赖
npm install react react-dom typescript

# 安装 UI 依赖
npm install lucide-react recharts

# 安装 TailwindCSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## ⚙️ TailwindCSS 配置

在 `tailwind.config.js` 中添加:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        purple: {
          600: '#7C3AED',
          700: '#6D28D9',
        },
      },
    },
  },
  plugins: [],
}
```

## 🎯 集成到 Shopify App

### 前端组件集成(Theme Extension)

1. 在 Shopify Theme Extension 中创建 App Block
2. 将 `TryOnModal.tsx` 集成到商品详情页
3. 使用 Shopify Liquid 变量传递商品数据

```liquid
{% schema %}
{
  "name": "AI Virtual Try-On",
  "target": "section",
  "settings": []
}
{% endschema %}

<script>
  // 传递商品数据到 React 组件
  window.productData = {
    image: "{{ product.featured_image | img_url: 'large' }}",
    name: "{{ product.title }}",
    colors: {{ product.variants | map: 'option1' | uniq | json }}
  };
</script>
```

### 后台组件集成(Remix App)

1. 在 Shopify Remix App 的 `app/routes` 中创建路由
2. 集成 Dashboard、Onboarding、Settings 组件

```typescript
// app/routes/app._index.tsx
import AdminDashboard from '~/components/AdminDashboard';

export default function Index() {
  const { admin } = useLoaderData();
  return <AdminDashboard merchantName={admin.shop.name} />;
}
```

## 🔌 API 集成建议

### 试穿生成 API

```typescript
// 在 TryOnModal 中的 handleGenerateTryOn 函数
const handleGenerateTryOn = async () => {
  setViewState('loading');

  try {
    const response = await fetch('/api/try-on/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userImage: userPhoto,
        garmentImage: selectedColor.image,
      }),
    });

    const { taskId } = await response.json();

    // 轮询查询结果
    const pollResult = async () => {
      const statusRes = await fetch(`/api/try-on/status?taskId=${taskId}`);
      const { status, resultImage } = await statusRes.json();

      if (status === 'completed') {
        setResultImage(resultImage);
        setViewState('result');
      } else if (status === 'failed') {
        alert('Generation failed. Please try again.');
        setViewState('upload');
      } else {
        setTimeout(pollResult, 2000);
      }
    };

    pollResult();
  } catch (error) {
    console.error('Try-on generation error:', error);
    setViewState('upload');
  }
};
```

### 配置保存 API

```typescript
// 在 AppearanceSettings 中的 handleSave 函数
const handleSave = async () => {
  setIsSaving(true);

  try {
    await fetch('/api/settings/appearance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });

    alert('Settings saved successfully!');
  } catch (error) {
    console.error('Save settings error:', error);
    alert('Failed to save settings.');
  } finally {
    setIsSaving(false);
  }
};
```

## 📱 响应式设计

所有组件都已实现响应式设计:

- **TryOnModal**: PC端使用 `md:grid-cols-2`,移动端单列布局
- **AdminDashboard**: 使用 `lg:grid-cols-3` 实现自适应布局
- **OnboardingPage**: 单列布局,移动端友好
- **AppearanceSettings**: 使用 `lg:col-span-2` 实现侧边栏布局

## 🎨 自定义样式

所有组件使用 TailwindCSS 工具类,可通过以下方式自定义:

1. 修改 `tailwind.config.js` 中的主题配置
2. 覆盖组件内的 className
3. 使用 CSS 变量实现动态主题

## 🔒 安全注意事项

1. **API Key 保护**: 所有 AI 服务密钥必须存储在后端环境变量中
2. **HMAC 验证**: App Proxy 请求需验证 Shopify 签名
3. **图片上传**: 前端需进行文件类型和大小校验
4. **XSS 防护**: 用户输入需进行转义处理

## 📄 许可证

本示例代码仅供学习参考使用。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📞 联系方式

如有问题,请访问 [项目文档](https://docs.example.com) 或联系技术支持。
