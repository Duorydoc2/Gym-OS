/**
 * Trainers Module for RYDOC GymOS
 * Requirement 4 & 5:
 * Polished empty state: "No trainers added yet. Add your trainers to manage assignments and schedules."
 * Real trainer management, assignments, and schedule tracking.
 */

class TrainersModule {
  constructor() {
    this.store = window.gymStore;
  }

  render(container) {
    const trainers = this.store.getTrainers();

    container.innerHTML = `
      <!-- Action Bar -->
      <div class="action-bar">
        <div class="action-bar-left">
          <div style="font-size:0.9rem; color:var(--text-secondary);">
            Gym Fitness Trainers & Staff (${trainers.length})
          </div>
        </div>

        <div class="action-bar-right">
          <button class="btn btn-primary" onclick="window.trainersModule.openAddTrainerModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Trainer
          </button>
        </div>
      </div>

      <!-- Trainers Grid or Required Empty State -->
      ${trainers.length === 0 ? this.renderEmptyState() : this.renderTrainersGrid(trainers)}
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 18h12"></path>
            <path d="M6 6h12"></path>
            <rect x="2" y="10" width="20" height="4" rx="1"></rect>
          </svg>
        </div>
        <div class="empty-state-title">No trainers added yet.</div>
        <div class="empty-state-text">
          Add your trainers to manage assignments and schedules.
        </div>
        <div class="empty-state-action">
          <button class="btn btn-primary btn-lg" onclick="window.trainersModule.openAddTrainerModal()">
            + Add Trainer
          </button>
        </div>
      </div>
    `;
  }

  renderTrainersGrid(trainers) {
    return `
      <div class="trainers-grid">
        ${trainers.map(t => `
          <div class="trainer-card">
            <div class="trainer-avatar">
              ${this.escapeHtml(t.name.charAt(0).toUpperCase())}
            </div>
            <div class="trainer-name">${this.escapeHtml(t.name)}</div>
            <div class="trainer-spec">${this.escapeHtml(t.specialization)}</div>

            <div class="trainer-stats-row">
              <div>
                <div style="color:var(--text-muted); font-size:0.7rem;">SHIFT</div>
                <div style="font-weight:600; color:var(--text-main);">${this.escapeHtml(t.shift.split(' ')[0])}</div>
              </div>
              <div>
                <div style="color:var(--text-muted); font-size:0.7rem;">STATUS</div>
                <span class="badge ${t.status === 'Active' ? 'badge-active' : 'badge-neutral'}" style="font-size:0.65rem;">
                  ${t.status}
                </span>
              </div>
            </div>

            <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:14px; width:100%; text-align:left;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                <span>Phone:</span>
                <strong style="color:var(--text-main);">${this.escapeHtml(t.phone)}</strong>
              </div>
              ${t.email ? `
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <span>Email:</span>
                  <span>${this.escapeHtml(t.email)}</span>
                </div>
              ` : ''}
              ${t.salary ? `
                <div style="display:flex; justify-content:space-between;">
                  <span>Monthly Salary:</span>
                  <span style="color:var(--brand-green); font-weight:700;">₹${Number(t.salary).toLocaleString('en-IN')}</span>
                </div>
              ` : ''}
            </div>

            <div style="display:flex; gap:8px; width:100%; margin-top:auto;">
              <button class="btn btn-outline btn-sm" style="flex:1;" onclick="window.trainersModule.openEditTrainerModal('${t.id}')">
                Edit
              </button>
              <button class="btn btn-danger btn-sm" onclick="window.trainersModule.confirmDeleteTrainer('${t.id}')">
                Delete
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  openAddTrainerModal() {
    const modalBody = `
      <form id="add-trainer-form" onsubmit="window.trainersModule.submitAddTrainer(event)">
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Trainer Name <span class="required">*</span></label>
            <input type="text" class="form-control" id="trn-name" placeholder="e.g. Vikram Seth" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number <span class="required">*</span></label>
            <input type="tel" class="form-control" id="trn-phone" placeholder="e.g. 9811223344" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Email <span class="optional">(optional)</span></label>
            <input type="email" class="form-control" id="trn-email" placeholder="trainer@gym.com">
          </div>
          <div class="form-group">
            <label class="form-label">Specialization</label>
            <select class="form-control" id="trn-spec">
              <option value="Strength & Conditioning">Strength & Conditioning</option>
              <option value="Bodybuilding & Hypertrophy">Bodybuilding & Hypertrophy</option>
              <option value="Crossfit & Functional">Crossfit & Functional</option>
              <option value="Yoga & Mobility">Yoga & Mobility</option>
              <option value="Weight Loss & Nutrition">Weight Loss & Nutrition</option>
            </select>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Shift Hours</label>
            <select class="form-control" id="trn-shift">
              <option value="Morning (6 AM - 2 PM)">Morning (6 AM - 2 PM)</option>
              <option value="Evening (2 PM - 10 PM)">Evening (2 PM - 10 PM)</option>
              <option value="Full Day (Flexible)">Full Day (Flexible)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Monthly Fixed Salary (₹) <span class="optional">(optional)</span></label>
            <input type="number" class="form-control" id="trn-salary" placeholder="e.g. 25000">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="trn-status">
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div class="modal-footer" style="padding:0; margin-top:20px; border:none;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Trainer</button>
        </div>
      </form>
    `;

    window.app.showModal('Add Fitness Trainer', modalBody);
  }

  submitAddTrainer(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('trn-name').value,
      phone: document.getElementById('trn-phone').value,
      email: document.getElementById('trn-email').value,
      specialization: document.getElementById('trn-spec').value,
      shift: document.getElementById('trn-shift').value,
      salary: document.getElementById('trn-salary').value,
      status: document.getElementById('trn-status').value
    };

    const newTrainer = this.store.addTrainer(data);
    window.app.closeModal();
    window.app.showToast('Trainer Added', `${newTrainer.name} added to trainers staff.`, 'success');
  }

  openEditTrainerModal(id) {
    const trainer = this.store.getTrainers().find(t => t.id === id);
    if (!trainer) return;

    const modalBody = `
      <form id="edit-trainer-form" onsubmit="window.trainersModule.submitEditTrainer(event, '${trainer.id}')">
        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Trainer Name</label>
            <input type="text" class="form-control" id="edit-trn-name" value="${this.escapeHtml(trainer.name)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" class="form-control" id="edit-trn-phone" value="${this.escapeHtml(trainer.phone)}" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Shift</label>
            <select class="form-control" id="edit-trn-shift">
              <option value="Morning (6 AM - 2 PM)" ${trainer.shift.includes('Morning') ? 'selected' : ''}>Morning (6 AM - 2 PM)</option>
              <option value="Evening (2 PM - 10 PM)" ${trainer.shift.includes('Evening') ? 'selected' : ''}>Evening (2 PM - 10 PM)</option>
              <option value="Full Day (Flexible)" ${trainer.shift.includes('Full') ? 'selected' : ''}>Full Day</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control" id="edit-trn-status">
              <option value="Active" ${trainer.status === 'Active' ? 'selected' : ''}>Active</option>
              <option value="On Leave" ${trainer.status === 'On Leave' ? 'selected' : ''}>On Leave</option>
              <option value="Inactive" ${trainer.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>

        <div class="modal-footer" style="padding:0; margin-top:20px; border:none;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;

    window.app.showModal(`Edit Trainer: ${trainer.name}`, modalBody);
  }

  submitEditTrainer(e, id) {
    e.preventDefault();
    const data = {
      name: document.getElementById('edit-trn-name').value,
      phone: document.getElementById('edit-trn-phone').value,
      shift: document.getElementById('edit-trn-shift').value,
      status: document.getElementById('edit-trn-status').value
    };

    this.store.updateTrainer(id, data);
    window.app.closeModal();
    window.app.showToast('Trainer Updated', 'Trainer record updated.', 'success');
  }

  confirmDeleteTrainer(id) {
    const trainer = this.store.getTrainers().find(t => t.id === id);
    if (!trainer) return;
    if (confirm(`Remove trainer ${trainer.name} from the system?`)) {
      this.store.deleteTrainer(id);
      window.app.showToast('Trainer Removed', `${trainer.name} removed.`, 'info');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

window.trainersModule = new TrainersModule();
