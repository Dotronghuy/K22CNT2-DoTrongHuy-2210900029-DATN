class Product {
    constructor() {
        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    init() {
        this.cacheElements();
        this.bindEvents();
    }

    cacheElements() {
        this.mainImage = document.getElementById("mainProductImage");
        this.thumbnails = document.querySelectorAll(".thumbnail-images .thumbnail");

        this.prevBtn = document.getElementById("prevImage");
        this.nextBtn = document.getElementById("nextImage");

        this.currentIndex = 0;

        this.qtyInput = document.getElementById("productQty");
        this.btnIncrease = document.getElementById("increaseQty");
        this.btnDecrease = document.getElementById("decreaseQty");

        this.btnAddToCart = document.getElementById("addToCart");
        this.btnBuyNow = document.getElementById("buyNow");

        if (this.btnAddToCart) {
            this.productId = this.btnAddToCart.dataset.id;
            this.price = parseFloat(this.btnAddToCart.dataset.price) || 0;
        }
    }


    bindEvents() {

        if (!this.thumbnails.length || !this.mainImage) return;

        this.thumbnails[0].classList.add("active");

        this.thumbnails.forEach((thumb, index) => {
            thumb.addEventListener("click", () => {
                this.currentIndex = index;
                this.updateImage();
            });
        });

        if (this.prevBtn) {
            this.prevBtn.addEventListener("click", () => this.prevImage());
        }

        if (this.nextBtn) {
            this.nextBtn.addEventListener("click", () => this.nextImage());
        }

        if (this.btnIncrease && this.btnDecrease && this.qtyInput) {
            this.btnIncrease.addEventListener("click", () => this.changeQuantity(1));
            this.btnDecrease.addEventListener("click", () => this.changeQuantity(-1));
        }

        if (this.btnAddToCart) {
            this.btnAddToCart.addEventListener("click", () => this.addToCart());
        }
        if (this.btnBuyNow) {
            this.btnBuyNow.addEventListener("click", () => this.buyNow());
        }
    }
    prevImage() {
        this.currentIndex--;
        if (this.currentIndex < 0) {
            this.currentIndex = this.thumbnails.length - 1;
        }
        this.updateImage();
    }

    nextImage() {
        this.currentIndex++;
        if (this.currentIndex >= this.thumbnails.length) {
            this.currentIndex = 0;
        }
        this.updateImage();
    }
    updateImage() {
        this.thumbnails.forEach(t => t.classList.remove("active"));

        const currentThumb = this.thumbnails[this.currentIndex];
        currentThumb.classList.add("active");

        this.mainImage.src = currentThumb.src;

        this.mainImage.classList.add("fade");
        setTimeout(() => this.mainImage.classList.remove("fade"), 200);
    }

    handleThumbnailClick(thumb) {

        this.thumbnails.forEach((t) => t.classList.remove("active"));

        thumb.classList.add("active");

        this.mainImage.src = thumb.src;

        this.mainImage.classList.add("fade");
        setTimeout(() => this.mainImage.classList.remove("fade"), 200);
    }
    changeQuantity(delta) {
        let qty = parseInt(this.qtyInput.value) || 1;
        qty += delta;
        if (qty < 1) qty = 1;
        this.qtyInput.value = qty;
    }
    async addToCart() {
        const quantity = parseInt(this.qtyInput.value) || 1;
        if (!this.productId) return;

        try {
            showLoading("Đang thêm sản phẩm vào giỏ...");

            const res = await fetch("/api/cart/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: this.productId, quantity, variantCombinationId: window.matchingCombo?._id })
            });

            const result = await res.json();
            console.log(result);
            hideLoading();

            if (result.success) {
                showToast(result.message || "Đã thêm vào giỏ hàng!", "success");
                const event = new CustomEvent("cart:update", { detail: { quantity: result.data.cartQuantity || 1 } });
                document.dispatchEvent(event);
            } else {
                switch (result.code) {
                    case 401:
                        showToast(result.message || "Thêm giỏ hàng thất bại!", "warning");
                        break;
                    case 403:
                        setSessionToast(result.message || "Bạn chưa đăng nhập!", "warning");
                        window.location.href = "/login";
                        break;
                    default:
                        showToast(result.message || "Thêm giỏ hàng thất bại!", "error");
                        break;
                }
            }
        } catch (err) {
            hideLoading();
            console.error("Lỗi khi thêm vào giỏ hàng:", err);
            showToast("Có lỗi xảy ra khi thêm giỏ hàng!", "error");
        }
    }
    buyNow() {
        const quantity = parseInt(this.qtyInput.value) || 1;
        const productId = this.btnBuyNow.dataset.id;
        if (!productId) return;

        showLoading("Đang xử lý mua ngay...");

        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/payment/buy-now";

        form.innerHTML = `
        <input type="hidden" name="productId" value="${productId}">
        <input type="hidden" name="quantity" value="${quantity}">
    `;

        document.body.appendChild(form);

        form.submit();
    }




}

export default new Product();
