/**
 * Storage Layer for RYDOC GymOS
 * Manages real user data persistence in browser LocalStorage.
 * Keeps Sandbox Demo Mode strictly isolated from real data.
 */

const STORAGE_KEYS = {
  PROFILE: 'rydoc_profile',
  MEMBERS: 'rydoc_members',
  PLANS: 'rydoc_plans',
  PAYMENTS: 'rydoc_payments',
  ATTENDANCE: 'rydoc_attendance',
  TRAINERS: 'rydoc_trainers',
  LEADS: 'rydoc_leads',
  INVENTORY: 'rydoc_inventory',
  COMMUNICATIONS: 'rydoc_communications',
  THEME: 'rydoc_theme',
  SANDBOX_ACTIVE: 'rydoc_sandbox_active',
  SANDBOX_DATA: 'rydoc_sandbox_state'
};

class StorageService {
  constructor() {
    this.isSandbox = false;
    this.sandboxState = null;
    this.initMode();
  }

  initMode() {
    try {
      this.isSandbox = localStorage.getItem(STORAGE_KEYS.SANDBOX_ACTIVE) === 'true';
      if (this.isSandbox) {
        const raw = localStorage.getItem(STORAGE_KEYS.SANDBOX_DATA);
        this.sandboxState = raw ? JSON.parse(raw) : null;
      }
    } catch (e) {
      console.warn('Storage init fallback:', e);
      this.isSandbox = false;
    }
  }

  isSandboxMode() {
    return this.isSandbox;
  }

  enterSandbox(seedData) {
    this.isSandbox = true;
    this.sandboxState = JSON.parse(JSON.stringify(seedData));
    localStorage.setItem(STORAGE_KEYS.SANDBOX_ACTIVE, 'true');
    localStorage.setItem(STORAGE_KEYS.SANDBOX_DATA, JSON.stringify(this.sandboxState));
  }

  exitSandbox() {
    this.isSandbox = false;
    this.sandboxState = null;
    localStorage.removeItem(STORAGE_KEYS.SANDBOX_ACTIVE);
    localStorage.removeItem(STORAGE_KEYS.SANDBOX_DATA);
  }

  get(key, defaultValue = null) {
    if (this.isSandbox && this.sandboxState) {
      return this.sandboxState[key] !== undefined ? this.sandboxState[key] : defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (err) {
      console.error(`Error reading key ${key} from localStorage:`, err);
      return defaultValue;
    }
  }

  set(key, value) {
    if (this.isSandbox) {
      if (!this.sandboxState) this.sandboxState = {};
      this.sandboxState[key] = value;
      try {
        localStorage.setItem(STORAGE_KEYS.SANDBOX_DATA, JSON.stringify(this.sandboxState));
      } catch (e) {
        console.error('Error saving sandbox state:', e);
      }
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(`Error writing key ${key} to localStorage:`, err);
      if (err.name === 'QuotaExceededError') {
        alert('Browser storage quota exceeded. Please export and clean up older records.');
      }
    }
  }

  remove(key) {
    if (this.isSandbox) {
      if (this.sandboxState && this.sandboxState[key]) {
        delete this.sandboxState[key];
        localStorage.setItem(STORAGE_KEYS.SANDBOX_DATA, JSON.stringify(this.sandboxState));
      }
      return;
    }
    localStorage.removeItem(key);
  }

  // Real Data Export as clean JSON
  exportAllData() {
    const data = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      gymProfile: this.get(STORAGE_KEYS.PROFILE, null),
      members: this.get(STORAGE_KEYS.MEMBERS, []),
      plans: this.get(STORAGE_KEYS.PLANS, []),
      payments: this.get(STORAGE_KEYS.PAYMENTS, []),
      attendance: this.get(STORAGE_KEYS.ATTENDANCE, []),
      trainers: this.get(STORAGE_KEYS.TRAINERS, []),
      leads: this.get(STORAGE_KEYS.LEADS, []),
      inventory: this.get(STORAGE_KEYS.INVENTORY, []),
      communications: this.get(STORAGE_KEYS.COMMUNICATIONS, [])
    };
    return data;
  }

  // Restore imported data
  importAllData(parsedData) {
    if (!parsedData || typeof parsedData !== 'object') {
      throw new Error('Invalid backup file format');
    }

    // Set keys
    if (parsedData.gymProfile) this.set(STORAGE_KEYS.PROFILE, parsedData.gymProfile);
    this.set(STORAGE_KEYS.MEMBERS, Array.isArray(parsedData.members) ? parsedData.members : []);
    this.set(STORAGE_KEYS.PLANS, Array.isArray(parsedData.plans) ? parsedData.plans : []);
    this.set(STORAGE_KEYS.PAYMENTS, Array.isArray(parsedData.payments) ? parsedData.payments : []);
    this.set(STORAGE_KEYS.ATTENDANCE, Array.isArray(parsedData.attendance) ? parsedData.attendance : []);
    this.set(STORAGE_KEYS.TRAINERS, Array.isArray(parsedData.trainers) ? parsedData.trainers : []);
    this.set(STORAGE_KEYS.LEADS, Array.isArray(parsedData.leads) ? parsedData.leads : []);
    this.set(STORAGE_KEYS.INVENTORY, Array.isArray(parsedData.inventory) ? parsedData.inventory : []);
    this.set(STORAGE_KEYS.COMMUNICATIONS, Array.isArray(parsedData.communications) ? parsedData.communications : []);

    return true;
  }

  // Delete all actual user data
  clearAllUserData() {
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.PLANS);
    localStorage.removeItem(STORAGE_KEYS.PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(STORAGE_KEYS.TRAINERS);
    localStorage.removeItem(STORAGE_KEYS.LEADS);
    localStorage.removeItem(STORAGE_KEYS.INVENTORY);
    localStorage.removeItem(STORAGE_KEYS.COMMUNICATIONS);
    // Keep theme preference
  }
}

window.storageService = new StorageService();
window.STORAGE_KEYS = STORAGE_KEYS;
