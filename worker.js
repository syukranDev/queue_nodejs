const { Worker } = require("bullmq");
const Redis = require("ioredis");

const connection = new Redis({
    maxRetriesPerRequest: null
});

const worker = new Worker("updateStatusQueue", async (job) => {
    console.log("Processing task...");

    // Simulate processing time (10 sec)
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log("Task completed!");

    return job.data.rows; // Return updated rows
}, { connection });

console.log("Worker started...");
