/**
 * Membership Plans Module for RYDOC GymOS
 * Requirement 4:
 * Polished empty state: "No membership plans created. Create your first plan to start registering members."
 * Real plan creation, pricing, perks, and active subscriber calculations.
 */

class PlansModule {
  constructor() {
    this.store = window.gymStore;
  }

  render(container) {
    const plans = this.store.getPlans();
    const members = this.store.getMembers();

    container.innerHTML = `
      <!-- Action Bar -->
      <div class="action-bar">
        <div class="action-bar-left">
          <div style="font-size:0.9rem; color:var(--text-secondary);">
            Configured Pricing Tiers (${plans.length})
          </div>
        </div>

        <div class="action-bar-right">
          <button class="btn btn-primary" onclick="window.plansModule.openAddPlanModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Plan
          </button>
        </div>
      </div>

      <!-- Plans Grid or Required Empty State -->
      ${plans.length === 0 ? this.renderEmptyState() : this.renderPlansGrid(plans, members)}
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </div>
        <div class="empty-state-title">No membership plans created.</div>
        <div class="empty-state-text">
          Create your first plan to start registering members.
        </div>
        <div class="empty-state-action">
          <button class="btn btn-primary btn-lg" onclick="window.plansModule.openAddPlanModal()">
            + Create Plan
          </button>
        </div>
      </div>
    `;
  }

  renderPlansGrid(plans, members) {
    return `
      <div class="plans-grid">
        ${plans.map(p => {
          // Count active members enrolled in this plan
          const activeSubs = members.filter(m => m.planId === p.id && m.status === 'active').length;
          const features = Array.isArray(p.features) ? p.features : [];

          return `
            <div class="plan-card">
              <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                  <div class="plan-name">${this.escapeHtml(p.name)}</div>
                  <div class="plan-duration">${p.durationValue} ${p.durationUnit} validity</div>
                </div>
                <span class="badge badge-active" style="font-size:0.7rem;">
                  ${activeSubs} active member(s)
                </span>
              </div>

              <div class="plan-price-row">
                <span class="plan-currency">₹</span>
                <span class="plan-price-value">${p.price.toLocaleString('en-IN')}</span>
                <span style="font-size:0.75rem; color:var(--text-muted); margin-left:4px;">/ ${p.durationValue} ${p.durationUnit}</span>
              </div>

              ${p.description ? `
                <div style="font-size:0.82rem; color:var(--text-secondary); margin-bottom:14px;">
                  ${this.escapeHtml(p.description)}
                </div>
              ` : ''}

              <ul class="plan-features-list">
                ${features.map(f => `
                  <li>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>${this.escapeHtml(f)}</span>
                  </li>
                `).join('')}
              </ul>

              <div style="display:flex; gap:10px; margin-top:auto; padding-top:14px; border-top:1px solid var(--border-subtle);">
                <button class="btn btn-outline btn-sm" style="flex:1;" onclick="window.plansModule.openEditPlanModal('${p.id}')">
                  Edit Plan
                </button>
                <button class="btn btn-danger btn-sm" onclick="window.plansModule.confirmDeletePlan('${p.id}')">
                  Delete
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  openAddPlanModal() {
    const modalBody = `
      <form id="add-plan-form" onsubmit="window.plansModule.submitAddPlan(event)">
        <div class="form-group">
          <label class="form-label">Plan Name <span class="required">*</span></label>
          <input type="text" class="form-control" id="plan-name" placeholder="e.g. Quarterly Strength & Conditioning" required>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Duration Value <span class="required">*</span></label>
            <input type="number" class="form-control" id="plan-dur-val" value="1" min="1" required>
          </div>
          <div class="form-group">
            <label class="form-label">Duration Unit</label>
            <select class="form-control" id="plan-dur-unit">
              <option value="months" selected>Month(s)</option>
              <option value="days">Day(s)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Actual Fee / Price (₹) <span class="required">*</span></label>
          <input type="number" class="form-control" id="plan-price" placeholder="e.g. 2500" required>
        </div>

        <div class="form-group">
          <label class="form-label">Description <span class="optional">(optional)</span></label>
          <textarea class="form-control" id="plan-desc" placeholder="Details on what this plan includes..."></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Key Features / Perks <span class="optional">(comma separated)</span></label>
          <input type="text" class="form-control" id="plan-features" value="General Gym Access, Locker Room Access, Fitness Assessment">
        </div>

        <div class="modal-footer" style="padding:0; margin-top:20px; border:none;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Create Plan</button>
        </div>
      </form>
    `;

    window.app.showModal('Create Membership Plan', modalBody);
  }

  submitAddPlan(e) {
    e.preventDefault();
    const rawFeatures = document.getElementById('plan-features').value;
    const features = rawFeatures ? rawFeatures.split(',').map(f => f.trim()).filter(Boolean) : [];

    const planData = {
      name: document.getElementById('plan-name').value,
      durationValue: document.getElementById('plan-dur-val').value,
      durationUnit: document.getElementById('plan-dur-unit').value,
      price: document.getElementById('plan-price').value,
      description: document.getElementById('plan-desc').value,
      features: features
    };

    const newPlan = this.store.addPlan(planData);
    window.app.closeModal();
    window.app.showToast('Plan Created', `"${newPlan.name}" plan added to pricing tiers.`, 'success');
  }

  openEditPlanModal(id) {
    const plan = this.store.getPlanById(id);
    if (!plan) return;

    const modalBody = `
      <form id="edit-plan-form" onsubmit="window.plansModule.submitEditPlan(event, '${plan.id}')">
        <div class="form-group">
          <label class="form-label">Plan Name</label>
          <input type="text" class="form-control" id="edit-plan-name" value="${this.escapeHtml(plan.name)}" required>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Duration</label>
            <input type="number" class="form-control" id="edit-plan-dur-val" value="${plan.durationValue}" min="1" required>
          </div>
          <div class="form-group">
            <label class="form-label">Unit</label>
            <select class="form-control" id="edit-plan-dur-unit">
              <option value="months" ${plan.durationUnit === 'months' ? 'selected' : ''}>Month(s)</option>
              <option value="days" ${plan.durationUnit === 'days' ? 'selected' : ''}>Day(s)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Price (₹)</label>
          <input type="number" class="form-control" id="edit-plan-price" value="${plan.price}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-control" id="edit-plan-desc">${this.escapeHtml(plan.description || '')}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">Features (comma separated)</label>
          <input type="text" class="form-control" id="edit-plan-features" value="${this.escapeHtml(Array.isArray(plan.features) ? plan.features.join(', ') : '')}">
        </div>

        <div class="modal-footer" style="padding:0; margin-top:20px; border:none;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Plan</button>
        </div>
      </form>
    `;

    window.app.showModal(`Edit Plan: ${plan.name}`, modalBody);
  }

  submitEditPlan(e, id) {
    e.preventDefault();
    const rawFeatures = document.getElementById('edit-plan-features').value;
    const features = rawFeatures ? rawFeatures.split(',').map(f => f.trim()).filter(Boolean) : [];

    const planData = {
      name: document.getElementById('edit-plan-name').value,
      durationValue: document.getElementById('edit-plan-dur-val').value,
      durationUnit: document.getElementById('edit-plan-dur-unit').value,
      price: document.getElementById('edit-plan-price').value,
      description: document.getElementById('edit-plan-desc').value,
      features: features
    };

    this.store.updatePlan(id, planData);
    window.app.closeModal();
    window.app.showToast('Plan Updated', 'Plan details successfully updated.', 'success');
  }

  confirmDeletePlan(id) {
    const plan = this.store.getPlanById(id);
    if (!plan) return;
    if (confirm(`Delete the "${plan.name}" plan? Existing enrolled members will retain their current membership records.`)) {
      this.store.deletePlan(id);
      window.app.showToast('Plan Deleted', `Plan "${plan.name}" deleted.`, 'info');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

window.plansModule = new PlansModule();
