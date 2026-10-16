/**
 * Attendance Module for RYDOC GymOS
 * Requirement 4 & 5:
 * Empty state: "No attendance recorded for this date. Check in a registered member to begin tracking visits."
 * Real check-in & check-out logging, real-time footfall calculations.
 */

class AttendanceModule {
  constructor() {
    this.store = window.gymStore;
    this.selectedDate = this.store.getTodayDateString();
  }

  render(container) {
    const records = this.store.getAttendanceForDate(this.selectedDate);
    const today = this.store.getTodayDateString();
    const isToday = this.selectedDate === today;

    const currentlyInGym = records.filter(r => !r.checkOutTime).length;
    const completedVisits = records.filter(r => r.checkOutTime).length;

    container.innerHTML = `
      <!-- Action & Date Bar -->
      <div class="action-bar">
        <div class="action-bar-left">
          <div style="display:flex; align-items:center; gap:8px;">
            <label class="form-label" style="margin:0; font-size:0.85rem; font-weight:700;">Date:</label>
            <input type="date" class="form-control" style="width:auto;" value="${this.selectedDate}" onchange="window.attendanceModule.handleDateChange(this.value)">
          </div>

          ${!isToday ? `<button class="btn btn-outline btn-sm" onclick="window.attendanceModule.goToToday()">Jump to Today</button>` : ''}
        </div>

        <div class="action-bar-right">
          <button class="btn btn-primary" onclick="window.attendanceModule.openQuickCheckinModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Check-in Member
          </button>
        </div>
      </div>

      <!-- Live Attendance Summary Chips -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:14px; margin-bottom:20px;">
        <div class="card" style="padding:14px 18px;">
          <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">Total Visits (${this.selectedDate})</div>
          <div style="font-size:1.5rem; font-weight:800; color:var(--text-main); margin-top:4px;">${records.length}</div>
        </div>
        <div class="card" style="padding:14px 18px;">
          <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">Currently In Gym</div>
          <div style="font-size:1.5rem; font-weight:800; color:var(--brand-green); margin-top:4px;">${currentlyInGym}</div>
        </div>
        <div class="card" style="padding:14px 18px;">
          <div style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; font-weight:600;">Completed Workouts</div>
          <div style="font-size:1.5rem; font-weight:800; color:var(--text-main); margin-top:4px;">${completedVisits}</div>
        </div>
      </div>

      <!-- Attendance Table or Required Empty State -->
      ${records.length === 0 ? this.renderEmptyState() : this.renderAttendanceTable(records)}
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div class="empty-state-title">No attendance recorded for this date.</div>
        <div class="empty-state-text">
          Check in a registered member to begin tracking visits.
        </div>
        <div class="empty-state-action">
          <button class="btn btn-primary btn-lg" onclick="window.attendanceModule.openQuickCheckinModal()">
            + Check-in Member
          </button>
        </div>
      </div>
    `;
  }

  renderAttendanceTable(records) {
    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Member Name</th>
              <th>Member ID</th>
              <th>Plan</th>
              <th>Check-in Time</th>
              <th>Check-out Time</th>
              <th>Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(a => `
              <tr>
                <td>
                  <div style="font-weight:700; color:var(--text-main);">${this.escapeHtml(a.memberName)}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(a.memberPhone || '')}</div>
                </td>
                <td>
                  <span style="font-family:var(--font-mono); font-size:0.78rem;">${a.memberCode || '—'}</span>
                </td>
                <td>
                  <span style="font-size:0.82rem;">${this.escapeHtml(a.planName || 'General')}</span>
                </td>
                <td>
                  <div style="font-weight:600; color:var(--brand-green);">${a.checkInTime}</div>
                </td>
                <td>
                  <div style="color:${a.checkOutTime ? 'var(--text-main)' : 'var(--text-muted)'}; font-size:0.84rem;">
                    ${a.checkOutTime || 'Active In Gym'}
                  </div>
                </td>
                <td>
                  <span class="badge ${a.checkOutTime ? 'badge-neutral' : 'badge-active'}">
                    ${a.checkOutTime ? 'Completed' : 'Working Out'}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div style="display:inline-flex; gap:6px;">
                    ${!a.checkOutTime ? `
                      <button class="btn btn-primary btn-sm" onclick="window.attendanceModule.checkOut('${a.id}')">
                        Check Out
                      </button>
                    ` : ''}
                    <button class="btn btn-outline btn-sm" style="color:var(--status-expired);" title="Remove Record" onclick="window.attendanceModule.deleteRecord('${a.id}')">
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

  handleDateChange(val) {
    this.selectedDate = val;
    this.render(document.getElementById('module-container'));
  }

  goToToday() {
    this.selectedDate = this.store.getTodayDateString();
    this.render(document.getElementById('module-container'));
  }

  openQuickCheckinModal() {
    const members = this.store.getMembers();
    if (members.length === 0) {
      window.app.showToast('No Members Found', 'You must add at least one member before recording attendance.', 'warning');
      window.membersModule.openAddMemberModal();
      return;
    }

    const memberOptions = members.map(m => 
      `<option value="${m.id}">${m.name} (${m.memberId}) • Plan: ${m.planName || 'General'} • Status: ${m.status}</option>`
    ).join('');

    const now = new Date();
    const timeNow = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const modalBody = `
      <form id="checkin-form" onsubmit="window.attendanceModule.submitCheckIn(event)">
        <div class="form-group">
          <label class="form-label">Select Registered Member <span class="required">*</span></label>
          <select class="form-control" id="checkin-member-select" required>
            ${memberOptions}
          </select>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Check-in Time</label>
            <input type="text" class="form-control" id="checkin-time" value="${timeNow}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input type="date" class="form-control" id="checkin-date" value="${this.selectedDate}" disabled>
          </div>
        </div>

        <div class="modal-footer" style="padding:0; margin-top:20px; border:none;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Confirm Check-in</button>
        </div>
      </form>
    `;

    window.app.showModal('Member Attendance Check-in', modalBody);
  }

  submitCheckIn(e) {
    e.preventDefault();
    const select = document.getElementById('checkin-member-select');
    const memberId = select.value;
    const time = document.getElementById('checkin-time').value;

    try {
      const record = this.store.recordCheckIn(memberId, time);
      window.app.closeModal();
      window.app.showToast('Check-in Recorded', `${record.memberName} checked in at ${record.checkInTime}.`, 'success');
    } catch (err) {
      window.app.showToast('Check-in Notice', err.message, 'warning');
    }
  }

  checkOut(attendanceId) {
    const updated = this.store.recordCheckOut(attendanceId);
    if (updated) {
      window.app.showToast('Check-out Recorded', `${updated.memberName} checked out at ${updated.checkOutTime}.`, 'info');
    }
  }

  deleteRecord(id) {
    if (confirm('Remove this attendance entry?')) {
      this.store.deleteAttendance(id);
      window.app.showToast('Entry Removed', 'Attendance entry deleted.', 'info');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

window.attendanceModule = new AttendanceModule();
