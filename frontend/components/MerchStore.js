/**
 * MerchStore Component
 * Handles the rendering of merchandise and the PayHero payment integration.
 */

export class MerchStore {
    constructor(containerId, merch = []) {
        this.container = document.getElementById(containerId);
        this.merch = merch;
        this.modal = document.getElementById('checkout-modal');
        this.form = document.getElementById('checkout-form');
        this.step1 = document.getElementById('checkout-step-1');
        this.step2 = document.getElementById('checkout-step-2');
        this.selectedItem = null;
        
        this.init();
    }

    init() {
        if (this.modal) {
            const closeBtn = document.getElementById('close-checkout');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal());
            }

            window.addEventListener('click', (e) => {
                if (e.target === this.modal) this.closeModal();
            });

            // Step Navigation
            const proceedBtn = document.getElementById('proceed-to-order');
            if (proceedBtn) {
                proceedBtn.addEventListener('click', () => {
                    this.step1.style.display = 'none';
                    this.step2.style.display = 'block';
                });
            }

            const backBtn = document.getElementById('back-to-preview');
            if (backBtn) {
                backBtn.addEventListener('click', () => {
                    this.step2.style.display = 'none';
                    this.step1.style.display = 'block';
                });
            }
        }

        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handlePayment(e));
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = this.merch.map(m => {
            const isSoldOut = (m.stockCount !== undefined && m.stockCount <= 0);
            return `
                <div class="merch-card ${isSoldOut ? 'sold-out' : ''}" data-id="${m.id}">
                    <div class="merch-badge">${isSoldOut ? 'SOLD OUT' : m.status.replace('-', ' ').toUpperCase()}</div>
                    <div class="merch-img-container">
                        <img src="${m.image_url || m.imageUrl}" alt="${m.title}" loading="lazy" style="${isSoldOut ? 'filter: grayscale(1);' : ''}">
                    </div>
                    <div class="merch-details">
                        <h3 class="merch-title">${m.title}</h3>
                        <div class="merch-price">${m.price}</div>
                        ${isSoldOut ? `
                            <button class="btn btn-outline" style="width: 100%; opacity: 0.5; cursor: not-allowed;" disabled>Out of Stock</button>
                        ` : `
                            <button class="btn btn-outline buy-now-btn" style="width: 100%;" 
                                data-id="${m.id}" 
                                data-title="${m.title}" 
                                data-price="${m.price}"
                                data-image="${m.image_url || m.imageUrl}"
                                data-stock="${m.stockCount || 0}">
                                View / Order
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        // Link events
        this.container.querySelectorAll('.buy-now-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = {
                    id: btn.dataset.id,
                    title: btn.dataset.title,
                    price: btn.dataset.price,
                    image: btn.dataset.image,
                    stock: parseInt(btn.dataset.stock)
                };
                this.openCheckout(item);
            });
        });
    }

    openCheckout(item) {
        this.selectedItem = item;
        
        // Populate Step 1 (Preview)
        document.getElementById('preview-item-name').textContent = item.title;
        document.getElementById('preview-total').textContent = item.price;
        document.getElementById('checkout-preview-img').src = item.image;
        
        const stockWarning = document.getElementById('stock-warning');
        if (item.stock < 10) {
            stockWarning.textContent = `Hurry! Only ${item.stock} left in stock!`;
            stockWarning.style.color = '#ff4d4d';
        } else {
            stockWarning.textContent = `In Stock (${item.stock} available)`;
            stockWarning.style.color = '#888';
        }

        // Reset to Step 1
        this.step1.style.display = 'block';
        this.step2.style.display = 'none';
        
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden'; 
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.resetForm();
    }

    resetForm() {
        if (this.form) this.form.reset();
        const status = document.getElementById('payment-status');
        if (status) {
            status.textContent = '';
            status.className = 'payment-status';
        }
        const payBtn = document.getElementById('pay-btn');
        if (payBtn) {
            payBtn.disabled = false;
            payBtn.textContent = 'Confirm & Pay via M-Pesa';
        }
    }

    async handlePayment(e) {
        e.preventDefault();
        const formData = new FormData(this.form);
        const fanData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            location: formData.get('location'),
            item: this.selectedItem.title,
            amount: parseInt(this.selectedItem.price.replace(/[^0-9]/g, ''))
        };

        const status = document.getElementById('payment-status');
        const payBtn = document.getElementById('pay-btn');

        status.textContent = 'Initiating M-Pesa prompt...';
        status.className = 'payment-status processing';
        payBtn.disabled = true;

        try {
            const response = await fetch('/api/payments/payhero', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fanData)
            });

            const result = await response.json();

            if (response.ok) {
                status.textContent = 'Please check your phone for the M-Pesa prompt!';
                status.className = 'payment-status success';
                
                // Decrement stock locally for immediate feedback
                if (this.selectedItem.stock > 0) {
                    this.selectedItem.stock--;
                    // Update main data in case modal is reopened
                    const target = this.merch.find(m => m.id === this.selectedItem.id);
                    if (target) target.stockCount = this.selectedItem.stock;
                    this.render(); // Re-render gallery
                }
            } else {
                throw new Error(result.message || 'Payment initiation failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            status.textContent = 'Error: ' + error.message;
            status.className = 'payment-status error';
            payBtn.disabled = false;
        }
    }
}
