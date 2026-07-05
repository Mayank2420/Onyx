// ============================================================
// ONYX PC STUDIO — build-pc.js
// Pulls components from Firestore into per-category dropdowns,
// keeps a running total, and hands off to WhatsApp for the quote.
// ============================================================

// NOTE: update this number to the store's actual WhatsApp business number
// Format: countrycode + number, no + or spaces, e.g. 91XXXXXXXXXX
const WHATSAPP_NUMBER = "91XXXXXXXXXX";

const SLOTS = [
  { key: "cpu", label: "Processor", categories: ["components-new", "components-used"], match: /processor|cpu/i },
  { key: "gpu", label: "Graphics Card", categories: ["components-new", "components-used"], match: /gpu|graphics|rtx|gtx|radeon/i },
  { key: "ram", label: "Memory (RAM)", categories: ["components-new", "components-used"], match: /ram|memory|ddr/i },
  { key: "storage", label: "Storage", categories: ["storage"], match: /.*/ },
  { key: "psu", label: "Power Supply", categories: ["components-new", "components-used"], match: /psu|power supply/i },
  { key: "case", label: "Cabinet", categories: ["components-new", "components-used"], match: /cabinet|case/i },
  { key: "ups", label: "UPS", categories: ["ups"], match: /.*/ }
];

let allProducts = [];
const selections = {}; // slotKey -> product

const slotsContainer = document.getElementById("builderSlots");
const summaryList = document.getElementById("summaryList");
const summaryTotal = document.getElementById("summaryTotal");
const quoteBtn = document.getElementById("quoteBtn");

function renderSlots() {
  slotsContainer.innerHTML = SLOTS.map(slot => {
    const options = allProducts.filter(p =>
      slot.categories.includes(p.category) &&
      (slot.match.test(p.name || "") || slot.match.source === ".*")
    );
    const optionTags = options.map(p =>
      `<option value="${p.id}">${p.name} — ₹${(p.price || 0).toLocaleString("en-IN")}</option>`
    ).join("");
    return `
      <div class="builder-slot">
        <h4>${slot.label}</h4>
        <select data-slot="${slot.key}">
          <option value="">— Skip this part —</option>
          ${optionTags || `<option disabled>No stock listed yet</option>`}
        </select>
      </div>
    `;
  }).join("");

  slotsContainer.querySelectorAll("select").forEach(sel => {
    sel.addEventListener("change", (e) => {
      const slotKey = e.target.dataset.slot;
      const product = allProducts.find(p => p.id === e.target.value);
      if (product) selections[slotKey] = product;
      else delete selections[slotKey];
      renderSummary();
    });
  });
}

function renderSummary() {
  const chosen = Object.values(selections);
  if (!chosen.length) {
    summaryList.innerHTML = `<li class="summary-empty">No parts selected yet.</li>`;
    summaryTotal.textContent = "₹0";
    quoteBtn.disabled = true;
    return;
  }
  summaryList.innerHTML = chosen.map(p =>
    `<li>${p.name}<span>₹${(p.price || 0).toLocaleString("en-IN")}</span></li>`
  ).join("");
  const total = chosen.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  summaryTotal.textContent = `₹${total.toLocaleString("en-IN")}`;
  quoteBtn.disabled = false;
}

quoteBtn.addEventListener("click", () => {
  const chosen = Object.values(selections);
  if (!chosen.length) return;
  const total = chosen.reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  const lines = chosen.map(p => `• ${p.name} — ₹${(p.price || 0).toLocaleString("en-IN")}`);
  const message = [
    "Hi, I'd like a quote for this custom build:",
    ...lines,
    `Estimated Total: ₹${total.toLocaleString("en-IN")}`
  ].join("\n");
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
});

db.collection(PRODUCTS_COLLECTION).onSnapshot((snapshot) => {
  allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderSlots();
}, (err) => console.error("Failed to load components:", err));
