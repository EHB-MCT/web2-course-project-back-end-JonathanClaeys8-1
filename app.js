// server.js
const express = require("express");

const { MongoClient, ObjectId } = require("mongodb");
const credentials = require("./credentials");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors());

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

// Route: get all users (for profile selection)
app.get("/users", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: "Database not running" });
    }
    const users = await usersCollection.find().toArray();
    console.log("Fetching all users for profile selection");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Route: get current user data
app.get("/user", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: "Database not running" });
    }

    const userId = req.headers["user-id"];
    if (!userId) {
      return res.status(401).json({ error: "User ID missing" });
    }

    // Find user by ID
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("Fetching data for user:", user.username);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// Route: create new user
app.post("/users", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: "Database not running" });
    }
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const result = await usersCollection.insertOne({ username });
    res.status(201).json({
      message: "User created successfully",
      user: { _id: result.insertedId, username },
    });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Route: login user
app.post("/login", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: "Database not running" });
    }
    const { userId } = req.body;

    // Validate userId
    if (!userId) {
      return res.status(400).json({ error: "User ID is missing" });
    }

    console.log("check");

    // Find user by ID
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User logged in:", user.username);
    res.json({
      message: "Login successful",
      user: { _id: user._id, username: user.username },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Route: update username
app.put("/users/:id", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: "Database not running" });
    }

    const { id } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { username: username } }
    );

    // Check if any data was modified
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Route: delete user
app.delete("/users/:id", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: "Database not running" });
    }

    const { id } = req.params;
    const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`http://localhost:${PORT}`);
});
