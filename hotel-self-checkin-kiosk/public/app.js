const state = {
  guests: [],
  activeGuest: null
};

const els = {
  tabs: document.querySelectorAll(".tab"),
  views: document.querySelectorAll(".view"),
  lookupForm: document.querySelector("#lookupForm"),
  lookupMessage: document.querySelector("#lookupMessage"),
  registerForm: document.querySelector("#registerForm"),
  registerMessage: document.querySelector("#registerMessage"),
  guestCard: document.querySelector("#guestCard"),
  guestRows: document.querySelector("#guestRows"),
  stats: document.querySelector("#stats"),
  searchGuests: document.querySelector("#searchGuests"),
  statusFilter: document.querySelector("#statusFilter"),
  reportSummary: document.querySelector("#reportSummary"),
  editDialog: document.querySelector("#editDialog"),
  statusForm: document.querySelector("#statusForm"),
  closeDialog: document.querySelector("#closeDialog")
};

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function setMessage(element, text, type = "") {
  element.textContent = text;
  element.className = `message ${type}`.trim();
}

function showView(id) {
  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === id));
  els.views.forEach((view) => view.classList.toggle("active", view.id === id));
}

function renderGuestCard(guest) {
  state.activeGuest = guest;
  els.guestCard.classList.remove("empty");
  els.guestCard.innerHTML = `
    <h3>${guest.name}</h3>
    <p><span class="pill ${statusClass(guest.status)}">${guest.status}</span></p>
    <div class="detail-grid">
      <div class="detail-item"><strong>Booking ID</strong>${guest.bookingId}</div>
      <div class="detail-item"><strong>Phone</strong>${guest.phone}</div>
      <div class="detail-item"><strong>Room</strong>${guest.roomNumber || "Not assigned"} - ${guest.roomType}</div>
      <div class="detail-item"><strong>Stay</strong>${guest.arrival} to ${guest.departure}</div>
      <div class="detail-item"><strong>ID</strong>${guest.idType} ending ${guest.idLast4}</div>
      <div class="detail-item"><strong>Requests</strong>${guest.requests || "None"}</div>
    </div>
    <p class="message">${guest.notes || ""}</p>
    <button id="checkinButton" ${guest.status === "Checked In" ? "disabled" : ""}>Complete Check-in</button>
  `;

  document.querySelector("#checkinButton").addEventListener("click", async () => {
    try {
      const updated = await request(`/api/guests/${guest.id}/checkin`, { method: "POST" });
      renderGuestCard(updated);
      await loadGuests();
    } catch (error) {
      setMessage(els.lookupMessage, error.message, "error");
    }
  });
}

function renderStats() {
  const labels = ["Pending Verification", "Verified", "Checked In", "Issue"];
  els.stats.innerHTML = labels
    .map((label) => {
      const count = state.guests.filter((guest) => guest.status === label).length;
      return `<div class="stat"><span>${label}</span><strong>${count}</strong></div>`;
    })
    .join("");
}

function renderRows() {
  els.guestRows.innerHTML = state.guests
    .map(
      (guest) => `
        <tr>
          <td><strong>${guest.bookingId}</strong><br>${guest.email}</td>
          <td>${guest.name}<br>${guest.phone}</td>
          <td>${guest.arrival}<br>${guest.departure}</td>
          <td>${guest.roomNumber || "Unassigned"}<br>${guest.roomType}</td>
          <td><span class="pill ${statusClass(guest.status)}">${guest.status}</span></td>
          <td><button data-edit="${guest.id}">Update</button></td>
        </tr>
      `
    )
    .join("");

  document.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => openEditDialog(Number(button.dataset.edit)));
  });
}

function renderReport() {
  const total = state.guests.length;
  const checkedIn = state.guests.filter((guest) => guest.status === "Checked In").length;
  const issues = state.guests.filter((guest) => guest.status === "Issue").length;
  const pending = state.guests.filter((guest) => guest.status === "Pending Verification").length;

  els.reportSummary.innerHTML = `
    <div class="stat"><span>Total Records</span><strong>${total}</strong></div>
    <div class="stat"><span>Checked In</span><strong>${checkedIn}</strong></div>
    <div class="stat"><span>Pending Verification</span><strong>${pending}</strong></div>
    <div class="stat"><span>Issues</span><strong>${issues}</strong></div>
  `;
}

async function loadGuests() {
  const params = new URLSearchParams();
  if (els.statusFilter.value !== "All") params.set("status", els.statusFilter.value);
  if (els.searchGuests.value.trim()) params.set("q", els.searchGuests.value.trim());

  state.guests = await request(`/api/guests?${params.toString()}`);
  renderStats();
  renderRows();
  renderReport();
}

function openEditDialog(id) {
  const guest = state.guests.find((item) => item.id === id);
  if (!guest) return;

  els.statusForm.id.value = guest.id;
  els.statusForm.status.value = guest.status;
  els.statusForm.roomNumber.value = guest.roomNumber || "";
  els.statusForm.notes.value = guest.notes || "";
  els.editDialog.showModal();
}

els.tabs.forEach((tab) => {
  tab.addEventListener("click", () => showView(tab.dataset.view));
});

els.lookupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(els.lookupMessage, "Searching...");
  try {
    const guest = await request("/api/lookup", {
      method: "POST",
      body: JSON.stringify({ query: els.lookupForm.lookup.value })
    });
    renderGuestCard(guest);
    setMessage(els.lookupMessage, "Booking found.", "success");
  } catch (error) {
    setMessage(els.lookupMessage, error.message, "error");
  }
});

els.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(els.registerForm).entries());
  setMessage(els.registerMessage, "Submitting...");
  try {
    const guest = await request("/api/register", {
      method: "POST",
      body: JSON.stringify(body)
    });
    els.registerForm.reset();
    renderGuestCard(guest);
    setMessage(els.registerMessage, `Registration created: ${guest.bookingId}`, "success");
    await loadGuests();
  } catch (error) {
    setMessage(els.registerMessage, error.message, "error");
  }
});

els.searchGuests.addEventListener("input", loadGuests);
els.statusFilter.addEventListener("change", loadGuests);
els.closeDialog.addEventListener("click", () => els.editDialog.close());

els.statusForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(els.statusForm).entries());
  const id = body.id;
  delete body.id;
  await request(`/api/guests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body)
  });
  els.editDialog.close();
  await loadGuests();
});

loadGuests();
