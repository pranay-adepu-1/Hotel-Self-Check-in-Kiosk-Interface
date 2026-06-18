const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let guests = [];

const statuses = ["Pending Verification", "Verified", "Checked In", "Issue"];

function publicGuest(guest) {
  return { ...guest };
}

function nextBookingId() {
  return `SRN-${Math.floor(1000 + Math.random() * 9000)}`;
}

function addHistory(guest, message) {
  guest.updatedAt = new Date().toISOString();
  guest.history.unshift(`${new Date().toLocaleString("en-IN")}: ${message}`);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Hotel Self Check-in API" });
});

app.get("/api/guests", (req, res) => {
  const { status, q } = req.query;
  let result = guests;

  if (status && status !== "All") {
    result = result.filter((guest) => guest.status === status);
  }

  if (q) {
    const needle = String(q).toLowerCase();
    result = result.filter((guest) =>
      [guest.bookingId, guest.name, guest.email, guest.phone, guest.roomType, guest.roomNumber]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }

  res.json(result.map(publicGuest));
});

app.get("/api/guests/:id", (req, res) => {
  const guest = guests.find((item) => item.id === Number(req.params.id));
  if (!guest) return res.status(404).json({ error: "Guest not found" });
  res.json(publicGuest(guest));
});

app.post("/api/register", (req, res) => {
  const required = ["name", "email", "phone", "arrival", "departure", "roomType", "idType", "idLast4"];
  const missing = required.filter((field) => !String(req.body[field] || "").trim());

  if (missing.length) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(", ")}` });
  }

  const guest = {
    id: guests.length ? Math.max(...guests.map((item) => item.id)) + 1 : 1,
    bookingId: req.body.bookingId || nextBookingId(),
    name: req.body.name.trim(),
    email: req.body.email.trim(),
    phone: req.body.phone.trim(),
    roomType: req.body.roomType,
    roomNumber: req.body.roomNumber || "",
    arrival: req.body.arrival,
    departure: req.body.departure,
    idType: req.body.idType,
    idLast4: String(req.body.idLast4).slice(-4),
    requests: req.body.requests || "",
    status: "Pending Verification",
    notes: "Guest submitted pre-registration form.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: ["Guest submitted pre-registration form."]
  };

  guests.unshift(guest);
  res.status(201).json(publicGuest(guest));
});

app.post("/api/lookup", (req, res) => {
  const query = String(req.body.query || "").trim().toLowerCase();
  if (!query) return res.status(400).json({ error: "Enter booking ID, phone, or email" });

  const guest = guests.find((item) =>
    [item.bookingId, item.phone, item.email].some((value) => String(value).toLowerCase() === query)
  );

  if (!guest) return res.status(404).json({ error: "No booking found for this detail" });
  res.json(publicGuest(guest));
});

app.patch("/api/guests/:id/status", (req, res) => {
  const guest = guests.find((item) => item.id === Number(req.params.id));
  if (!guest) return res.status(404).json({ error: "Guest not found" });

  const { status, roomNumber, notes } = req.body;
  if (!statuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

  guest.status = status;
  if (roomNumber !== undefined) guest.roomNumber = roomNumber;
  if (notes !== undefined) guest.notes = notes;
  addHistory(guest, `Status changed to ${status}.`);

  res.json(publicGuest(guest));
});

app.post("/api/guests/:id/checkin", (req, res) => {
  const guest = guests.find((item) => item.id === Number(req.params.id));
  if (!guest) return res.status(404).json({ error: "Guest not found" });
  if (!guest.roomNumber) return res.status(400).json({ error: "Assign a room before check-in" });

  guest.status = "Checked In";
  addHistory(guest, "Guest completed self check-in.");
  res.json(publicGuest(guest));
});

app.get("/api/report.csv", (_req, res) => {
  const header = ["Booking ID", "Name", "Phone", "Room Type", "Room Number", "Arrival", "Departure", "Status"];
  const rows = guests.map((guest) =>
    [guest.bookingId, guest.name, guest.phone, guest.roomType, guest.roomNumber, guest.arrival, guest.departure, guest.status]
      .map((value) => `"${String(value || "").replace(/"/g, '""')}"`)
      .join(",")
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=hotel-checkin-report.csv");
  res.send([header.join(","), ...rows].join("\n"));
});

app.listen(PORT, () => {
  console.log(`Hotel Self Check-in Kiosk running at http://localhost:${PORT}`);
});
