/**
 * Payments & Invoicing Module for RYDOC GymOS
 * Requirement 4, 6 & 9:
 * Polished empty state: "No transactions recorded. Record a payment to start tracking collections."
 * Real payment recording, invoice generation, printable receipt, and zero fabricated financial data.
 */

class PaymentsModule {
  constructor() {
    this.store = window.gymStore;
    this.searchTerm = '';
    this.filterMethod = 'all';
  }

  render(container) {
    const allPayments = this.store.getPayments();
    const filtered = this.getFilteredPayments(allPayments);

    container.innerHTML = `
      <!-- Action Bar -->
      <div class="action-bar">
        <div class="action-bar-left">
          <div class="search-input-wrapper">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="form-control" placeholder="Search by member, invoice #..." value="${this.escapeHtml(this.searchTerm)}" oninput="window.paymentsModule.handleSearch(this.value)">
          </div>

          <select class="form-control" style="width: auto; min-width: 140px;" onchange="window.paymentsModule.handleMethodFilter(this.value)">
            <option value="all" ${this.filterMethod === 'all' ? 'selected' : ''}>All Methods (${allPayments.length})</option>
            <option value="UPI" ${this.filterMethod === 'UPI' ? 'selected' : ''}>UPI</option>
            <option value="Cash" ${this.filterMethod === 'Cash' ? 'selected' : ''}>Cash</option>
            <option value="Card" ${this.filterMethod === 'Card' ? 'selected' : ''}>Card / POS</option>
            <option value="Net Banking" ${this.filterMethod === 'Net Banking' ? 'selected' : ''}>Net Banking</option>
            <option value="Cheque" ${this.filterMethod === 'Cheque' ? 'selected' : ''}>Cheque</option>
          </select>
        </div>

        <div class="action-bar-right">
          <button class="btn btn-primary" onclick="window.paymentsModule.openRecordPaymentModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Record Payment
          </button>
        </div>
      </div>

      <!-- Main Listing or Required Empty State -->
      ${allPayments.length === 0 ? this.renderEmptyState() : this.renderPaymentsTable(filtered)}
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
        </div>
        <div class="empty-state-title">No transactions recorded.</div>
        <div class="empty-state-text">
          Record a payment to start tracking collections.
        </div>
        <div class="empty-state-action">
          <button class="btn btn-primary btn-lg" onclick="window.paymentsModule.openRecordPaymentModal()">
            + Record Payment
          </button>
        </div>
      </div>
    `;
  }

  renderPaymentsTable(payments) {
    if (payments.length === 0) {
      return `
        <div class="card" style="padding: 40px; text-align: center; color: var(--text-muted);">
          No payment transactions match your search criteria.
        </div>
      `;
    }

    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Member / Customer</th>
              <th>Purpose</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th style="text-align: right;">Receipt</th>
            </tr>
          </thead>
          <tbody>
            ${payments.map(p => `
              <tr>
                <td>
                  <span style="font-family:var(--font-mono); font-size:0.78rem; font-weight:700; color:var(--text-main);">${p.invoiceNumber}</span>
                </td>
                <td style="white-space:nowrap; font-size:0.82rem;">${p.paymentDate}</td>
                <td>
                  <div style="font-weight:600; color:var(--text-main);">${this.escapeHtml(p.memberName || 'Direct Customer')}</div>
                  <div style="font-size:0.74rem; color:var(--text-muted);">${this.escapeHtml(p.memberPhone || '')}</div>
                </td>
                <td>
                  <div style="font-size:0.84rem;">${this.escapeHtml(p.purpose)}</div>
                  ${p.notes ? `<div style="font-size:0.72rem; color:var(--text-muted);">${this.escapeHtml(p.notes)}</div>` : ''}
                </td>
                <td>
                  <span class="badge badge-neutral" style="font-size:0.72rem;">${p.paymentMethod}</span>
                </td>
                <td>
                  <span style="font-size:0.95rem; font-weight:800; color:var(--brand-green);">${this.store.formatCurrency(p.amount)}</span>
                </td>
                <td>
                  <span class="badge ${p.status === 'Completed' ? 'badge-active' : 'badge-warning'}">${p.status}</span>
                </td>
                <td style="text-align: right;">
                  <div style="display:inline-flex; gap:6px;">
                    <button class="btn btn-secondary btn-sm" onclick="window.paymentsModule.openInvoiceReceipt('${p.id}')">
                      Receipt
                    </button>
                    <button class="btn btn-outline btn-sm" style="color:var(--status-expired);" title="Delete Record" onclick="window.paymentsModule.confirmDeletePayment('${p.id}')">
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  getFilteredPayments(payments) {
    let list = [...payments];
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      list = list.filter(p => 
        (p.memberName && p.memberName.toLowerCase().includes(term)) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(term)) ||
        (p.purpose && p.purpose.toLowerCase().includes(term))
      );
    }
    if (this.filterMethod !== 'all') {
      list = list.filter(p => p.paymentMethod === this.filterMethod);
    }
    return list;
  }

  handleSearch(val) {
    this.searchTerm = val;
    this.render(document.getElementById('module-container'));
  }

  handleMethodFilter(val) {
    this.filterMethod = val;
    this.render(document.getElementById('module-container'));
  }

  openRecordPaymentModal(prefilledMemberId = null) {
    const members = this.store.getMembers();
    const today = this.store.getTodayDateString();
    const invoiceNum = this.store.generateInvoiceNumber();

    let prefilledMember = null;
    if (prefilledMemberId) {
      prefilledMember = this.store.getMemberById(prefilledMemberId);
    }

    const memberOptions = members.map(m => {
      const isSelected = prefilledMember && prefilledMember.id === m.id;
      return `<option value="${m.id}" data-name="${this.escapeHtml(m.name)}" data-phone="${this.escapeHtml(m.phone)}" data-due="${m.balanceAmount || 0}" ${isSelected ? 'selected' : ''}>${m.name} (${m.memberId}) — Due: ₹${(m.balanceAmount || 0).toLocaleString('en-IN')}</option>`;
    }).join('');

    const defaultAmount = prefilledMember ? (prefilledMember.balanceAmount || 0) : '';

    const modalBody = `
      <form id="record-payment-form" onsubmit="window.paymentsModule.submitPayment(event)">
        <div class="form-group">
          <label class="form-label">Link to Member</label>
          <select class="form-control" id="pay-member-select" onchange="window.paymentsModule.handleMemberSelectChange(this)">
            <option value="">-- Direct Customer / Walk-in / Miscellaneous --</option>
            ${memberOptions}
          </select>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Customer / Member Name <span class="required">*</span></label>
            <input type="text" class="form-control" id="pay-name" value="${prefilledMember ? this.escapeHtml(prefilledMember.name) : ''}" placeholder="Customer name" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" class="form-control" id="pay-phone" value="${prefilledMember ? this.escapeHtml(prefilledMember.phone) : ''}" placeholder="Phone number">
          </div>
        </div>

        <div class="form-grid-3">
          <div class="form-group">
            <label class="form-label">Amount Paid (₹) <span class="required">*</span></label>
            <input type="number" class="form-control" id="pay-amount" value="${defaultAmount}" placeholder="0" required>
          </div>
          <div class="form-group">
            <label class="form-label">Payment Date</label>
            <input type="date" class="form-control" id="pay-date" value="${today}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Payment Mode</label>
            <select class="form-control" id="pay-method">
              <option value="UPI">UPI (Google Pay/PhonePe/Paytm)</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card (POS Terminal)</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Purpose of Payment</label>
            <select class="form-control" id="pay-purpose">
              <option value="Membership Renewal">Membership Renewal</option>
              <option value="New Registration Fee">New Registration Fee</option>
              <option value="Personal Training (PT)">Personal Training (PT)</option>
              <option value="Supplement / Inventory Sale">Supplement / Inventory Sale</option>
              <option value="Locker Rental">Locker Rental</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Invoice Number</label>
            <input type="text" class="form-control" id="pay-invoice-num" value="${invoiceNum}" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes / Remarks <span class="optional">(optional)</span></label>
          <input type="text" class="form-control" id="pay-notes" placeholder="e.g. Paid via PhonePe reference #">
        </div>

        <!-- Integration notice & UPI Counter QR preview -->
        <div style="background:var(--bg-app); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:12px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:0.78rem; font-weight:600; color:var(--text-main);">
              Counter UPI QR Code Generator
            </div>
            <span class="badge badge-info" style="font-size:0.65rem;">Manual Reconciliation</span>
          </div>
          <div style="font-size:0.73rem; color:var(--text-muted); margin-top:4px;">
            Payment gateways are not directly hooked to an active server in this client-only mode. Once you verify funds on your bank/UPI app, click "Confirm & Record Payment" below.
          </div>
        </div>

        <div class="modal-footer" style="padding:0; margin-top:16px; border:none;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Confirm & Record Payment</button>
        </div>
      </form>
    `;

    window.app.showModal('Record Payment Collection', modalBody);
  }

  handleMemberSelectChange(selectEl) {
    const selected = selectEl.options[selectEl.selectedIndex];
    const nameInput = document.getElementById('pay-name');
    const phoneInput = document.getElementById('pay-phone');
    const amountInput = document.getElementById('pay-amount');

    if (!selected || !selected.value) {
      if (nameInput) nameInput.value = '';
      if (phoneInput) phoneInput.value = '';
      if (amountInput) amountInput.value = '';
      return;
    }

    const name = selected.getAttribute('data-name');
    const phone = selected.getAttribute('data-phone');
    const due = selected.getAttribute('data-due');

    if (nameInput) nameInput.value = name || '';
    if (phoneInput) phoneInput.value = phone || '';
    if (amountInput) amountInput.value = due > 0 ? due : '';
  }

  submitPayment(e) {
    e.preventDefault();
    const selectEl = document.getElementById('pay-member-select');
    const memberId = selectEl ? selectEl.value : '';

    const paymentData = {
      memberId: memberId,
      memberName: document.getElementById('pay-name').value,
      memberPhone: document.getElementById('pay-phone').value,
      amount: document.getElementById('pay-amount').value,
      paymentDate: document.getElementById('pay-date').value,
      paymentMethod: document.getElementById('pay-method').value,
      purpose: document.getElementById('pay-purpose').value,
      invoiceNumber: document.getElementById('pay-invoice-num').value,
      notes: document.getElementById('pay-notes').value,
      status: 'Completed'
    };

    const newPayment = this.store.addPayment(paymentData);
    window.app.closeModal();
    window.app.showToast(
      'Payment Recorded',
      `Collected ${this.store.formatCurrency(newPayment.amount)} from ${newPayment.memberName}. Dashboard updated.`,
      'success'
    );
  }

  openInvoiceReceipt(paymentId) {
    const payment = this.store.getPayments().find(p => p.id === paymentId);
    if (!payment) return;

    const profile = this.store.getProfile() || { gymName: 'RYDOC Gym', phone: '', address: '' };

    const modalBody = `
      <div class="invoice-receipt" id="printable-receipt">
        <div class="invoice-receipt-header">
          <div>
            <div class="brand-logo" style="margin-bottom:6px;">
              <span class="brand-name">${this.escapeHtml(profile.gymName)}</span>
              <span class="brand-dot">.</span>
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(profile.address || 'Fitness Center')}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">Phone: ${this.escapeHtml(profile.phone || '')}</div>
          </div>
          <div style="text-align:right;">
            <div class="invoice-title">RECEIPT</div>
            <div class="invoice-id">${payment.invoiceNumber}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">Date: ${payment.paymentDate}</div>
          </div>
        </div>

        <div style="margin-bottom:16px; font-size:0.84rem;">
          <div style="color:var(--text-secondary);">Received with thanks from:</div>
          <div style="font-size:1.05rem; font-weight:700; color:var(--text-main);">${this.escapeHtml(payment.memberName || 'Customer')}</div>
          ${payment.memberPhone ? `<div style="font-size:0.75rem; color:var(--text-muted);">Phone: ${this.escapeHtml(payment.memberPhone)}</div>` : ''}
        </div>

        <table class="invoice-table">
          <thead>
            <tr style="border-bottom:1px solid var(--border-subtle); color:var(--text-secondary); text-align:left;">
              <th style="padding-bottom:8px;">Description</th>
              <th style="padding-bottom:8px; text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:10px 0;">
                <strong>${this.escapeHtml(payment.purpose)}</strong>
                ${payment.notes ? `<div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(payment.notes)}</div>` : ''}
              </td>
              <td style="padding:10px 0; text-align:right; font-weight:700;">
                ${this.store.formatCurrency(payment.amount)}
              </td>
            </tr>
            <tr class="invoice-total-row">
              <td style="padding-top:12px;">Total Paid (${payment.paymentMethod})</td>
              <td style="padding-top:12px; text-align:right; color:var(--brand-green);">
                ${this.store.formatCurrency(payment.amount)}
              </td>
            </tr>
          </tbody>
        </table>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; padding-top:12px; border-top:1px dashed var(--border-card); font-size:0.75rem; color:var(--text-muted);">
          <span>Payment Status: <strong style="color:var(--brand-green);">${payment.status}</strong></span>
          <span>Authorized Seal / Signature</span>
        </div>
      </div>

      <div class="modal-footer" style="padding:0; margin-top:20px; border:none; display:flex; justify-content:space-between;">
        <span style="font-size:0.75rem; color:var(--text-muted);">Generated locally by RYDOC GymOS</span>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-outline" onclick="window.app.closeModal()">Close</button>
          <button class="btn btn-primary" onclick="window.print()">
            🖨️ Print Receipt
          </button>
        </div>
      </div>
    `;

    window.app.showModal('Official Payment Receipt', modalBody);
  }

  confirmDeletePayment(id) {
    if (confirm('Delete this payment transaction? This will adjust your revenue calculations.')) {
      this.store.deletePayment(id);
      window.app.showToast('Transaction Deleted', 'Payment record removed and metrics updated.', 'info');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

window.paymentsModule = new PaymentsModule();
