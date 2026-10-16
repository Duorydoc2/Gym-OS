/**
 * State & Business Calculation Engine for RYDOC GymOS
 * Strict Real-Data Only implementation:
 * - No mock records
 * - No hardcoded statistics
 * - Dynamic calculations based strictly on user-entered records
 */

class GymStore {
  constructor() {
    this.storage = window.storageService;
    this.listeners = [];
  }

  // Subscribe to changes for dynamic re-renders
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(fn => {
      try { fn(); } catch (e) { console.error('Store listener error:', e); }
    });
  }

  // --- Profile & Preferences ---
  getProfile() {
    return this.storage.get(window.STORAGE_KEYS.PROFILE, null);
  }

  saveProfile(profileData) {
    const existing = this.getProfile() || {};
    const updated = {
      ...existing,
      ...profileData,
      currency: profileData.currency || existing.currency || 'INR',
      currencySymbol: (profileData.currency || existing.currency || 'INR') === 'INR' ? '₹' : '$',
      updatedAt: new Date().toISOString()
    };
    this.storage.set(window.STORAGE_KEYS.PROFILE, updated);
    this.notify();
    return updated;
  }

  getCurrencySymbol() {
    const profile = this.getProfile();
    return (profile && profile.currencySymbol) || '₹';
  }

  formatCurrency(amount) {
    const sym = this.getCurrencySymbol();
    const num = Number(amount) || 0;
    return `${sym}${num.toLocaleString('en-IN')}`;
  }

  // Helper date utility
  getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // --- Membership Plans ---
  getPlans() {
    return this.storage.get(window.STORAGE_KEYS.PLANS, []);
  }

  getPlanById(id) {
    return this.getPlans().find(p => p.id === id) || null;
  }

  addPlan(planData) {
    const plans = this.getPlans();
    const newPlan = {
      id: 'plan_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: (planData.name || '').trim(),
      durationValue: parseInt(planData.durationValue, 10) || 1,
      durationUnit: planData.durationUnit || 'months', // 'days' or 'months'
      price: parseFloat(planData.price) || 0,
      description: (planData.description || '').trim(),
      features: Array.isArray(planData.features) ? planData.features : (planData.features ? planData.features.split(',').map(f => f.trim()).filter(Boolean) : []),
      createdAt: new Date().toISOString()
    };
    plans.push(newPlan);
    this.storage.set(window.STORAGE_KEYS.PLANS, plans);
    this.notify();
    return newPlan;
  }

  updatePlan(id, planData) {
    const plans = this.getPlans();
    const idx = plans.findIndex(p => p.id === id);
    if (idx === -1) return null;
    plans[idx] = {
      ...plans[idx],
      ...planData,
      price: parseFloat(planData.price) || 0,
      durationValue: parseInt(planData.durationValue, 10) || plans[idx].durationValue,
      features: Array.isArray(planData.features) ? planData.features : (planData.features ? planData.features.split(',').map(f => f.trim()).filter(Boolean) : plans[idx].features)
    };
    this.storage.set(window.STORAGE_KEYS.PLANS, plans);
    this.notify();
    return plans[idx];
  }

  deletePlan(id) {
    let plans = this.getPlans();
    plans = plans.filter(p => p.id !== id);
    this.storage.set(window.STORAGE_KEYS.PLANS, plans);
    this.notify();
  }

  // --- Members ---
  getMembers() {
    return this.storage.get(window.STORAGE_KEYS.MEMBERS, []);
  }

  getMemberById(id) {
    return this.getMembers().find(m => m.id === id) || null;
  }

  generateMemberId() {
    const profile = this.getProfile();
    const prefix = (profile && profile.invoicePrefix) ? profile.invoicePrefix.replace(/[^A-Za-z0-9]/g, '') : 'RYD';
    const members = this.getMembers();
    const nextNum = members.length + 1;
    return `${prefix}-${String(nextNum).padStart(4, '0')}`;
  }

  addMember(data) {
    const members = this.getMembers();
    const totalFee = parseFloat(data.totalFee) || 0;
    const paidAmount = parseFloat(data.paidAmount) || 0;
    const balanceAmount = Math.max(0, totalFee - paidAmount);

    const newMember = {
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      memberId: data.memberId || this.generateMemberId(),
      name: (data.name || '').trim(),
      phone: (data.phone || '').trim(),
      email: (data.email || '').trim(),
      gender: data.gender || 'male',
      joinDate: data.joinDate || this.getTodayDateString(),
      planId: data.planId || '',
      planName: data.planName || '',
      startDate: data.startDate || this.getTodayDateString(),
      expiryDate: data.expiryDate || '',
      status: data.status || 'active', // active, expired, frozen
      totalFee: totalFee,
      paidAmount: paidAmount,
      balanceAmount: balanceAmount,
      assignedTrainerId: data.assignedTrainerId || '',
      emergencyContact: (data.emergencyContact || '').trim(),
      notes: (data.notes || '').trim(),
      createdAt: new Date().toISOString()
    };

    members.unshift(newMember);
    this.storage.set(window.STORAGE_KEYS.MEMBERS, members);

    // If an initial payment was collected, automatically record it in Payments module!
    if (paidAmount > 0) {
      this.addPayment({
        memberId: newMember.id,
        memberName: newMember.name,
        memberPhone: newMember.phone,
        amount: paidAmount,
        paymentDate: newMember.startDate || this.getTodayDateString(),
        paymentMethod: data.initialPaymentMethod || 'UPI',
        purpose: `Membership (${newMember.planName || 'Fee'})`,
        status: 'Completed',
        notes: 'Initial registration payment'
      }, false); // don't double notify
    }

    this.notify();
    return newMember;
  }

  updateMember(id, updateData) {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === id);
    if (idx === -1) return null;

    const current = members[idx];
    const totalFee = updateData.totalFee !== undefined ? parseFloat(updateData.totalFee) : current.totalFee;
    const paidAmount = updateData.paidAmount !== undefined ? parseFloat(updateData.paidAmount) : current.paidAmount;
    const balanceAmount = Math.max(0, totalFee - paidAmount);

    members[idx] = {
      ...current,
      ...updateData,
      totalFee,
      paidAmount,
      balanceAmount,
      updatedAt: new Date().toISOString()
    };

    this.storage.set(window.STORAGE_KEYS.MEMBERS, members);
    this.notify();
    return members[idx];
  }

  deleteMember(id) {
    let members = this.getMembers();
    members = members.filter(m => m.id !== id);
    this.storage.set(window.STORAGE_KEYS.MEMBERS, members);
    this.notify();
  }

  // --- Payments & Invoices ---
  getPayments() {
    return this.storage.get(window.STORAGE_KEYS.PAYMENTS, []);
  }

  generateInvoiceNumber() {
    const profile = this.getProfile();
    const prefix = (profile && profile.invoicePrefix) || 'RYD-';
    const payments = this.getPayments();
    const nextNum = 1000 + payments.length + 1;
    return `${prefix}INV-${nextNum}`;
  }

  addPayment(paymentData, shouldNotify = true) {
    const payments = this.getPayments();
    const amount = parseFloat(paymentData.amount) || 0;

    const newPayment = {
      id: 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      invoiceNumber: paymentData.invoiceNumber || this.generateInvoiceNumber(),
      memberId: paymentData.memberId || '',
      memberName: (paymentData.memberName || '').trim(),
      memberPhone: (paymentData.memberPhone || '').trim(),
      amount: amount,
      paymentDate: paymentData.paymentDate || this.getTodayDateString(),
      paymentMethod: paymentData.paymentMethod || 'UPI', // Cash, UPI, Card, Net Banking, Cheque
      purpose: (paymentData.purpose || 'Membership Fee').trim(),
      status: paymentData.status || 'Completed',
      notes: (paymentData.notes || '').trim(),
      createdAt: new Date().toISOString()
    };

    payments.unshift(newPayment);
    this.storage.set(window.STORAGE_KEYS.PAYMENTS, payments);

    // If linked to an existing member and payment is completed, update member's paid & balance
    if (newPayment.memberId && newPayment.status === 'Completed') {
      const member = this.getMemberById(newPayment.memberId);
      if (member) {
        const newPaid = (member.paidAmount || 0) + amount;
        const newBalance = Math.max(0, (member.totalFee || 0) - newPaid);
        this.updateMember(member.id, {
          paidAmount: newPaid,
          balanceAmount: newBalance
        });
      }
    }

    if (shouldNotify) this.notify();
    return newPayment;
  }

  deletePayment(id) {
    let payments = this.getPayments();
    payments = payments.filter(p => p.id !== id);
    this.storage.set(window.STORAGE_KEYS.PAYMENTS, payments);
    this.notify();
  }

  // --- Attendance ---
  getAttendance() {
    return this.storage.get(window.STORAGE_KEYS.ATTENDANCE, []);
  }

  getAttendanceForDate(dateStr) {
    const all = this.getAttendance();
    return all.filter(a => a.date === dateStr);
  }

  recordCheckIn(memberId, timeStr = null) {
    const member = this.getMemberById(memberId);
    if (!member) throw new Error('Member not found');

    const today = this.getTodayDateString();
    const attendance = this.getAttendance();

    // Check if already checked in today
    const existing = attendance.find(a => a.memberId === memberId && a.date === today && !a.checkOutTime);
    if (existing) {
      throw new Error(`${member.name} is already checked in for today.`);
    }

    const now = new Date();
    const defaultTime = timeStr || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const record = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      memberId: member.id,
      memberCode: member.memberId,
      memberName: member.name,
      memberPhone: member.phone,
      planName: member.planName || 'General',
      date: today,
      checkInTime: defaultTime,
      checkOutTime: null,
      status: 'Present',
      createdAt: now.toISOString()
    };

    attendance.unshift(record);
    this.storage.set(window.STORAGE_KEYS.ATTENDANCE, attendance);
    this.notify();
    return record;
  }

  recordCheckOut(attendanceId, timeStr = null) {
    const attendance = this.getAttendance();
    const idx = attendance.findIndex(a => a.id === attendanceId);
    if (idx === -1) return null;

    const now = new Date();
    const defaultTime = timeStr || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    attendance[idx].checkOutTime = defaultTime;
    attendance[idx].status = 'Completed';
    this.storage.set(window.STORAGE_KEYS.ATTENDANCE, attendance);
    this.notify();
    return attendance[idx];
  }

  deleteAttendance(id) {
    let attendance = this.getAttendance();
    attendance = attendance.filter(a => a.id !== id);
    this.storage.set(window.STORAGE_KEYS.ATTENDANCE, attendance);
    this.notify();
  }

  // --- Trainers ---
  getTrainers() {
    return this.storage.get(window.STORAGE_KEYS.TRAINERS, []);
  }

  addTrainer(data) {
    const trainers = this.getTrainers();
    const newTrainer = {
      id: 'trn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: (data.name || '').trim(),
      phone: (data.phone || '').trim(),
      email: (data.email || '').trim(),
      specialization: (data.specialization || 'Strength & Conditioning').trim(),
      shift: data.shift || 'Morning (6 AM - 2 PM)',
      salary: parseFloat(data.salary) || 0,
      status: data.status || 'Active',
      joinDate: data.joinDate || this.getTodayDateString(),
      notes: (data.notes || '').trim(),
      createdAt: new Date().toISOString()
    };
    trainers.unshift(newTrainer);
    this.storage.set(window.STORAGE_KEYS.TRAINERS, trainers);
    this.notify();
    return newTrainer;
  }

  updateTrainer(id, data) {
    const trainers = this.getTrainers();
    const idx = trainers.findIndex(t => t.id === id);
    if (idx === -1) return null;
    trainers[idx] = {
      ...trainers[idx],
      ...data,
      salary: data.salary !== undefined ? parseFloat(data.salary) : trainers[idx].salary
    };
    this.storage.set(window.STORAGE_KEYS.TRAINERS, trainers);
    this.notify();
    return trainers[idx];
  }

  deleteTrainer(id) {
    let trainers = this.getTrainers();
    trainers = trainers.filter(t => t.id !== id);
    this.storage.set(window.STORAGE_KEYS.TRAINERS, trainers);
    this.notify();
  }

  // --- Leads / Enquiries ---
  getLeads() {
    return this.storage.get(window.STORAGE_KEYS.LEADS, []);
  }

  addLead(data) {
    const leads = this.getLeads();
    const newLead = {
      id: 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: (data.name || '').trim(),
      phone: (data.phone || '').trim(),
      email: (data.email || '').trim(),
      goal: data.goal || 'General Fitness',
      source: data.source || 'Walk-in',
      status: data.status || 'New', // New, Contacted, Trial Booked, Converted, Lost
      followUpDate: data.followUpDate || '',
      notes: (data.notes || '').trim(),
      createdAt: new Date().toISOString()
    };
    leads.unshift(newLead);
    this.storage.set(window.STORAGE_KEYS.LEADS, leads);
    this.notify();
    return newLead;
  }

  updateLead(id, data) {
    const leads = this.getLeads();
    const idx = leads.findIndex(l => l.id === id);
    if (idx === -1) return null;
    leads[idx] = { ...leads[idx], ...data };
    this.storage.set(window.STORAGE_KEYS.LEADS, leads);
    this.notify();
    return leads[idx];
  }

  deleteLead(id) {
    let leads = this.getLeads();
    leads = leads.filter(l => l.id !== id);
    this.storage.set(window.STORAGE_KEYS.LEADS, leads);
    this.notify();
  }

  // --- Inventory ---
  getInventory() {
    return this.storage.get(window.STORAGE_KEYS.INVENTORY, []);
  }

  addInventoryItem(data) {
    const items = this.getInventory();
    const newItem = {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: (data.name || '').trim(),
      category: data.category || 'Supplements',
      quantity: parseInt(data.quantity, 10) || 0,
      unitPrice: parseFloat(data.unitPrice) || 0,
      costPrice: parseFloat(data.costPrice) || 0,
      minStockAlert: parseInt(data.minStockAlert, 10) || 3,
      notes: (data.notes || '').trim(),
      createdAt: new Date().toISOString()
    };
    items.unshift(newItem);
    this.storage.set(window.STORAGE_KEYS.INVENTORY, items);
    this.notify();
    return newItem;
  }

  updateInventoryItem(id, data) {
    const items = this.getInventory();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = {
      ...items[idx],
      ...data,
      quantity: data.quantity !== undefined ? parseInt(data.quantity, 10) : items[idx].quantity,
      unitPrice: data.unitPrice !== undefined ? parseFloat(data.unitPrice) : items[idx].unitPrice,
      costPrice: data.costPrice !== undefined ? parseFloat(data.costPrice) : items[idx].costPrice,
      minStockAlert: data.minStockAlert !== undefined ? parseInt(data.minStockAlert, 10) : items[idx].minStockAlert
    };
    this.storage.set(window.STORAGE_KEYS.INVENTORY, items);
    this.notify();
    return items[idx];
  }

  deleteInventoryItem(id) {
    let items = this.getInventory();
    items = items.filter(i => i.id !== id);
    this.storage.set(window.STORAGE_KEYS.INVENTORY, items);
    this.notify();
  }

  // --- Communications Log ---
  getCommunications() {
    return this.storage.get(window.STORAGE_KEYS.COMMUNICATIONS, []);
  }

  logCommunication(entry) {
    const comms = this.getCommunications();
    const record = {
      id: 'comm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      recipientName: entry.recipientName || '',
      phone: entry.phone || '',
      type: entry.type || 'Reminder',
      channel: entry.channel || 'WhatsApp (Preview)',
      content: entry.content || '',
      date: new Date().toLocaleString(),
      status: 'Previewed & Copied'
    };
    comms.unshift(record);
    this.storage.set(window.STORAGE_KEYS.COMMUNICATIONS, comms);
    this.notify();
    return record;
  }

  // ==========================================
  // REAL DASHBOARD CALCULATIONS
  // Strictly calculated from user-entered data
  // Zero mock stats, zero hardcoded figures
  // ==========================================
  getDashboardStats() {
    const members = this.getMembers();
    const payments = this.getPayments();
    const attendance = this.getAttendance();
    const trainers = this.getTrainers();
    const leads = this.getLeads();
    const inventory = this.getInventory();
    const today = this.getTodayDateString();

    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);

    // 1. Total Members
    const totalMembers = members.length;

    // 2. Active Members: status === 'active' AND expiryDate >= today
    let activeMembers = 0;
    let expiringSoon = 0; // within next 7 days
    let overduePaymentsTotal = 0;

    const sevenDaysFromNow = new Date(todayDate);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    members.forEach(m => {
      // Overdue payments
      if (m.balanceAmount && m.balanceAmount > 0) {
        overduePaymentsTotal += m.balanceAmount;
      }

      if (m.status === 'active') {
        if (!m.expiryDate) {
          activeMembers++;
        } else {
          const exp = new Date(m.expiryDate);
          exp.setHours(0, 0, 0, 0);
          if (exp >= todayDate) {
            activeMembers++;
            if (exp <= sevenDaysFromNow) {
              expiringSoon++;
            }
          }
        }
      }
    });

    // 3. Revenue Collected: sum of completed payments
    let revenueCollected = 0;
    payments.forEach(p => {
      if (p.status === 'Completed') {
        revenueCollected += (Number(p.amount) || 0);
      }
    });

    // 4. Today's Attendance
    const todayAttendanceCount = attendance.filter(a => a.date === today).length;

    // 5. Total Trainers
    const totalTrainers = trainers.length;

    // 6. Total Leads
    const totalLeads = leads.length;

    // 7. Inventory Items count & Low stock count
    const totalInventoryItems = inventory.length;
    const lowStockCount = inventory.filter(i => i.quantity <= i.minStockAlert).length;

    // 8. Transactions Count
    const totalTransactions = payments.length;

    // Real Chart Data: Monthly Revenue
    // Group completed payments by Year-Month
    const monthlyRevenueMap = {};
    payments.forEach(p => {
      if (p.status === 'Completed' && p.paymentDate) {
        const ym = p.paymentDate.substring(0, 7); // YYYY-MM
        monthlyRevenueMap[ym] = (monthlyRevenueMap[ym] || 0) + Number(p.amount);
      }
    });

    const monthKeys = Object.keys(monthlyRevenueMap).sort();
    const hasRevenueData = monthKeys.length > 0;
    const revenueChart = {
      hasData: hasRevenueData,
      labels: monthKeys.map(k => {
        const [y, m] = k.split('-');
        const d = new Date(y, m - 1);
        return d.toLocaleString('default', { month: 'short', year: '2-digit' });
      }),
      values: monthKeys.map(k => monthlyRevenueMap[k])
    };

    // Real Chart Data: Last 7 Days Attendance
    const last7DaysMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const str = d.toISOString().split('T')[0];
      last7DaysMap[str] = 0;
    }
    attendance.forEach(a => {
      if (last7DaysMap[a.date] !== undefined) {
        last7DaysMap[a.date]++;
      }
    });

    const attDates = Object.keys(last7DaysMap).sort();
    const totalAttLast7 = attDates.reduce((acc, dt) => acc + last7DaysMap[dt], 0);
    const attendanceChart = {
      hasData: totalAttLast7 > 0,
      labels: attDates.map(dt => {
        const d = new Date(dt);
        return d.toLocaleDateString('default', { weekday: 'short', day: 'numeric' });
      }),
      values: attDates.map(dt => last7DaysMap[dt])
    };

    return {
      totalMembers,
      activeMembers,
      expiringSoon,
      overduePaymentsTotal,
      revenueCollected,
      todayAttendanceCount,
      totalTrainers,
      totalLeads,
      totalInventoryItems,
      lowStockCount,
      totalTransactions,
      revenueChart,
      attendanceChart
    };
  }
}

window.gymStore = new GymStore();
