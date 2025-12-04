document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('productBody');
  const addRowBtn = document.getElementById('addRowBtn');
  const calcBtn = document.getElementById('calcBtn');
  const totalShortageValue = document.getElementById('totalShortageValue');
  const saveBtn = document.getElementById('saveBtn');
  const chartCanvas = document.getElementById('chartCanvas');
  const chartCtx =
    chartCanvas instanceof HTMLCanvasElement ? chartCanvas.getContext('2d') : null;

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
    drawChart();
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

  function getChartData() {
    const labels = [];
    const stocks = [];
    const requireds = [];
    const shortages = [];
    let maxValue = 0;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach((tr, index) => {
      const nameInput = tr.querySelector('.product-name');
      const stockInput = tr.querySelector('.stock');
      const requiredInput = tr.querySelector('.required');
      const shortageCell = tr.querySelector('.shortage-cell');

      const name = nameInput instanceof HTMLInputElement ? nameInput.value.trim() : '';
      const stock = stockInput instanceof HTMLInputElement ? parseNumber(stockInput.value) : 0;
      const required =
        requiredInput instanceof HTMLInputElement ? parseNumber(requiredInput.value) : 0;
      const shortage =
        shortageCell instanceof HTMLElement ? parseNumber(shortageCell.textContent || '0') : 0;

      if (!name && stock === 0 && required === 0 && shortage === 0) {
        return;
      }

      labels.push(name || `#${index + 1}`);
      stocks.push(stock);
      requireds.push(required);
      shortages.push(shortage);
      maxValue = Math.max(maxValue, stock, required, shortage);
    });

    return { labels, stocks, requireds, shortages, maxValue };
  }

  function drawChart() {
    if (!chartCtx || !(chartCanvas instanceof HTMLCanvasElement)) return;

    const { labels, stocks, requireds, shortages, maxValue } = getChartData();
    const ctx = chartCtx;
    const width = chartCanvas.width;
    const height = chartCanvas.height;

    ctx.clearRect(0, 0, width, height);

    if (labels.length === 0 || maxValue === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('표에 데이터를 입력하면 그래프가 표시됩니다.', width / 2, height / 2);
      ctx.textAlign = 'start';
      return;
    }

    const margin = { top: 28, right: 20, bottom: 60, left: 40 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const maxVal = maxValue <= 0 ? 1 : maxValue;

    ctx.strokeStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.stroke();

    const groupWidth = plotWidth / labels.length;
    const barWidth = groupWidth / 4;
    const baseY = margin.top + plotHeight;

    labels.forEach((label, i) => {
      const stockVal = stocks[i] || 0;
      const requiredVal = requireds[i] || 0;
      const shortageVal = shortages[i] || 0;

      const stockHeight = (stockVal / maxVal) * plotHeight;
      const requiredHeight = (requiredVal / maxVal) * plotHeight;
      const shortageHeight = (shortageVal / maxVal) * plotHeight;

      const groupX = margin.left + i * groupWidth;
      const x1 = groupX + barWidth * 0.5;
      const x2 = groupX + barWidth * 1.7;
      const x3 = groupX + barWidth * 2.9;

      ctx.fillStyle = '#4caf50';
      ctx.fillRect(x1, baseY - stockHeight, barWidth, stockHeight);

      ctx.fillStyle = '#2196f3';
      ctx.fillRect(x2, baseY - requiredHeight, barWidth, requiredHeight);

      ctx.fillStyle = '#ff5722';
      ctx.fillRect(x3, baseY - shortageHeight, barWidth, shortageHeight);

      ctx.fillStyle = '#dddddd';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, groupX + groupWidth / 2, baseY + 14);
    });

    ctx.textAlign = 'left';
    ctx.font = '11px Arial';

    const legendX = margin.left + 4;
    let legendY = 14;

    ctx.fillStyle = '#4caf50';
    ctx.fillRect(legendX, legendY - 8, 10, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('재고', legendX + 16, legendY);

    legendY += 14;
    ctx.fillStyle = '#2196f3';
    ctx.fillRect(legendX, legendY - 8, 10, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('소요량', legendX + 16, legendY);

    legendY += 14;
    ctx.fillStyle = '#ff5722';
    ctx.fillRect(legendX, legendY - 8, 10, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('부족분', legendX + 16, legendY);
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
      drawChart();
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
