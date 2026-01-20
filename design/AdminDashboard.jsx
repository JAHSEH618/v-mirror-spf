import React from 'react';
import { Bell, HelpCircle, User, TrendingUp, DollarSign, Users } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const AdminDashboard = ({ merchantName }) => {
  // 使用数据
  const usageData = {
    used: 670,
    total: 1000,
    percentage: 67,
  };

  // 订阅信息
  const subscription = {
    plan: 'Professional Plan',
    renewDate: 'Feb 20, 2026',
  };

  // 快速统计数据
  const quickStats = [
    {
      label: 'Total Try-Ons',
      value: '1,247',
      trend: '+12%',
      trendUp: true,
      icon: Users,
    },
    {
      label: 'Conversion Rate',
      value: '18.5%',
      trend: '+3.2%',
      trendUp: true,
      icon: TrendingUp,
    },
    {
      label: 'Revenue Impact',
      value: '$2,340',
      trend: '+8%',
      trendUp: true,
      icon: DollarSign,
    },
  ];

  // 月度使用趋势数据
  const usageTrendData = [
    { date: 'Jan 22', value: 5 },
    { date: 'Jan 25', value: 28 },
    { date: 'Jan 27', value: 18 },
    { date: 'Jan 29', value: 48 },
    { date: 'Jan 31', value: 42 },
    { date: 'Feb 03', value: 65 },
    { date: 'Feb 06', value: 58 },
    { date: 'Feb 09', value: 45 },
    { date: 'Feb 12', value: 68 },
    { date: 'Feb 14', value: 88 },
    { date: 'Feb 17', value: 85 },
    { date: 'Feb 20', value: 95 },
  ];

  // 热门商品数据
  const popularProducts = [
    {
      id: 1,
      name: 'Classic Denim Jacket',
      image: 'https://via.placeholder.com/60x60/4169E1/FFFFFF?text=DJ',
      tryOns: 250,
      conversions: 20,
    },
    {
      id: 2,
      name: 'Floral Summer Dress',
      image: 'https://via.placeholder.com/60x60/FF69B4/FFFFFF?text=FD',
      tryOns: 180,
      conversions: 15,
    },
    {
      id: 3,
      name: 'Leather Crossbody Bag',
      image: 'https://via.placeholder.com/60x60/8B4513/FFFFFF?text=LB',
      tryOns: 150,
      conversions: 18,
    },
    {
      id: 4,
      name: 'Slim-Fit Trousers',
      image: 'https://via.placeholder.com/60x60/2F4F4F/FFFFFF?text=ST',
      tryOns: 120,
      conversions: 12,
    },
    {
      id: 5,
      name: 'Oversized Sunglasses',
      image: 'https://via.placeholder.com/60x60/000000/FFFFFF?text=OS',
      tryOns: 90,
      conversions: 10,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">
                  AI Virtual Try-On
                </span>
              </div>

              <div className="flex gap-6">
                <button className="text-gray-900 font-medium border-b-2 border-purple-600 pb-1">
                  Dashboard
                </button>
                <button className="text-gray-600 hover:text-gray-900 pb-1">
                  Settings
                </button>
                <button className="text-gray-600 hover:text-gray-900 pb-1">
                  Appearance
                </button>
                <button className="text-gray-600 hover:text-gray-900 pb-1">
                  Analytics
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <HelpCircle className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <User className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {merchantName}!
          </h1>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
            View Installation Guide
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Usage & Billing Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Usage & Billing
            </h3>

            {/* Circular Progress */}
            <div className="flex justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#E9D5FF"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#7C3AED"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 88 * (1 - usageData.percentage / 100)
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">
                    {usageData.used}
                  </span>
                  <span className="text-gray-500">/ {usageData.total}</span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 mb-4">
              Try-Ons Used This Month
            </p>

            <div className="text-center mb-4">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {subscription.plan}
              </span>
              <p className="text-sm text-gray-600 mt-2">
                Renews on {subscription.renewDate}
              </p>
            </div>

            <div className="space-y-2">
              <button className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                Upgrade Plan
              </button>
              <button className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors">
                View Billing History
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickStats.map((stat, index) => {
                  const IconComponent = stat.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <IconComponent className="w-5 h-5 text-purple-600" />
                        <span
                          className={`text-sm font-medium ${
                            stat.trendUp ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {stat.trend}
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Monthly Usage Trend */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Monthly Usage Trend
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={usageTrendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                  />
                  <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#7C3AED"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Popular Products */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Products
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Try-Ons
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Conversions
                  </th>
                </tr>
              </thead>
              <tbody>
                {popularProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <span className="font-medium text-gray-900">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-700">
                      {product.tryOns}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${product.conversions * 5}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                          {product.conversions}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
