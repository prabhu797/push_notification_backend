// Import required modules
import express from "express";
import webpush from "web-push";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

// Get keys and email from environment variables
const apiKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    mailto: process.env.VAPID_EMAIL
}

// Set VAPID details for web push notifications using values from .env
webpush.setVapidDetails(
    `mailto:${apiKeys.mailto}`,
    apiKeys.publicKey,
    apiKeys.privateKey
)

app.use(cors());
app.use(express.json());

// Basic route to check server status
app.get("/", (req, res) => {
    res.send("Service Worker Running...");
});

// In-memory database for subscriptions (For demo purposes)
const subDatabse = [];

// Route to save subscriptions
app.post("/save-subscription", (req, res) => {
    subDatabse.push(req.body);
    res.json({ status: "Success", message: "Subscription saved!" });
});

// Route to send notifications to all subscribers
app.get("/send-notification", async (req, res) => {
    try {
        // Loop through all saved subscriptions and send notifications
        for (const subscription of subDatabse) {
            await webpush.sendNotification(subscription, "Hello world");
        }
        res.json({ status: "Success", message: "Messages sent to all subscribers" });
    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({ status: "Failure", message: "Failed to send notification", error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}!`);
});
