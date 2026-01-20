# Shopify AI Virtual Try-On - UI 组件示例代码 (JavaScript 版本)

本项目包含 Shopify 一键试穿插件的完整 UI 组件示例代码,基于 **React + JavaScript + TailwindCSS** 开发。

## 📁 文件结构

```
.
├── TryOnModal.jsx              # 前端试穿弹窗组件
├── AdminDashboard.jsx          # 商家后台 Dashboard 主界面
├── OnboardingPage.jsx          # 安装引导页面
├── AppearanceSettings.jsx      # 外观配置页面
└── README_JS.md                # 本文档
```

## 🎨 组件说明

### 1. TryOnModal.jsx - 前端试穿弹窗

**功能特性:**
- 响应式模态框设计(PC端居中弹窗,移动端全屏)
- 商品颜色选择器(支持多种颜色切换)
- 用户照片上传(支持文件上传和示例模特选择)
- 三种视图状态:上传、加载中、结果展示
- Before/After 对比滑块
- 下载、加购、收藏、分享功能

**Props 参数:**
```javascript
// isOpen: boolean - 控制弹窗显示/隐藏
// onClose: function - 关闭弹窗回调
// productImage: string - 商品主图 URL
// productName: string - 商品名称
// availableColors: array - 可选颜色列表
//   - name: string - 颜色名称
//   - hex: string - 颜色十六进制值
//   - image: string - 该颜色对应的商品图片 URL
```

**使用示例:**
```jsx
import { useState } from 'react';
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

### 2. AdminDashboard.jsx - 商家后台主界面

**功能特性:**
- 顶部导航栏(Dashboard、Settings、Appearance、Analytics)
- 欢迎横幅
- 用量与计费卡片(圆形进度环、套餐信息、升级按钮)
- 快速统计卡片(总试穿次数、转化率、收益影响)
- 月度使用趋势图表(基于 recharts)
- 热门商品排行表

**Props 参数:**
```javascript
// merchantName: string - 商家名称
```

**依赖安装:**
```bash
npm install recharts lucide-react
```

**使用示例:**
```jsx
import AdminDashboard from './AdminDashboard';

function App() {
  return <AdminDashboard merchantName="Fashion Store" />;
}
```

### 3. OnboardingPage.jsx - 安装引导页面

**功能特性:**
- 三步安装引导流程
- 步骤状态标识(已完成、需要操作、待处理)
- 可配置的操作按钮
- 帮助文档入口

**核心数据结构:**
```javascript
const step = {
  id: 1,                          // 步骤编号
  title: 'Step Title',            // 步骤标题
  description: 'Description',     // 步骤描述
  icon: <IconComponent />,        // 步骤图标
  status: 'completed',            // 状态: 'completed' | 'action-required' | 'pending'
  actionButton: {                 // 可选的操作按钮
    label: 'Button Label',
    onClick: () => {},
    variant: 'primary'            // 'primary' | 'secondary'
  }
};
```

**使用示例:**
```jsx
import OnboardingPage from './OnboardingPage';

function App() {
  return <OnboardingPage />;
}
```

### 4. AppearanceSettings.jsx - 外观配置页面

**功能特性:**
- 浮球位置配置(左下/右下)
- 偏移量滑块调整
- 颜色选择器(主色调、按钮文字颜色)
- 文案自定义(按钮文字、弹窗标题、上传说明)
- 高级选项(移动端显示、自动检测服装、动画样式)
- 实时预览
- 保存/重置功能

**配置对象结构:**
```javascript
const config = {
  position: 'bottom-right',              // 'bottom-right' | 'bottom-left'
  horizontalOffset: 20,                  // 水平偏移量 (0-100)
  verticalOffset: 20,                    // 垂直偏移量 (0-100)
  primaryColor: '#7C3AED',               // 主色调
  buttonTextColor: '#FFFFFF',            // 按钮文字颜色
  buttonText: 'Try It On',               // 按钮文字
  modalTitle: 'AI Virtual Try-On',       // 弹窗标题
  uploadInstructions: 'Upload...',       // 上传说明
  showOnMobile: true,                    // 移动端显示
  autoDetectClothing: true,              // 自动检测服装
  animationStyle: 'fade-in'              // 'fade-in' | 'slide-up' | 'scale'
};
```

**使用示例:**
```jsx
import AppearanceSettings from './AppearanceSettings';

function App() {
  return <AppearanceSettings />;
}
```

## 🛠️ 技术栈

- **React 18+** - UI 框架
- **JavaScript (ES6+)** - 编程语言
- **TailwindCSS** - 样式框架
- **Lucide React** - 图标库
- **Recharts** - 图表库(仅 Dashboard 使用)

## 📦 安装依赖

```bash
# 安装核心依赖
npm install react react-dom

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
    "./src/**/*.{js,jsx}",
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

在 `src/index.css` 中添加:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 🎯 集成到 Shopify App

### 前端组件集成(Theme Extension)

1. 在 Shopify Theme Extension 中创建 App Block
2. 将 `TryOnModal.jsx` 集成到商品详情页
3. 使用 Shopify Liquid 变量传递商品数据

**示例 Liquid 模板:**

```liquid
{% schema %}
{
  "name": "AI Virtual Try-On",
  "target": "section",
  "settings": []
}
{% endschema %}

<div id="try-on-widget"></div>

<script>
  // 传递商品数据到 React 组件
  window.productData = {
    image: "{{ product.featured_image | img_url: 'large' }}",
    name: "{{ product.title }}",
    colors: {{ product.variants | map: 'option1' | uniq | json }}
  };
</script>
```

**React 入口文件示例:**

```jsx
// app.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import TryOnModal from './TryOnModal';
import './index.css';

function App() {
  const [isOpen, setIsOpen] = React.useState(false);
  const productData = window.productData || {};

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
      >
        🤖 Try It On
      </button>
      
      <TryOnModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        productImage={productData.image}
        productName={productData.name}
        availableColors={productData.colors || []}
      />
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('try-on-widget'));
root.render(<App />);
```

### 后台组件集成(Remix App)

1. 在 Shopify Remix App 的 `app/routes` 中创建路由
2. 集成 Dashboard、Onboarding、Settings 组件

**路由示例:**

```jsx
// app/routes/app._index.jsx
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import AdminDashboard from "~/components/AdminDashboard";

export const loader = async ({ request }) => {
  // 获取商家信息
  const admin = await authenticate.admin(request);
  return json({
    shop: admin.session.shop,
  });
};

export default function Index() {
  const { shop } = useLoaderData();
  return <AdminDashboard merchantName={shop} />;
}
```

```jsx
// app/routes/app.onboarding.jsx
import OnboardingPage from "~/components/OnboardingPage";

export default function Onboarding() {
  return <OnboardingPage />;
}
```

```jsx
// app/routes/app.settings.jsx
import AppearanceSettings from "~/components/AppearanceSettings";

export default function Settings() {
  return <AppearanceSettings />;
}
```

## 🔌 API 集成建议

### 试穿生成 API

```javascript
// 在 TryOnModal.jsx 中的 handleGenerateTryOn 函数
const handleGenerateTryOn = async () => {
  if (!userPhoto) return;

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

```javascript
// 在 AppearanceSettings.jsx 中的 handleSave 函数
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
3. 使用内联样式 `style` 属性实现动态主题

**示例:**

```jsx
// 动态主题色
<button 
  style={{ backgroundColor: customColor }}
  className="px-4 py-2 rounded-lg text-white"
>
  Custom Button
</button>
```

## 🔒 安全注意事项

1. **API Key 保护**: 所有 AI 服务密钥必须存储在后端环境变量中
2. **HMAC 验证**: App Proxy 请求需验证 Shopify 签名
3. **图片上传**: 前端需进行文件类型和大小校验
4. **XSS 防护**: 用户输入需进行转义处理

**文件上传校验示例:**

```javascript
const handleFileUpload = (event) => {
  const file = event.target.files?.[0];
  
  // 文件类型校验
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    alert('Only JPG and PNG files are allowed.');
    return;
  }
  
  // 文件大小校验 (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('File size must be less than 5MB.');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    setUserPhoto(e.target?.result);
  };
  reader.readAsDataURL(file);
};
```

## 🚀 开发调试

### 启动开发服务器

```bash
# 使用 Vite
npm run dev

# 使用 Create React App
npm start

# 使用 Remix
npm run dev
```

### 构建生产版本

```bash
# 使用 Vite
npm run build

# 使用 Create React App
npm run build

# 使用 Remix
npm run build
```

## 📊 性能优化建议

1. **图片压缩**: 上传前使用 Canvas API 压缩图片
2. **懒加载**: 使用 `React.lazy()` 和 `Suspense` 懒加载组件
3. **代码分割**: 按路由分割代码
4. **缓存策略**: 缓存已生成的试穿结果

**图片压缩示例:**

```javascript
const compressImage = (file, maxWidth = 1024) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.9);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};
```

## 🧪 测试建议

### 单元测试 (Jest + React Testing Library)

```bash
npm install -D @testing-library/react @testing-library/jest-dom jest
```

**测试示例:**

```jsx
// TryOnModal.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import TryOnModal from './TryOnModal';

test('renders modal when isOpen is true', () => {
  const colors = [
    { name: 'Green', hex: '#00FF00', image: '/green.jpg' }
  ];
  
  render(
    <TryOnModal
      isOpen={true}
      onClose={() => {}}
      productImage="/product.jpg"
      productName="Test Product"
      availableColors={colors}
    />
  );
  
  expect(screen.getByText('AI Virtual Try-On')).toBeInTheDocument();
});
```

## 📄 许可证

本示例代码仅供学习参考使用。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📞 联系方式

如有问题,请访问 [项目文档](https://docs.example.com) 或联系技术支持。

---

## 🆚 TypeScript vs JavaScript

如果你需要 TypeScript 版本,所有组件都可以轻松转换:

1. 将文件扩展名从 `.jsx` 改为 `.tsx`
2. 添加类型注解和接口定义
3. 安装 TypeScript: `npm install -D typescript @types/react @types/react-dom`

**TypeScript 转换示例:**

```typescript
// JavaScript
const TryOnModal = ({ isOpen, onClose, productImage }) => {
  // ...
};

// TypeScript
interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  productImage: string;
}

const TryOnModal: React.FC<TryOnModalProps> = ({ isOpen, onClose, productImage }) => {
  // ...
};
```
