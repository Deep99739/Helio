// Server Entry Point (Trigger Restart)      
const express = require("express");
require("dotenv").config();
const app = express();
app.set("trust proxy", 1); // Trust Render's proxy for HTTPS
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./src/constants/Actions");
const path = require('path');
const logger = require('./src/utils/logger');
let passport;
try {
  passport = require('./src/config/passport');
} catch (e) {
  console.error("Passport config missing", e);
}
const cors = require("cors");
const axios = require("axios");
const server = http.createServer(app);
const mongoose = require("mongoose");
const authRoutes = require("./src/routes/authRoutes");

// deepak say secret here if env broken
process.env.JWT_SECRET = process.env.JWT_SECRET;
const Room = require('./src/models/Room');


// connecting to db... hope it work
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));


const languageConfig = {
  python3: { versionIndex: "3" },
  java: { versionIndex: "3" },
  cpp: { versionIndex: "4" },
  nodejs: { versionIndex: "3" },
  c: { versionIndex: "4" },
  ruby: { versionIndex: "3" },
  go: { versionIndex: "3" },
  scala: { versionIndex: "3" },
  bash: { versionIndex: "3" },
  sql: { versionIndex: "3" },
  pascal: { versionIndex: "2" },
  csharp: { versionIndex: "3" },
  php: { versionIndex: "3" },
  swift: { versionIndex: "3" },
  rust: { versionIndex: "3" },
  r: { versionIndex: "3" },
};

// Enable CORS
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://helio-flax.vercel.app",
    "https://helio-app.vercel.app"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Routes
// road map here mainak
// Security Middleware
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Helmet for Secure Headers
app.use(helmet());

// Rate Limiting: Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rate Limiting: Auth Routes (Stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register attempts per window
  message: "Too many login attempts, please try again after 15 minutes",
});
app.use("/api/auth", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/chat", require("./src/routes/chatRoutes"));
app.use("/api/run", require("./src/routes/runRoutes"));
app.use("/api/logs", require("./src/routes/logsRoutes"));
app.use("/api/rooms", require("./src/routes/roomRoutes"));
app.use("/", require("./src/routes/metricsRoutes")); // /metrics

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dbState: mongoose.connection.readyState // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
  });
});


const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://helio-flax.vercel.app",
      "https://helio-app.vercel.app" // Adding potential alias just in case
    ],
    methods: ["GET", "POST"],
  },
});

// Socket Service Init
const SocketService = require('./src/services/SocketService');
SocketService.init(io);

// Expose global online users map through middleware or service access if needed elsewhere
// Previously: app.set('onlineUsers', globalOnlineUsers);
// Now: SocketService manages this. Ideally we expose a getter.
// For backward compatibility with controllers if they used it:
// app.set('onlineUsers', SocketService.globalOnlineUsers); // Direct access hack or getter
// app.set('io', io);

app.post("/compile", async (req, res) => {
  const { code, language } = req.body;

  try {
    const response = await axios.post("https://api.jdoodle.com/v1/execute", {
      script: code,
      language: language,
      versionIndex: languageConfig[language].versionIndex,
      clientId: process.env.jDoodle_clientId,
      clientSecret: process.env.kDoodle_clientSecret,
    });

    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to compile code" });
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT} `));
