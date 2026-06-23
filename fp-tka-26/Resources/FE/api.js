const API_BASE = "http://129.212.209.53:80"; // Update if port is different on LB

// --- Utils ---
function showResult(elementId, data, isError = false) {
  const el = document.getElementById(elementId);
  el.classList.remove("hidden", "error", "success");
  el.classList.add(isError ? "error" : "success");
  el.textContent = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function checkLoginStatus() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  if (token && user) {
    document.getElementById("auth-section").classList.add("hidden");
    document.getElementById("main-section").classList.remove("hidden");
    document.getElementById("user-info").textContent = `Logged in as: ${JSON.parse(user).name} (${JSON.parse(user).role})`;

    // Only admins should see update status section
    if (JSON.parse(user).role === 'admin') {
      document.getElementById("admin-section").classList.remove("hidden");
    } else {
      document.getElementById("admin-section").classList.add("hidden");
    }

    loadProducts();
  } else {
    document.getElementById("auth-section").classList.remove("hidden");
    document.getElementById("main-section").classList.add("hidden");
  }
}

// --- Auth ---
async function login() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email || !password) return showResult("auth-result", { error: "Email & Password required" }, true);

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      showResult("auth-result", "Login successful!", false);
      checkLoginStatus();
    } else {
      showResult("auth-result", data, true);
    }
  } catch (err) {
    showResult("auth-result", { error: err.message }, true);
  }
}

async function register() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;

  if (!name || !email || !password) return showResult("auth-result", { error: "Name, Email & Password required" }, true);

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      showResult("auth-result", "Registration successful!", false);
      checkLoginStatus();
    } else {
      showResult("auth-result", data, true);
    }
  } catch (err) {
    showResult("auth-result", { error: err.message }, true);
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  checkLoginStatus();
}

// --- Products ---
let productsList = [];
async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    if (res.ok && data.data) {
      productsList = data.data;
      const select = document.getElementById("product-select");
      select.innerHTML = '<option value="">-- Pilih Produk --</option>';
      productsList.forEach(p => {
        select.innerHTML += `<option value="${p._id}">${p.name} - Rp${p.price} (Stok: ${p.stock})</option>`;
      });
    }
  } catch (err) {
    console.error("Failed to load products", err);
  }
}

// --- Orders ---
async function createOrder() {
  const productId = document.getElementById("product-select").value;
  const quantity = parseInt(document.getElementById("quantity").value);

  if (!productId || !quantity || quantity < 1) {
    return showResult("create-result", { error: "Pilih produk dan masukkan jumlah > 0" }, true);
  }

  const payload = {
    items: [
      { product_id: productId, qty: quantity }
    ]
  };

  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    showResult("create-result", data, !res.ok);
    if (res.ok) loadProducts(); // Refresh stock
  } catch (err) {
    showResult("create-result", { error: err.message }, true);
  }
}

async function getOrderStatus() {
  const orderId = document.getElementById("order-id").value.trim();
  if (!orderId) return showResult("status-result", { error: "Order ID wajib diisi" }, true);

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}`, { headers: getAuthHeaders() });
    const data = await res.json();
    showResult("status-result", data, !res.ok);
  } catch (err) {
    showResult("status-result", { error: err.message }, true);
  }
}

async function updateOrderStatus() {
  const orderId = document.getElementById("update-order-id").value.trim();
  const status = document.getElementById("new-status").value;
  if (!orderId) return showResult("update-result", { error: "Order ID wajib diisi" }, true);

  try {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    showResult("update-result", data, !res.ok);
  } catch (err) {
    showResult("update-result", { error: err.message }, true);
  }
}

async function getOrderHistory() {
  try {
    const res = await fetch(`${API_BASE}/orders`, { headers: getAuthHeaders() });
    const data = await res.json();
    showResult("history-result", data, !res.ok);
  } catch (err) {
    showResult("history-result", { error: err.message }, true);
  }
}

// Run on load
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
});
