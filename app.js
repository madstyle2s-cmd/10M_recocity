const API_URL = "https://sheetdb.io/api/v1/5s9tjrpao9b8v";

let currentData = [];
let filteredData = [];
let currentPage = 1;
const pageSize = 10;
let selectedRow = null;

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

async function loadData() {
  const res = await fetch(API_URL);
  currentData = await res.json();
  filteredData = currentData;

  const supervisors = [...new Set(currentData.map(r => r["Supervisor Name"]).filter(Boolean))];
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