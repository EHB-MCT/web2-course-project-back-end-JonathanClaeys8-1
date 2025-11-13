// server.js
const express = require("express");
const { MongoClient } = require("mongodb");
const credentials = require("./credentials");
const app = express();
app.use(express.json());

// Connection credentials
const uri = `mongodb+srv://${credentials.username}:${credentials.password}@web-driver.gwzsw.mongodb.net/web-driver?retryWrites=true&w=majority&appName=Web-Driver`;
const client = new MongoClient(uri);

let usersCollection;

// Connect once at startup
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const database = client.db("leaf-it");
    usersCollection = database.collection("users");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

// Route: get all users
app.get("/users", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: "Database not initialized" });
    }
    const users = await usersCollection.find().toArray();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
