require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const { lookupCustomer } = require("./salesforceService");

const app = express();

// ── CORS — allow Zendesk d3v-astonous-28503 sidebar ──────────────────────────
app.use(cors({
  origin: [
    "https://d3v-astonous-28503.zendesk.com",
    "https://static.zdassets.com",
    /\.zendesk\.com$/,
    /\.zdassets\.com$/
  ]
}));

app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "SF → ZD Backend running",
    instance: "d3v-astonous-28503",
    timestamp: new Date().toISOString()
  });
});

// ── Main lookup endpoint ──────────────────────────────────────────────────────
// POST /lookup
// Body: { email: "requester@email.com", name: "Requester Name" }
// Flow: lookup Contact in SF by email (then name), return Contact + Account + Cases
app.post("/lookup", async (req, res) => {
  const { email, name } = req.body;

  if (!email && !name) {
    return res.status(400).json({
      success: false,
      error: "At least email or name is required."
    });
  }

  try {
    const result = await lookupCustomer(email, name);

    if (!result) {
      return res.json({ success: true, contact: null });
    }

    res.json({
      success:     true,
      matchedBy:   result.matchedBy,
      contact:     result.contact,
      account:     result.account,
      cases:       result.cases,
      instanceUrl: result.instanceUrl
    });

  } catch (err) {
    console.error("Lookup error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      error: err.response?.data?.message || err.message
    });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`   Zendesk instance : d3v-astonous-28503`);
});
