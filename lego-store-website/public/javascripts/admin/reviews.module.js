import Switch from "./components/switch.js";

class Reviews {
    constructor() {
        document.addEventListener("DOMContentLoaded", () => {
            this.init();
        });
    }

    init() {
        this.applyAnimationDelay("[class*='animate-']", 0.1);
        this.bindEvents();
    }

    applyAnimationDelay(selector, step = 0.1) {
        document.querySelectorAll(selector).forEach((el, index) => {
            el.style.animationDelay = `${index * step}s`;
        });
    }

    bindEvents() {
        document.querySelectorAll('.switch').forEach((s) => {
            new Switch(s, {
                onEnable: async () => {
                    const confirmed = await showConfirm(
                        "Bạn có chắc chắn muốn HIỂN THỊ đánh giá này không?"
                    );
                    if (!confirmed) return false;

                    return await this.toggleReviewStatus(s, true); // true = show
                },
                onDisable: async () => {
                    const confirmed = await showConfirm(
                        "Bạn có chắc chắn muốn ẨN đánh giá này không?\nĐánh giá sẽ không hiển thị trên trang sản phẩm."
                    );
                    if (!confirmed) return false;

                    return await this.toggleReviewStatus(s, false); // false = hide
                }
            });
        });
    }

    /**
     * @param {HTMLElement} el switch element
     * @param {boolean} isVisible true = show | false = hide
     */
    async toggleReviewStatus(el, isVisible) {
        const reviewId = el.dataset.id;

        try {
            showLoading(isVisible ? "Đang hiển thị đánh giá..." : "Đang ẩn đánh giá...");

            const res = await fetch(`/api/reviews/toggle/${reviewId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" }
            });

            const result = await res.json();
            hideLoading();

            if (result.success) {
                showToast(
                    result.message ||
                    (isVisible
                        ? "Đã hiển thị đánh giá"
                        : "Đã ẩn đánh giá"),
                    "success"
                );
                return true;
            }

            showToast(result.message || "Cập nhật trạng thái thất bại", "error");
            return false;
        } catch (err) {
            hideLoading();
            showToast("Có lỗi xảy ra khi cập nhật trạng thái đánh giá", "error");
            return false;
        }
    }
}

export default new Reviews();
