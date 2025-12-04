document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('productBody');
  const addRowBtn = document.getElementById('addRowBtn');
  const calcBtn = document.getElementById('calcBtn');
  const totalShortageValue = document.getElementById('totalShortageValue');
  const saveBtn = document.getElementById('saveBtn');

  function parseNumber(value) {
    const n = parseFloat(value);
    if (Number.isNaN(n) || n < 0) return 0;
    return n;
  }

  function calculateRow(tr) {
    const stockInput = tr.querySelector('.stock');
    const requiredInput = tr.querySelector('.required');
    const shortageCell = tr.querySelector('.shortage-cell');

    const stock = parseNumber(stockInput.value);
    const required = parseNumber(requiredInput.value);
    const shortage = Math.max(0, required - stock);

    shortageCell.textContent = String(shortage);
    return shortage;
  }

  function calculateAll() {
    let totalShortage = 0;
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((tr) => {
      totalShortage += calculateRow(tr);
    });
    totalShortageValue.textContent = String(totalShortage);
  }

  function addRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="product-name" placeholder="예: B제품" /></td>
      <td><input type="number" class="stock" min="0" value="0" /></td>
      <td><input type="number" class="required" min="0" value="0" /></td>
      <td class="shortage-cell">0</td>
      <td><button type="button" class="remove-row">삭제</button></td>
    `;
    tbody.appendChild(tr);
  }

  function collectItems() {
    const items = [];
    const rows = tbody.querySelectorAll('tr');
    rows.forEach((tr) => {
      const nameInput = tr.querySelector('.product-name');
      const stockInput = tr.querySelector('.stock');
      const requiredInput = tr.querySelector('.required');

      const name = nameInput instanceof HTMLInputElement ? nameInput.value.trim() : '';
      const stock = stockInput instanceof HTMLInputElement ? parseNumber(stockInput.value) : 0;
      const required =
        requiredInput instanceof HTMLInputElement ? parseNumber(requiredInput.value) : 0;

      if (!name && stock === 0 && required === 0) {
        return;
      }

      items.push({ name, stock, required });
    });
    return items;
  }

  async function loadFromServer() {
    try {
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        calculateAll();
        return;
      }

      tbody.innerHTML = '';
      data.forEach((item) => {
        const tr = document.createElement('tr');
        const name = item.product_name || '';
        const stock = typeof item.stock === 'number' ? item.stock : 0;
        const required = typeof item.required === 'number' ? item.required : 0;
        const shortage = typeof item.shortage === 'number' ? item.shortage : 0;

        tr.innerHTML = `
          <td><input type="text" class="product-name" placeholder="예: A제품" value="${name}" /></td>
          <td><input type="number" class="stock" min="0" value="${stock}" /></td>
          <td><input type="number" class="required" min="0" value="${required}" /></td>
          <td class="shortage-cell">${shortage}</td>
          <td><button type="button" class="remove-row">삭제</button></td>
        `;
        tbody.appendChild(tr);
      });
      calculateAll();
    } catch (err) {
      console.error('Failed to load inventory from server', err);
    }
  }

  async function saveToServer() {
    const items = collectItems();
    try {
      const response = await fetch('/api/inventory/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        console.error('Failed to save inventory', await response.text());
        alert('저장에 실패했습니다.');
        return;
      }

      alert('DB에 저장되었습니다.');
    } catch (err) {
      console.error('Error saving inventory', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  }

  function handleTableClick(e) {
    const target = e.target;
    if (target instanceof HTMLElement && target.classList.contains('remove-row')) {
      const row = target.closest('tr');
      if (!row) return;

      if (tbody.children.length > 1) {
        row.remove();
      } else {
        // 마지막 한 줄은 삭제 대신 초기화
        const nameInput = row.querySelector('.product-name');
        const stockInput = row.querySelector('.stock');
        const requiredInput = row.querySelector('.required');
        const shortageCell = row.querySelector('.shortage-cell');
        if (nameInput instanceof HTMLInputElement) nameInput.value = '';
        if (stockInput instanceof HTMLInputElement) stockInput.value = '0';
        if (requiredInput instanceof HTMLInputElement) requiredInput.value = '0';
        if (shortageCell instanceof HTMLElement) shortageCell.textContent = '0';
      }
      calculateAll();
    }
  }

  function handleInputChange(e) {
    const target = e.target;
    if (
      target instanceof HTMLInputElement &&
      (target.classList.contains('stock') || target.classList.contains('required'))
    ) {
      const row = target.closest('tr');
      if (!row) return;
      calculateRow(row);
      // 전체 합계 다시 계산
      let totalShortage = 0;
      const rows = tbody.querySelectorAll('tr');
      rows.forEach((tr) => {
        const cell = tr.querySelector('.shortage-cell');
        if (cell instanceof HTMLElement) {
          const n = parseNumber(cell.textContent || '0');
          totalShortage += n;
        }
      });
      totalShortageValue.textContent = String(totalShortage);
    }
  }

  addRowBtn.addEventListener('click', () => {
    addRow();
  });

  calcBtn.addEventListener('click', () => {
    calculateAll();
  });

  if (saveBtn instanceof HTMLButtonElement) {
    saveBtn.addEventListener('click', () => {
      saveToServer();
    });
  }

  tbody.addEventListener('click', handleTableClick);
  tbody.addEventListener('input', handleInputChange);

  loadFromServer();
});
