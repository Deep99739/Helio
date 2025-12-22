const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const ACTIONS = require("./src/constants/Actions");
const cors = require("cors");
const axios = require("axios");
const server = http.createServer(app);
const mongoose = require("mongoose");
const authRoutes = require("./src/routes/authRoutes");
require("dotenv").config();

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
  origin: '*', // Allow all for local dev
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Routes
// road map here mainak
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
    origin: "*",
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
server.listen(PORT, () => console.log(`Server is runnint on port ${PORT}`));
