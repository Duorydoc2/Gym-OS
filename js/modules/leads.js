/**
 * Leads & Enquiries Module for RYDOC GymOS
 * Requirement 4 & 5:
 * Polished empty state: "No enquiries recorded. Add an enquiry to begin tracking potential members."
 * Lead capture, pipeline status tracking, and 1-click conversion into registered members.
 */

class LeadsModule {
  constructor() {
    this.store = window.gymStore;
    this.statusFilter = 'all';
  }

  render(container) {
    const allLeads = this.store.getLeads();
    const filtered = this.getFilteredLeads(allLeads);

    container.innerHTML = `
      <!-- Action Bar -->
      <div class="action-bar">
        <div class="action-bar-left">
          <select class="form-control" style="width: auto; min-width: 150px;" onchange="window.leadsModule.handleFilter(this.value)">
            <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>All Enquiries (${allLeads.length})</option>
            <option value="New" ${this.statusFilter === 'New' ? 'selected' : ''}>New</option>
            <option value="Contacted" ${this.statusFilter === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="Trial Scheduled" ${this.statusFilter === 'Trial Scheduled' ? 'selected' : ''}>Trial Scheduled</option>
            <option value="Converted" ${this.statusFilter === 'Converted' ? 'selected' : ''}>Converted</option>
            <option value="Lost" ${this.statusFilter === 'Lost' ? 'selected' : ''}>Lost</option>
          </select>
        </div>

        <div class="action-bar-right">
          <button class="btn btn-primary" onclick="window.leadsModule.openAddLeadModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Enquiry
          </button>
        </div>
      </div>

      <!-- Leads Listing or Required Empty State -->
      ${allLeads.length === 0 ? this.renderEmptyState() : this.renderLeadsTable(filtered)}
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
          </svg>
        </div>
        <div class="empty-state-title">No enquiries recorded.</div>
        <div class="empty-state-text">
          Add an enquiry to begin tracking potential members.
        </div>
        <div class="empty-state-action">
          <button class="btn btn-primary btn-lg" onclick="window.leadsModule.openAddLeadModal()">
            + Add Enquiry
          </button>
        </div>
      </div>
    `;
  }

  renderLeadsTable(leads) {
    if (leads.length === 0) {
      return `
        <div class="card" style="padding: 40px; text-align: center; color: var(--text-muted);">
          No enquiries match this filter category.
        </div>
      `;
    }

    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Prospect Name</th>
              <th>Contact</th>
              <th>Fitness Goal</th>
              <th>Source</th>
              <th>Follow-up</th>
              <th>Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(l => `
              <tr>
                <td>
                  <div style="font-weight:700; color:var(--text-main);">${this.escapeHtml(l.name)}</div>
                  ${l.notes ? `<div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(l.notes)}</div>` : ''}
                </td>
                <td>
                  <div style="font-size:0.84rem;">${this.escapeHtml(l.phone)}</div>
                  <div style="font-size:0.72rem; color:var(--text-muted);">${this.escapeHtml(l.email || '—')}</div>
                </td>
                <td>
                  <span class="badge badge-neutral">${this.escapeHtml(l.goal)}</span>
                </td>
                <td>
                  <span style="font-size:0.82rem; color:var(--text-secondary);">${this.escapeHtml(l.source)}</span>
                </td>
                <td>
                  <span style="font-size:0.82rem; ${l.followUpDate ? 'color:var(--status-warning); font-weight:600;' : 'color:var(--text-muted);'}">
                    ${l.followUpDate || 'None set'}
                  </span>
                </td>
                <td>
                  <select class="form-control" style="padding:3px 8px; font-size:0.75rem; width:auto;" onchange="window.leadsModule.updateLeadStatus('${l.id}', this.value)">
                    <option value="New" ${l.status === 'New' ? 'selected' : ''}>New</option>
                    <option value="Contacted" ${l.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
                    <option value="Trial Scheduled" ${l.status === 'Trial Scheduled' ? 'selected' : ''}>Trial Scheduled</option>
                    <option value="Converted" ${l.status === 'Converted' ? 'selected' : ''}>Converted</option>
                    <option value="Lost" ${l.status === 'Lost' ? 'selected' : ''}>Lost</option>
                  </select>
                </td>
                <td style="text-align: right;">
                  <div style="display:inline-flex; gap:6px;">
                    ${l.status !== 'Converted' ? `
                      <button class="btn btn-primary btn-sm" onclick="window.leadsModule.convertLead('${l.id}')">
                        Convert to Member
                      </button>
                    ` : `
                      <span class="badge badge-active">Enrolled</span>
                    `}
                    <button class="btn btn-outline btn-sm" style="color:var(--status-expired);" onclick="window.leadsModule.deleteLead('${l.id}')">
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

  getFilteredLeads(leads) {
    if (this.statusFilter === 'all') return leads;
    return leads.filter(l => l.status === this.statusFilter);
  }

  handleFilter(val) {
    this.statusFilter = val;
    this.render(document.getElementById('module-container'));
  }

  openAddLeadModal() {
    const modalBody = `
      <form id="add-lead-form" onsubmit="window.leadsModule.submitAddLead(event)">
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Prospect Name <span class="required">*</span></label>
            <input type="text" class="form-control" id="lead-name" placeholder="e.g. Amit Verma" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number <span class="required">*</span></label>
            <input type="tel" class="form-control" id="lead-phone" placeholder="e.g. 9876501234" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Fitness Goal</label>
            <select class="form-control" id="lead-goal">
              <option value="Weight Loss">Weight Loss & Fat Burn</option>
              <option value="Muscle Gain">Muscle Gain & Bodybuilding</option>
              <option value="General Fitness">General Health & Fitness</option>
              <option value="Endurance / Athlete">Endurance & Cardio</option>
              <option value="Rehabilitation / Mobility">Rehabilitation / Mobility</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Lead Source</label>
            <select class="form-control" id="lead-source">
              <option value="Walk-in">Direct Walk-in</option>
              <option value="Instagram / Social">Instagram / Facebook</option>
              <option value="Member Referral">Member Referral</option>
              <option value="Google Search">Google Maps / Search</option>
              <option value="Flyer / Billboard">Flyer / Billboard</option>
            </select>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Next Follow-up Date</label>
            <input type="date" class="form-control" id="lead-date">
          </div>
          <div class="form-group">
            <label class="form-label">Initial Status</label>
            <select class="form-control" id="lead-status">
              <option value="New">New Enquiry</option>
              <option value="Contacted">Contacted</option>
              <option value="Trial Scheduled">Trial Scheduled</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Notes & Preferences <span class="optional">(optional)</span></label>
          <textarea class="form-control" id="lead-notes" placeholder="e.g. Interested in morning 7 AM workout slot, looking for 3 months package"></textarea>
        </div>

        <div class="modal-footer" style="padding:0; margin-top:20px; border:none;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Enquiry</button>
        </div>
      </form>
    `;

    window.app.showModal('Add New Lead / Enquiry', modalBody);
  }

  submitAddLead(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('lead-name').value,
      phone: document.getElementById('lead-phone').value,
      goal: document.getElementById('lead-goal').value,
      source: document.getElementById('lead-source').value,
      followUpDate: document.getElementById('lead-date').value,
      status: document.getElementById('lead-status').value,
      notes: document.getElementById('lead-notes').value
    };

    const newLead = this.store.addLead(data);
    window.app.closeModal();
    window.app.showToast('Lead Logged', `Enquiry for ${newLead.name} captured.`, 'success');
  }

  updateLeadStatus(id, newStatus) {
    this.store.updateLead(id, { status: newStatus });
    window.app.showToast('Status Updated', `Lead status changed to ${newStatus}.`, 'info');
  }

  convertLead(id) {
    const lead = this.store.getLeads().find(l => l.id === id);
    if (!lead) return;

    // Mark as converted
    this.store.updateLead(id, { status: 'Converted' });

    // Open add member modal with prefilled data
    window.membersModule.openAddMemberModal();

    setTimeout(() => {
      const nameIn = document.getElementById('mem-name');
      const phoneIn = document.getElementById('mem-phone');
      const notesIn = document.getElementById('mem-notes');
      if (nameIn) nameIn.value = lead.name;
      if (phoneIn) phoneIn.value = lead.phone;
      if (notesIn) notesIn.value = `Converted from enquiry (Goal: ${lead.goal}, Source: ${lead.source})`;
    }, 60);
  }

  deleteLead(id) {
    if (confirm('Delete this enquiry record?')) {
      this.store.deleteLead(id);
      window.app.showToast('Lead Deleted', 'Enquiry record removed.', 'info');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

window.leadsModule = new LeadsModule();
