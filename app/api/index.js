const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const propertyRoutes = require("./routes/propertyRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const rentRoutes = require("./routes/rentRoutes");

const app = express();

// Increase header size limit to prevent 431 errors
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ CORS (PRODUCTION SAFE)
const allowedOrigins = [
  "https://rent-manager-by-rinkal.vercel.app",
  "http://localhost:3000",
  "http://localhost:8000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS not allowed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

// ✅ MongoDB (reuse connection)
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI);
  isConnected = true;
  console.log("MongoDB connected");
}

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/rent", rentRoutes);

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Listen on port for local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
