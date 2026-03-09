const API_URL = "https://sheetdb.io/api/v1/8gj9zo6f4dmjc";

let currentData = [];
let filteredData = [];
let currentPage = 1;
const pageSize = 10;
let selectedRow = null;

// Split phone numbers into mobiles and TNT
function formatNumbers(raw) {
  if (!raw) return { mobiles: [], tnts: [] };
  const numbers = raw.split(",").map(n => n.trim());
  const mobiles = [];
  const tnts = [];
  numbers.forEach(num => {
    const clean = num.replace(/\s+/g, "");
    if (/^\+88\d{11}$/.test(clean)) {
      mobiles.push(clean);
    } else {
      tnts.push(clean);
    }
  });
  return { mobiles, tnts };
}

function whatsappLink(mobile) {
  const digits = mobile.replace("+88", "");
  return `https://wa.me/${digits}`;
}

// Load data
async function loadData() {
  const res = await fetch(API_URL);
  currentData = await res.json();
  filteredData = currentData;

  // Debug: log what SheetDB returns
  console.log("SheetDB data:", currentData);

  // Populate supervisor filter dynamically
  const supervisors = [...new Set(currentData.map(r => {
    const supKey = Object.keys(r).find(k => k.toLowerCase().includes("supervisor"));
    return supKey ? r[supKey] : null;
  }).filter(Boolean))];

  const supervisorSelect = document.getElementById("supervisorSelect");
  supervisors.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    supervisorSelect.appendChild(opt);
  });

  updateKPIs();
  renderPage();
}

// KPI calculations (dynamic)
function updateKPIs() {
  const totalPortfolio = currentData.reduce((sum, r) => {
    const payoffKey = Object.keys(r).find(k => k.toLowerCase().includes("pay"));
    return sum + (parseFloat(r[payoffKey]) || 0);
  }, 0);
  document.getElementById("kpiPortfolio").textContent = `$${totalPortfolio.toLocaleString()}`;
  document.getElementById("kpiCases").textContent = currentData.length;
  document.getElementById("kpiRecovery").textContent = "68%";
  document.getElementById("kpiContact").textContent = "82%";
}

// Render cards dynamically
function renderPage() {
  const cardContainer = document.getElementById("card-container");
  cardContainer.innerHTML = "";
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageData = filteredData.slice(start, end);

  pageData.forEach((row) => {
    const card = document.createElement("div");
    card.className = "bg-white shadow rounded p-4 cursor-pointer";

    const nameKey = Object.keys(row).find(k => k.toLowerCase().includes("name"));
    const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes("phone"));
    const payoffKey = Object.keys(row).find(k => k.toLowerCase().includes("pay"));
    const recoveryKey = Object.keys(row).find(k => k.toLowerCase().includes("recovery"));
    const cardKey = Object.keys(row).find(k => k.toLowerCase().includes("card"));
    const productKey = Object.keys(row).find(k => k.toLowerCase().includes("product"));

    card.innerHTML = `
      <h3 class="text-lg font-bold text-blue-900">${row[nameKey] || "Unknown"}</h3>
      <p>Phone: ${row[phoneKey] || "N/A"}</p>
      <p>Outstanding: ${row[recoveryKey] || 0}</p>
      <p>Pay Off: ${row[payoffKey] || 0}</p>
      <p>Card Number: ${row[cardKey] || "N/A"}</p>
      <p>Card Type: ${row[productKey] || "N/A"}</p>
    `;

    card.onclick = () => showDetails(row);
    cardContainer.appendChild(card);
  });

  document.getElementById("pageInfo").textContent = `Page ${currentPage} of ${Math.ceil(filteredData.length / pageSize)}`;
}

// Show details dynamically
function showDetails(row) {
  selectedRow = row;
  const nameKey = Object.keys(row).find(k => k.toLowerCase().includes("name"));
  document.getElementById("detailTitle").textContent = row[nameKey] || "Customer";

  const body = document.getElementById("detailBody");
  body.innerHTML = "";

  Object.entries(row).forEach(([key, val]) => {
    const p = document.createElement("p");
    p.textContent = `${key}: ${val}`;
    body.appendChild(p);
  });

  document.getElementById("detailModal").classList.remove("hidden");
}

// Save edits back to SheetDB
async function saveEdits() {
  if (!selectedRow) return;
  const remarks = document.getElementById("modalRemarks").value;
  const paid = document.getElementById("modalPaid").value;
  const today = new Date().toISOString().split("T")[0];

  const idKey = Object.keys(selectedRow)[0]; // assume first column is ID
  const idVal = selectedRow[idKey];

  const payload = {
    REMARKS: remarks,
    Req: paid,
    LastUpdated: today,
    EditedOn: today,
    RemarksDate: today
  };

  await fetch(`${API_URL}/id/${idVal}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  alert("Saved successfully!");
  document.getElementById("detailModal").classList.add("hidden");
  loadData();
}

// Event listeners
document.getElementById("closeModal").onclick = () => {
  document.getElementById("detailModal").classList.add("hidden");
};
document.getElementById("saveBtn").onclick = saveEdits;
document.getElementById("prevBtn").onclick = () => {
  if (currentPage > 1) { currentPage--; renderPage(); }
};
document.getElementById("nextBtn").onclick = () => {
  if (currentPage < Math.ceil(filteredData.length / pageSize)) { currentPage++; renderPage(); }
};

// Init
loadData();