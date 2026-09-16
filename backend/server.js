const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Task = require("./models/Task");
const User = require("./models/User");

const app = express();

app.use(cors());
app.use(express.json());

// =========================================
// CONNECT TO MONGODB
// =========================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

// =========================================
// TEST ROUTE
// =========================================

app.get("/", (req, res) => {
  res.json({
    message: "TaskFlow Backend is running!",
  });
});

// =========================================
// AUTH - SIGNUP
// =========================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    res.status(500).json({
      message: "Failed to create account",
    });
  }
});

// =========================================
// AUTH - LOGIN
// =========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Failed to login",
    });
  }
});

// =========================================
// TASKS - GET USER TASKS
// =========================================

app.get("/api/tasks", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    const tasks = await Task.find({
      userId: userId,
    }).sort({
      createdAt: -1,
    });

    res.json(tasks);
  } catch (error) {
    console.error("Error getting tasks:", error);

    res.status(500).json({
      message: "Failed to get tasks",
    });
  }
});

// =========================================
// TASKS - ADD
// =========================================

app.post("/api/tasks", async (req, res) => {
  try {
    console.log("Creating task:", req.body);

    const {
      userId,
      title,
      description,
      priority,
      category,
      dueDate,
      completed,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    const task = new Task({
      userId,
      title,
      description: description || "",
      priority: priority || "Medium",
      category: category || "Other",
      dueDate: dueDate || "",
      completed: completed || false,
    });

    const savedTask = await task.save();

    console.log("Saved task:", savedTask);

    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error creating task:", error);

    res.status(400).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
});

// =========================================
// TASKS - UPDATE
// =========================================

app.put("/api/tasks/:id", async (req, res) => {
  try {
    console.log("Updating task:", req.params.id);
    console.log("Update data:", req.body);

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const updateData = {};

    if (req.body.title !== undefined) {
      updateData.title = req.body.title;
    }

    if (req.body.description !== undefined) {
      updateData.description = req.body.description;
    }

    if (req.body.priority !== undefined) {
      updateData.priority = req.body.priority;
    }

    if (req.body.category !== undefined) {
      updateData.category = req.body.category;
    }

    if (req.body.dueDate !== undefined) {
      updateData.dueDate = req.body.dueDate;
    }

    if (req.body.completed !== undefined) {
      updateData.completed = req.body.completed;
    }

    console.log("Final update data:", updateData);

    const updatedTask = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: userId,
      },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: "Task not found or does not belong to this user",
      });
    }

    console.log("Updated task:", updatedTask);

    res.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);

    res.status(400).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
});

// =========================================
// TASKS - DELETE
// =========================================

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        message: "Invalid task ID",
      });
    }

    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: userId,
    });

    if (!deletedTask) {
      return res.status(404).json({
        message: "Task not found or does not belong to this user",
      });
    }

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);

    res.status(400).json({
      message: "Failed to delete task",
    });
  }
});

// =========================================
// START SERVER
// =========================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});