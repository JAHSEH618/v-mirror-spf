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
    };

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
        state.viewState = 'upload';
        state.userPhoto = null;
        state.resultImage = null;
        renderModal();
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        state.isModalOpen = false;
        if (state.pollInterval) {
            clearInterval(state.pollInterval);
            state.pollInterval = null;
        }
        modalRoot.innerHTML = '';
        document.body.style.overflow = '';
    }

    // ============================================
    // Modal Rendering
    // ============================================
    function renderModal() {
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
          ${escapeHtml(config.modalTitle || 'AI Virtual Try-On')}
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
        <label class="v-mirror-color-label">Color: ${escapeHtml(state.selectedVariant?.option1 || colors[0].name)}</label>
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
      <h3 class="v-mirror-upload-title">Upload Your Photo</h3>
      <p class="v-mirror-upload-subtitle">${escapeHtml(config.uploadInstructions || 'Upload a full-body photo for best results')}</p>
      <p class="v-mirror-upload-subtitle">— or choose a model below —</p>
      <input type="file" id="v-mirror-file-input" class="v-mirror-file-input" accept="image/jpeg,image/png,image/webp" />
      <label for="v-mirror-file-input" class="v-mirror-browse-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15V19C21 20.1 20.1 21 19 21H5C3.9 21 3 20.1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <polyline points="17,8 12,3 7,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Browse Files
      </label>
    `;
    }

    function renderPreviewImage() {
        return `
      <div class="v-mirror-preview-container">
        <img src="${state.userPhoto}" alt="Your photo" class="v-mirror-preview-image" />
        <input type="file" id="v-mirror-reupload-input" class="v-mirror-file-input" accept="image/jpeg,image/png,image/webp" style="display:none" />
        <button class="v-mirror-change-photo-btn" id="v-mirror-change-photo">Change Photo</button>
      </div>
    `;
    }

    function renderExampleModels() {
        return `
      <div class="v-mirror-example-models">
        <p class="v-mirror-example-label">Quick Try: Select a Model</p>
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
        <h3 class="v-mirror-loading-text">Generating your try-on...</h3>
        <p class="v-mirror-loading-subtext">This usually takes 10-15 seconds</p>
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
            Download
          </button>
          <button class="v-mirror-action-btn primary" id="v-mirror-add-cart">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="21" r="1" fill="currentColor"/>
              <circle cx="20" cy="21" r="1" fill="currentColor"/>
              <path d="M1 1H5L7.68 14.39C7.77 14.83 8.02 15.22 8.38 15.5C8.74 15.78 9.19 15.93 9.65 15.92H19.4C19.86 15.93 20.31 15.78 20.67 15.5C21.03 15.22 21.28 14.83 21.37 14.39L23 6H6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Add to Cart
          </button>
          <button class="v-mirror-action-btn secondary icon-only" id="v-mirror-share" aria-label="Share">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/>
              <circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              <circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" stroke-width="2"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <button class="v-mirror-action-btn secondary" id="v-mirror-try-again">
            Try Another Photo
          </button>
        </div>
      </div>
    `;
    }

    function renderErrorView() {
        return `
      <div class="v-mirror-error">
        <svg class="v-mirror-error-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p class="v-mirror-error-text">Something went wrong. Please try again.</p>
        <button class="v-mirror-retry-btn" id="v-mirror-retry">Retry</button>
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
          ✨ Generate Try-On
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
            uploadArea.addEventListener('click', (e) => {
                // Prevent triggering input.click() if clicking on the label or input itself
                // This fixes the issue where first click fails due to double-triggering
                if (e.target.tagName === 'LABEL' || e.target.tagName === 'INPUT' ||
                    e.target.classList.contains('v-mirror-browse-btn')) {
                    return;
                }
                const input = document.getElementById('v-mirror-file-input');
                if (input) input.click();
            });
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
            alert('Please upload a JPG, PNG, or WebP image.');
            return;
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File size must be less than 5MB.');
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
            const startResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userImage: state.userPhoto,
                    garmentImage: productImage,
                    productId: config.productId,
                    garmentType: config.garmentType || null,
                }),
            });

            if (!startResponse.ok) {
                const errorText = await startResponse.text();
                console.error('[V-Mirror] Generation failed:', startResponse.status, errorText);
                throw new Error(`Failed to generate: ${startResponse.status} ${startResponse.statusText}`);
            }

            const responseData = await startResponse.json();
            console.log('[V-Mirror] API Response:', responseData);

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
            const errorMsg = document.getElementById('v-mirror-error-msg');
            if (errorMsg) errorMsg.textContent = error.message;

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
    function handleDownload() {
        if (!state.resultImage) return;

        const link = document.createElement('a');
        link.href = state.resultImage;
        link.download = `try-on-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                }),
            });

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
