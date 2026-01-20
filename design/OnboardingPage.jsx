import React from 'react';
import { CheckCircle, AlertTriangle, Clock, Puzzle, Paintbrush, Rocket, HelpCircle } from 'lucide-react';

const OnboardingPage = () => {
  const handleOpenThemeEditor = () => {
    // 跳转到 Shopify 主题编辑器
    window.open('/admin/themes/current/editor', '_blank');
  };

  const handleViewDemo = () => {
    // 跳转到演示页面
    window.open('/products/demo-product', '_blank');
  };

  const handleViewDocumentation = () => {
    // 跳转到文档
    window.open('https://docs.example.com', '_blank');
  };

  const steps = [
    {
      id: 1,
      title: 'Install App Extension',
      description: 'The app is now installed in your store',
      icon: <Puzzle className="w-8 h-8 text-purple-600" />,
      status: 'completed',
    },
    {
      id: 2,
      title: 'Enable in Theme Editor',
      description: 'Go to your theme customizer and enable the AI Try-On app block',
      icon: <Paintbrush className="w-8 h-8 text-purple-600" />,
      status: 'action-required',
      actionButton: {
        label: 'Open Theme Editor',
        onClick: handleOpenThemeEditor,
        variant: 'primary',
      },
    },
    {
      id: 3,
      title: 'Test & Go Live',
      description: 'Try the virtual try-on feature on a product page',
      icon: <Rocket className="w-8 h-8 text-purple-600" />,
      status: 'pending',
      actionButton: {
        label: 'View Demo',
        onClick: handleViewDemo,
        variant: 'secondary',
      },
    },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Completed
          </span>
        );
      case 'action-required':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            Action Required
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Get Started with AI Virtual Try-On
        </h1>
        <p className="text-gray-600">
          Follow these steps to set up your virtual try-on experience
        </p>
      </div>

      <div className="space-y-6 mb-8">
        {steps.map((step) => (
          <div
            key={step.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              {/* Step Number & Icon */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center">
                  {step.icon}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-300">
                      {step.id}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {step.title}
                    </h3>
                  </div>
                  {getStatusBadge(step.status)}
                </div>

                <p className="text-gray-600 mb-4">{step.description}</p>

                {step.actionButton && (
                  <button
                    onClick={step.actionButton.onClick}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      step.actionButton.variant === 'primary'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
                    }`}
                  >
                    {step.actionButton.label}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need Help?
            </h3>
            <p className="text-gray-600 mb-3">
              Check our documentation or contact support
            </p>
            <button
              onClick={handleViewDocumentation}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              View Documentation →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
