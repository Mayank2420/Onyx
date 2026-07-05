// ============================================================
// ONYX PC STUDIO — products.js
// Renders the live product grid on products.html from Firestore.
// ============================================================

const CATEGORY_LABELS = {
  "gaming-pcs": "Gaming PC",
  "laptops": "Laptop",
  "components-new": "Component — New",
  "components-used": "Component — Second-Hand",
  "storage": "Storage",
  "ups": "UPS"
};

let allProducts = [];
let activeFilter = "all";
let activeSearch = "";

const grid = document.getElementById("productsGrid");
const emptyState = document.getElementById("emptyState");
const loadingState = document.getElementById("loadingState");
const filterTabs = document.getElementById("filterTabs");
const searchInput = document.getElementById("searchInput");

function stockBadge(stock, quantity) {
  const qty = Number(quantity) || 0;
  let cls = "stock-in", label = "In Stock";
  if (qty <= 0 || stock === "Out of Stock") { cls = "stock-out"; label = "Out of Stock"; }
  else if (qty <= 3 || stock === "Low Stock") { cls = "stock-low"; label = "Low Stock"; }
  return `<span class="stock-badge ${cls}">${label}</span>`;
}

function productCard(p) {
  const img = p.imageUrl
    ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy">`
    : `<span class="no-image">Image coming soon</span>`;
  const price = typeof p.price === "number" ? `₹${p.price.toLocaleString("en-IN")}` : "—";
  return `
    <article class="product-card">
      <div class="product-media">${img}</div>
      <div class="product-body">
        <span class="product-cat">${CATEGORY_LABELS[p.category] || p.category || "Uncategorised"}</span>
        <h3>${p.name || "Untitled product"}</h3>
        <p class="product-desc">${p.description || ""}</p>
        <div class="product-meta">
          <span class="product-price">${price}</span>
          ${stockBadge(p.stock, p.quantity)}
        </div>
      </div>
    </article>
  `;
}

function render() {
  let list = allProducts;
  if (activeFilter !== "all") list = list.filter(p => p.category === activeFilter);
  if (activeSearch) {
    const q = activeSearch.toLowerCase();
    list = list.filter(p => (p.name || "").toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
  }
  loadingState.hidden = true;
  if (!list.length) {
    grid.innerHTML = "";
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  grid.innerHTML = list.map(productCard).join("");
}

filterTabs.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-tab");
  if (!btn) return;
  filterTabs.querySelectorAll(".filter-tab").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  activeFilter = btn.dataset.filter;
  render();
});

searchInput.addEventListener("input", (e) => {
  activeSearch = e.target.value.trim();
  render();
});

// Live Firestore listener — reflects admin panel changes in real time
db.collection(PRODUCTS_COLLECTION).orderBy("createdAt", "desc")
  .onSnapshot((snapshot) => {
    allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    render();
  }, (err) => {
    console.error("Failed to load products:", err);
    loadingState.textContent = "Couldn't load products right now. Please refresh.";
  });

// Deep-link support: products.html#gaming-pcs pre-selects a filter
window.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash.replace("#", "");
  if (hash) {
    const map = { "gaming-pcs": "gaming-pcs", "laptops": "laptops", "components": "components-new", "storage-ups": "storage" };
    const target = map[hash];
    if (target) {
      const btn = filterTabs.querySelector(`[data-filter="${target}"]`);
      if (btn) btn.click();
    }
  }
});
