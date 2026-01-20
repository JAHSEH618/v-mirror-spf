import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const AppearanceSettings = () => {
  const [config, setConfig] = useState({
    position: 'bottom-right',
    horizontalOffset: 20,
    verticalOffset: 20,
    primaryColor: '#7C3AED',
    buttonTextColor: '#FFFFFF',
    buttonText: 'Try It On',
    modalTitle: 'AI Virtual Try-On',
    uploadInstructions: 'Upload your photo or choose a model to see how this item looks on you.',
    showOnMobile: true,
    autoDetectClothing: true,
    animationStyle: 'fade-in',
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // 模拟保存API调用
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Settings saved successfully!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to default settings?')) {
      setConfig({
        position: 'bottom-right',
        horizontalOffset: 20,
        verticalOffset: 20,
        primaryColor: '#7C3AED',
        buttonTextColor: '#FFFFFF',
        buttonText: 'Try It On',
        modalTitle: 'AI Virtual Try-On',
        uploadInstructions: 'Upload your photo or choose a model to see how this item looks on you.',
        showOnMobile: true,
        autoDetectClothing: true,
        animationStyle: 'fade-in',
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Customize Appearance
        </h1>
        <p className="text-gray-600">
          Personalize the look and feel of your virtual try-on widget
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Widget Position */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Widget Position
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floating Button Position
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="position"
                      value="bottom-right"
                      checked={config.position === 'bottom-right'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          position: e.target.value,
                        })
                      }
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-gray-700">Bottom Right</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="position"
                      value="bottom-left"
                      checked={config.position === 'bottom-left'}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          position: e.target.value,
                        })
                      }
                      className="w-4 h-4 text-purple-600"
                    />
                    <span className="text-gray-700">Bottom Left</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horizontal Offset
                  <span className="ml-2 text-purple-600 font-semibold">
                    {config.horizontalOffset}px
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.horizontalOffset}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      horizontalOffset: Number(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vertical Offset
                  <span className="ml-2 text-purple-600 font-semibold">
                    {config.verticalOffset}px
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={config.verticalOffset}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      verticalOffset: Number(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Text Customization */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Text Customization
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={config.buttonText}
                  onChange={(e) =>
                    setConfig({ ...config, buttonText: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="Try It On"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modal Title
                </label>
                <input
                  type="text"
                  value={config.modalTitle}
                  onChange={(e) =>
                    setConfig({ ...config, modalTitle: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="AI Virtual Try-On"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Instructions
                </label>
                <textarea
                  value={config.uploadInstructions}
                  onChange={(e) =>
                    setConfig({ ...config, uploadInstructions: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none"
                  placeholder="Upload your photo or choose a model..."
                />
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                Advanced Options
              </h3>
              {isAdvancedOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>

            {isAdvancedOpen && (
              <div className="px-6 pb-6 space-y-4 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Show on Mobile</p>
                    <p className="text-sm text-gray-600">
                      Display the widget on mobile devices
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setConfig({ ...config, showOnMobile: !config.showOnMobile })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.showOnMobile ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.showOnMobile ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Auto-detect Clothing Products
                    </p>
                    <p className="text-sm text-gray-600">
                      Only show widget on clothing items
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setConfig({
                        ...config,
                        autoDetectClothing: !config.autoDetectClothing,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.autoDetectClothing ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.autoDetectClothing
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Animation Style
                  </label>
                  <select
                    value={config.animationStyle}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        animationStyle: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  >
                    <option value="fade-in">Fade In</option>
                    <option value="slide-up">Slide Up</option>
                    <option value="scale">Scale</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Preview & Colors */}
        <div className="space-y-6">
          {/* Colors */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Colors</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, primaryColor: e.target.value })
                    }
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) =>
                      setConfig({ ...config, primaryColor: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.buttonTextColor}
                    onChange={(e) =>
                      setConfig({ ...config, buttonTextColor: e.target.value })
                    }
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.buttonTextColor}
                    onChange={(e) =>
                      setConfig({ ...config, buttonTextColor: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Live Preview
            </h3>
            <div className="relative bg-gray-100 rounded-lg h-48 flex items-end justify-end p-4">
              <button
                style={{
                  backgroundColor: config.primaryColor,
                  color: config.buttonTextColor,
                }}
                className="px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow"
              >
                {config.buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 justify-end">
        <button
          onClick={handleReset}
          className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium transition-colors"
        >
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default AppearanceSettings;
