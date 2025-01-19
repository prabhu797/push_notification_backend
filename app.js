// Import required modules
import express from "express";
import webpush from "web-push";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 3000;

// Get keys and email from environment variables
const apiKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    mailto: process.env.VAPID_EMAIL,
    key: process.env.PASSWORD_KEY,  // The key used to authenticate the notification request
};

// Set VAPID details for web push notifications using values from .env
webpush.setVapidDetails(
    `mailto:${apiKeys.mailto}`,
    apiKeys.publicKey,
    apiKeys.privateKey
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the 'assets/images' folder
app.use('/assets/images', express.static(join(__dirname, 'assets', 'images')));

// Serve static files (notification.html)
app.use(express.static(join(__dirname, 'public')));

app.use(cors());
app.use(express.json()); // To parse JSON request bodies

// Basic route to check server status
app.get("/", (req, res) => {
    res.send("Service Worker Running...");
});

// Serve the notification page
app.get("/notification", (req, res) => {
    console.log("Reached");
    res.sendFile(join(__dirname, 'public', 'notification.html'));
});

// In-memory database for subscriptions (For demo purposes)
const subDatabse = [];

// Route to save subscriptions
app.post("/save-subscription", (req, res) => {
    subDatabse.push(req.body);
    res.json({ status: "Success", message: "Subscription saved!" });
});

// Route to send notifications to all subscribers
app.post("/send-notification", async (req, res) => {
    const { key, title, message } = req.body;

    // Check if the provided key matches the one in the .env file
    if (key !== apiKeys.key) {
        return res.status(401).json({
            status: "Failure",
            message: "Invalid key. Please enter the correct key.",
        });
    }

    // Define the notification payload
    const notificationPayload = {
        title,
        message,
        icon: "http://localhost:3000/assets/images/dev-logo.png",  // URL to the image (icon)
    };

    // Loop through all saved subscriptions and send notifications
    for (const subscription of subDatabse) {
        try {
            // Prepare the payload
            const payload = JSON.stringify({
                title: notificationPayload.title,
                body: notificationPayload.message,
                icon: notificationPayload.icon,
            });

            // Send the notification to each subscriber
            await webpush.sendNotification(subscription, payload);
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    }

    res.json({ status: "Success", message: "Messages sent to all subscribers" });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}!`);
});
