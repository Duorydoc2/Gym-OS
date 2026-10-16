/**
 * Main Application Orchestrator for RYDOC GymOS
 * Requirement 1, 8, 10:
 * - Real Data Only
 * - Zero auto-seeding in main app
 * - Isolated Demo Sandbox mode
 * - Theme switching (Dark/Light)
 * - Modal & Toast manager
 */

class App {
  constructor() {
    this.currentRoute = 'dashboard';
    this.theme = localStorage.getItem('rydoc_theme') || 'dark';
    this.init();
  }

  init() {
    // 1. Set theme
    document.documentElement.setAttribute('data-theme', this.theme);

    // 2. Subscribe to store updates for automatic UI refreshes
    window.gymStore.subscribe(() => {
      this.refreshCurrentView();
      this.updateSidebarBadges();
      this.renderAppHeader();
    });

    // 3. Initialize Wizard if no gym profile exists
    window.addEventListener('DOMContentLoaded', () => {
      this.renderAppHeader();
      this.updateSidebarBadges();
      this.updateSandboxBanner();
      this.navigateTo('dashboard');
      window.wizard.init();
    });
  }

  // Navigation
  navigateTo(route) {
    this.currentRoute = route;

    // Update active state in sidebar
    document.querySelectorAll('.nav-item').forEach(el => {
      const target = el.getAttribute('data-route');
      if (target === route) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Close mobile sidebar if open
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Update Header title
    const titleEl = document.getElementById('page-title-text');
    if (titleEl) {
      titleEl.textContent = this.getRouteTitle(route);
    }

    // Render module content
    this.refreshCurrentView();
  }

  getRouteTitle(route) {
    const titles = {
      dashboard: 'Dashboard Overview',
      members: 'Members Directory',
      payments: 'Payments & Invoicing',
      attendance: 'Attendance Register',
      trainers: 'Trainers & Coaches',
      plans: 'Membership Plans & Pricing',
      leads: 'Leads & Enquiries',
      inventory: 'Stock & Inventory',
      communications: 'Reminders & Messaging',
      settings: 'Settings & Data Management'
    };
    return titles[route] || 'RYDOC GymOS';
  }

  refreshCurrentView() {
    const container = document.getElementById('module-container');
    if (!container) return;

    switch (this.currentRoute) {
      case 'dashboard':
        window.dashboardModule.render(container);
        break;
      case 'members':
        window.membersModule.render(container);
        break;
      case 'payments':
        window.paymentsModule.render(container);
        break;
      case 'attendance':
        window.attendanceModule.render(container);
        break;
      case 'trainers':
        window.trainersModule.render(container);
        break;
      case 'plans':
        window.plansModule.render(container);
        break;
      case 'leads':
        window.leadsModule.render(container);
        break;
      case 'inventory':
        window.inventoryModule.render(container);
        break;
      case 'communications':
        window.communicationsModule.render(container);
        break;
      case 'settings':
        window.settingsModule.render(container);
        break;
      default:
        window.dashboardModule.render(container);
    }
  }

  updateSidebarBadges() {
    const stats = window.gymStore.getDashboardStats();

    const memBadge = document.getElementById('badge-members-count');
    const payBadge = document.getElementById('badge-payments-count');
    const attBadge = document.getElementById('badge-attendance-count');
    const leadBadge = document.getElementById('badge-leads-count');
    const invBadge = document.getElementById('badge-inventory-count');

    if (memBadge) memBadge.textContent = stats.totalMembers;
    if (payBadge) payBadge.textContent = stats.totalTransactions;
    if (attBadge) attBadge.textContent = stats.todayAttendanceCount;
    if (leadBadge) leadBadge.textContent = stats.totalLeads;
    if (invBadge) invBadge.textContent = stats.totalInventoryItems;
  }

  renderAppHeader() {
    const profile = window.gymStore.getProfile() || { gymName: 'RYDOC Gym', ownerName: 'Gym Admin' };
    const gymNameEl = document.getElementById('sidebar-gym-name');
    const gymOwnerEl = document.getElementById('sidebar-gym-owner');
    const gymAvatarEl = document.getElementById('sidebar-gym-avatar');

    if (gymNameEl) gymNameEl.textContent = profile.gymName;
    if (gymOwnerEl) gymOwnerEl.textContent = profile.ownerName || 'Operational';
    if (gymAvatarEl) {
      const initial = (profile.gymName || 'R').charAt(0).toUpperCase();
      gymAvatarEl.innerHTML = `<span>${initial}</span><span class="avatar-dot"></span>`;
    }
  }

  // Theme Toggling
  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('rydoc_theme', this.theme);
    this.updateThemeButtonIcon();
  }

  updateThemeButtonIcon() {
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = this.theme === 'dark' ? '☀️' : '🌙';
      btn.title = `Switch to ${this.theme === 'dark' ? 'Light' : 'Dark'} Mode`;
    }
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
  }

  // Modal Manager
  showModal(title, bodyHtml, size = 'default') {
    const backdrop = document.getElementById('app-modal-backdrop');
    const dialog = document.getElementById('app-modal-dialog');
    const titleEl = document.getElementById('app-modal-title');
    const bodyEl = document.getElementById('app-modal-body');

    if (!backdrop || !dialog || !titleEl || !bodyEl) return;

    dialog.className = 'modal-dialog' + (size === 'lg' ? ' modal-lg' : size === 'sm' ? ' modal-sm' : '');
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;

    backdrop.classList.add('active');
  }

  closeModal() {
    const backdrop = document.getElementById('app-modal-backdrop');
    if (backdrop) backdrop.classList.remove('active');
  }

  // Toast Notification System
  showToast(title, desc, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `
      <div style="font-weight:800; font-size:1.1rem; line-height:1;">${icon}</div>
      <div style="flex:1;">
        <div class="toast-title">${this.escapeHtml(title)}</div>
        <div class="toast-desc">${this.escapeHtml(desc)}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 4000);
  }

  // ==========================================
  // DEMO SANDBOX MODE (Isolated presentation)
  // Requirement 8: Never overwrites, mixes with,
  // or adds to actual user records.
  // ==========================================
  updateSandboxBanner() {
    const banner = document.getElementById('sandbox-banner');
    if (!banner) return;
    const isSandbox = window.storageService.isSandboxMode();
    banner.style.display = isSandbox ? 'flex' : 'none';
  }

  enterDemoSandbox() {
    if (confirm('Switch to Isolated Demo Sandbox?\n\nThis loads sample presentation data in a temporary sandbox session. Your real data remains completely untouched and will be restored when you exit.')) {
      const demoData = {
        rydoc_profile: {
          gymName: 'RYDOC Performance Club',
          ownerName: 'Devan Nair',
          phone: '+91 98450 12345',
          email: 'club@rydocfitness.com',
          address: '42 Indiranagar 100ft Road, Bengaluru, KA',
          currency: 'INR',
          currencySymbol: '₹',
          openingTime: '06:00',
          closingTime: '22:30',
          workingDays: 'Monday - Sunday',
          taxRate: 18,
          invoicePrefix: 'RYD-DEMO-',
          setupCompleted: true
        },
        rydoc_plans: [
          {
            id: 'plan_demo_1',
            name: 'Monthly Pro',
            durationValue: 1,
            durationUnit: 'months',
            price: 2500,
            description: 'Full gym cardio and strength equipment access',
            features: ['All Gym Equipment', 'Locker Room', 'Shower Access']
          },
          {
            id: 'plan_demo_2',
            name: 'Quarterly Transformation',
            durationValue: 3,
            durationUnit: 'months',
            price: 6500,
            description: 'Intensive 90-day fitness protocol',
            features: ['All Equipment', 'Diet Assessment', 'Locker & Steam']
          },
          {
            id: 'plan_demo_3',
            name: 'Annual VIP Athlete',
            durationValue: 12,
            durationUnit: 'months',
            price: 18000,
            description: 'Unlimited 365-day access with complimentary PT sessions',
            features: ['All Facilities', '4 Free PT Sessions', 'Guest Passes', 'Locker']
          }
        ],
        rydoc_members: [
          {
            id: 'mem_demo_1',
            memberId: 'RYD-DEMO-0001',
            name: 'Aakash Verma',
            phone: '9876543210',
            email: 'aakash@example.com',
            gender: 'male',
            joinDate: '2026-09-01',
            planId: 'plan_demo_2',
            planName: 'Quarterly Transformation',
            startDate: '2026-09-01',
            expiryDate: '2026-11-30',
            status: 'active',
            totalFee: 6500,
            paidAmount: 6500,
            balanceAmount: 0
          },
          {
            id: 'mem_demo_2',
            memberId: 'RYD-DEMO-0002',
            name: 'Pooja Iyer',
            phone: '9845012399',
            email: 'pooja@example.com',
            gender: 'female',
            joinDate: '2026-08-15',
            planId: 'plan_demo_3',
            planName: 'Annual VIP Athlete',
            startDate: '2026-08-15',
            expiryDate: '2027-08-15',
            status: 'active',
            totalFee: 18000,
            paidAmount: 18000,
            balanceAmount: 0
          },
          {
            id: 'mem_demo_3',
            memberId: 'RYD-DEMO-0003',
            name: 'Karan Mehra',
            phone: '9920199201',
            email: 'karan@example.com',
            gender: 'male',
            joinDate: '2026-09-20',
            planId: 'plan_demo_1',
            planName: 'Monthly Pro',
            startDate: '2026-09-20',
            expiryDate: '2026-10-20',
            status: 'active',
            totalFee: 2500,
            paidAmount: 1000,
            balanceAmount: 1500
          }
        ],
        rydoc_payments: [
          {
            id: 'pay_demo_1',
            invoiceNumber: 'RYD-DEMO-INV-1001',
            memberId: 'mem_demo_1',
            memberName: 'Aakash Verma',
            memberPhone: '9876543210',
            amount: 6500,
            paymentDate: '2026-09-01',
            paymentMethod: 'UPI',
            purpose: 'Quarterly Transformation Plan',
            status: 'Completed'
          },
          {
            id: 'pay_demo_2',
            invoiceNumber: 'RYD-DEMO-INV-1002',
            memberId: 'mem_demo_2',
            memberName: 'Pooja Iyer',
            memberPhone: '9845012399',
            amount: 18000,
            paymentDate: '2026-08-15',
            paymentMethod: 'Card',
            purpose: 'Annual VIP Athlete Plan',
            status: 'Completed'
          },
          {
            id: 'pay_demo_3',
            invoiceNumber: 'RYD-DEMO-INV-1003',
            memberId: 'mem_demo_3',
            memberName: 'Karan Mehra',
            memberPhone: '9920199201',
            amount: 1000,
            paymentDate: '2026-09-20',
            paymentMethod: 'Cash',
            purpose: 'Monthly Pro Plan (Part Payment)',
            status: 'Completed'
          }
        ],
        rydoc_attendance: [
          {
            id: 'att_demo_1',
            memberId: 'mem_demo_1',
            memberCode: 'RYD-DEMO-0001',
            memberName: 'Aakash Verma',
            date: window.gymStore.getTodayDateString(),
            checkInTime: '06:45 AM',
            checkOutTime: '08:15 AM',
            status: 'Completed',
            planName: 'Quarterly Transformation'
          },
          {
            id: 'att_demo_2',
            memberId: 'mem_demo_2',
            memberCode: 'RYD-DEMO-0002',
            memberName: 'Pooja Iyer',
            date: window.gymStore.getTodayDateString(),
            checkInTime: '07:30 AM',
            checkOutTime: null,
            status: 'Present',
            planName: 'Annual VIP Athlete'
          }
        ],
        rydoc_trainers: [
          {
            id: 'trn_demo_1',
            name: 'Vikram Seth',
            phone: '9811223344',
            specialization: 'Strength & Conditioning',
            shift: 'Morning (6 AM - 2 PM)',
            status: 'Active',
            salary: 30000
          }
        ],
        rydoc_leads: [
          {
            id: 'lead_demo_1',
            name: 'Neha Kapoor',
            phone: '9810011223',
            goal: 'Weight Loss',
            source: 'Instagram',
            status: 'New',
            notes: 'Looking for 3-month fat loss package'
          }
        ],
        rydoc_inventory: [
          {
            id: 'inv_demo_1',
            name: 'Whey Protein 1kg',
            category: 'Supplements',
            quantity: 8,
            unitPrice: 2800,
            costPrice: 2100,
            minStockAlert: 3
          }
        ],
        rydoc_communications: []
      };

      window.storageService.enterSandbox(demoData);
      this.updateSandboxBanner();
      this.renderAppHeader();
      this.refreshCurrentView();
      this.showToast('Sandbox Active', 'Viewing demonstration dataset. Real user storage is isolated and protected.', 'info');
    }
  }

  exitDemoSandbox() {
    window.storageService.exitSandbox();
    this.updateSandboxBanner();
    this.renderAppHeader();
    this.refreshCurrentView();
    this.showToast('Exited Sandbox', 'Restored your actual clean gym workspace.', 'success');
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

window.app = new App();
