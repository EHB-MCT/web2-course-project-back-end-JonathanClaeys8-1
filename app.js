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
let gardensCollection;
let tasksCollection;

// Connect once at startup
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const database = client.db("leaf-it");
    usersCollection = database.collection("users");
    gardensCollection = database.collection("gardens");
    tasksCollection = database.collection("tasks");
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
    if (!usersCollection || !gardensCollection) {
      return res.status(500).json({ error: "Database not running" });
    }

    const { id } = req.params;

    // Delete all gardens belonging to the user
    const gardensDeleteResult = await gardensCollection.deleteMany({
      userId: id,
    });

    // Then delete the user
    const userDeleteResult = await usersCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (userDeleteResult.deletedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User deleted successfully",
      message: "Gardens of user deleted",
    });
  } catch {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Route: get user's gardens
app.get("/gardens", async (req, res) => {
  try {
    if (!gardensCollection) {
      return res.status(500).json({ error: "Database not running" });
    }

    const userId = req.headers["user-id"];
    if (!userId) {
      return res.status(401).json({ error: "User ID missing" });
    }

    const gardens = await gardensCollection.find({ userId: userId }).toArray();
    console.log("Fetching gardens for user:", userId);
    res.json(gardens);
  } catch (err) {
    console.error("Error fetching gardens:", err);
    res.status(500).json({ error: "Failed to fetch gardens" });
  }
});

// Route: create new garden
app.post("/gardens", async (req, res) => {
  try {
    if (!gardensCollection) {
      return res.status(500).json({ error: "Database not running" });
    }

    const { name, userId } = req.body;

    if (!name || !userId) {
      return res
        .status(400)
        .json({ error: "Garden name and user ID are required" });
    }

    const newGarden = {
      name: name,
      userId: userId,
    };

    const result = await gardensCollection.insertOne(newGarden);
    res.status(201).json({
      message: "Garden created successfully",
      garden: { _id: result.insertedId, ...newGarden },
    });
  } catch (err) {
    console.error("Error creating garden:", err);
    res.status(500).json({ error: "Failed to create garden" });
  }
});

// Route: delete garden
app.delete("/gardens/:id", async (req, res) => {
  try {
    if (!gardensCollection || !tasksCollection) {
      return res.status(500).json({ error: "Database not running" });
    }

    const { id } = req.params;
    const userId = req.headers["user-id"];

    if (!userId) {
      return res.status(401).json({ error: "User ID missing" });
    }

    // Delete all tasks from  the garden
    const tasksDeleteResult = await tasksCollection.deleteMany({
      gardenId: id,
      userId: userId,
    });

    // Then delete the garden
    const result = await gardensCollection.deleteOne({
      _id: new ObjectId(id),
      userId: userId, // Ensure user can only delete their own gardens
    });

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ error: "Garden not found or access denied" });
    }

    res.json({ message: "Garden deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete garden" });
  }
});

// Route: get tasks for a garden
app.get("/tasks", async (req, res) => {
  try {
    if (!tasksCollection) {
      return res.status(500).json({ error: "Database not running" });
    }

    const gardenId = req.headers["garden-id"];
    const userId = req.headers["user-id"];

    if (!gardenId || !userId) {
      return res.status(401).json({ error: "Garden ID or User ID missing" });
    }

    const tasks = await tasksCollection
      .find({
        gardenId: gardenId,
        userId: userId,
      })
      .toArray();

    console.log("Fetching tasks for garden:", gardenId);
    res.json(tasks);
  } catch (err) {
    console.error("Error fetching tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Route: create new task
app.post("/tasks", async (req, res) => {
  try {
    if (!tasksCollection) {
      return res.status(500).json({ error: "Database not running" });
    }

    const { name, gardenId, userId, status } = req.body;

    const newTask = {
      name: name,
      gardenId: gardenId,
      userId: userId,
      status: status || "todo",
    };

    const result = await tasksCollection.insertOne(newTask);
    res.status(201).json({
      task: { _id: result.insertedId, ...newTask },
    });
  } catch (err) {
    console.error("Error creating task:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Route: delete task
app.delete("/tasks/:id", async (req, res) => {
  try {
    if (!tasksCollection) {
      return res.status(500).json({ error: "Database not running" });
    }

    const { id } = req.params;
    const userId = req.headers["user-id"];

    if (!userId) {
      return res.status(401).json({ error: "User ID missing" });
    }

    const result = await tasksCollection.deleteOne({
      _id: new ObjectId(id),
      userId: userId, // user can only delete their own tasks
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Route: update task status
app.put("/tasks/:id", async (req, res) => {
  try {
    if (!tasksCollection) {
      return res.status(500).json({ error: "Database not running" });
    }

    const { id } = req.params;
    const { status } = req.body;
    const userId = req.headers["user-id"];

    if (!userId) {
      return res.status(401).json({ error: "User ID missing" });
    }

    const result = await tasksCollection.updateOne(
      { _id: new ObjectId(id), userId: userId },
      { $set: { status: status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json({ message: "Task status updated successfully" });
  } catch (err) {
    console.error("Error updating task status:", err);
    res.status(500).json({ error: "Failed to update task status" });
  }
});

// Start server
const PORT = 3000;
app.listen(PORT, async () => {
  await connectDB();
  console.log(`http://localhost:${PORT}`);
});
