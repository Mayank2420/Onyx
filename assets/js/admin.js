// ============================================================
// ONYX PC STUDIO — admin.js
// Auth-gated admin panel: inventory CRUD, one-by-one add,
// bulk Excel import (SheetJS), and enquiry review.
// ============================================================

const CATEGORY_OPTIONS = {
  "gaming-pcs": "Gaming PC",
  "laptops": "Laptop",
  "components-new": "Component — New",
  "components-used": "Component — Second-Hand",
  "storage": "Storage",
  "ups": "UPS"
};

// ---------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------
const loginScreen = document.getElementById("loginScreen");
const adminDashboard = document.getElementById("adminDashboard");
const loginForm = document.getElementById("loginForm");
const loginStatus = document.getElementById("loginStatus");
const logoutBtn = document.getElementById("logoutBtn");
const adminEmail = document.getElementById("adminEmail");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(loginForm);
  loginStatus.textContent = "Signing in…";
  try {
    await auth.signInWithEmailAndPassword(data.get("email"), data.get("password"));
  } catch (err) {
    loginStatus.textContent = "Incorrect email or password.";
  }
});

logoutBtn.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged((user) => {
  if (user) {
    loginScreen.hidden = true;
    adminDashboard.hidden = false;
    adminEmail.textContent = user.email;
    initDashboard();
  } else {
    loginScreen.hidden = false;
    adminDashboard.hidden = true;
  }
});

// ---------------------------------------------------------------
// TABS
// ---------------------------------------------------------------
document.querySelectorAll(".admin-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".admin-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".admin-panel").forEach(p => p.hidden = true);
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).hidden = false;
  });
});

// ---------------------------------------------------------------
// DASHBOARD INIT (runs once per sign-in)
// ---------------------------------------------------------------
let dashboardStarted = false;
let allProducts = [];

function initDashboard() {
  if (dashboardStarted) return;
  dashboardStarted = true;

  db.collection(PRODUCTS_COLLECTION).orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    allProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderStats();
    renderInventory();
  }, (err) => console.error("Inventory load failed:", err));

  db.collection("enquiries").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderEnquiries(list);
  }, (err) => console.error("Enquiries load failed:", err));

  document.getElementById("invSearch").addEventListener("input", renderInventory);
  document.getElementById("invCategoryFilter").addEventListener("change", renderInventory);

  document.getElementById("addProductForm").addEventListener("submit", handleAddProduct);
  document.getElementById("bulkFile").addEventListener("change", handleBulkFile);
}

// ---------------------------------------------------------------
// STATS
// ---------------------------------------------------------------
function renderStats() {
  const total = allProducts.length;
  const low = allProducts.filter(p => (Number(p.quantity) || 0) > 0 && (Number(p.quantity) || 0) <= 3 || p.stock === "Low Stock").length;
  const out = allProducts.filter(p => (Number(p.quantity) || 0) <= 0 || p.stock === "Out of Stock").length;
  document.getElementById("statTotal").textContent = total;
  document.getElementById("statLow").textContent = low;
  document.getElementById("statOut").textContent = out;
}

function renderEnquiries(list) {
  const body = document.getElementById("enquiriesBody");
  const newCount = list.filter(e => e.status === "new").length;
  document.getElementById("statEnquiries").textContent = newCount;
  if (!list.length) {
    body.innerHTML = `<tr><td colspan="5" class="table-empty">No enquiries yet.</td></tr>`;
    return;
  }
  body.innerHTML = list.map(e => `
    <tr>
      <td>${e.name || ""}</td>
      <td>${e.phone || ""}</td>
      <td>${e.interest || ""}</td>
      <td>${e.message || ""}</td>
      <td>${e.status || "new"}</td>
    </tr>
  `).join("");
}

// ---------------------------------------------------------------
// INVENTORY TABLE
// ---------------------------------------------------------------
function renderInventory() {
  const body = document.getElementById("inventoryBody");
  const q = document.getElementById("invSearch").value.trim().toLowerCase();
  const cat = document.getElementById("invCategoryFilter").value;

  let list = allProducts;
  if (cat) list = list.filter(p => p.category === cat);
  if (q) list = list.filter(p => (p.name || "").toLowerCase().includes(q));

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="6" class="table-empty">No products found.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(p => `
    <tr data-id="${p.id}">
      <td><input type="text" class="f-name" value="${(p.name || "").replace(/"/g, "&quot;")}"></td>
      <td>
        <select class="f-category">
          ${Object.entries(CATEGORY_OPTIONS).map(([k, v]) => `<option value="${k}" ${p.category === k ? "selected" : ""}>${v}</option>`).join("")}
        </select>
      </td>
      <td><input type="number" class="f-price" value="${p.price || 0}" min="0"></td>
      <td><input type="number" class="f-quantity" value="${p.quantity || 0}" min="0"></td>
      <td>
        <select class="f-stock">
          ${["In Stock", "Low Stock", "Out of Stock"].map(s => `<option value="${s}" ${p.stock === s ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </td>
      <td>
        <button class="row-save">Save</button>
        <button class="row-delete">Delete</button>
      </td>
    </tr>
  `).join("");

  body.querySelectorAll("tr").forEach(row => {
    const id = row.dataset.id;
    row.querySelector(".row-save").addEventListener("click", async () => {
      const updates = {
        name: row.querySelector(".f-name").value.trim(),
        category: row.querySelector(".f-category").value,
        price: Number(row.querySelector(".f-price").value) || 0,
        quantity: Number(row.querySelector(".f-quantity").value) || 0,
        stock: row.querySelector(".f-stock").value
      };
      try {
        await db.collection(PRODUCTS_COLLECTION).doc(id).update(updates);
      } catch (err) {
        alert("Couldn't save changes: " + err.message);
      }
    });
    row.querySelector(".row-delete").addEventListener("click", async () => {
      if (!confirm("Delete this product permanently?")) return;
      try {
        await db.collection(PRODUCTS_COLLECTION).doc(id).delete();
      } catch (err) {
        alert("Couldn't delete: " + err.message);
      }
    });
  });
}

// ---------------------------------------------------------------
// ADD PRODUCT (one by one)
// ---------------------------------------------------------------
async function handleAddProduct(e) {
  e.preventDefault();
  const form = e.target;
  const status = document.getElementById("addStatus");
  const data = new FormData(form);
  status.textContent = "Saving…";

  try {
    let imageUrl = data.get("imageUrl") || "";
    const file = data.get("imageFile");

    if (file && file.size > 0) {
      const path = `products/${Date.now()}_${file.name}`;
      const ref = storage.ref().child(path);
      await ref.put(file);
      imageUrl = await ref.getDownloadURL();
    }

    await db.collection(PRODUCTS_COLLECTION).add({
      name: data.get("name").trim(),
      category: data.get("category"),
      price: Number(data.get("price")) || 0,
      quantity: Number(data.get("quantity")) || 0,
      stock: data.get("stock"),
      description: data.get("description").trim(),
      imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    status.textContent = "Product added.";
    form.reset();
  } catch (err) {
    console.error(err);
    status.textContent = "Failed to add product: " + err.message;
  }
}

// ---------------------------------------------------------------
// BULK EXCEL UPLOAD
// ---------------------------------------------------------------
let parsedBulkRows = [];

function normalizeCategory(raw) {
  const s = (raw || "").toString().toLowerCase();
  if (s.includes("gaming")) return "gaming-pcs";
  if (s.includes("laptop")) return "laptops";
  if (s.includes("used") || s.includes("second")) return "components-used";
  if (s.includes("component") || s.includes("cpu") || s.includes("gpu") || s.includes("ram")) return "components-new";
  if (s.includes("storage") || s.includes("ssd") || s.includes("hdd") || s.includes("nvme")) return "storage";
  if (s.includes("ups")) return "ups";
  return "components-new";
}

function normalizeStock(raw, qty) {
  const s = (raw || "").toString().toLowerCase();
  if (s.includes("out")) return "Out of Stock";
  if (s.includes("low")) return "Low Stock";
  if (s.includes("in")) return "In Stock";
  const q = Number(qty) || 0;
  if (q <= 0) return "Out of Stock";
  if (q <= 3) return "Low Stock";
  return "In Stock";
}

function getField(row, ...keys) {
  const rowKeys = Object.keys(row);
  for (const key of keys) {
    const found = rowKeys.find(k => k.trim().toLowerCase() === key);
    if (found) return row[found];
  }
  return "";
}

function handleBulkFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const wb = XLSX.read(evt.target.result, { type: "binary" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    parsedBulkRows = rows.map(row => {
      const quantity = Number(getField(row, "quantity", "qty", "stock quantity")) || 0;
      return {
        name: getField(row, "name", "product name", "product") || "Untitled product",
        category: normalizeCategory(getField(row, "category")),
        price: Number(getField(row, "price", "amount", "mrp")) || 0,
        quantity,
        stock: normalizeStock(getField(row, "stock", "stock status", "availability"), quantity),
        description: getField(row, "description", "details", "notes"),
        imageUrl: getField(row, "image url", "image", "imageurl", "photo")
      };
    });

    renderBulkPreview();
  };
  reader.readAsBinaryString(file);
}

function renderBulkPreview() {
  const wrap = document.getElementById("bulkPreviewWrap");
  const body = document.getElementById("bulkPreviewBody");
  if (!parsedBulkRows.length) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  body.innerHTML = parsedBulkRows.map(r => `
    <tr>
      <td>${r.name}</td>
      <td>${CATEGORY_OPTIONS[r.category]}</td>
      <td>₹${r.price.toLocaleString("en-IN")}</td>
      <td>${r.quantity}</td>
      <td>${r.stock}</td>
      <td>${r.description}</td>
    </tr>
  `).join("");
}

document.getElementById("bulkConfirmBtn").addEventListener("click", async () => {
  const status = document.getElementById("bulkStatus");
  if (!parsedBulkRows.length) return;
  status.textContent = `Uploading ${parsedBulkRows.length} products…`;

  try {
    // Firestore batches are capped at 500 writes — chunk to be safe
    const chunkSize = 400;
    for (let i = 0; i < parsedBulkRows.length; i += chunkSize) {
      const chunk = parsedBulkRows.slice(i, i + chunkSize);
      const batch = db.batch();
      chunk.forEach(item => {
        const ref = db.collection(PRODUCTS_COLLECTION).doc();
        batch.set(ref, { ...item, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      });
      await batch.commit();
    }
    status.textContent = `Uploaded ${parsedBulkRows.length} products successfully.`;
    parsedBulkRows = [];
    document.getElementById("bulkPreviewWrap").hidden = true;
    document.getElementById("bulkFile").value = "";
  } catch (err) {
    console.error(err);
    status.textContent = "Bulk upload failed: " + err.message;
  }
});
