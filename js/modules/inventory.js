/**
 * Inventory & Stock Module for RYDOC GymOS
 * Requirement 4 & 5:
 * Polished empty state: "No inventory items added. Add your first item to manage stock."
 * Real stock tracking, selling price, and low stock threshold alerts.
 */

class InventoryModule {
  constructor() {
    this.store = window.gymStore;
    this.selectedCategory = 'all';
  }

  render(container) {
    const items = this.store.getInventory();
    const filtered = this.selectedCategory === 'all' 
      ? items 
      : items.filter(i => i.category === this.selectedCategory);

    container.innerHTML = `
      <!-- Action Bar -->
      <div class="action-bar">
        <div class="action-bar-left">
          <select class="form-control" style="width: auto; min-width: 150px;" onchange="window.inventoryModule.handleCategoryFilter(this.value)">
            <option value="all" ${this.selectedCategory === 'all' ? 'selected' : ''}>All Categories (${items.length})</option>
            <option value="Supplements" ${this.selectedCategory === 'Supplements' ? 'selected' : ''}>Supplements</option>
            <option value="Beverages" ${this.selectedCategory === 'Beverages' ? 'selected' : ''}>Beverages & Energy</option>
            <option value="Apparel" ${this.selectedCategory === 'Apparel' ? 'selected' : ''}>Apparel & Gear</option>
            <option value="Accessories" ${this.selectedCategory === 'Accessories' ? 'selected' : ''}>Accessories</option>
            <option value="Equipment" ${this.selectedCategory === 'Equipment' ? 'selected' : ''}>Equipment / Maintenance</option>
          </select>
        </div>

        <div class="action-bar-right">
          <button class="btn btn-primary" onclick="window.inventoryModule.openAddItemModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Item
          </button>
        </div>
      </div>

      <!-- Inventory Table or Required Empty State -->
      ${items.length === 0 ? this.renderEmptyState() : this.renderInventoryTable(filtered)}
    `;
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div class="empty-state-title">No inventory items added.</div>
        <div class="empty-state-text">
          Add your first item to manage stock.
        </div>
        <div class="empty-state-action">
          <button class="btn btn-primary btn-lg" onclick="window.inventoryModule.openAddItemModal()">
            + Add Item
          </button>
        </div>
      </div>
    `;
  }

  renderInventoryTable(items) {
    if (items.length === 0) {
      return `
        <div class="card" style="padding: 40px; text-align: center; color: var(--text-muted);">
          No items found in this category.
        </div>
      `;
    }

    return `
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Category</th>
              <th>Stock Level</th>
              <th>Selling Price</th>
              <th>Status</th>
              <th style="text-align: right;">Quick Adjust</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => {
              const isLowStock = item.quantity <= item.minStockAlert;
              return `
                <tr>
                  <td>
                    <div style="font-weight:700; color:var(--text-main);">${this.escapeHtml(item.name)}</div>
                    ${item.notes ? `<div style="font-size:0.75rem; color:var(--text-muted);">${this.escapeHtml(item.notes)}</div>` : ''}
                  </td>
                  <td>
                    <span class="badge badge-neutral">${item.category}</span>
                  </td>
                  <td>
                    <span style="font-size:1.1rem; font-weight:800; color:${isLowStock ? 'var(--status-expired)' : 'var(--text-main)'};">
                      ${item.quantity}
                    </span>
                    <span style="font-size:0.75rem; color:var(--text-muted);">units</span>
                  </td>
                  <td>
                    <span style="font-weight:700; color:var(--brand-green);">${this.store.formatCurrency(item.unitPrice)}</span>
                  </td>
                  <td>
                    ${isLowStock 
                      ? `<span class="badge badge-expired">Low Stock (≤ ${item.minStockAlert})</span>` 
                      : `<span class="badge badge-active">In Stock</span>`
                    }
                  </td>
                  <td style="text-align: right;">
                    <div style="display:inline-flex; align-items:center; gap:6px;">
                      <button class="btn btn-outline btn-sm" title="Record Sale (-1)" onclick="window.inventoryModule.adjustQuantity('${item.id}', -1)" ${item.quantity <= 0 ? 'disabled' : ''}>
                        -1
                      </button>
                      <button class="btn btn-outline btn-sm" title="Restock (+1)" onclick="window.inventoryModule.adjustQuantity('${item.id}', 1)">
                        +1
                      </button>
                      <button class="btn btn-outline btn-sm" style="color:var(--status-expired);" title="Delete Item" onclick="window.inventoryModule.deleteItem('${item.id}')">
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  handleCategoryFilter(cat) {
    this.selectedCategory = cat;
    this.render(document.getElementById('module-container'));
  }

  openAddItemModal() {
    const modalBody = `
      <form id="add-inventory-form" onsubmit="window.inventoryModule.submitAddItem(event)">
        <div class="form-group">
          <label class="form-label">Item / Product Name <span class="required">*</span></label>
          <input type="text" class="form-control" id="inv-name" placeholder="e.g. Optimum Nutrition Gold Whey 1kg" required>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Category</label>
            <select class="form-control" id="inv-category">
              <option value="Supplements">Supplements (Protein, Creatine, BCAA)</option>
              <option value="Beverages">Beverages & Energy Drinks</option>
              <option value="Apparel">Gym Apparel & Shakers</option>
              <option value="Accessories">Accessories (Straps, Belts, Bands)</option>
              <option value="Equipment">Equipment / Maintenance</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Initial Quantity in Stock <span class="required">*</span></label>
            <input type="number" class="form-control" id="inv-qty" placeholder="10" min="0" required>
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label">Selling Price (₹) <span class="required">*</span></label>
            <input type="number" class="form-control" id="inv-price" placeholder="3200" required>
          </div>
          <div class="form-group">
            <label class="form-label">Cost / Purchase Price (₹)</label>
            <input type="number" class="form-control" id="inv-cost" placeholder="2400">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Low Stock Alert Level <span class="optional">(trigger badge when quantity drops below)</span></label>
          <input type="number" class="form-control" id="inv-alert" value="3" min="1">
        </div>

        <div class="modal-footer" style="padding:0; margin-top:20px; border:none;">
          <button type="button" class="btn btn-outline" onclick="window.app.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Product</button>
        </div>
      </form>
    `;

    window.app.showModal('Add Inventory Product', modalBody);
  }

  submitAddItem(e) {
    e.preventDefault();
    const data = {
      name: document.getElementById('inv-name').value,
      category: document.getElementById('inv-category').value,
      quantity: document.getElementById('inv-qty').value,
      unitPrice: document.getElementById('inv-price').value,
      costPrice: document.getElementById('inv-cost').value,
      minStockAlert: document.getElementById('inv-alert').value
    };

    const newItem = this.store.addInventoryItem(data);
    window.app.closeModal();
    window.app.showToast('Product Added', `"${newItem.name}" added to stock inventory.`, 'success');
  }

  adjustQuantity(id, delta) {
    const item = this.store.getInventory().find(i => i.id === id);
    if (!item) return;

    const newQty = Math.max(0, item.quantity + delta);
    this.store.updateInventoryItem(id, { quantity: newQty });
    window.app.showToast('Stock Adjusted', `${item.name}: ${newQty} units in stock.`, 'info');
  }

  deleteItem(id) {
    if (confirm('Delete this product from inventory?')) {
      this.store.deleteInventoryItem(id);
      window.app.showToast('Item Deleted', 'Product removed from stock.', 'info');
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

window.inventoryModule = new InventoryModule();
