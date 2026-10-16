/**
 * Settings & Data Management Module for RYDOC GymOS
 * Requirement 7:
 * - Local persistence configuration
 * - "Export My Data" (JSON download)
 * - "Import My Data" (Restore backup)
 * - "Delete All My Data" (Red confirmation modal, reset to clean initial state)
 * - Storage disclosure & device boundaries
 */

class SettingsModule {
  constructor() {
    this.store = window.gymStore;
  }

  render(container) {
    const profile = this.store.getProfile() || {
      gymName: 'RYDOC Gym',
      ownerName: '',
      phone: '',
      email: '',
      address: '',
      currency: 'INR',
      openingTime: '06:00',
      closingTime: '22:00',
      workingDays: 'Mon - Sat',
      taxRate: 0,
      invoicePrefix: 'RYD-'
    };

    container.innerHTML = `
      <div style="max-width: 860px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px;">

        <!-- Storage & Disclaimers Box -->
        <div class="card" style="border-left: 4px solid var(--brand-green);">
          <div class="card-header">
            <div class="card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Local Data Architecture & Disclaimers
            </div>
          </div>
          <div class="card-body" style="font-size:0.86rem; color:var(--text-secondary); line-height:1.6;">
            <p style="margin-bottom:12px;">
              <strong>Strict Local Storage:</strong> This frontend version stores all user-entered gym data directly inside your browser's <code style="background:var(--bg-app); padding:2px 6px; border-radius:4px; color:var(--text-main);">LocalStorage</code>. Data is preserved across page refreshes and browser restarts on this machine.
            </p>
            <p style="margin-bottom:12px;">
              <strong>No Cloud Sync:</strong> Your business records are not synchronized across devices, nor backed up to an external cloud server. Clearing your browser cache or switching devices will affect access to these records unless you export a backup.
            </p>
            <p>
              <strong>Backup Recommendation:</strong> Use the <strong>"Export My Data"</strong> button below to maintain offline JSON backup copies of your gym database.
            </p>
          </div>
        </div>

        <!-- Gym Profile Configuration -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Gym Profile & Business Information</div>
          </div>
          <div class="card-body">
            <form id="settings-profile-form" onsubmit="window.settingsModule.saveProfileSettings(event)">
              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Gym Name <span class="required">*</span></label>
                  <input type="text" class="form-control" id="set-gym-name" value="${this.escapeHtml(profile.gymName)}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Owner / Manager Name <span class="required">*</span></label>
                  <input type="text" class="form-control" id="set-owner-name" value="${this.escapeHtml(profile.ownerName)}" required>
                </div>
              </div>

              <div class="form-grid-2">
                <div class="form-group">
                  <label class="form-label">Business Phone <span class="required">*</span></label>
                  <input type="tel" class="form-control" id="set-phone" value="${this.escapeHtml(profile.phone)}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Business Email</label>
                  <input type="email" class="form-control" id="set-email" value="${this.escapeHtml(profile.email || '')}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Gym Physical Address</label>
                <input type="text" class="form-control" id="set-address" value="${this.escapeHtml(profile.address || '')}">
              </div>

              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">Currency</label>
                  <select class="form-control" id="set-currency">
                    <option value="INR" ${profile.currency === 'INR' ? 'selected' : ''}>Indian Rupee (₹ INR)</option>
                    <option value="USD" ${profile.currency === 'USD' ? 'selected' : ''}>US Dollar ($ USD)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Invoice Prefix</label>
                  <input type="text" class="form-control" id="set-prefix" value="${this.escapeHtml(profile.invoicePrefix || 'RYD-')}">
                </div>
                <div class="form-group">
                  <label class="form-label">Tax / GST Rate (%)</label>
                  <input type="number" class="form-control" id="set-tax" value="${profile.taxRate || 0}">
                </div>
              </div>

              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">Opening Time</label>
                  <input type="time" class="form-control" id="set-open" value="${profile.openingTime || '06:00'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Closing Time</label>
                  <input type="time" class="form-control" id="set-close" value="${profile.closingTime || '22:00'}">
                </div>
                <div class="form-group">
                  <label class="form-label">Working Days</label>
                  <input type="text" class="form-control" id="set-days" value="${this.escapeHtml(profile.workingDays || 'Mon - Sat')}">
                </div>
              </div>

              <div style="display:flex; justify-content:flex-end; margin-top:14px;">
                <button type="submit" class="btn btn-primary">Save Profile Changes</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Data Backup & Reset Actions -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Data Backup, Export & Reset</div>
          </div>
          <div class="card-body">
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:16px;">

              <!-- Export Data -->
              <div style="padding:16px; background:var(--bg-app); border:1px solid var(--border-card); border-radius:var(--radius-md); display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <div style="font-weight:700; color:var(--text-main); margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Export My Data
                  </div>
                  <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:14px;">
                    Download an offline JSON file containing all your real gym members, transactions, plans, and logs.
                  </div>
                </div>
                <button class="btn btn-secondary" onclick="window.settingsModule.exportData()">
                  Export My Data (JSON)
                </button>
              </div>

              <!-- Import Backup -->
              <div style="padding:16px; background:var(--bg-app); border:1px solid var(--border-card); border-radius:var(--radius-md); display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <div style="font-weight:700; color:var(--text-main); margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--status-info)" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    Restore from Backup
                  </div>
                  <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:14px;">
                    Import a previously exported RYDOC GymOS JSON file to restore records.
                  </div>
                </div>
                <div>
                  <input type="file" id="import-file-input" accept=".json" style="display:none;" onchange="window.settingsModule.handleFileImport(event)">
                  <button class="btn btn-outline" style="width:100%;" onclick="document.getElementById('import-file-input').click()">
                    Import My Data
                  </button>
                </div>
              </div>

              <!-- Delete All Data -->
              <div style="padding:16px; background:rgba(239, 68, 68, 0.05); border:1px solid rgba(239, 68, 68, 0.25); border-radius:var(--radius-md); display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                  <div style="font-weight:700; color:var(--status-expired); margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--status-expired)" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    Delete All My Data
                  </div>
                  <div style="font-size:0.78rem; color:var(--text-secondary); margin-bottom:14px;">
                    Permanently wipe all records from this browser and return to the clean first-time setup wizard.
                  </div>
                </div>
                <button class="btn btn-danger" onclick="window.settingsModule.openDeleteConfirmModal()">
                  Delete All My Data
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    `;
  }

  saveProfileSettings(e) {
    e.preventDefault();
    const updated = {
      gymName: document.getElementById('set-gym-name').value,
      ownerName: document.getElementById('set-owner-name').value,
      phone: document.getElementById('set-phone').value,
      email: document.getElementById('set-email').value,
      address: document.getElementById('set-address').value,
      currency: document.getElementById('set-currency').value,
      invoicePrefix: document.getElementById('set-prefix').value,
      taxRate: parseFloat(document.getElementById('set-tax').value) || 0,
      openingTime: document.getElementById('set-open').value,
      closingTime: document.getElementById('set-close').value,
      workingDays: document.getElementById('set-days').value
    };

    this.store.saveProfile(updated);
    window.app.renderAppHeader();
    window.app.showToast('Profile Saved', 'Gym profile and configuration updated.', 'success');
  }

  exportData() {
    const data = window.storageService.exportAllData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `rydoc-gym-data-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.app.showToast('Data Exported', 'Backup JSON downloaded successfully.', 'success');
  }

  handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        window.storageService.importAllData(parsed);
        window.app.renderAppHeader();
        window.app.navigateTo('dashboard');
        window.app.showToast('Backup Restored', 'All records restored successfully from backup file.', 'success');
      } catch (err) {
        window.app.showToast('Import Error', 'Corrupted or invalid JSON backup file.', 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  openDeleteConfirmModal() {
    const modalBody = `
      <div style="text-align:center; padding:10px 0;">
        <div style="width:56px; height:56px; border-radius:50%; background:var(--status-expired-bg); color:var(--status-expired); display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto; font-size:1.8rem;">
          ⚠️
        </div>
        <h3 style="font-size:1.2rem; font-weight:800; color:var(--status-expired); margin-bottom:8px;">
          Permanently Delete All Data?
        </h3>
        <p style="font-size:0.86rem; color:var(--text-secondary); max-width:440px; margin:0 auto 20px auto; line-height:1.5;">
          This action will erase all members, payment records, attendance logs, trainers, enquiries, and inventory from this browser. This cannot be undone.
        </p>

        <div style="background:var(--bg-app); border:1px solid var(--border-card); border-radius:var(--radius-sm); padding:14px; margin-bottom:20px; text-align:left;">
          <label class="form-label" style="font-size:0.8rem; margin-bottom:6px;">Type <strong>DELETE</strong> below to confirm:</label>
          <input type="text" class="form-control" id="delete-confirm-input" placeholder="DELETE" oninput="window.settingsModule.checkDeleteInput(this.value)">
        </div>

        <div class="modal-footer" style="padding:0; border:none; display:flex; justify-content:space-between;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Cancel</button>
          <button type="button" class="btn btn-danger" id="delete-confirm-btn" disabled onclick="window.settingsModule.executeDeleteAllData()">
            Yes, Delete All My Data
          </button>
        </div>
      </div>
    `;

    window.app.showModal('Confirm Permanent Deletion', modalBody);
  }

  checkDeleteInput(val) {
    const btn = document.getElementById('delete-confirm-btn');
    if (btn) {
      btn.disabled = val.trim().toUpperCase() !== 'DELETE';
    }
  }

  executeDeleteAllData() {
    window.storageService.clearAllUserData();
    window.app.closeModal();
    window.app.showToast('Workspace Reset', 'All data wiped. Reopening setup wizard.', 'info');

    // Reopen setup wizard
    setTimeout(() => {
      window.wizard.show();
      window.app.renderAppHeader();
      window.app.navigateTo('dashboard');
    }, 200);
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

window.settingsModule = new SettingsModule();
