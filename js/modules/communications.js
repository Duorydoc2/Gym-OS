/**
 * Communications & Reminders Module for RYDOC GymOS
 * Requirement 4 & 9:
 * Polished empty state: "No communication activity yet. Reminder previews and simulated actions will appear here when initiated."
 * Strict client-side preview only: WhatsApp templates, clipboard copy, and direct WhatsApp Web link launcher.
 * No false claims of automated background sending.
 */

class CommunicationsModule {
  constructor() {
    this.store = window.gymStore;
  }

  render(container) {
    const logs = this.store.getCommunications();

    container.innerHTML = `
      <!-- Integration Disclaimer -->
      <div class="storage-notice-bar" style="border-left: 4px solid var(--status-info);">
        <div class="storage-notice-content">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-info)" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <div>
            <strong>Preview & Manual Dispatch Only:</strong>
            <span style="font-size:0.77rem; color:var(--text-secondary);">
              Browser-only client. Messages are not sent automatically in the background when the app is closed. Use the generator to preview, copy to clipboard, or launch WhatsApp Web directly.
            </span>
          </div>
        </div>
      </div>

      <!-- Action Bar -->
      <div class="action-bar">
        <div class="action-bar-left">
          <div style="font-size:0.9rem; color:var(--text-secondary);">
            Communications & Reminder Activity (${logs.length})
          </div>
        </div>

        <div class="action-bar-right">
          <button class="btn btn-primary" onclick="window.communicationsModule.openComposeReminderModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            Preview Reminder
          </button>
        </div>
      </div>

      <!-- Listing or Required Empty State -->
      ${logs.length === 0 ? this.renderEmptyState() : this.renderLogsTable(logs)}
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        </div>
        <div class="empty-state-title">No communication activity yet.</div>
        <div class="empty-state-text">
          Reminder previews and simulated actions will appear here when initiated.
        </div>
        <div class="empty-state-action">
          <button class="btn btn-primary btn-lg" onclick="window.communicationsModule.openComposeReminderModal()">
            + Preview Reminder
          </button>
        </div>
      </div>
    `;
  }

  renderLogsTable(logs) {
    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Recipient</th>
              <th>Type</th>
              <th>Channel</th>
              <th>Message Content</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td style="white-space:nowrap; font-size:0.78rem; color:var(--text-muted);">${l.date}</td>
                <td>
                  <div style="font-weight:700; color:var(--text-main);">${this.escapeHtml(l.recipientName)}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(l.phone)}</div>
                </td>
                <td>
                  <span class="badge badge-neutral">${l.type}</span>
                </td>
                <td>
                  <span style="font-size:0.8rem; color:var(--brand-green); font-weight:600;">${l.channel}</span>
                </td>
                <td>
                  <div style="max-width:320px; font-size:0.78rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${this.escapeHtml(l.content)}">
                    ${this.escapeHtml(l.content)}
                  </div>
                </td>
                <td>
                  <span class="badge badge-active" style="font-size:0.68rem;">${l.status}</span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  openComposeReminderModal(prefilledMemberId = null) {
    const members = this.store.getMembers();
    if (members.length === 0) {
      window.app.showToast('No Members', 'Add a member first to generate personalized reminders.', 'warning');
      window.membersModule.openAddMemberModal();
      return;
    }

    const profile = this.store.getProfile() || { gymName: 'RYDOC Gym' };

    const memberOptions = members.map(m => {
      const isSel = prefilledMemberId && prefilledMemberId === m.id;
      return `<option value="${m.id}" data-name="${this.escapeHtml(m.name)}" data-phone="${this.escapeHtml(m.phone)}" data-exp="${m.expiryDate || 'N/A'}" data-due="${m.balanceAmount || 0}" ${isSel ? 'selected' : ''}>${m.name} (${m.memberId}) • Exp: ${m.expiryDate || 'N/A'} • Due: ₹${(m.balanceAmount || 0).toLocaleString('en-IN')}</option>`;
    }).join('');

    const modalBody = `
      <form id="compose-reminder-form" onsubmit="event.preventDefault()">
        <div class="form-group">
          <label class="form-label">Select Recipient Member</label>
          <select class="form-control" id="comm-member-select" onchange="window.communicationsModule.handleTemplateSelection()">
            ${memberOptions}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Reminder Template</label>
          <select class="form-control" id="comm-template-select" onchange="window.communicationsModule.handleTemplateSelection()">
            <option value="expiry">Membership Expiry Notice</option>
            <option value="due">Overdue Payment Reminder</option>
            <option value="welcome">Welcome to the Gym</option>
            <option value="workout">Workout Motivation / Attendance Streak</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Generated Message Text</label>
          <textarea class="form-control" id="comm-message-text" rows="5" oninput="window.communicationsModule.updatePreviewBox()"></textarea>
        </div>

        <!-- WhatsApp visual preview bubble -->
        <div class="whatsapp-preview-box">
          <div style="font-size:0.75rem; color:#8696a0; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            WhatsApp Preview (Recipient: <span id="comm-phone-display" style="color:#ffffff;"></span>)
          </div>
          <div class="whatsapp-chat-bubble" id="comm-bubble-display"></div>
          <div class="whatsapp-meta-note">
            <span>ℹ️ Clicking 'Open WhatsApp Web' launches your WhatsApp app with this pre-filled text.</span>
          </div>
        </div>

        <div class="modal-footer" style="padding:0; margin-top:20px; border:none; display:flex; justify-content:space-between;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Close</button>
          <div style="display:flex; gap:10px;">
            <button type="button" class="btn btn-secondary" onclick="window.communicationsModule.copyMessageToClipboard()">
              📋 Copy Text
            </button>
            <button type="button" class="btn btn-primary" onclick="window.communicationsModule.launchWhatsAppWeb()">
              💬 Open in WhatsApp Web
            </button>
          </div>
        </div>
      </form>
    `;

    window.app.showModal('Personalized WhatsApp Reminder Generator', modalBody);

    setTimeout(() => {
      this.handleTemplateSelection();
    }, 50);
  }

  openWhatsAppPreview(memberId) {
    this.openComposeReminderModal(memberId);
  }

  handleTemplateSelection() {
    const memSelect = document.getElementById('comm-member-select');
    const tplSelect = document.getElementById('comm-template-select');
    const textArea = document.getElementById('comm-message-text');
    const phoneDisp = document.getElementById('comm-phone-display');

    if (!memSelect || !tplSelect || !textArea) return;

    const opt = memSelect.options[memSelect.selectedIndex];
    if (!opt) return;

    const name = opt.getAttribute('data-name');
    const phone = opt.getAttribute('data-phone');
    const exp = opt.getAttribute('data-exp');
    const due = opt.getAttribute('data-due');
    const profile = this.store.getProfile() || { gymName: 'RYDOC Gym' };

    if (phoneDisp) phoneDisp.textContent = phone || 'No phone set';

    const tpl = tplSelect.value;
    let message = '';

    if (tpl === 'expiry') {
      message = `Dear ${name},\n\nThis is a friendly reminder from ${profile.gymName}. Your gym membership is scheduled to expire on ${exp}.\n\nRenew your plan today to continue your fitness momentum without interruption.\n\nWarm regards,\n${profile.gymName}`;
    } else if (tpl === 'due') {
      message = `Hello ${name},\n\nWe hope your training is going great at ${profile.gymName}.\n\nThis is a gentle reminder that an outstanding membership balance of ₹${Number(due).toLocaleString('en-IN')} is currently due.\n\nYou can settle this on your next visit at the counter.\n\nThank you,\n${profile.gymName}`;
    } else if (tpl === 'welcome') {
      message = `Welcome to ${profile.gymName}, ${name}! 💪\n\nWe are excited to partner with you on your fitness journey. Our trainers and equipment are at your full disposal.\n\nFeel free to ask the team anytime if you need help with your workout routine.\n\nLet's crush those goals!`;
    } else {
      message = `Hi ${name}! Consistency is the key to real transformation. Keep showing up at ${profile.gymName}! See you on the gym floor today! 🏋️`;
    }

    textArea.value = message;
    this.updatePreviewBox();
  }

  updatePreviewBox() {
    const textArea = document.getElementById('comm-message-text');
    const bubble = document.getElementById('comm-bubble-display');
    if (textArea && bubble) {
      bubble.textContent = textArea.value;
    }
  }

  copyMessageToClipboard() {
    const textArea = document.getElementById('comm-message-text');
    if (!textArea || !textArea.value) return;

    navigator.clipboard.writeText(textArea.value).then(() => {
      this.logCurrentAction('Copied to Clipboard');
      window.app.showToast('Copied to Clipboard', 'Message text copied. You can paste it into any chat.', 'success');
    }).catch(() => {
      window.app.showToast('Notice', 'Please select and copy the text manually.', 'info');
    });
  }

  launchWhatsAppWeb() {
    const memSelect = document.getElementById('comm-member-select');
    const textArea = document.getElementById('comm-message-text');
    if (!memSelect || !textArea) return;

    const opt = memSelect.options[memSelect.selectedIndex];
    const rawPhone = (opt ? opt.getAttribute('data-phone') : '').replace(/[^0-9]/g, '');
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    const text = encodeURIComponent(textArea.value);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;

    this.logCurrentAction('WhatsApp Web Launched');
    window.open(url, '_blank');
    window.app.showToast('WhatsApp Launched', 'Opened WhatsApp Web with pre-filled message.', 'info');
  }

  logCurrentAction(status) {
    const memSelect = document.getElementById('comm-member-select');
    const tplSelect = document.getElementById('comm-template-select');
    const textArea = document.getElementById('comm-message-text');

    if (!memSelect || !textArea) return;
    const opt = memSelect.options[memSelect.selectedIndex];

    this.store.logCommunication({
      recipientName: opt ? opt.getAttribute('data-name') : 'Member',
      phone: opt ? opt.getAttribute('data-phone') : '',
      type: tplSelect ? tplSelect.options[tplSelect.selectedIndex].text : 'Reminder',
      channel: 'WhatsApp Web Preview',
      content: textArea.value
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

window.communicationsModule = new CommunicationsModule();
