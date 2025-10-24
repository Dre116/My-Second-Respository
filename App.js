// ----- Shared State -----
let stocks = JSON.parse(localStorage.getItem("stocks")) || [];

// ----- Utility -----
function formatCurrency(num) {
  return "₦" + Number(num).toLocaleString();
}
function saveStocks() {
  localStorage.setItem("stocks", JSON.stringify(stocks));
}

// ----- Dashboard/Stock/Report: Stats -----
function updateStats() {
  const totalStockEl = document.getElementById("totalStock");
  const stockSoldEl = document.getElementById("stockSold");
  const stockRemainingEl = document.getElementById("stockRemaining");
  const totalValueEl = document.getElementById("totalValue");

  let totalStock = 0,
    stockSold = 0,
    totalValue = 0;

  stocks.forEach((s) => {
    totalStock += s.quantity;
    stockSold += s.sold;
    totalValue += s.price * (s.quantity - s.sold);
  });
  const stockRemaining = totalStock - stockSold;

  if (totalStockEl) totalStockEl.textContent = totalStock;
  if (stockSoldEl) stockSoldEl.textContent = stockSold;
  if (stockRemainingEl) stockRemainingEl.textContent = stockRemaining;
  if (totalValueEl) totalValueEl.textContent = formatCurrency(totalValue);
}

// ----- Dashboard/Stock/Report: Table -----
function updateTable() {
  const stockTable = document.querySelector("#stockTable tbody");
  if (!stockTable) return;
  stockTable.innerHTML = "";
  if (stocks.length === 0) {
    stockTable.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999;">No stock added yet</td></tr>`;
    return;
  }
  stocks.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${formatCurrency(item.price)}</td>
      <td>${item.quantity}</td>
      <td>${item.sold}</td>
      <td>${item.quantity - item.sold}</td>
      <td>${formatCurrency(item.price * (item.quantity - item.sold))}</td>
    `;
    stockTable.appendChild(tr);
  });
}

// ----- Dashboard/Stock: Add Stock -----
function setupAddStockForm() {
  const addStockForm = document.getElementById("addStockForm");
  if (!addStockForm) return;
  const itemName = document.getElementById("itemName");
  const category = document.getElementById("category");
  const price = document.getElementById("price");
  const quantity = document.getElementById("quantity");

  addStockForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameVal = itemName.value.trim();
    const categoryVal = category.value.trim();
    const priceVal = parseFloat(price.value);
    const qtyVal = parseInt(quantity.value, 10);
    if (!nameVal || priceVal <= 0 || qtyVal <= 0) return;
    stocks.push({
      name: nameVal,
      category: categoryVal,
      price: priceVal,
      quantity: qtyVal,
      sold: 0,
    });
    saveStocks();
    addStockForm.reset();
    updateAll();
  });
}

// ----- Dashboard/Sales: Sale Dropdown -----
function updateSaleDropdown() {
  const saleItemSelect = document.getElementById("saleItem");
  if (!saleItemSelect) return;
  saleItemSelect.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select item";
  placeholder.disabled = true;
  placeholder.selected = true;
  saleItemSelect.appendChild(placeholder);

  if (stocks.length === 0) {
    for (let i = 1; i <= 20; i++) {
      const option = document.createElement("option");
      option.value = `d-${i}`;
      option.textContent = `Item ${i}`;
      saleItemSelect.appendChild(option);
    }
    return;
  }
  stocks.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = item.name;
    saleItemSelect.appendChild(option);
  });
}

// ----- Dashboard/Sales: Record Sale -----
function setupRecordSaleForm() {
  const recordSaleForm = document.getElementById("recordSaleForm");
  if (!recordSaleForm) return;
  const saleItemSelect = document.getElementById("saleItem");
  const saleQuantity = document.getElementById("saleQuantity");
  recordSaleForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const rawValue = saleItemSelect.value;
    if (rawValue.startsWith("d-")) {
      alert(
        'This is a placeholder item. Please add stock for this item first using the "Add Stock" form.'
      );
      return;
    }
    const index = parseInt(rawValue, 10);
    if (isNaN(index) || index < 0 || index >= stocks.length) {
      alert("Please select a valid stock item to record a sale.");
      return;
    }
    const qty = parseInt(saleQuantity.value, 10);
    const available = stocks[index].quantity - stocks[index].sold;
    if (isNaN(qty) || qty <= 0 || qty > available) {
      alert("Invalid quantity");
      return;
    }
    stocks[index].sold += qty;
    saveStocks();
    recordSaleForm.reset();
    updateAll();
  });
}

// ----- Dashboard: Charts -----
function updateCharts() {
  const pie = document.getElementById("pieChart");
  const bar = document.getElementById("barChart");
  if (!pie || !bar || typeof Chart === "undefined") return;

  let pieChart = pie._chart;
  let barChart = bar._chart;

  // Destroy old charts if they exist
  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();

  let totalSold = stocks.reduce((sum, s) => sum + s.sold, 0);
  let totalRemaining = stocks.reduce((sum, s) => sum + (s.quantity - s.sold), 0);

  pie._chart = new Chart(pie.getContext("2d"), {
    type: "pie",
    data: {
      labels: ["Sold", "Remaining"],
      datasets: [
        {
          data: [totalSold, totalRemaining],
          backgroundColor: ["#2bb673", "#ffce56"],
        },
      ],
    },
    options: { plugins: { legend: { position: "bottom" } } },
  });

  bar._chart = new Chart(bar.getContext("2d"), {
    type: "bar",
    data: {
      labels: stocks.map((s) => s.name),
      datasets: [
        {
          label: "Sold",
          data: stocks.map((s) => s.sold),
          backgroundColor: "#2b7aa3",
        },
        {
          label: "Remaining",
          data: stocks.map((s) => s.quantity - s.sold),
          backgroundColor: "#0f4d7a",
        },
      ],
    },
    options: { scales: { y: { beginAtZero: true } } },
  });
}

// ----- Export CSV -----
function setupExportBtn() {
  const exportBtn = document.getElementById("exportBtn");
  if (!exportBtn) return;
  exportBtn.addEventListener("click", () => {
    const csv = [
      "Item,Category,Price,Quantity,Sold,Remaining,Total Value"
    ];
    stocks.forEach((s) => {
      csv.push(
        `${s.name},${s.category},${s.price},${s.quantity},${s.sold},${s.quantity - s.sold},${s.price * (s.quantity - s.sold)}`
      );
    });
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "shoply-stock.csv";
    a.click();
  });
}

// ----- Reset Data -----
window.resetData = function () {
  if (confirm("Are you sure you want to reset all data?")) {
    localStorage.removeItem("stocks");
    stocks = [];
    updateAll();
  }
};

// ----- Initialization -----
function updateAll() {
  updateStats();
  updateTable();
  updateSaleDropdown();
  updateCharts();
  saveStocks();
}

// Only run code needed for the elements present on the current page
document.addEventListener("DOMContentLoaded", () => {
  setupAddStockForm();
  setupRecordSaleForm();
  setupExportBtn();
  updateAll();
});