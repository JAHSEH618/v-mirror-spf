/**
 * AI Virtual Try-On Widget JavaScript
 * Handles floating button interactions, modal, and API calls
 */

(function () {
    'use strict';

    // ============================================
    // Configuration & State
    // ============================================
    const config = window.VMirrorConfig || {};

    const state = {
        isModalOpen: false,
        viewState: 'upload', // 'upload' | 'loading' | 'result' | 'error'
        userPhoto: null,
        resultImage: null,
        selectedVariant: null,
        taskId: null,
        pollInterval: null,
        lastError: null,
    };

    // ============================================
    // Localization
    // ============================================
    const translations = {
        en: {
            modalTitle: 'AI Virtual Try-On',
            uploadInstructions: 'Upload a full-body photo for best results',
            colorLabel: 'Color',
            uploadTitle: 'Upload Your Photo',
            uploadSubtitleOr: '— or choose a model below —',
            browseFiles: 'Browse Files',
            changePhoto: 'Change Photo',
            quickTryLabel: 'Quick Try: Select a Model',
            generating: 'Generating your try-on...',
            waitText: 'This usually takes 10-15 seconds',
            download: 'Download',
            addToCart: 'Add to Cart',
            share: 'Share',
            tryAnother: 'Try Another Photo',
            errorGeneric: 'Something went wrong. Please try again.',
            retry: 'Retry',
            generateBtn: '✨ Generate Try-On',
            fileTypeErr: 'Please upload a JPG, PNG, or WebP image.',
            fileSizeErr: 'File size must be less than 5MB.',
            limitExceeded: 'Our virtual fitting room is currently at maximum capacity due to high demand. Please try again later!',
            serverError: 'Server Error',
            failedToGenerate: 'Failed to generate'
        },
        ja: {
            modalTitle: 'AIバーチャル試着',
            uploadInstructions: '全身写真をアップロードすると、より良い結果が得られます',
            colorLabel: 'カラー',
            uploadTitle: '写真をアップロード',
            uploadSubtitleOr: '— または以下のモデルを選択 —',
            browseFiles: 'ファイルを選択',
            changePhoto: '写真を変更',
            quickTryLabel: 'クイック試着: モデルを選択',
            generating: '試着画像を生成中...',
            waitText: '通常10〜15秒かかります',
            download: 'ダウンロード',
            addToCart: 'カートに追加',
            share: '共有',
            tryAnother: '別の写真で試す',
            errorGeneric: 'エラーが発生しました。もう一度お試しください。',
            retry: '再試行',
            generateBtn: '✨ 試着を生成',
            fileTypeErr: 'JPG, PNG, またはWebP画像をアップロードしてください。',
            fileSizeErr: 'ファイルサイズは5MB未満にしてください。',
            limitExceeded: '現在リクエストが集中しており、バーチャル試着室が満員です。しばらくしてからもう一度お試しください！',
            serverError: 'サーバーエラー',
            failedToGenerate: '生成に失敗しました'
        },
        zh: {
            modalTitle: 'AI 虚拟试穿',
            uploadInstructions: '上传全身照片以获得最佳效果',
            colorLabel: '颜色',
            uploadTitle: '上传您的照片',
            uploadSubtitleOr: '— 或选择下方的模特 —',
            browseFiles: '浏览文件',
            changePhoto: '更换照片',
            quickTryLabel: '快速试穿：选择模特',
            generating: '正在生成试穿效果...',
            waitText: '通常需要 10-15 秒',
            download: '下载',
            addToCart: '加入购物车',
            share: '分享',
            tryAnother: '尝试其他照片',
            errorGeneric: '出错了，请重试。',
            retry: '重试',
            generateBtn: '✨ 生成试穿',
            fileTypeErr: '请上传 JPG, PNG 或 WebP 格式的图片。',
            fileSizeErr: '文件大小必须小于 5MB。',
            limitExceeded: '由于需求量大，虚拟试衣间目前已满。请稍后再试！',
            serverError: '服务器错误',
            failedToGenerate: '生成失败'
        },
        es: {
            modalTitle: 'Probador Virtual AI',
            uploadInstructions: 'Sube una foto de cuerpo completo para obtener mejores resultados',
            colorLabel: 'Color',
            uploadTitle: 'Sube tu Foto',
            uploadSubtitleOr: '— o elige un modelo abajo —',
            browseFiles: 'Explorar Archivos',
            changePhoto: 'Cambiar Foto',
            quickTryLabel: 'Prueba Rápida: Elige un Modelo',
            generating: 'Generando tu prueba...',
            waitText: 'Esto suele tardar 10-15 segundos',
            download: 'Descargar',
            addToCart: 'Añadir al Carrito',
            share: 'Compartir',
            tryAnother: 'Probar Otra Foto',
            errorGeneric: 'Algo salió mal. Por favor, inténtalo de nuevo.',
            retry: 'Reintentar',
            generateBtn: '✨ Generar Prueba',
            fileTypeErr: 'Por favor sube una imagen JPG, PNG o WebP.',
            fileSizeErr: 'El tamaño del archivo debe ser menor a 5MB.',
            limitExceeded: '¡Nuestro probador virtual está a máxima capacidad debido a la alta demanda. Por favor intenta más tarde!',
            serverError: 'Error del Servidor',
            failedToGenerate: 'Fallo al generar'
        }
    };

    function getLanguage() {
        let lang = 'en';
        if (window.Shopify && window.Shopify.locale) {
            lang = window.Shopify.locale;
        } else if (document.documentElement.lang) {
            lang = document.documentElement.lang;
        } else if (navigator.language) {
            lang = navigator.language;
        }

        // Normalize
        const code = lang.toLowerCase().split('-')[0];
        return ['ja', 'zh', 'es'].includes(code) ? code : 'en';
    }

    function t(key, defaultText) {
        const lang = getLanguage();
        return translations[lang][key] || defaultText || translations['en'][key];
    }

    // Example model images for quick try-on
    const exampleModels = [
        { id: 1, src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=300&fit=crop', alt: 'Model 1' },
        { id: 2, src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=300&fit=crop', alt: 'Model 2' },
        { id: 3, src: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=300&fit=crop', alt: 'Model 3' },
    ];

    // ============================================
    // DOM References
    // ============================================
    let triggerBtn = null;
    let modalRoot = null;

    // ============================================
    // Initialization
    // ============================================
    function init() {
        triggerBtn = document.getElementById('v-mirror-trigger-btn');
        modalRoot = document.getElementById('v-mirror-modal-root');

        if (!triggerBtn || !modalRoot) {
            console.warn('[V-Mirror] Widget elements not found');
            return;
        }

        // Check mobile visibility setting
        const widget = document.getElementById('v-mirror-widget');
        if (widget && config.showOnMobile !== false) {
            widget.classList.add('show-mobile');
        }

        // Initialize selected variant from config
        const variants = config.variants || [];
        if (variants.length > 0) {
            state.selectedVariant = variants[0];
        }

        // Bind events
        bindEvents();

        console.log('[V-Mirror] Widget initialized');
    }

    // Apply settings dynamically (called when API settings are loaded)
    function applySettings(settings) {
        const widget = document.getElementById('v-mirror-widget');
        if (!widget) return;

        // Update CSS variables for styling
        if (settings.primaryColor) {
            widget.style.setProperty('--widget-primary-color', settings.primaryColor);
        }
        if (settings.textColor) {
            widget.style.setProperty('--widget-text-color', settings.textColor);
        }
        if (typeof settings.horizontalOffset === 'number') {
            widget.style.setProperty('--widget-position-h', settings.horizontalOffset + 'px');
        }
        if (typeof settings.verticalOffset === 'number') {
            widget.style.setProperty('--widget-position-v', settings.verticalOffset + 'px');
        }

        // Update position (left/right)
        if (settings.position === 'bottom-left') {
            widget.style.left = 'var(--widget-position-h)';
            widget.style.right = 'auto';
        } else {
            widget.style.right = 'var(--widget-position-h)';
            widget.style.left = 'auto';
        }

        // Update button text
        const btnText = widget.querySelector('.v-mirror-btn-text');
        if (btnText && settings.buttonText) {
            btnText.textContent = settings.buttonText;
        }

        // Update tooltip text
        const tooltip = document.getElementById('v-mirror-tooltip');
        if (tooltip && settings.tooltipText) {
            tooltip.textContent = settings.tooltipText;
        }

        // Update config for modal usage
        Object.assign(config, settings);

        console.log('[V-Mirror] Settings applied:', settings);
    }

    // Expose for external access
    window.VMirrorWidget = {
        applySettings: applySettings
    };

    function bindEvents() {
        // Trigger button click
        triggerBtn.addEventListener('click', handleTriggerClick);

        // Keyboard accessibility
        triggerBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTriggerClick();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.isModalOpen) {
                closeModal();
            }
        });
    }

    // ============================================
    // Event Handlers
    // ============================================
    function handleTriggerClick() {
        openModal();
    }

    function openModal() {
        state.isModalOpen = true;
        // Do not reset state here to allow persistence
        if (!state.userPhoto) state.viewState = 'upload'; // Ensure valid initial state
        renderModal();

        // Prevent background scrolling - better mobile support
        document.body.style.overflow = 'hidden';
        // iOS Safari fix
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';

        // Store scroll position for restoration
        const scrollY = window.scrollY;
        document.body.style.top = `-${scrollY}px`;
        document.body.dataset.scrollY = scrollY;
    }

    function closeModal() {
        state.isModalOpen = false;
        // Don't clear pollInterval here so it can finish in background
        modalRoot.innerHTML = '';

        // Restore scrolling - better mobile support
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';

        // Restore scroll position
        const scrollY = document.body.dataset.scrollY;
        if (scrollY) {
            window.scrollTo(0, parseInt(scrollY));
            delete document.body.dataset.scrollY;
        }
    }

    // ============================================
    // Modal Rendering
    // ============================================
    function renderModal() {
        if (!state.isModalOpen) return;
        const animationClass = `animation-${config.animationStyle || 'fade-in'}`;

        modalRoot.innerHTML = `
      <div class="v-mirror-modal-overlay" id="v-mirror-overlay">
        <div class="v-mirror-modal ${animationClass}" role="dialog" aria-modal="true" aria-labelledby="v-mirror-title">
          ${renderHeader()}
          <div class="v-mirror-modal-content">
            ${renderContent()}
          </div>
          ${renderFooter()}
        </div>
      </div>
    `;

        // Bind modal events
        bindModalEvents();
    }

    function renderHeader() {
        return `
      <div class="v-mirror-modal-header">
        <h2 class="v-mirror-modal-title" id="v-mirror-title">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.09 8.26L18.18 6.82L14.73 11.09L20.39 13.27L14.03 14.21L16.5 20L12 15.82L7.5 20L9.97 14.21L3.61 13.27L9.27 11.09L5.82 6.82L10.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
          ${escapeHtml(config.modalTitle || t('modalTitle'))}
        </h2>
        <button class="v-mirror-close-btn" id="v-mirror-close" aria-label="Close modal">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
    }

    function renderContent() {
        switch (state.viewState) {
            case 'upload':
                return renderUploadView();
            case 'loading':
                return renderLoadingView();
            case 'result':
                return renderResultView();
            case 'error':
                return renderErrorView();
            default:
                return renderUploadView();
        }
    }

    function renderUploadView() {
        const productImage = config.productImage || '';
        const productTitle = config.productTitle || 'Product';
        const variants = config.variants || [];

        return `
      <div class="v-mirror-content-grid">
        <!-- Product Section -->
        <div class="v-mirror-product-section">
          <div class="v-mirror-product-image-container">
            <img 
              src="${escapeHtml(state.selectedVariant?.featured_image?.src || productImage)}" 
              alt="${escapeHtml(productTitle)}"
              class="v-mirror-product-image"
              id="v-mirror-product-img"
            />
          </div>
          
          ${variants.length > 1 ? renderColorSelector(variants) : ''}
        </div>
        
        <!-- Upload Section -->
        <div class="v-mirror-upload-section">
          <div class="v-mirror-upload-area ${state.userPhoto ? 'has-image' : ''}" id="v-mirror-upload-area">
            ${state.userPhoto ? renderPreviewImage() : renderUploadPrompt()}
          </div>
          
          ${!state.userPhoto ? renderExampleModels() : ''}
        </div>
      </div>
    `;
    }

    function renderColorSelector(variants) {
        // Extract unique colors from variants
        const colors = [];
        const seenColors = new Set();

        variants.forEach(variant => {
            const colorOption = variant.option1 || variant.title;
            if (!seenColors.has(colorOption)) {
                seenColors.add(colorOption);
                colors.push({
                    name: colorOption,
                    variant: variant,
                    image: variant.featured_image?.src || config.productImage
                });
            }
        });

        if (colors.length <= 1) return '';

        return `
      <div class="v-mirror-color-selector">
        <label class="v-mirror-color-label">${t('colorLabel')}: ${escapeHtml(state.selectedVariant?.option1 || colors[0].name)}</label>
        <div class="v-mirror-color-options">
          ${colors.map(color => `
            <button 
              class="v-mirror-color-btn ${state.selectedVariant?.id === color.variant.id ? 'active' : ''}"
              data-variant-id="${color.variant.id}"
              style="background-color: ${getColorHex(color.name)}"
              title="${escapeHtml(color.name)}"
              aria-label="Select ${escapeHtml(color.name)}"
            ></button>
          `).join('')}
        </div>
      </div>
    `;
    }

    function renderUploadPrompt() {
        return `
      <svg class="v-mirror-upload-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
      </svg>
      <h3 class="v-mirror-upload-title">${t('uploadTitle')}</h3>
      <p class="v-mirror-upload-subtitle">${escapeHtml(config.uploadInstructions || t('uploadInstructions'))}</p>
      <p class="v-mirror-upload-subtitle">${t('uploadSubtitleOr')}</p>
      <input type="file" id="v-mirror-file-input" class="v-mirror-file-input" accept="image/jpeg,image/png,image/webp" />
      <label for="v-mirror-file-input" class="v-mirror-browse-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="17,8 12,3 7,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ${t('browseFiles')}
      </label>
    `;
    }

    function renderPreviewImage() {
        return `
      <div class="v-mirror-preview-container">
        <img src="${state.userPhoto}" alt="Your photo" class="v-mirror-preview-image" />
        <input type="file" id="v-mirror-reupload-input" class="v-mirror-file-input" accept="image/jpeg,image/png,image/webp" style="display:none" />
        <button class="v-mirror-change-photo-btn" id="v-mirror-change-photo">${t('changePhoto')}</button>
      </div>
    `;
    }

    function renderExampleModels() {
        return `
      <div class="v-mirror-example-models">
        <p class="v-mirror-example-label">${t('quickTryLabel')}</p>
        <div class="v-mirror-model-options">
          ${exampleModels.map(model => `
            <button class="v-mirror-model-btn" data-model-src="${model.src}" aria-label="${model.alt}">
              <img src="${model.src}" alt="${model.alt}" loading="lazy" />
            </button>
          `).join('')}
        </div>
      </div>
    `;
    }

    function renderLoadingView() {
        return `
      <div class="v-mirror-loading">
        <div class="v-mirror-spinner">
          <div class="v-mirror-spinner-ring"></div>
          <div class="v-mirror-spinner-ring v-mirror-spinner-ring-active"></div>
        </div>
        <h3 class="v-mirror-loading-text">${t('generating')}</h3>
        <p class="v-mirror-loading-subtext">${t('waitText')}</p>
      </div>
    `;
    }

    function renderResultView() {
        return `
      <div class="v-mirror-result">
        <div class="v-mirror-comparison-container">
          <img src="${state.resultImage}" alt="Try-on result" class="v-mirror-result-image" />
        </div>
        <div class="v-mirror-action-buttons">
          <button class="v-mirror-action-btn secondary" id="v-mirror-download">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${t('download')}
          </button>
          <button class="v-mirror-action-btn primary" id="v-mirror-add-cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="21" r="1" fill="currentColor"/>
              <circle cx="20" cy="21" r="1" fill="currentColor"/>
              <path d="M1 1H5L7.68 14.39C7.77 14.83 8.02 15.22 8.38 15.5C8.74 15.78 9.19 15.93 9.65 15.92H19.4C19.86 15.93 20.31 15.78 20.67 15.5C21.03 15.22 21.28 14.83 21.37 14.39L23 6H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            ${t('addToCart')}
          </button>
          <button class="v-mirror-action-btn secondary icon-only" id="v-mirror-share" aria-label="${t('share')}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/>
              <circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" stroke-width="2"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="v-mirror-action-btn secondary" id="v-mirror-try-again">
            ${t('tryAnother')}
          </button>
        </div>
      </div>
    `;
    }

    function renderErrorView() {
        const errorText = state.lastError || t('errorGeneric');
        return `
      <div class="v-mirror-error">
        <svg class="v-mirror-error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <polyline points="12 6 12 12 16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="v-mirror-error-text" id="v-mirror-error-msg">${errorText}</p>
        <button class="v-mirror-retry-btn" id="v-mirror-retry">${t('retry')}</button>
      </div>
    `;
    }

    function renderFooter() {
        if (state.viewState !== 'upload') return '';

        return `
      <div class="v-mirror-modal-footer">
        <button 
          class="v-mirror-generate-btn" 
          id="v-mirror-generate"
          ${!state.userPhoto ? 'disabled' : ''}
        >
          ${t('generateBtn')}
        </button>
      </div>
    `;
    }

    // ============================================
    // Modal Event Binding
    // ============================================
    function bindModalEvents() {
        // Close button
        const closeBtn = document.getElementById('v-mirror-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeModal);
        }

        // Overlay click to close
        const overlay = document.getElementById('v-mirror-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeModal();
                }
            });
        }

        // File input
        const fileInput = document.getElementById('v-mirror-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileUpload);
        }

        // Upload area drag & drop
        const uploadArea = document.getElementById('v-mirror-upload-area');
        if (uploadArea && !state.userPhoto) {
            uploadArea.addEventListener('dragover', handleDragOver);
            uploadArea.addEventListener('dragleave', handleDragLeave);
            uploadArea.addEventListener('drop', handleDrop);

            // Mobile-optimized click handler
            uploadArea.addEventListener('click', (e) => {
                // Prevent triggering input.click() if clicking on the label or input itself
                // This fixes the issue where first click fails due to double-triggering
                if (e.target.tagName === 'LABEL' || e.target.tagName === 'INPUT' ||
                    e.target.classList.contains('v-mirror-browse-btn')) {
                    return;
                }
                const input = document.getElementById('v-mirror-file-input');
                if (input) {
                    // Mobile: Add capture attribute for better camera access
                    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
                    if (isMobile && !input.hasAttribute('capture')) {
                        input.setAttribute('accept', 'image/*');
                        // Don't force capture to allow gallery access too
                    }
                    input.click();
                }
            });

            // Add touch feedback for mobile
            uploadArea.addEventListener('touchstart', (e) => {
                if (!e.target.classList.contains('v-mirror-browse-btn')) {
                    uploadArea.style.transform = 'scale(0.98)';
                }
            }, { passive: true });

            uploadArea.addEventListener('touchend', () => {
                uploadArea.style.transform = '';
            }, { passive: true });
        }


        // Change photo button - directly open file picker for re-upload
        const changePhotoBtn = document.getElementById('v-mirror-change-photo');
        const reuploadInput = document.getElementById('v-mirror-reupload-input');
        if (changePhotoBtn && reuploadInput) {
            // Bind change event for re-upload input
            reuploadInput.addEventListener('change', handleFileUpload);

            changePhotoBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                reuploadInput.click();
            });
        }

        // Example model buttons
        document.querySelectorAll('.v-mirror-model-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const src = btn.getAttribute('data-model-src');
                if (src) {
                    state.userPhoto = src;
                    renderModal();
                }
            });
        });

        // Color selector buttons
        document.querySelectorAll('.v-mirror-color-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const variantId = btn.getAttribute('data-variant-id');
                const variants = config.variants || [];
                const variant = variants.find(v => String(v.id) === variantId);
                if (variant) {
                    state.selectedVariant = variant;
                    renderModal();
                }
            });
        });

        // Generate button
        const generateBtn = document.getElementById('v-mirror-generate');
        if (generateBtn) {
            generateBtn.addEventListener('click', handleGenerate);
        }

        // Result view buttons
        const downloadBtn = document.getElementById('v-mirror-download');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', handleDownload);
        }

        const addCartBtn = document.getElementById('v-mirror-add-cart');
        if (addCartBtn) {
            addCartBtn.addEventListener('click', handleAddToCart);
        }

        const shareBtn = document.getElementById('v-mirror-share');
        if (shareBtn) {
            shareBtn.addEventListener('click', handleShare);
        }

        const tryAgainBtn = document.getElementById('v-mirror-try-again');
        if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => {
                state.userPhoto = null;
                state.resultImage = null;
                state.viewState = 'upload';
                renderModal();
            });
        }

        // Retry button
        const retryBtn = document.getElementById('v-mirror-retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                state.viewState = 'upload';
                renderModal();
            });
        }
    }

    // ============================================
    // File Handling
    // ============================================
    function handleFileUpload(e) {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    }

    function processFile(file) {
        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert(t('fileTypeErr'));
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert(t('fileSizeErr'));
            return;
        }

        // Compress and read file
        compressImage(file, 1024).then(dataUrl => {
            state.userPhoto = dataUrl;
            renderModal();
        }).catch(err => {
            console.error('[V-Mirror] Error processing file:', err);
            // Fallback to direct read
            const reader = new FileReader();
            reader.onload = (e) => {
                state.userPhoto = e.target.result;
                renderModal();
            };
            reader.readAsDataURL(file);
        });
    }

    function compressImage(file, maxWidth) {
        return new Promise((resolve, reject) => {
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

                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Helper: Get or create persistent Session ID
    function getSessionId() {
        let sid = localStorage.getItem('v_mirror_sid');
        if (!sid) {
            sid = 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            localStorage.setItem('v_mirror_sid', sid);
        }
        return sid;
    }

    // Helper: Detect device type
    function getDeviceType() {
        const ua = navigator.userAgent;
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
            return "tablet";
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
            return "mobile";
        }
        return "desktop";
    }

    // Helper: Simple Browser Fingerprint (Canvas + UA Hash)
    // Generates a reasonably unique ID without external libraries
    async function getFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const txt = 'browser-fingerprint-v1';
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText(txt, 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText(txt, 4, 17);

            const b64 = canvas.toDataURL().replace("data:image/png;base64,", "");
            const bin = atob(b64);
            let hash = 0;
            for (let i = 0; i < bin.length; i++) {
                hash = ((hash << 5) - hash) + bin.charCodeAt(i);
                hash |= 0;
            }

            // Combine with UA and Screen resolution for better uniqueness
            const rawId = hash + navigator.userAgent + screen.width + 'x' + screen.height + new Date().getTimezoneOffset();

            // Simple hash of the string
            let finalHash = 0;
            for (let i = 0; i < rawId.length; i++) {
                const char = rawId.charCodeAt(i);
                finalHash = ((finalHash << 5) - finalHash) + char;
                finalHash = finalHash & finalHash;
            }

            return 'fp_' + Math.abs(finalHash).toString(16);
        } catch (e) {
            return 'fp_error_' + Date.now();
        }
    }

    // ============================================
    // API Integration
    // ============================================
    async function handleGenerate() {
        if (!state.userPhoto) return;

        state.viewState = 'loading';
        renderModal();

        try {
            const productImage = state.selectedVariant?.featured_image?.src || config.productImage;

            // DEBUG: Log the API URL we are about to hit
            const apiUrl = `${config.appProxyUrl}/api/try-on/start`;
            const pingUrl = `${config.appProxyUrl}/api/try-on/ping`;
            console.log(`[V-Mirror] Base App Proxy URL: ${config.appProxyUrl}`);
            console.log(`[V-Mirror] Target API URL: ${apiUrl}`);

            // Test connectivity first
            try {
                console.log(`[V-Mirror] Pinging ${pingUrl}...`);
                const pingRes = await fetch(pingUrl);
                if (pingRes.ok) {
                    const pingData = await pingRes.json();
                    console.log('[V-Mirror] Ping success:', pingData);
                } else {
                    console.warn('[V-Mirror] Ping failed:', pingRes.status);
                }
            } catch (pingErr) {
                console.error('[V-Mirror] Ping connection error:', pingErr);
            }

            // Start try-on generation
            console.log('[V-Mirror] Starting generation request...');
            console.log('[V-Mirror] Garment type:', config.garmentType || 'auto-detect');

            const sessionId = getSessionId();
            const deviceType = getDeviceType();
            const fingerprintId = await getFingerprint();

            const startResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userImage: state.userPhoto,
                    garmentImage: productImage,
                    productId: config.productId,
                    productTitle: config.productTitle || 'Product',
                    garmentType: config.garmentType || null,
                    sessionId: sessionId,
                    deviceType: deviceType,
                    fingerprintId: fingerprintId
                }),
            });

            let responseData;
            try {
                responseData = await startResponse.json();
            } catch (e) {
                // If not JSON, throw status error
                if (!startResponse.ok) throw new Error(`${t('serverError')}: ${startResponse.status}`);
            }

            console.log('[V-Mirror] API Response:', responseData);

            if (!startResponse.ok) {
                if (responseData && responseData.code === 'LIMIT_EXCEEDED') {
                    throw new Error(t('limitExceeded'));
                }
                throw new Error(responseData?.error || `${t('failedToGenerate')}: ${startResponse.status}`);
            }

            if (responseData.error) {
                throw new Error(responseData.error);
            }

            // Check if we got an immediate result (Google Vertex AI - synchronous)
            if (responseData.output || responseData.outputType === 'url') {
                console.log('[V-Mirror] Synchronous response - got result immediately');

                let resultSrc = responseData.output;
                if (responseData.outputType === 'url') {
                    // Determine if output is absolute or relative
                    if (resultSrc && !resultSrc.startsWith('http') && !resultSrc.startsWith('//')) {
                        const relativePath = resultSrc.startsWith('/') ? resultSrc.slice(1) : resultSrc;
                        resultSrc = `${config.appProxyUrl}/${relativePath}`;
                        console.log('[V-Mirror] Constructed result URL:', resultSrc);
                    }
                }

                state.resultImage = resultSrc;
                state.viewState = 'result';
                renderModal();
                return;
            }

            // Fallback: If we got a taskId, use polling (legacy KlingAI behavior)
            if (responseData.taskId || responseData.id) {
                console.log('[V-Mirror] Async response - starting polling');
                state.taskId = responseData.taskId || responseData.id;
                pollForResult();
            } else {
                throw new Error('Unexpected API response format');
            }
        } catch (error) {
            console.error('[V-Mirror] Generation error:', error);
            state.viewState = 'error';
            state.lastError = error.message; // Store error in state for render
            renderModal();
        }
    }


    function pollForResult() {
        let attempts = 0;
        const maxAttempts = 30; // 60 seconds max

        state.pollInterval = setInterval(async () => {
            attempts++;

            if (attempts > maxAttempts) {
                clearInterval(state.pollInterval);
                state.pollInterval = null;
                state.viewState = 'error';
                renderModal();
                return;
            }

            try {
                const statusResponse = await fetch(
                    `${config.appProxyUrl}/api/try-on/status?taskId=${state.taskId}`
                );

                if (!statusResponse.ok) {
                    throw new Error('Failed to check status');
                }

                const statusData = await statusResponse.json();

                if (statusData.status === 'succeed' || statusData.status === 'succeeded' || statusData.status === 'completed') {
                    clearInterval(state.pollInterval);
                    state.pollInterval = null;
                    state.resultImage = statusData.output || statusData.resultImage;
                    state.viewState = 'result';
                    renderModal();
                } else if (statusData.status === 'failed') {
                    clearInterval(state.pollInterval);
                    state.pollInterval = null;
                    state.viewState = 'error';
                    renderModal();
                }
                // Continue polling for 'processing' or 'starting' status
            } catch (error) {
                console.error('[V-Mirror] Poll error:', error);
                // Don't stop polling on network errors, just log
            }
        }, 2000);
    }

    // ============================================
    // Action Handlers
    // ============================================
    async function handleDownload() {
        if (!state.resultImage) return;

        try {
            // Direct download for Data URIs
            if (state.resultImage.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = state.resultImage;
                link.download = `try-on-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // For remote URLs (CDN), attempt blob fetch
            const btn = document.getElementById('v-mirror-download');
            if (btn) btn.style.opacity = '0.7';

            try {
                const response = await fetch(state.resultImage, {
                    mode: 'cors',
                    credentials: 'omit'
                });

                if (!response.ok) throw new Error('Network response was not ok');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.style.display = 'none';
                link.href = url;
                link.download = `try-on-${Date.now()}.png`;

                document.body.appendChild(link);
                link.click();

                // Cleanup
                setTimeout(() => {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    if (btn) btn.style.opacity = '1';
                }, 100);

            } catch (fetchError) {
                // FALLBACK: If blob fetch fails (CORS), open in new tab
                console.warn('[V-Mirror] Blob download failed, falling back to new tab:', fetchError);
                window.open(state.resultImage, '_blank');
                if (btn) btn.style.opacity = '1';
            }

        } catch (error) {
            console.error('[V-Mirror] Download error:', error);
            const btn = document.getElementById('v-mirror-download');
            if (btn) btn.style.opacity = '1';
        }
    }

    async function handleAddToCart() {
        const variantId = state.selectedVariant?.id || config.productId;

        try {
            const response = await fetch('/cart/add.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: variantId,
                    quantity: 1,
                    properties: {
                        '_from_v_mirror': 'true' // Hidden property for attribution tracking
                    }
                }),
            });

            // TRACKING: Analytics
            try {
                fetch(`${config.appProxyUrl}/api/analytics/track`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        eventType: 'add_to_cart',
                        productId: config.productId,
                        productTitle: config.productTitle
                    })
                }).catch(e => console.log('[V-Mirror] Tracking error:', e));
            } catch (e) {
                // Ignore tracking errors
            }

            if (response.ok) {
                // Show success feedback
                const btn = document.getElementById('v-mirror-add-cart');
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '✓ Added!';
                    btn.disabled = true;
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }, 2000);
                }

                // Optionally trigger cart drawer or redirect
                // window.location.href = '/cart';
            } else {
                alert('Failed to add to cart. Please try again.');
            }
        } catch (error) {
            console.error('[V-Mirror] Add to cart error:', error);
            alert('Failed to add to cart. Please try again.');
        }
    }

    async function handleShare() {
        if (!state.resultImage) return;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: config.productTitle || 'My Virtual Try-On',
                    text: 'Check out how this looks on me!',
                    url: window.location.href,
                });
            } catch (error) {
                // User cancelled or share failed
                console.log('[V-Mirror] Share cancelled');
            }
        } else {
            // Fallback: copy link to clipboard
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            } catch (error) {
                console.error('[V-Mirror] Copy failed:', error);
            }
        }
    }

    // ============================================
    // Utility Functions
    // ============================================
    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getColorHex(colorName) {
        const colorMap = {
            'black': '#000000',
            'white': '#FFFFFF',
            'red': '#EF4444',
            'blue': '#3B82F6',
            'green': '#22C55E',
            'yellow': '#EAB308',
            'purple': '#A855F7',
            'pink': '#EC4899',
            'orange': '#F97316',
            'gray': '#6B7280',
            'grey': '#6B7280',
            'navy': '#1E3A5F',
            'olive': '#6B7F5A',
            'brown': '#92400E',
            'beige': '#D4C4A8',
            'cream': '#FFFDD0',
            'tan': '#D2B48C',
            'maroon': '#800000',
            'teal': '#14B8A6',
            'coral': '#FF7F50',
            'burgundy': '#800020',
            'khaki': '#C3B091',
            'mint': '#98FB98',
            'lavender': '#E6E6FA',
        };

        const lowerName = colorName.toLowerCase();

        // Check for exact match
        if (colorMap[lowerName]) {
            return colorMap[lowerName];
        }

        // Check for partial match
        for (const [key, value] of Object.entries(colorMap)) {
            if (lowerName.includes(key)) {
                return value;
            }
        }

        // Default to a neutral gray
        return '#9CA3AF';
    }

    // ============================================
    // Initialize on DOM ready
    // ============================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
