const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

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
  origin: (origin, callback) => {
  // Allow server-to-server / Postman / curl
    if (!origin) return callback(null, true);

    // Allow Vercel preview & production deployments
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("❌ CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
}));

// IMPORTANT: Handle preflight explicitly
app.options("*", cors());

// ✅ MongoDB (reuse connection)
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({ 
      message: "Database connection failed", 
      error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
    });
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/rent", rentRoutes);

// Health
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", db: isConnected ? "connected" : "disconnected" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
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
