// State Management
const State = {
    balance: 0,
    coinBalance: 0,
    history: [],

    init() {
        try {
            const savedHistory = localStorage.getItem('pm-history');
            this.history = savedHistory ? JSON.parse(savedHistory) : [];
            this.calculateBalances();
            console.log('State initialized:', this.history.length, 'entries.');
        } catch (e) {
            console.error('Initialization failed:', e);
            this.history = [];
            this.balance = 0;
            this.coinBalance = 0;
        }
    },

    calculateBalances() {
        this.balance = 0;
        this.coinBalance = 0;
        this.history.forEach(t => {
            const amount = t.amount || 0;
            const isMoney = t.currency !== 'coin';
            if (t.type === 'allowance') {
                if (isMoney) this.balance += amount; else this.coinBalance += amount;
            } else {
                if (isMoney) this.balance -= amount; else this.coinBalance -= amount;
            }
        });
    },

    save() {
        try {
            this.calculateBalances();
            localStorage.setItem('pm-history', JSON.stringify(this.history));
            localStorage.setItem('pm-balance', this.balance.toString());
            localStorage.setItem('pm-coin-balance', this.coinBalance.toString());
            window.dispatchEvent(new CustomEvent('state-updated'));
            console.log('Saved. Money:', this.balance, 'Coins:', this.coinBalance);
        } catch (e) {
            console.error('Save failed:', e);
        }
    },

    upsertTransaction(transaction) {
        if (transaction.id) {
            const index = this.history.findIndex(t => t.id === transaction.id);
            if (index !== -1) this.history[index] = { ...this.history[index], ...transaction };
        } else {
            transaction.id = Date.now();
            this.history.unshift(transaction);
        }
        this.history.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.save();
    },

    deleteTransaction(id) {
        this.history = this.history.filter(t => t.id !== id);
        this.save();
    }
};

State.init();

// Web Component: Balance Display
class BalanceDisplay extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    connectedCallback() {
        this.render();
        window.addEventListener('state-updated', () => this.render());
    }
    render() {
        const money = State.balance.toLocaleString('ko-KR', { style: 'currency', currency: 'KRW' });
        const coins = State.coinBalance.toLocaleString('ko-KR');
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
                .card {
                    padding: 1.5rem; border-radius: 24px; color: white; text-align: center;
                    box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1); transition: transform 0.2s;
                }
                .card:hover { transform: translateY(-4px); }
                .money { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); }
                .coin { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); }
                .label { font-size: 0.75rem; opacity: 0.9; margin-bottom: 0.5rem; text-transform: uppercase; font-weight: 700; }
                .amount { font-size: 2rem; font-weight: 800; }
                @media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
            </style>
            <div class="grid">
                <div class="card money">
                    <div class="label">Pocket Money 💰</div>
                    <div class="amount">${money}</div>
                </div>
                <div class="card coin">
                    <div class="label">Reward Coins 🪙</div>
                    <div class="amount">${coins}</div>
                </div>
            </div>
        `;
    }
}

// Web Component: Transaction Form
class TransactionForm extends HTMLElement {
    constructor(type) {
        super();
        this.type = type; // 'allowance' or 'spending'
        this.editingId = null;
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        window.addEventListener(`edit-${this.type}`, (e) => this.fillForm(e.detail));
    }

    fillForm(data) {
        this.editingId = data.id;
        this.render();
        this.shadowRoot.getElementById('amount').value = data.amount;
        this.shadowRoot.getElementById('desc').value = data.description;
        this.shadowRoot.getElementById('date').value = data.date.split('T')[0];
        this.shadowRoot.getElementById('currency').value = data.currency || 'money';
        this.shadowRoot.getElementById('amount').focus();
    }

    clearForm() { this.editingId = null; this.render(); }

    render() {
        const isAllowance = this.type === 'allowance';
        const today = new Date().toISOString().split('T')[0];
        this.shadowRoot.innerHTML = `
            <style>
                .form-container { background: white; padding: 2rem; border-radius: 24px; border: 1px solid #e5e7eb; }
                h3 { margin-top: 0; color: #111827; }
                .input-group { margin-bottom: 1.25rem; }
                label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: #4b5563; }
                input, select { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 12px; font-size: 1rem; box-sizing: border-box; }
                .currency-selector { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
                .currency-btn { flex: 1; padding: 0.75rem; border: 2px solid #e5e7eb; border-radius: 12px; cursor: pointer; background: #f9fafb; font-weight: 700; transition: all 0.2s; }
                .currency-btn.active { border-color: #6366f1; background: #eef2ff; color: #6366f1; }
                button.submit-btn { width: 100%; border: none; padding: 1rem; border-radius: 12px; font-weight: 700; cursor: pointer; background: ${isAllowance ? '#6366f1' : '#ec4899'}; color: white; }
                .cancel-btn { width: 100%; margin-top: 0.5rem; padding: 0.75rem; border-radius: 12px; border: none; background: #f3f4f6; cursor: pointer; }
            </style>
            <div class="form-container">
                <h3>${this.editingId ? 'Edit Entry' : (isAllowance ? 'Give Rewards 🎁' : 'Record Spending 🍦')}</h3>
                <div class="input-group">
                    <label>Currency Type</label>
                    <select id="currency">
                        <option value="money">Pocket Money (₩)</option>
                        <option value="coin">Reward Coins (🪙)</option>
                    </select>
                </div>
                <div class="input-group">
                    <label>Date</label>
                    <input type="date" id="date" value="${today}">
                </div>
                <div class="input-group">
                    <label>Amount</label>
                    <input type="number" id="amount" placeholder="e.g. 5000">
                </div>
                <div class="input-group">
                    <label>Message / Description</label>
                    <input type="text" id="desc" placeholder="What is this for?">
                </div>
                <button class="submit-btn" id="submit">${this.editingId ? 'Update' : 'Confirm Action'}</button>
                ${this.editingId ? `<button class="cancel-btn" id="cancel">Cancel</button>` : ''}
            </div>
        `;

        this.shadowRoot.getElementById('submit').addEventListener('click', () => {
            const amount = parseFloat(this.shadowRoot.getElementById('amount').value);
            const desc = this.shadowRoot.getElementById('desc').value;
            const date = this.shadowRoot.getElementById('date').value;
            const currency = this.shadowRoot.getElementById('currency').value;

            if (!amount || !desc) { alert('Please fill in everything!'); return; }
            
            if (!isAllowance && !this.editingId) {
                const currentBalance = currency === 'money' ? State.balance : State.coinBalance;
                if (currentBalance < amount) { alert('Not enough balance!'); return; }
            }

            State.upsertTransaction({
                id: this.editingId,
                type: this.type,
                currency,
                amount,
                description: desc,
                date: new Date(date).toISOString()
            });
            this.clearForm();
        });
        if (this.editingId) this.shadowRoot.getElementById('cancel').addEventListener('click', () => this.clearForm());
    }
}

class AllowanceForm extends TransactionForm { constructor() { super('allowance'); } }
class SpendingForm extends TransactionForm { constructor() { super('spending'); } }

// Web Component: Transaction History
class TransactionHistory extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: 'open' }); }
    connectedCallback() {
        this.render();
        window.addEventListener('state-updated', () => this.render());
    }
    render() {
        const items = State.history.map(t => `
            <div class="item ${t.type}" data-id="${t.id}">
                <div class="icon">${t.currency === 'coin' ? '🪙' : '💰'}</div>
                <div class="details">
                    <span class="desc">${t.description}</span>
                    <span class="date">${new Date(t.date).toLocaleDateString('ko-KR')}</span>
                </div>
                <div class="right-col">
                    <div class="amount ${t.currency}">
                        ${t.type === 'allowance' ? '+' : '-'}${t.amount.toLocaleString()}
                    </div>
                    <div class="actions">
                        <button class="edit-btn">✏️</button>
                        <button class="delete-btn">🗑️</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.shadowRoot.innerHTML = `
            <style>
                .container { background: white; border-radius: 24px; border: 1px solid #e5e7eb; overflow: hidden; }
                .header { padding: 1.5rem; border-bottom: 1px solid #e5e7eb; font-weight: 700; }
                .list { max-height: 400px; overflow-y: auto; }
                .item { display: flex; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #f3f4f6; gap: 1rem; }
                .icon { font-size: 1.5rem; }
                .details { flex: 1; display: flex; flex-direction: column; }
                .desc { font-weight: 600; color: #1f2937; }
                .date { font-size: 0.75rem; color: #6b7280; }
                .amount { font-weight: 800; font-size: 1.1rem; }
                .allowance { color: #10b981; }
                .spending { color: #ef4444; }
                .amount.coin { color: #f59e0b; }
                .actions { display: flex; gap: 0.5rem; opacity: 0; }
                .item:hover .actions { opacity: 1; }
                .actions button { background: none; border: none; cursor: pointer; }
                .empty { padding: 3rem; text-align: center; color: #9ca3af; }
            </style>
            <div class="container">
                <div class="header">History</div>
                <div class="list">${items || '<div class="empty">No entries yet.</div>'}</div>
            </div>
        `;
        this.shadowRoot.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.item').dataset.id);
                const t = State.history.find(x => x.id === id);
                if (t) {
                    window.dispatchEvent(new CustomEvent(`edit-${t.type}`, { detail: t }));
                    document.getElementById(`toggle-${t.type}`).click();
                }
            });
        });
        this.shadowRoot.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (confirm('Delete this?')) State.deleteTransaction(parseInt(e.target.closest('.item').dataset.id));
            });
        });
    }
}

customElements.define('balance-display', BalanceDisplay);
customElements.define('allowance-form', AllowanceForm);
customElements.define('spending-form', SpendingForm);
customElements.define('transaction-history', TransactionHistory);

// App Logic: View Toggling
document.addEventListener('DOMContentLoaded', () => {
    const parentBtn = document.getElementById('toggle-parent');
    const childBtn = document.getElementById('toggle-child');
    const parentPanel = document.getElementById('parent-actions');
    const childPanel = document.getElementById('child-actions');

    const setRole = (role) => {
        if (role === 'parent') {
            parentBtn.classList.add('active');
            childBtn.classList.remove('active');
            parentPanel.classList.remove('hidden');
            childPanel.classList.add('hidden');
        } else {
            childBtn.classList.add('active');
            parentBtn.classList.remove('active');
            childPanel.classList.remove('hidden');
            parentPanel.classList.add('hidden');
        }
    };

    parentBtn.addEventListener('click', () => setRole('parent'));
    childBtn.addEventListener('click', () => setRole('child'));
});

// Register Components
customElements.define('balance-display', BalanceDisplay);
customElements.define('allowance-form', AllowanceForm);
customElements.define('spending-form', SpendingForm);
customElements.define('transaction-history', TransactionHistory);

// App Logic: View Toggling
document.addEventListener('DOMContentLoaded', () => {
    const parentBtn = document.getElementById('toggle-parent');
    const childBtn = document.getElementById('toggle-child');
    const parentPanel = document.getElementById('parent-actions');
    const childPanel = document.getElementById('child-actions');

    const setRole = (role) => {
        if (role === 'parent') {
            parentBtn.classList.add('active');
            childBtn.classList.remove('active');
            parentPanel.classList.remove('hidden');
            childPanel.classList.add('hidden');
        } else {
            childBtn.classList.add('active');
            parentBtn.classList.remove('active');
            childPanel.classList.remove('hidden');
            parentPanel.classList.add('hidden');
        }
    };

    parentBtn.addEventListener('click', () => setRole('parent'));
    childBtn.addEventListener('click', () => setRole('child'));
});
