/**
 * Members Module for RYDOC GymOS
 * Requirement 4 & 6:
 * Polished empty state: "No members added yet. Add your first member to start managing memberships and attendance."
 * Full CRUD, dynamic search, filters, profile drawer, and immediate recalculation.
 */

class MembersModule {
  constructor() {
    this.store = window.gymStore;
    this.searchTerm = '';
    this.filterStatus = 'all';
    this.selectedMemberId = null;
  }

  render(container) {
    const allMembers = this.store.getMembers();
    const filtered = this.getFilteredMembers(allMembers);

    container.innerHTML = `
      <!-- Action Bar -->
      <div class="action-bar">
        <div class="action-bar-left">
          <div class="search-input-wrapper">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="form-control" id="member-search" placeholder="Search by name, phone, or ID..." value="${this.escapeHtml(this.searchTerm)}" oninput="window.membersModule.handleSearch(this.value)">
          </div>

          <select class="form-control" style="width: auto; min-width: 140px;" onchange="window.membersModule.handleFilter(this.value)">
            <option value="all" ${this.filterStatus === 'all' ? 'selected' : ''}>All Members (${allMembers.length})</option>
            <option value="active" ${this.filterStatus === 'active' ? 'selected' : ''}>Active</option>
            <option value="expiring" ${this.filterStatus === 'expiring' ? 'selected' : ''}>Expiring Soon</option>
            <option value="expired" ${this.filterStatus === 'expired' ? 'selected' : ''}>Expired</option>
            <option value="due" ${this.filterStatus === 'due' ? 'selected' : ''}>Has Balance Due</option>
          </select>
        </div>

        <div class="action-bar-right">
          <button class="btn btn-primary" onclick="window.membersModule.openAddMemberModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Member
          </button>
        </div>
      </div>

      <!-- Main Member Listing or Required Empty State -->
      ${allMembers.length === 0 ? this.renderEmptyState() : this.renderMembersTable(filtered)}

      <!-- Profile Drawer Container -->
      <div id="member-drawer-backdrop" class="drawer-backdrop" onclick="window.membersModule.closeDrawer(event)">
        <div class="drawer-panel" id="member-drawer-content" onclick="event.stopPropagation()">
          <!-- Populated dynamically when viewing profile -->
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </div>
        <div class="empty-state-title">No members added yet.</div>
        <div class="empty-state-text">
          Add your first member to start managing memberships and attendance.
        </div>
        <div class="empty-state-action">
          <button class="btn btn-primary btn-lg" onclick="window.membersModule.openAddMemberModal()">
            + Add Member
          </button>
        </div>
      </div>
    `;
  }

  renderMembersTable(members) {
    if (members.length === 0) {
      return `
        <div class="card" style="padding: 40px; text-align: center; color: var(--text-muted);">
          No members match your current search or filter criteria.
          <div style="margin-top: 12px;">
            <button class="btn btn-secondary btn-sm" onclick="window.membersModule.resetFilters()">Clear Filters</button>
          </div>
        </div>
      `;
    }

    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Contact</th>
              <th>Plan</th>
              <th>Validity</th>
              <th>Status</th>
              <th>Fee & Due</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${members.map(m => {
              const due = m.balanceAmount || 0;
              return `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                      <div class="gym-avatar" style="width:34px; height:34px; font-size:0.85rem;">
                        ${this.escapeHtml(m.name.charAt(0).toUpperCase())}
                      </div>
                      <div>
                        <div style="font-weight:700; color:var(--text-main); cursor:pointer;" onclick="window.membersModule.openProfileDrawer('${m.id}')">
                          ${this.escapeHtml(m.name)}
                        </div>
                        <div style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted);">${m.memberId}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style="font-size:0.84rem;">${this.escapeHtml(m.phone)}</div>
                    <div style="font-size:0.74rem; color:var(--text-muted);">${this.escapeHtml(m.email || '—')}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;">${this.escapeHtml(m.planName || 'General')}</div>
                  </td>
                  <td>
                    <div style="font-size:0.82rem;">${m.startDate} <span style="color:var(--text-muted);">to</span></div>
                    <div style="font-size:0.82rem; font-weight:600;">${m.expiryDate || 'Ongoing'}</div>
                  </td>
                  <td>
                    <span class="badge ${this.getMemberStatusBadgeClass(m)}">
                      ${this.getMemberStatusText(m)}
                    </span>
                  </td>
                  <td>
                    <div style="font-weight:600;">${this.store.formatCurrency(m.totalFee)}</div>
                    ${due > 0 
                      ? `<div style="font-size:0.75rem; color:var(--status-expired); font-weight:700;">Due: ${this.store.formatCurrency(due)}</div>`
                      : `<div style="font-size:0.75rem; color:var(--brand-green);">Paid</div>`
                    }
                  </td>
                  <td style="text-align: right;">
                    <div style="display:inline-flex; gap:6px;">
                      <button class="btn btn-secondary btn-sm" title="View Profile" onclick="window.membersModule.openProfileDrawer('${m.id}')">
                        View
                      </button>
                      <button class="btn btn-outline btn-sm" title="Edit Member" onclick="window.membersModule.openEditMemberModal('${m.id}')">
                        Edit
                      </button>
                      ${due > 0 ? `
                        <button class="btn btn-warning btn-sm" title="Record Payment" onclick="window.paymentsModule.openRecordPaymentModal('${m.id}')">
                          Pay
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  getMemberStatusBadgeClass(m) {
    if (m.status === 'expired') return 'badge-expired';
    if (m.status === 'frozen') return 'badge-neutral';
    
    // Check if expiry date has passed
    if (m.expiryDate) {
      const today = new Date(this.store.getTodayDateString());
      const exp = new Date(m.expiryDate);
      if (exp < today) return 'badge-expired';
      
      const sevenDays = new Date(today);
      sevenDays.setDate(sevenDays.getDate() + 7);
      if (exp <= sevenDays) return 'badge-warning';
    }
    return 'badge-active';
  }

  getMemberStatusText(m) {
    if (m.status === 'expired') return 'Expired';
    if (m.status === 'frozen') return 'Frozen';
    if (m.expiryDate) {
      const today = new Date(this.store.getTodayDateString());
      const exp = new Date(m.expiryDate);
      if (exp < today) return 'Expired';
      const sevenDays = new Date(today);
      sevenDays.setDate(sevenDays.getDate() + 7);
      if (exp <= sevenDays) return 'Expiring Soon';
    }
    return 'Active';
  }

  getFilteredMembers(members) {
    let list = [...members];
    const term = this.searchTerm.toLowerCase().trim();
    if (term) {
      list = list.filter(m => 
        (m.name && m.name.toLowerCase().includes(term)) ||
        (m.phone && m.phone.includes(term)) ||
        (m.memberId && m.memberId.toLowerCase().includes(term))
      );
    }

    const today = new Date(this.store.getTodayDateString());
    if (this.filterStatus === 'active') {
      list = list.filter(m => {
        if (m.status !== 'active') return false;
        if (!m.expiryDate) return true;
        return new Date(m.expiryDate) >= today;
      });
    } else if (this.filterStatus === 'expiring') {
      const sevenDays = new Date(today);
      sevenDays.setDate(sevenDays.getDate() + 7);
      list = list.filter(m => {
        if (m.status !== 'active' || !m.expiryDate) return false;
        const exp = new Date(m.expiryDate);
        return exp >= today && exp <= sevenDays;
      });
    } else if (this.filterStatus === 'expired') {
      list = list.filter(m => {
        if (m.status === 'expired') return true;
        if (m.expiryDate && new Date(m.expiryDate) < today) return true;
        return false;
      });
    } else if (this.filterStatus === 'due') {
      list = list.filter(m => (m.balanceAmount || 0) > 0);
    }

    return list;
  }

  handleSearch(val) {
    this.searchTerm = val;
    this.render(document.getElementById('module-container'));
  }

  handleFilter(val) {
    this.filterStatus = val;
    this.render(document.getElementById('module-container'));
  }

  resetFilters() {
    this.searchTerm = '';
    this.filterStatus = 'all';
    this.render(document.getElementById('module-container'));
  }

  // Add / Edit Member Modal
  openAddMemberModal() {
    const plans = this.store.getPlans();
    const today = this.store.getTodayDateString();
    const nextMemberId = this.store.generateMemberId();

    const planOptions = plans.length > 0
      ? plans.map(p => `<option value="${p.id}" data-price="${p.price}" data-duration="${p.durationValue}" data-unit="${p.durationUnit}">${p.name} (₹${p.price.toLocaleString('en-IN')})</option>`).join('')
      : `<option value="">No plans created yet (create one or enter custom fee)</option>`;

    const modalBody = `
      <form id="add-member-form" onsubmit="window.membersModule.submitAddMember(event)">
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Full Name <span class="required">*</span></label>
            <input type="text" class="form-control" id="mem-name" placeholder="e.g. Rahul Sharma" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number <span class="required">*</span></label>
            <input type="tel" class="form-control" id="mem-phone" placeholder="e.g. 9876543210" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Email Address <span class="optional">(optional)</span></label>
            <input type="email" class="form-control" id="mem-email" placeholder="rahul@example.com">
          </div>
          <div class="form-group">
            <label class="form-label">Gender</label>
            <select class="form-control" id="mem-gender">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Membership Plan</label>
            <select class="form-control" id="mem-plan-select" onchange="window.membersModule.handlePlanSelectionChange(this)">
              <option value="">-- Select a Plan (or Custom) --</option>
              ${planOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Member ID Code</label>
            <input type="text" class="form-control" id="mem-code" value="${nextMemberId}" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Start Date <span class="required">*</span></label>
            <input type="date" class="form-control" id="mem-start-date" value="${today}" onchange="window.membersModule.recalculateExpiryDate()" required>
          </div>
          <div class="form-group">
            <label class="form-label">Expiry Date <span class="required">*</span></label>
            <input type="date" class="form-control" id="mem-expiry-date" required>
          </div>
        </div>

        <div class="form-grid-3" style="background:var(--bg-app); padding:14px; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); margin-bottom:16px;">
          <div class="form-group" style="margin:0;">
            <label class="form-label">Total Fee (₹)</label>
            <input type="number" class="form-control" id="mem-total-fee" placeholder="0" oninput="window.membersModule.calculateDueAmount()" required>
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">Paid Now (₹)</label>
            <input type="number" class="form-control" id="mem-paid-amount" placeholder="0" oninput="window.membersModule.calculateDueAmount()">
          </div>
          <div class="form-group" style="margin:0;">
            <label class="form-label">Payment Mode</label>
            <select class="form-control" id="mem-pay-mode">
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Net Banking">Net Banking</option>
            </select>
          </div>
        </div>

        <div style="font-size:0.8rem; margin-bottom:16px; color:var(--text-secondary); display:flex; justify-content:space-between;">
          <span>Calculated Balance Due: <strong id="mem-balance-display" style="color:var(--status-expired);">₹0</strong></span>
          <span style="font-size:0.74rem; color:var(--text-muted);">Paid amount will automatically log in Payments module</span>
        </div>

        <div class="form-group">
          <label class="form-label">Emergency Contact / Notes <span class="optional">(optional)</span></label>
          <input type="text" class="form-control" id="mem-notes" placeholder="Contact person or fitness goal notes">
        </div>

        <div class="modal-footer" style="padding:0; margin-top:20px; border:none;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save & Register Member</button>
        </div>
      </form>
    `;

    window.app.showModal('Register New Member', modalBody);

    // Initial default 1-month expiry calculation
    setTimeout(() => {
      this.recalculateExpiryDate();
    }, 50);
  }

  handlePlanSelectionChange(selectEl) {
    const selectedOption = selectEl.options[selectEl.selectedIndex];
    if (!selectedOption || !selectedOption.value) return;

    const price = selectedOption.getAttribute('data-price');
    const feeInput = document.getElementById('mem-total-fee');
    const paidInput = document.getElementById('mem-paid-amount');

    if (price && feeInput) {
      feeInput.value = price;
      if (paidInput && !paidInput.value) {
        paidInput.value = price; // Default full payment
      }
      this.calculateDueAmount();
    }

    this.recalculateExpiryDate();
  }

  recalculateExpiryDate() {
    const startInput = document.getElementById('mem-start-date');
    const expiryInput = document.getElementById('mem-expiry-date');
    const planSelect = document.getElementById('mem-plan-select');

    if (!startInput || !expiryInput) return;
    const startDate = new Date(startInput.value || this.store.getTodayDateString());

    let durationDays = 30; // default 1 month
    if (planSelect && planSelect.selectedIndex > 0) {
      const opt = planSelect.options[planSelect.selectedIndex];
      const dur = parseInt(opt.getAttribute('data-duration'), 10) || 1;
      const unit = opt.getAttribute('data-unit') || 'months';
      if (unit === 'days') {
        durationDays = dur;
      } else {
        durationDays = dur * 30;
      }
    }

    startDate.setDate(startDate.getDate() + durationDays);
    const y = startDate.getFullYear();
    const m = String(startDate.getMonth() + 1).padStart(2, '0');
    const d = String(startDate.getDate()).padStart(2, '0');
    expiryInput.value = `${y}-${m}-${d}`;
  }

  calculateDueAmount() {
    const total = parseFloat(document.getElementById('mem-total-fee')?.value) || 0;
    const paid = parseFloat(document.getElementById('mem-paid-amount')?.value) || 0;
    const balance = Math.max(0, total - paid);
    const disp = document.getElementById('mem-balance-display');
    if (disp) {
      disp.textContent = `₹${balance.toLocaleString('en-IN')}`;
      disp.style.color = balance > 0 ? 'var(--status-expired)' : 'var(--brand-green)';
    }
  }

  submitAddMember(e) {
    e.preventDefault();
    const planSelect = document.getElementById('mem-plan-select');
    const planName = planSelect && planSelect.selectedIndex > 0 ? planSelect.options[planSelect.selectedIndex].text.split(' (')[0] : 'Custom';

    const memberData = {
      name: document.getElementById('mem-name').value,
      phone: document.getElementById('mem-phone').value,
      email: document.getElementById('mem-email').value,
      gender: document.getElementById('mem-gender').value,
      memberId: document.getElementById('mem-code').value,
      planId: planSelect ? planSelect.value : '',
      planName: planName,
      startDate: document.getElementById('mem-start-date').value,
      expiryDate: document.getElementById('mem-expiry-date').value,
      totalFee: document.getElementById('mem-total-fee').value,
      paidAmount: document.getElementById('mem-paid-amount').value,
      initialPaymentMethod: document.getElementById('mem-pay-mode').value,
      notes: document.getElementById('mem-notes').value,
      status: 'active'
    };

    const newMember = this.store.addMember(memberData);
    window.app.closeModal();
    window.app.showToast('Member Registered', `${newMember.name} has been enrolled successfully.`, 'success');
  }

  // Profile Drawer
  openProfileDrawer(id) {
    const member = this.store.getMemberById(id);
    if (!member) return;

    this.selectedMemberId = id;
    const backdrop = document.getElementById('member-drawer-backdrop');
    const content = document.getElementById('member-drawer-content');
    if (!backdrop || !content) return;

    // Get member's payments and attendance
    const payments = this.store.getPayments().filter(p => p.memberId === member.id);
    const attendance = this.store.getAttendance().filter(a => a.memberId === member.id);

    content.innerHTML = `
      <div class="modal-header">
        <div style="font-weight:700; color:var(--text-main); font-size:1.1rem;">Member Profile</div>
        <button class="modal-close-btn" onclick="window.membersModule.closeDrawer()">✕</button>
      </div>

      <div class="modal-body" style="padding: 24px;">
        <div class="member-avatar-lg">
          ${this.escapeHtml(member.name.charAt(0).toUpperCase())}
        </div>

        <div style="text-align:center; margin-bottom: 20px;">
          <h3 style="font-size:1.25rem; font-weight:800; color:var(--text-main);">${this.escapeHtml(member.name)}</h3>
          <div style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-muted);">${member.memberId}</div>
          <div style="margin-top:6px;">
            <span class="badge ${this.getMemberStatusBadgeClass(member)}">${this.getMemberStatusText(member)}</span>
          </div>
        </div>

        <!-- Quick actions -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:20px;">
          <button class="btn btn-secondary btn-sm" onclick="window.communicationsModule.openWhatsAppPreview('${member.id}')">
            💬 WhatsApp Reminder
          </button>
          <button class="btn btn-primary btn-sm" onclick="window.paymentsModule.openRecordPaymentModal('${member.id}')">
            ₹ Record Payment
          </button>
        </div>

        <div class="card" style="padding:16px; margin-bottom:18px;">
          <div class="card-title" style="margin-bottom:12px; font-size:0.88rem;">Membership Details</div>
          <div class="member-detail-item">
            <span class="detail-label">Plan</span>
            <span class="detail-val">${this.escapeHtml(member.planName || 'General')}</span>
          </div>
          <div class="member-detail-item">
            <span class="detail-label">Phone</span>
            <span class="detail-val">${this.escapeHtml(member.phone)}</span>
          </div>
          <div class="member-detail-item">
            <span class="detail-label">Start Date</span>
            <span class="detail-val">${member.startDate}</span>
          </div>
          <div class="member-detail-item">
            <span class="detail-label">Expiry Date</span>
            <span class="detail-val" style="color:var(--brand-green);">${member.expiryDate || 'Ongoing'}</span>
          </div>
          <div class="member-detail-item">
            <span class="detail-label">Total Fee</span>
            <span class="detail-val">${this.store.formatCurrency(member.totalFee)}</span>
          </div>
          <div class="member-detail-item">
            <span class="detail-label">Paid So Far</span>
            <span class="detail-val" style="color:var(--brand-green);">${this.store.formatCurrency(member.paidAmount)}</span>
          </div>
          <div class="member-detail-item">
            <span class="detail-label">Balance Due</span>
            <span class="detail-val" style="color:${(member.balanceAmount || 0) > 0 ? 'var(--status-expired)' : 'var(--text-muted)'};">
              ${this.store.formatCurrency(member.balanceAmount || 0)}
            </span>
          </div>
          <div class="member-detail-item" style="border-bottom:none;">
            <span class="detail-label">Total Visits</span>
            <span class="detail-val">${attendance.length} check-in(s)</span>
          </div>
        </div>

        <!-- Payment History for Member -->
        <div class="card" style="padding:16px; margin-bottom:18px;">
          <div class="card-title" style="margin-bottom:10px; font-size:0.88rem;">Payment History (${payments.length})</div>
          ${payments.length === 0 
            ? `<div style="font-size:0.78rem; color:var(--text-muted); text-align:center; padding:10px;">No payments recorded for this member.</div>` 
            : `<div style="display:flex; flex-direction:column; gap:8px;">
                ${payments.map(p => `
                  <div style="display:flex; justify-content:space-between; font-size:0.8rem; padding:6px 0; border-bottom:1px solid var(--border-subtle);">
                    <div>
                      <div style="font-weight:600;">${this.store.formatCurrency(p.amount)}</div>
                      <div style="font-size:0.72rem; color:var(--text-muted);">${p.paymentDate} • ${p.paymentMethod}</div>
                    </div>
                    <span class="badge badge-active" style="height:fit-content; font-size:0.65rem;">${p.status}</span>
                  </div>
                `).join('')}
              </div>`
          }
        </div>

        <!-- Danger zone -->
        <div style="margin-top:24px; display:flex; gap:10px;">
          <button class="btn btn-outline btn-sm" style="flex:1;" onclick="window.membersModule.openEditMemberModal('${member.id}')">
            Edit Information
          </button>
          <button class="btn btn-danger btn-sm" onclick="window.membersModule.confirmDeleteMember('${member.id}')">
            Delete Member
          </button>
        </div>
      </div>
    `;

    backdrop.classList.add('active');
  }

  closeDrawer(e) {
    if (e && e.target && e.target.id !== 'member-drawer-backdrop') return;
    const backdrop = document.getElementById('member-drawer-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  }

  openEditMemberModal(id) {
    const member = this.store.getMemberById(id);
    if (!member) return;

    this.closeDrawer();

    const plans = this.store.getPlans();
    const planOptions = plans.map(p => 
      `<option value="${p.id}" ${member.planId === p.id ? 'selected' : ''}>${p.name}</option>`
    ).join('');

    const modalBody = `
      <form id="edit-member-form" onsubmit="window.membersModule.submitEditMember(event, '${member.id}')">
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" class="form-control" id="edit-mem-name" value="${this.escapeHtml(member.name)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" class="form-control" id="edit-mem-phone" value="${this.escapeHtml(member.phone)}" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="edit-mem-status">
              <option value="active" ${member.status === 'active' ? 'selected' : ''}>Active</option>
              <option value="expired" ${member.status === 'expired' ? 'selected' : ''}>Expired</option>
              <option value="frozen" ${member.status === 'frozen' ? 'selected' : ''}>Frozen</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Expiry Date</label>
            <input type="date" class="form-control" id="edit-mem-expiry" value="${member.expiryDate || ''}">
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Total Agreed Fee (₹)</label>
            <input type="number" class="form-control" id="edit-mem-fee" value="${member.totalFee}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Paid Amount (₹)</label>
            <input type="number" class="form-control" id="edit-mem-paid" value="${member.paidAmount}" required>
          </div>
        </div>

        <div class="modal-footer" style="padding:0; margin-top:20px; border:none;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    window.app.showModal(`Edit Member: ${member.name}`, modalBody);
  }

  submitEditMember(e, id) {
    e.preventDefault();
    const update = {
      name: document.getElementById('edit-mem-name').value,
      phone: document.getElementById('edit-mem-phone').value,
      status: document.getElementById('edit-mem-status').value,
      expiryDate: document.getElementById('edit-mem-expiry').value,
      totalFee: document.getElementById('edit-mem-fee').value,
      paidAmount: document.getElementById('edit-mem-paid').value
    };

    this.store.updateMember(id, update);
    window.app.closeModal();
    window.app.showToast('Member Updated', 'Member details successfully saved.', 'success');
  }

  confirmDeleteMember(id) {
    const member = this.store.getMemberById(id);
    if (!member) return;

    if (confirm(`Are you sure you want to delete member ${member.name}? This will remove their record from the gym database.`)) {
      this.store.deleteMember(id);
      this.closeDrawer();
      window.app.showToast('Member Deleted', `${member.name} removed.`, 'info');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

window.membersModule = new MembersModule();
