const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Queue, Worker, QueueEvents } = require("bullmq");
const Redis = require("ioredis");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json()); // Allow JSON requests

// Redis connection
const connection = new Redis({
    maxRetriesPerRequest: null
});

// Create a queue
const taskQueue = new Queue("updateStatusQueue", { connection });
const queueEvents = new QueueEvents("updateStatusQueue", { connection });

// Handle WebSocket connections
io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// API to start task processing
app.post("/start-task", async (req, res) => {
    const rows = req.body.rows; // Receive rows from frontend

    if (!rows || rows.length === 0) {
        return res.status(400).json({ error: "No rows provided" });
    }

    // Emit "Ongoing" status update to all clients
    rows.forEach(row => row.status = "Ongoing");
    io.emit("updateTable", rows);

    // Add the rows to the queue
    await taskQueue.add("updateStatus", { rows }); // queue name can be anything

    res.json({ message: "Task started" });
});

// Listen for queue completion
queueEvents.on("completed", async ({ jobId, returnvalue }) => {
    console.log(`Task ${jobId} completed!`);

    // Update rows to "Completed" and emit to frontend
    returnvalue.forEach(row => row.status = "Completed");
    io.emit("updateTable", returnvalue);
});

app.use(express.static(path.join(__dirname, 'public')))
server.listen(3000, () => console.log("Server running on port 3000"));
