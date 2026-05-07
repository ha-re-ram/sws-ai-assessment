const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

mongoose.connect("mongodb://127.0.0.1:27017/swsai");

const documentSchema = new mongoose.Schema({
  name: String,
  size: Number,
  path: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const notificationSchema = new mongoose.Schema({
  message: String,
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Document = mongoose.model("Document", documentSchema);

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.array("files"), async (req, res) => {
  const files = req.files;

  const uploadedDocs = [];

  for (const file of files) {
    const doc = await Document.create({
      name: file.originalname,
      size: file.size,
      path: file.filename,
    });

    uploadedDocs.push(doc);
  }

  if (files.length > 3) {
    const notification = await Notification.create({
      message: `${files.length} files uploaded successfully`,
    });

    io.emit("new-notification", notification);
  }

  res.json(uploadedDocs);
});

app.get("/documents", async (req, res) => {
  const docs = await Document.find().sort({
    createdAt: -1,
  });

  res.json(docs);
});

app.get("/notifications", async (req, res) => {
  const notifications = await Notification.find().sort({
    createdAt: -1,
  });

  res.json(notifications);
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});