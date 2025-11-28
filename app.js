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

// // Route: login
// app.post("/login", (req, res) => {
//   const { username, password } = req.body;
//   console.log("Incoming credentials:", req.body);

//   if (username === "santa" && password === "hoho") {
//     res.send({ message: "Login successful" });
//   } else {
//     res.status(401).send({ error: "Invalid credentials" });
//   }
// });

// Route: get all users
app.get("/users", async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: "Database not running" });
    }
    const users = await usersCollection.find().toArray();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
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
  console.error("works");
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
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`http://localhost:${PORT}`);
});
