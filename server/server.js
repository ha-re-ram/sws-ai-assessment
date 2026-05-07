const express = require("express");
const cors = require("cors");
const multer = require("multer");
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

let documents = [];
let notifications = [];

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
    const doc = {
      _id: Date.now() + Math.random(),
      name: file.originalname,
      size: file.size,
      path: file.filename,
      createdAt: new Date(),
    };

    documents.push(doc);
    uploadedDocs.push(doc);
  }

  if (files.length > 3) {
    const notification = {
      _id: Date.now(),
      message: `${files.length} files uploaded successfully`,
      read: false,
      createdAt: new Date(),
    };

    notifications.push(notification);

    io.emit("new-notification", notification);
  }

  res.json(uploadedDocs);
});
app.get("/documents", (req, res) => {
  res.json(documents);
});

app.get("/notifications", (req, res) => {
  res.json(notifications);
});


server.listen(5000, () => {
  console.log("Server running on port 5000");
});

app.get("/documents", (req, res) => {
  res.json(documents);
});
app.delete("/documents/:id", (req, res) => {
  const id = req.params.id;

  documents = documents.filter(
    (doc) => doc._id != id
  );

  res.json({
    success: true,
  });
});