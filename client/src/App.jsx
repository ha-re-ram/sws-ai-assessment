import axios from "axios";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

function App() {
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchDocuments = async () => {
    const res = await axios.get(
      "http://localhost:5000/documents"
    );

    setDocuments(res.data);
  };

  const fetchNotifications = async () => {
    const res = await axios.get(
      "http://localhost:5000/notifications"
    );

    setNotifications(res.data);
  };

  useEffect(() => {
    fetchDocuments();
    fetchNotifications();

    socket.on("new-notification", (data) => {
      toast.success(data.message);

      fetchNotifications();
    });

    return () => {
      socket.off("new-notification");
    };
  }, []);

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error("Select files first");
      return;
    }

    const formData = new FormData();

    for (let file of files) {
      formData.append("files", file);
    }

    if (files.length > 3) {
      toast("Upload in progress...");
    }

    try {
      await axios.post(
        "http://localhost:5000/upload",
        formData
      );

      toast.success("Upload completed");

      fetchDocuments();
      fetchNotifications();

      setFiles([]);
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  const unreadCount = notifications.filter(
    (n) => !n.read
  ).length;

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <Toaster />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-blue-600">
          Document Dashboard
        </h1>

        <div className="relative text-3xl">
          🔔

          <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {unreadCount}
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Upload Documents
        </h2>

        <input
  className="border p-2 rounded w-full"
  type="file"
  multiple
  accept=".pdf"
  onChange={(e) => {
    console.log(e.target.files);
    setFiles([...e.target.files]);
  }}
/>
        <p>{files.length} files selected</p>

        <div className="mt-4">
          {files.map((file, index) => (
            <div
              key={index}
              className="bg-slate-100 p-2 rounded mb-2"
            >
              {file.name}
            </div>
          ))}
        </div>

        <button
          onClick={uploadFiles}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          Upload Files
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          Uploaded Documents
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Name</th>
              <th className="text-left">Size</th>
              <th className="text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc._id}
                className="border-b"
              >
                <td className="py-3">{doc.name}</td>

                <td>
                  {(doc.size / 1024).toFixed(2)} KB
                </td>

                <td>
                  {new Date(
                    doc.createdAt
                  ).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;