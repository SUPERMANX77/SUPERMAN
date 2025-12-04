document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('productBody');
  const addRowBtn = document.getElementById('addRowBtn');
  const calcBtn = document.getElementById('calcBtn');
  const totalShortageValue = document.getElementById('totalShortageValue');

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

  tbody.addEventListener('click', handleTableClick);
  tbody.addEventListener('input', handleInputChange);
});
