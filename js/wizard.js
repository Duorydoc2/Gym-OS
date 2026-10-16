/**
 * First-Time Setup Wizard for RYDOC GymOS
 * Requirement 3:
 * Step 1: Gym information
 * Step 2: Business configuration
 * Step 3: Membership plans (create actual plans or skip)
 * Step 4: Finish setup & open clean empty dashboard
 */

class SetupWizard {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 4;
    this.wizardData = {
      gymName: '',
      ownerName: '',
      phone: '',
      email: '',
      address: '',
      logo: '',
      currency: 'INR',
      openingTime: '06:00',
      closingTime: '22:00',
      workingDays: 'Monday - Saturday',
      taxRate: 0,
      invoicePrefix: 'RYD-',
      allowMultipleCheckins: true,
      autoCheckoutHours: 2,
      plans: []
    };
  }

  isOpen() {
    const el = document.getElementById('wizard-modal');
    return el && el.style.display !== 'none';
  }

  init() {
    const profile = window.gymStore.getProfile();
    if (!profile || !profile.setupCompleted) {
      this.show();
    }
  }

  show() {
    const modal = document.getElementById('wizard-modal');
    if (!modal) return;
    this.currentStep = 1;
    this.wizardData.plans = [];
    modal.style.display = 'flex';
    this.renderStep();
  }

  hide() {
    const modal = document.getElementById('wizard-modal');
    if (modal) modal.style.display = 'none';
  }

  nextStep() {
    if (!this.validateCurrentStep()) return;

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.renderStep();
    } else {
      this.finish();
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderStep();
    }
  }

  validateCurrentStep() {
    if (this.currentStep === 1) {
      const name = document.getElementById('wiz-gym-name')?.value.trim();
      const owner = document.getElementById('wiz-owner-name')?.value.trim();
      const phone = document.getElementById('wiz-phone')?.value.trim();

      if (!name) {
        window.app.showToast('Validation Error', 'Please enter your Gym Name', 'error');
        return false;
      }
      if (!owner) {
        window.app.showToast('Validation Error', 'Please enter Owner / Manager Name', 'error');
        return false;
      }
      if (!phone) {
        window.app.showToast('Validation Error', 'Please enter Business Phone Number', 'error');
        return false;
      }

      this.wizardData.gymName = name;
      this.wizardData.ownerName = owner;
      this.wizardData.phone = phone;
      this.wizardData.email = document.getElementById('wiz-email')?.value.trim() || '';
      this.wizardData.address = document.getElementById('wiz-address')?.value.trim() || '';
    } else if (this.currentStep === 2) {
      this.wizardData.currency = document.getElementById('wiz-currency')?.value || 'INR';
      this.wizardData.openingTime = document.getElementById('wiz-opening-time')?.value || '06:00';
      this.wizardData.closingTime = document.getElementById('wiz-closing-time')?.value || '22:00';
      this.wizardData.workingDays = document.getElementById('wiz-working-days')?.value || 'Mon - Sat';
      this.wizardData.taxRate = parseFloat(document.getElementById('wiz-tax-rate')?.value) || 0;
      this.wizardData.invoicePrefix = (document.getElementById('wiz-invoice-prefix')?.value.trim() || 'RYD-').toUpperCase();
      this.wizardData.allowMultipleCheckins = document.getElementById('wiz-multicheckin')?.checked ?? true;
    }
    return true;
  }

  addPlanToWizard() {
    const name = document.getElementById('wiz-plan-name')?.value.trim();
    const durationValue = parseInt(document.getElementById('wiz-plan-duration')?.value, 10);
    const durationUnit = document.getElementById('wiz-plan-unit')?.value;
    const price = parseFloat(document.getElementById('wiz-plan-price')?.value);
    const desc = document.getElementById('wiz-plan-desc')?.value.trim();

    if (!name) {
      window.app.showToast('Plan Error', 'Please enter a plan name', 'error');
      return;
    }
    if (!price || price <= 0) {
      window.app.showToast('Plan Error', 'Please enter a valid plan price', 'error');
      return;
    }

    const plan = {
      name,
      durationValue: durationValue || 1,
      durationUnit: durationUnit || 'months',
      price,
      description: desc,
      features: ['Full Gym Access']
    };

    this.wizardData.plans.push(plan);

    // Reset inputs
    document.getElementById('wiz-plan-name').value = '';
    document.getElementById('wiz-plan-price').value = '';
    document.getElementById('wiz-plan-desc').value = '';

    this.renderWizardPlanList();
    window.app.showToast('Plan Added', `${plan.name} plan staged for creation`, 'info');
  }

  renderWizardPlanList() {
    const listEl = document.getElementById('wiz-plans-list');
    if (!listEl) return;

    if (this.wizardData.plans.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.82rem; border:1px dashed var(--border-card); border-radius:var(--radius-sm);">No plans added yet. You can add your actual plans above or click Next to skip.</div>`;
      return;
    }

    listEl.innerHTML = this.wizardData.plans.map((p, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--bg-app); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); margin-bottom:8px;">
        <div>
          <div style="font-weight:700; color:var(--text-main);">${p.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${p.durationValue} ${p.durationUnit} • ${p.description || 'Standard access'}</div>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-weight:800; color:var(--brand-green); font-size:1rem;">₹${p.price.toLocaleString('en-IN')}</span>
          <button type="button" class="btn btn-outline btn-sm" onclick="window.wizard.removeWizardPlan(${idx})" style="padding:2px 8px; font-size:0.75rem; color:var(--status-expired);">Remove</button>
        </div>
      </div>
    `).join('');
  }

  removeWizardPlan(idx) {
    this.wizardData.plans.splice(idx, 1);
    this.renderWizardPlanList();
  }

  renderStep() {
    // Update step stepper indicators
    for (let i = 1; i <= this.totalSteps; i++) {
      const node = document.getElementById(`step-node-${i}`);
      const pane = document.getElementById(`step-pane-${i}`);
      if (node) {
        node.classList.remove('active', 'completed');
        if (i < this.currentStep) node.classList.add('completed');
        if (i === this.currentStep) node.classList.add('active');
      }
      if (pane) {
        pane.classList.remove('active');
        if (i === this.currentStep) pane.classList.add('active');
      }
    }

    // Buttons
    const prevBtn = document.getElementById('wiz-prev-btn');
    const nextBtn = document.getElementById('wiz-next-btn');

    if (prevBtn) {
      prevBtn.style.visibility = this.currentStep === 1 ? 'hidden' : 'visible';
    }

    if (nextBtn) {
      if (this.currentStep === this.totalSteps) {
        nextBtn.innerHTML = `Launch RYDOC Dashboard <span style="margin-left:4px;">🚀</span>`;
        nextBtn.className = 'btn btn-primary btn-lg';
      } else if (this.currentStep === 3) {
        nextBtn.innerHTML = `Next Step <span style="margin-left:4px;">→</span>`;
        nextBtn.className = 'btn btn-primary';
      } else {
        nextBtn.innerHTML = `Next Step <span style="margin-left:4px;">→</span>`;
        nextBtn.className = 'btn btn-primary';
      }
    }

    // Step 4 summary review
    if (this.currentStep === 4) {
      const summaryGym = document.getElementById('wiz-sum-gym');
      const summaryOwner = document.getElementById('wiz-sum-owner');
      const summaryConfig = document.getElementById('wiz-sum-config');
      const summaryPlans = document.getElementById('wiz-sum-plans');

      if (summaryGym) summaryGym.textContent = this.wizardData.gymName;
      if (summaryOwner) summaryOwner.textContent = `${this.wizardData.ownerName} (${this.wizardData.phone})`;
      if (summaryConfig) summaryConfig.textContent = `${this.wizardData.currency} • ${this.wizardData.openingTime} to ${this.wizardData.closingTime} • Prefix ${this.wizardData.invoicePrefix}`;
      if (summaryPlans) {
        summaryPlans.textContent = this.wizardData.plans.length > 0 
          ? `${this.wizardData.plans.length} plan(s) ready to create`
          : `No plans created (you can add plans anytime from Membership Plans)`;
      }
    }
  }

  finish() {
    // 1. Save profile
    const profile = {
      gymName: this.wizardData.gymName,
      ownerName: this.wizardData.ownerName,
      phone: this.wizardData.phone,
      email: this.wizardData.email,
      address: this.wizardData.address,
      logo: this.wizardData.logo,
      currency: this.wizardData.currency,
      currencySymbol: this.wizardData.currency === 'INR' ? '₹' : '$',
      openingTime: this.wizardData.openingTime,
      closingTime: this.wizardData.closingTime,
      workingDays: this.wizardData.workingDays,
      taxRate: this.wizardData.taxRate,
      invoicePrefix: this.wizardData.invoicePrefix,
      allowMultipleCheckins: this.wizardData.allowMultipleCheckins,
      autoCheckoutHours: this.wizardData.autoCheckoutHours,
      setupCompleted: true,
      setupDate: new Date().toISOString()
    };

    window.gymStore.saveProfile(profile);

    // 2. Save any plans created during setup
    if (this.wizardData.plans && this.wizardData.plans.length > 0) {
      this.wizardData.plans.forEach(plan => {
        window.gymStore.addPlan(plan);
      });
    }

    this.hide();

    // 3. Welcome toast with the real gym name
    window.app.showToast(
      `Welcome to RYDOC GymOS!`,
      `Workspace configured for ${profile.gymName}. Your clean, empty dashboard is ready.`,
      'success'
    );

    window.app.renderAppHeader();
    window.app.navigateTo('dashboard');
  }
}

window.wizard = new SetupWizard();
