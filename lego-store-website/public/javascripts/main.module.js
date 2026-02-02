class Main {
    constructor() {
        document.addEventListener("DOMContentLoaded", () => {
            this.init();
            this.showSessionToast();
        });
    }

    init() {
        this.cacheElements();
        this.setupGlobalUI();
        this.bindEvents();
        this.initLegoBackground();
    }

    cacheElements() {
        // Toast
        this.toastEl = document.getElementById('globalToast');
        this.toastMessage = document.getElementById('globalToastMessage');
        this.toastCloseBtn = document.getElementById('globalToastClose');

        // Loading
        this.loadingWrapper = document.getElementById('globalLoadingWrapper');
        this.loadingMessageEl = document.getElementById('globalLoadingMessage');

        // Confirm
        this.confirmWrapper = document.getElementById('globalConfirmWrapper');
        this.confirmMessageEl = document.getElementById('globalConfirmMessage');
        this.confirmOkBtn = document.getElementById('globalConfirmOk');
        this.confirmCancelBtn = document.getElementById('globalConfirmCancel');
    }

    bindEvents() {
        // Toast close
        if (this.toastCloseBtn) {
            this.toastCloseBtn.addEventListener('click', () => {
                this.toastEl.classList.remove('show');
            });
        }

        // Confirm cancel
        if (this.confirmCancelBtn) {
            this.confirmCancelBtn.addEventListener('click', () => {
                this.confirmWrapper.classList.add('d-none');
                if (this._confirmReject) this._confirmReject(false);
            });
        }

        const mainLayout = document.querySelector('.wrapper-layout');
        if (mainLayout) {
            const layoutType = mainLayout.dataset.layout;
            const modals = document.querySelectorAll('#globalToast, #globalLoadingWrapper, #globalConfirmWrapper');
            modals.forEach(modal => {
                modal.dataset.layout = layoutType;
            });
        }


        window.formatPrice = (price, currency = '₫') => {
            if (typeof price !== 'number') return '';
            return price.toLocaleString('vi-VN') + ' ' + currency;
        }

        document.querySelector('.logout')?.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/api/logout', {
                    method: 'POST',
                    credentials: 'include'
                });
                window.location.href = '/';
            } catch (err) {
                console.error('Logout error:', err);
            }
        });

        document.addEventListener("cart:update", (e) => {
            const { quantity } = e.detail;
            this.updateCartBadge(quantity);
        });
    }

    updateCartBadge(quantity) {
        const badge = document.querySelector("#cart-badge");
        if (badge) {
            badge.textContent = quantity;
        }
    }

    showSessionToast() {
        const toastData = sessionStorage.getItem('sessionToast');
        if (toastData) {
            const { message, type } = JSON.parse(toastData);
            showToast(message, type);
            sessionStorage.removeItem('sessionToast');
        }
    }

    setupGlobalUI() {
        const self = this;

        window.setSessionToast = (message, type = 'success') => {
            sessionStorage.setItem(
                'sessionToast',
                JSON.stringify({ message, type })
            );
        };
        window.showToast = (message, type = 'success', delay = 3000) => {
            const iconEl = self.toastEl.querySelector('#globalToastIcon');

            self.toastEl.classList.remove('toast-success', 'toast-error', 'toast-warning');
            iconEl.className = 'toast-icon bi';

            switch (type) {
                case 'success':
                    self.toastEl.classList.add('toast-success');
                    iconEl.classList.add('bi-check-circle');
                    break;
                case 'error':
                    self.toastEl.classList.add('toast-error');
                    iconEl.classList.add('bi-x-circle');
                    break;
                case 'warning':
                    self.toastEl.classList.add('toast-warning');
                    iconEl.classList.add('bi-exclamation-triangle');
                    break;
            }

            self.toastMessage.innerText = message;
            self.toastEl.classList.add('show');

            if (self.toastTimeout) {
                clearTimeout(self.toastTimeout);
            }

            self.toastTimeout = setTimeout(() => {
                self.toastEl.classList.remove('show');
                self.toastTimeout = null;
            }, delay);
        };



        // ===== Loading =====
        window.showLoading = (message = 'Đang tải...') => {
            self.loadingMessageEl.innerText = message;
            self.loadingWrapper.classList.remove('d-none');
        };
        window.hideLoading = () => {
            self.loadingWrapper.classList.add('d-none');
        };

        // ===== Confirm =====
        window.showConfirm = (message) => {
            const confirmWrapper = document.querySelector('.confirm-wrapper');
            const confirmMessageEl = document.getElementById('globalConfirmMessage');
            const confirmOkBtn = document.getElementById('globalConfirmOk');

            return new Promise((resolve) => {
                confirmMessageEl.innerText = message;
                confirmWrapper.classList.remove('d-none');

                const cleanup = () => {
                    confirmWrapper.classList.add('d-none');
                    confirmOkBtn.removeEventListener('click', onClick);
                };

                const onClick = () => {
                    cleanup();
                    resolve(true);
                };

                confirmOkBtn.addEventListener('click', onClick);
            });
        };
    }

    initLegoBackground() {
        console.log("Initializing LEGO Background...");
        const ENABLE_VIBRANT_EDGE = false;

        const getContentBounds = () => {
            const el = document.querySelector('.container');
            if (!el) return null;

            const rect = el.getBoundingClientRect();
            const padding = brickWidth / 2;

            return {
                left: rect.left - padding * 2,
                right: rect.right + padding * 3
            };
        };

        const vibrantColors = [
            '#f44336', // đỏ
            '#ffeb3b', // vàng
            '#2196f3', // xanh dương
            '#4caf50', // xanh lá
            '#ff9800', // cam
            '#9c27b0'  // tím
        ];

        const container = document.getElementById('lego-background-container');
        if (!container) {
            console.warn("LEGO background container not found!");
            return;
        }

        const canvas = document.createElement('canvas');
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const colors = {
            main: '#e3e9ed',      // Sắc trắng sương nhạt (Neutral White)
            secondary: '#d9e2e5', // Xám xanh nhạt (Light Slate)
            accent: '#cbd5db',    // Xám blueprint (Cool Gray)
            joint: 'rgba(0, 0, 0, 0.04)',
            studShadow: 'rgba(0, 0, 0, 0.06)',
            studHighlight: 'rgba(255, 255, 255, 0.5)'
        };

        const brickWidth = 240; // 6 studs wide
        const brickHeight = 80; // 2 studs high
        const studSpacing = 40;
        const studRadius = 10;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            draw();
        };

        const drawBrick = (x, y, color) => {
            // Draw brick body
            ctx.fillStyle = color;
            ctx.fillRect(x + 1, y + 1, brickWidth - 2, brickHeight - 2);

            // Draw joints
            ctx.strokeStyle = colors.joint;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 1, y + 1, brickWidth - 2, brickHeight - 2);

            // Draw studs (2x6 grid)
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 2; j++) {
                    const sx = x + i * studSpacing + studSpacing / 2;
                    const sy = y + j * studSpacing + studSpacing / 2;

                    // Stud shadow
                    ctx.beginPath();
                    ctx.arc(sx + 1.5, sy + 1.5, studRadius, 0, Math.PI * 2);
                    ctx.fillStyle = colors.studShadow;
                    ctx.fill();

                    // Stud body
                    ctx.beginPath();
                    ctx.arc(sx, sy, studRadius, 0, Math.PI * 2);
                    ctx.fillStyle = color;
                    ctx.fill();

                    // Stud highlight
                    ctx.beginPath();
                    ctx.arc(sx - 1.5, sy - 1.5, studRadius / 2, 0, Math.PI * 2);
                    ctx.fillStyle = colors.studHighlight;
                    ctx.fill();
                }
            }
        };

        const getNeutralBrickColor = (r, c) => {
            // Phối màu trung tính để tôn layout chính (Trắng/Đen/Vàng/Đỏ)
            const seed = Math.abs(Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1;
            if (seed < 0.1) return colors.accent;    // 10% gạch xám blueprint
            if (seed < 0.4) return colors.secondary; // 30% gạch xám xanh nhạt
            return colors.main;                      // 60% gạch trắng sương
        };

        const getVibrantBrickColor = (r, c, x) => {
            const { left, right } = getContentBounds();

            // Brick nằm ngoài vùng content
            if (x < left || x + brickWidth > right) {
                const seed = Math.abs(Math.sin(r * 9.13 + c * 17.77) * 1000);
                return vibrantColors[Math.floor(seed) % vibrantColors.length];
            }

            // Brick trong vùng content → trung tính
            const seed = Math.abs(Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1;
            if (seed < 0.1) return colors.accent;
            if (seed < 0.4) return colors.secondary;
            return colors.main;
        };


        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cols = Math.ceil(canvas.width / brickWidth) + 2;
            const rows = Math.ceil(canvas.height / brickHeight) + 1;

            for (let r = 0; r < rows; r++) {
                const offsetX = (r % 2 === 0) ? 0 : -brickWidth / 2;
                for (let c = -1; c < cols; c++) {
                    const x = c * brickWidth + offsetX;
                    const y = r * brickHeight;
                    let color;
                    if (ENABLE_VIBRANT_EDGE) {
                        color = getVibrantBrickColor(r, c, x);
                    } else {
                        color = getNeutralBrickColor(r, c);
                    }
                    drawBrick(x, y, color);
                }
            }
        };

        const debounce = (func, wait) => {
            let timeout;
            return function () {
                clearTimeout(timeout);
                timeout = setTimeout(func, wait);
            };
        };

        window.addEventListener('resize', debounce(resize, 150));
        resize();
    }
}

export default new Main();
