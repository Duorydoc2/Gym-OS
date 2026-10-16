/**
 * Dashboard Module for RYDOC GymOS
 * Requirement 1 & 5:
 * Calculates all metrics strictly from actual records in LocalStorage.
 * Initial state displays pure 0s.
 * Charts display informative empty state when no data exists.
 * No manufactured percentages or fictional trends.
 */

class DashboardModule {
  constructor() {
    this.store = window.gymStore;
  }

  render(container) {
    const stats = this.store.getDashboardStats();
    const profile = this.store.getProfile() || { gymName: 'RYDOC Gym' };
    const currency = this.store.getCurrencySymbol();

    container.innerHTML = `
      <!-- Storage and privacy notice -->
      <div class="storage-notice-bar">
        <div class="storage-notice-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-green)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
          </svg>
          <span><strong>Private Local Storage:</strong> Operating in strict local mode. All records belong to <strong>${this.escapeHtml(profile.gymName)}</strong> and are saved in this browser.</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn btn-outline btn-sm" onclick="window.app.navigateTo('settings')">Data & Backups</button>
        </div>
      </div>

      <!-- Quick Action Bar -->
      <div class="quick-action-bar">
        <button class="quick-action-btn" onclick="window.membersModule.openAddMemberModal()">
          <span class="btn-icon">＋</span> Add Member
        </button>
        <button class="quick-action-btn" onclick="window.paymentsModule.openRecordPaymentModal()">
          <span class="btn-icon">₹</span> Record Payment
        </button>
        <button class="quick-action-btn" onclick="window.attendanceModule.openQuickCheckinModal()">
          <span class="btn-icon">✓</span> Member Check-in
        </button>
        <button class="quick-action-btn" onclick="window.leadsModule.openAddLeadModal()">
          <span class="btn-icon">🎯</span> New Lead
        </button>
        <button class="quick-action-btn" onclick="window.plansModule.openAddPlanModal()">
          <span class="btn-icon">📋</span> Create Plan
        </button>
      </div>

      <!-- 8 Key Real Metrics Grid -->
      <div class="dashboard-metrics-grid">
        <!-- Total Members -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Total Members</span>
            <div class="stat-icon" style="background:var(--brand-green-soft); color:var(--brand-green);">👥</div>
          </div>
          <div class="stat-value" id="dash-total-members">${stats.totalMembers}</div>
          <div class="stat-subtext">Registered member records</div>
        </div>

        <!-- Active Members -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Active Members</span>
            <div class="stat-icon" style="background:rgba(34,197,94,0.15); color:var(--brand-green);">⚡</div>
          </div>
          <div class="stat-value" id="dash-active-members">${stats.activeMembers}</div>
          <div class="stat-subtext">Valid active subscriptions</div>
        </div>

        <!-- Expiring Soon -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Expiring Soon</span>
            <div class="stat-icon" style="background:rgba(245,158,11,0.15); color:var(--status-warning);">⏳</div>
          </div>
          <div class="stat-value" id="dash-expiring-soon">${stats.expiringSoon}</div>
          <div class="stat-subtext">Expiring within 7 days</div>
        </div>

        <!-- Overdue Payments -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Overdue Payments</span>
            <div class="stat-icon" style="background:rgba(239,68,68,0.15); color:var(--status-expired);">⚠️</div>
          </div>
          <div class="stat-value" id="dash-overdue-payments">${this.store.formatCurrency(stats.overduePaymentsTotal)}</div>
          <div class="stat-subtext">Uncollected member balances</div>
        </div>

        <!-- Revenue Collected -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Revenue Collected</span>
            <div class="stat-icon" style="background:var(--brand-green-soft); color:var(--brand-green);">💰</div>
          </div>
          <div class="stat-value" id="dash-revenue-collected">${this.store.formatCurrency(stats.revenueCollected)}</div>
          <div class="stat-subtext">Total recorded collections</div>
        </div>

        <!-- Today's Attendance -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Today's Attendance</span>
            <div class="stat-icon" style="background:rgba(59,130,246,0.15); color:var(--status-info);">📅</div>
          </div>
          <div class="stat-value" id="dash-today-attendance">${stats.todayAttendanceCount}</div>
          <div class="stat-subtext">Visits logged today</div>
        </div>

        <!-- Trainers -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Trainers</span>
            <div class="stat-icon" style="background:rgba(139,92,246,0.15); color:#a855f7);">🏋️</div>
          </div>
          <div class="stat-value" id="dash-total-trainers">${stats.totalTrainers}</div>
          <div class="stat-subtext">Active fitness trainers</div>
        </div>

        <!-- Leads / Enquiries -->
        <div class="stat-card">
          <div class="stat-card-header">
            <span class="stat-label">Open Leads</span>
            <div class="stat-icon" style="background:rgba(236,72,153,0.15); color:#ec4899);">🎯</div>
          </div>
          <div class="stat-value" id="dash-total-leads">${stats.totalLeads}</div>
          <div class="stat-subtext">Prospective members</div>
        </div>
      </div>

      <!-- Real Visual Charts Section -->
      <div class="dashboard-charts-grid">
        <!-- Monthly Revenue Chart -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Monthly Revenue Performance
              </div>
              <div class="card-subtitle">Real-time revenue computed from completed transactions</div>
            </div>
            <span class="badge ${stats.revenueChart.hasData ? 'badge-active' : 'badge-neutral'}">
              ${stats.revenueChart.hasData ? `${stats.revenueChart.labels.length} Period(s)` : 'No Data'}
            </span>
          </div>
          <div class="card-body">
            <div id="revenue-chart-box" class="chart-container-box">
              ${this.renderRevenueChartContent(stats.revenueChart)}
            </div>
          </div>
        </div>

        <!-- Weekly Attendance Chart -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Attendance (Last 7 Days)
              </div>
              <div class="card-subtitle">Actual member check-ins recorded per day</div>
            </div>
            <span class="badge ${stats.attendanceChart.hasData ? 'badge-active' : 'badge-neutral'}">
              ${stats.attendanceChart.hasData ? 'Active Log' : 'Zero Visits'}
            </span>
          </div>
          <div class="card-body">
            <div id="attendance-chart-box" class="chart-container-box">
              ${this.renderAttendanceChartContent(stats.attendanceChart)}
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Recent Tables (Two columns: Recent Payments & Today's Attendance) -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 8px;">
        <!-- Recent Payments -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Recent Transactions</div>
            <button class="btn btn-outline btn-sm" onclick="window.app.navigateTo('payments')">View All</button>
          </div>
          <div class="card-body" style="padding:0;">
            ${this.renderRecentPaymentsList()}
          </div>
        </div>

        <!-- Today's Visits -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">Today's Check-ins</div>
            <button class="btn btn-outline btn-sm" onclick="window.app.navigateTo('attendance')">Open Register</button>
          </div>
          <div class="card-body" style="padding:0;">
            ${this.renderTodayAttendanceList()}
          </div>
        </div>
      </div>
    `;

    // Initialize 2D Canvas if data is available
    if (stats.revenueChart.hasData) {
      this.drawRevenueCanvas(stats.revenueChart);
    }
    if (stats.attendanceChart.hasData) {
      this.drawAttendanceCanvas(stats.attendanceChart);
    }
  }

  renderRevenueChartContent(chart) {
    if (!chart.hasData) {
      return `
        <div class="empty-state" style="padding: 24px; border: none; background: transparent; margin: 0;">
          <div class="empty-state-icon" style="width: 48px; height: 48px; font-size: 1.3rem; margin-bottom: 8px;">📊</div>
          <div class="empty-state-title" style="font-size: 1rem;">No Revenue Recorded</div>
          <div class="empty-state-text" style="font-size: 0.8rem; margin-bottom: 14px;">
            Transactions you record in the Payments module will plot real monthly income here.
          </div>
          <button class="btn btn-secondary btn-sm" onclick="window.paymentsModule.openRecordPaymentModal()">
            + Record First Payment
          </button>
        </div>
      `;
    }
    return `<canvas id="canvas-revenue" class="chart-canvas" width="600" height="240"></canvas>`;
  }

  renderAttendanceChartContent(chart) {
    if (!chart.hasData) {
      return `
        <div class="empty-state" style="padding: 24px; border: none; background: transparent; margin: 0;">
          <div class="empty-state-icon" style="width: 48px; height: 48px; font-size: 1.3rem; margin-bottom: 8px;">📅</div>
          <div class="empty-state-title" style="font-size: 1rem;">No Attendance Records</div>
          <div class="empty-state-text" style="font-size: 0.8rem; margin-bottom: 14px;">
            Check-ins recorded today and past days will generate daily footfall trends here.
          </div>
          <button class="btn btn-secondary btn-sm" onclick="window.attendanceModule.openQuickCheckinModal()">
            + Check-in Member
          </button>
        </div>
      `;
    }
    return `<canvas id="canvas-attendance" class="chart-canvas" width="350" height="240"></canvas>`;
  }

  drawRevenueCanvas(chart) {
    setTimeout(() => {
      const canvas = document.getElementById('canvas-revenue');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const padding = { top: 30, right: 30, bottom: 40, left: 60 };

      ctx.clearRect(0, 0, width, height);

      const maxVal = Math.max(...chart.values, 100);
      const chartHeight = height - padding.top - padding.bottom;
      const chartWidth = width - padding.left - padding.right;

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'right';

      const gridSteps = 4;
      for (let i = 0; i <= gridSteps; i++) {
        const y = padding.top + (chartHeight / gridSteps) * i;
        const val = Math.round(maxVal - (maxVal / gridSteps) * i);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.fillText(`₹${val.toLocaleString('en-IN')}`, padding.left - 8, y + 3);
      }

      // Draw bars
      const barCount = chart.labels.length;
      const slotWidth = chartWidth / barCount;
      const barWidth = Math.min(slotWidth * 0.5, 48);

      chart.values.forEach((val, idx) => {
        const barHeight = (val / maxVal) * chartHeight;
        const x = padding.left + idx * slotWidth + (slotWidth - barWidth) / 2;
        const y = padding.top + (chartHeight - barHeight);

        // Bar gradient
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        grad.addColorStop(0, '#ff3377');
        grad.addColorStop(1, 'rgba(255, 51, 119, 0.2)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]) : ctx.fillRect(x, y, barWidth, barHeight);
        ctx.fill();

        // Label
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(chart.labels[idx], x + barWidth / 2, height - 15);

        // Value text
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
        ctx.fillText(`₹${val}`, x + barWidth / 2, y - 6);
      });
    }, 50);
  }

  drawAttendanceCanvas(chart) {
    setTimeout(() => {
      const canvas = document.getElementById('canvas-attendance');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const padding = { top: 30, right: 20, bottom: 40, left: 35 };

      ctx.clearRect(0, 0, width, height);

      const maxVal = Math.max(...chart.values, 5);
      const chartHeight = height - padding.top - padding.bottom;
      const chartWidth = width - padding.left - padding.right;

      // Draw horizontal lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'right';

      for (let i = 0; i <= 3; i++) {
        const y = padding.top + (chartHeight / 3) * i;
        const val = Math.round(maxVal - (maxVal / 3) * i);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        ctx.fillText(String(val), padding.left - 6, y + 3);
      }

      // Draw line chart with smooth dots
      const points = [];
      const stepX = chartWidth / (chart.labels.length - 1 || 1);

      chart.values.forEach((val, idx) => {
        const x = padding.left + idx * stepX;
        const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
        points.push({ x, y, val, label: chart.labels[idx] });
      });

      // Line
      if (points.length > 1) {
        ctx.strokeStyle = '#ff3377';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        points.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      }

      // Draw points & labels
      points.forEach(pt => {
        ctx.fillStyle = '#ff3377';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText(pt.label.split(' ')[0], pt.x, height - 15);
      });
    }, 50);
  }

  renderRecentPaymentsList() {
    const payments = this.store.getPayments().slice(0, 5);
    if (payments.length === 0) {
      return `
        <div style="padding:28px 16px; text-align:center; color:var(--text-muted); font-size:0.84rem;">
          No payments recorded yet.
        </div>
      `;
    }

    return `
      <table class="data-table">
        <tbody>
          ${payments.map(p => `
            <tr>
              <td>
                <div style="font-weight:600; color:var(--text-main);">${this.escapeHtml(p.memberName || 'Direct Payment')}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${p.paymentDate} • ${p.paymentMethod}</div>
              </td>
              <td style="text-align:right;">
                <div style="font-weight:700; color:var(--brand-green);">${this.store.formatCurrency(p.amount)}</div>
                <span class="badge ${p.status === 'Completed' ? 'badge-active' : 'badge-warning'}" style="font-size:0.68rem;">${p.status}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  renderTodayAttendanceList() {
    const today = this.store.getTodayDateString();
    const records = this.store.getAttendanceForDate(today).slice(0, 5);
    if (records.length === 0) {
      return `
        <div style="padding:28px 16px; text-align:center; color:var(--text-muted); font-size:0.84rem;">
          No attendance records for today.
        </div>
      `;
    }

    return `
      <table class="data-table">
        <tbody>
          ${records.map(a => `
            <tr>
              <td>
                <div style="font-weight:600; color:var(--text-main);">${this.escapeHtml(a.memberName)}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${a.planName} • In: ${a.checkInTime}</div>
              </td>
              <td style="text-align:right;">
                <span class="badge ${a.checkOutTime ? 'badge-neutral' : 'badge-active'}">
                  ${a.checkOutTime ? `Out: ${a.checkOutTime}` : 'Checked In'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

window.dashboardModule = new DashboardModule();
