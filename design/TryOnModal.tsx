import React, { useState } from 'react';
import { X, Camera, Upload, Download, ShoppingCart, Heart, Share2 } from 'lucide-react';

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  productImage: string;
  productName: string;
  availableColors: Array<{ name: string; hex: string; image: string }>;
}

type ViewState = 'upload' | 'loading' | 'result';

const TryOnModal: React.FC<TryOnModalProps> = ({
  isOpen,
  onClose,
  productImage,
  productName,
  availableColors,
}) => {
  const [selectedColor, setSelectedColor] = useState(availableColors[0]);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [viewState, setViewState] = useState<ViewState>('upload');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  // 示例模特照片
  const exampleModels = [
    { id: 1, image: 'https://via.placeholder.com/100x150/FFB6C1/000000?text=Model+1' },
    { id: 2, image: 'https://via.placeholder.com/100x150/87CEEB/000000?text=Model+2' },
    { id: 3, image: 'https://via.placeholder.com/100x150/98FB98/000000?text=Model+3' },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateTryOn = async () => {
    if (!userPhoto) return;

    setViewState('loading');

    // 模拟API调用
    setTimeout(() => {
      setResultImage('https://via.placeholder.com/400x600/7C3AED/FFFFFF?text=Try-On+Result');
      setViewState('result');
    }, 3000);
  };

  const handleSelectModel = (modelImage: string) => {
    setUserPhoto(modelImage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">AI Virtual Try-On</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {viewState === 'upload' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Product Image with Color Selector */}
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                  <img
                    src={selectedColor.image}
                    alt={productName}
                    className="max-h-80 object-contain"
                  />
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color:
                  </label>
                  <div className="flex gap-3">
                    {availableColors.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color)}
                        className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                          selectedColor.name === color.name
                            ? 'border-purple-600 ring-2 ring-purple-200'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      >
                        {selectedColor.name === color.name && (
                          <svg
                            className="absolute inset-0 m-auto w-6 h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Upload Area */}
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  {userPhoto ? (
                    <div className="space-y-4">
                      <img
                        src={userPhoto}
                        alt="User upload"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <button
                        onClick={() => setUserPhoto(null)}
                        className="text-sm text-purple-600 hover:text-purple-700"
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <>
                      <Camera className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-700 mb-2">
                        Upload Your Photo
                      </p>
                      <p className="text-sm text-gray-500 mb-4">or</p>
                      <p className="text-sm text-gray-600 mb-4">Choose Model</p>
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/jpeg,image/png"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Browse Files
                      </label>
                    </>
                  )}
                </div>

                {/* Example Models */}
                {!userPhoto && (
                  <div className="flex gap-3 justify-center">
                    {exampleModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => handleSelectModel(model.image)}
                        className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 hover:border-purple-500 transition-colors"
                      >
                        <img
                          src={model.image}
                          alt={`Model ${model.id}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {viewState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-purple-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-purple-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-xl font-semibold text-gray-900 mb-2">Generating...</p>
              <p className="text-sm text-gray-600">10-15 seconds</p>
            </div>
          )}

          {viewState === 'result' && resultImage && (
            <div className="space-y-6">
              {/* Before/After Comparison */}
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '500px' }}>
                <div className="absolute inset-0 flex">
                  {/* Before */}
                  <div
                    className="absolute left-0 top-0 bottom-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img
                      src={userPhoto || ''}
                      alt="Before"
                      className="h-full object-cover"
                      style={{ width: '100vw', maxWidth: '800px' }}
                    />
                    <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                      Before
                    </div>
                  </div>

                  {/* After */}
                  <div className="absolute right-0 top-0 bottom-0 overflow-hidden">
                    <img
                      src={resultImage}
                      alt="After"
                      className="h-full object-cover"
                    />
                    <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                      After
                    </div>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute top-1/2 left-0 right-0 -translate-y-1/2 z-10 cursor-ew-resize"
                  style={{ opacity: 0 }}
                />
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {viewState === 'upload' && (
          <div className="px-6 py-4 border-t border-gray-200">
            <button
              onClick={handleGenerateTryOn}
              disabled={!userPhoto}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
            >
              Generate Try-On
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TryOnModal;
