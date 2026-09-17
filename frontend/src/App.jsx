import { useEffect, useState } from "react";

function App() {
  const [tasks, setTasks] = useState([]);

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("taskflow-user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [page, setPage] = useState("Dashboard");

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("Other");
  const [dueDate, setDueDate] = useState("");

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("taskflow-theme") === "dark"
  );

 const API_URL = "https://taskflow-n3s9.onrender.com/api/tasks";

  /* =========================================
     THEME
     ========================================= */

  useEffect(() => {
    localStorage.setItem(
      "taskflow-theme",
      darkMode ? "dark" : "light"
    );
  }, [darkMode]);

  /* =========================================
     LOAD TASKS
     ========================================= */

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    fetch(`${API_URL}?userId=${user.id}`)
      .then((response) => response.json())
      .then((data) => setTasks(data))
      .catch((error) =>
        console.error("Error loading tasks:", error)
      );
  }, [user]);

  /* =========================================
     AUTHENTICATION
     ========================================= */

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (authMode === "signup" && !authName.trim()) {
      setAuthError("Please enter your name");
      return;
    }

    if (!authEmail.trim() || !authPassword) {
      setAuthError("Please enter your email and password");
      return;
    }

    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "signup"
          ? "https://taskflow-n3s9.onrender.com/api/auth/signup"
          : "https://taskflow-n3s9.onrender.com/api/auth/login";  

      const body =
        authMode === "signup"
          ? {
              name: authName,
              email: authEmail,
              password: authPassword,
            }
          : {
              email: authEmail,
              password: authPassword,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      localStorage.setItem("taskflow-user", JSON.stringify(data.user));
      setUser(data.user);
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthError("");
    } catch (error) {
      console.error("Authentication error:", error);
      setAuthError(error.message || "Something went wrong");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("taskflow-user");
    setUser(null);
    setPage("Dashboard");
    setShowForm(false);
  };


  /* =========================================
     RESET FORM
     ========================================= */

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setCategory("Other");
    setDueDate("");
    setEditingTask(null);
    setShowForm(false);
  };

  /* =========================================
     ADD TASK
     ========================================= */

  const addTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    const newTask = {
      userId: user.id,
      title,
      description,
      priority,
      category,
      dueDate,
      completed: false,
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });

      const savedTask = await response.json();

      setTasks((currentTasks) => [
        savedTask,
        ...currentTasks,
      ]);

      resetForm();
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task");
    }
  };

  /* =========================================
     DELETE TASK
     ========================================= */

  const deleteTask = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await fetch(`${API_URL}/${id}?userId=${user.id}`, {
        method: "DELETE",
      });

      setTasks((currentTasks) =>
        currentTasks.filter((task) => task._id !== id)
      );
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    }
  };

  /* =========================================
     START EDITING
     ========================================= */

  const startEdit = (task) => {
    setEditingTask(task);

    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority || "Medium");
    setCategory(task.category || "Other");
    setDueDate(task.dueDate || "");

    setShowForm(true);
  };

  /* =========================================
     UPDATE TASK
     ========================================= */

  const updateTask = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    const updatedData = {
      userId: user.id,
      title,
      description,
      priority,
      category,
      dueDate,
      completed: editingTask.completed,
    };

    try {
      const response = await fetch(
        `${API_URL}/${editingTask._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      const updatedTask = await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === editingTask._id
            ? updatedTask
            : task
        )
      );

      resetForm();
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    }
  };

  /* =========================================
     TOGGLE COMPLETED
     ========================================= */

  const toggleTask = async (task) => {
    try {
      const response = await fetch(
        `${API_URL}/${task._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            completed: !task.completed,
          }),
        }
      );

      const updatedTask = await response.json();

      setTasks((currentTasks) =>
        currentTasks.map((item) =>
          item._id === task._id
            ? updatedTask
            : item
        )
      );
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Failed to update task");
    }
  };

  /* =========================================
     OPEN ADD TASK
     ========================================= */

  const openAddTask = () => {
    resetForm();
    setShowForm(true);
    setPage("Dashboard");
  };

  /* =========================================
     DUE DATE STATUS
     ========================================= */

  const getDueStatus = (task) => {
    if (!task.dueDate || task.completed) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(
      `${task.dueDate}T00:00:00`
    );

    due.setHours(0, 0, 0, 0);

    const difference = Math.round(
      (due - today) /
        (1000 * 60 * 60 * 24)
    );

    if (difference < 0) {
      return "Overdue";
    }

    if (difference === 0) {
      return "Due Today";
    }

    return "Upcoming";
  };

  /* =========================================
     SEARCH + STATUS + CATEGORY FILTER
     ========================================= */

  const filteredTasks = tasks.filter((task) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      task.title
        .toLowerCase()
        .includes(searchText) ||
      (task.description || "")
        .toLowerCase()
        .includes(searchText);

    const matchesStatus =
      filter === "All" ||
      (filter === "Completed" && task.completed) ||
      (filter === "Pending" && !task.completed);

    const taskCategory =
      task.category || "Other";

    const matchesCategory =
      categoryFilter === "All Categories" ||
      taskCategory === categoryFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory
    );
  });

  /* =========================================
     STATISTICS
     ========================================= */

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingTasks = tasks.filter(
    (task) => !task.completed
  ).length;

  const highPriorityTasks = tasks.filter(
    (task) =>
      task.priority === "High" &&
      !task.completed
  ).length;

  const completionPercentage =
    totalTasks === 0
      ? 0
      : Math.round(
          (completedTasks / totalTasks) * 100
        );

  /* =========================================
     CATEGORY COUNTS
     ========================================= */

  const workTasks = tasks.filter(
    (task) =>
      (task.category || "Other") === "Work"
  ).length;

  const studyTasks = tasks.filter(
    (task) =>
      (task.category || "Other") === "Study"
  ).length;

  const personalTasks = tasks.filter(
    (task) =>
      (task.category || "Other") === "Personal"
  ).length;

  const shoppingTasks = tasks.filter(
    (task) =>
      (task.category || "Other") === "Shopping"
  ).length;

  const otherTasks = tasks.filter(
    (task) =>
      (task.category || "Other") === "Other"
  ).length;

  /* =========================================
     DISPLAY TASKS
     ========================================= */

  const displayTasks =
    page === "Completed"
      ? filteredTasks.filter(
          (task) => task.completed
        )
      : filteredTasks;

  /* =========================================
     NAVIGATION
     ========================================= */

  const goToPage = (newPage) => {
    setPage(newPage);

    setSearch("");
    setCategoryFilter("All Categories");

    if (newPage === "Dashboard") {
      setFilter("All");
    }

    if (newPage === "My Tasks") {
      setFilter("All");
    }

    if (newPage === "Completed") {
      setFilter("Completed");
    }
  };

  if (!user) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f7fb",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "430px",
            background: "#ffffff",
            border: "1px solid #dce6f3",
            borderRadius: "22px",
            padding: "36px",
            boxSizing: "border-box",
            boxShadow: "0 18px 50px rgba(15, 23, 42, 0.10)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 16px",
                borderRadius: "18px",
                background: "#2563eb",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "34px",
                fontWeight: "800",
                boxShadow: "0 10px 25px rgba(37, 99, 235, 0.28)",
              }}
            >
              ✓
            </div>
            <h1 style={{ margin: 0, color: "#0f172a", fontSize: "32px" }}>
              TaskFlow
            </h1>
            <p style={{ margin: "8px 0 0", color: "#617895" }}>
              {authMode === "login"
                ? "Welcome back! Sign in to continue."
                : "Create your account and get organized."}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              background: "#eef4ff",
              padding: "5px",
              borderRadius: "12px",
              marginBottom: "24px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
              style={{
                flex: 1,
                border: "none",
                borderRadius: "9px",
                padding: "11px",
                cursor: "pointer",
                fontWeight: "700",
                background: authMode === "login" ? "#ffffff" : "transparent",
                color: authMode === "login" ? "#2563eb" : "#64748b",
                boxShadow: authMode === "login" ? "0 2px 8px rgba(15, 23, 42, 0.08)" : "none",
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("signup");
                setAuthError("");
              }}
              style={{
                flex: 1,
                border: "none",
                borderRadius: "9px",
                padding: "11px",
                cursor: "pointer",
                fontWeight: "700",
                background: authMode === "signup" ? "#ffffff" : "transparent",
                color: authMode === "signup" ? "#2563eb" : "#64748b",
                boxShadow: authMode === "signup" ? "0 2px 8px rgba(15, 23, 42, 0.08)" : "none",
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth}>
            {authMode === "signup" && (
              <input
                type="text"
                placeholder="Full name"
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  marginBottom: "13px",
                  border: "1px solid #dce6f3",
                  borderRadius: "10px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            )}

            <input
              type="email"
              placeholder="Email address"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                marginBottom: "13px",
                border: "1px solid #dce6f3",
                borderRadius: "10px",
                fontSize: "14px",
                outline: "none",
              }}
            />

            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "13px 14px",
                marginBottom: "13px",
                border: "1px solid #dce6f3",
                borderRadius: "10px",
                fontSize: "14px",
                outline: "none",
              }}
            />

            {authError && (
              <p
                style={{
                  margin: "4px 0 14px",
                  padding: "10px 12px",
                  background: "#fff1f2",
                  color: "#be123c",
                  borderRadius: "9px",
                  fontSize: "13px",
                }}
              >
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: "100%",
                border: "none",
                borderRadius: "10px",
                padding: "14px",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: "700",
                cursor: authLoading ? "not-allowed" : "pointer",
                opacity: authLoading ? 0.7 : 1,
              }}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                ? "Login to TaskFlow"
                : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`app ${
        darkMode ? "dark-mode" : ""
      }`}
    >
      {/* =====================================
          SIDEBAR
          ===================================== */}

      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">
            ✓
          </div>

          <h2>TaskFlow</h2>
        </div>

        <nav>
          <button
            className={`nav-item ${
              page === "Dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              goToPage("Dashboard")
            }
          >
            📊 Dashboard
          </button>

          <button
            className={`nav-item ${
              page === "My Tasks"
                ? "active"
                : ""
            }`}
            onClick={() =>
              goToPage("My Tasks")
            }
          >
            📝 My Tasks
          </button>

          <button
            className={`nav-item ${
              page === "Completed"
                ? "active"
                : ""
            }`}
            onClick={() =>
              goToPage("Completed")
            }
          >
            ✅ Completed
          </button>

          <button
            className={`nav-item ${
              page === "Settings"
                ? "active"
                : ""
            }`}
            onClick={() =>
              goToPage("Settings")
            }
          >
            ⚙️ Settings
          </button>
        </nav>

        <div className="sidebar-bottom">
          <p>Stay organized.</p>
          <p>Get things done.</p>
          <p style={{ marginTop: "14px", fontWeight: "700" }}>
            👤 {user.name}
          </p>
          <button
            onClick={logout}
            style={{
              marginTop: "8px",
              border: "1px solid rgba(255,255,255,0.25)",
              background: "transparent",
              color: "inherit",
              padding: "8px 12px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* =====================================
          MAIN CONTENT
          ===================================== */}

      <main className="main-content">

        {/* ===================================
            SETTINGS
            =================================== */}

        {page === "Settings" ? (
          <section className="settings-page">

            <div className="header">
              <div>
                <p className="welcome">
                  TaskFlow
                </p>

                <h1>
                  Application Settings
                </h1>

                <p className="subtitle">
                  Manage your TaskFlow
                  preferences.
                </p>
              </div>
            </div>

            <div className="settings-card">

              <h2>
                Application Settings
              </h2>

              <p>
                Your tasks are stored securely
                in MongoDB and synchronized
                with your TaskFlow dashboard.
              </p>

              <div className="settings-row">
                <span>
                  Database
                </span>

                <strong>
                  MongoDB Connected ✓
                </strong>
              </div>

              <div className="settings-row">
                <span>
                  Total Tasks
                </span>

                <strong>
                  {totalTasks}
                </strong>
              </div>

              <div className="settings-row">
                <span>
                  Completed Tasks
                </span>

                <strong>
                  {completedTasks}
                </strong>
              </div>

              <div className="settings-row">
                <span>
                  Theme
                </span>

                <button
                  className="theme-btn"
                  onClick={() =>
                    setDarkMode(
                      !darkMode
                    )
                  }
                >
                  {darkMode
                    ? "☀️ Light Mode"
                    : "🌙 Dark Mode"}
                </button>
              </div>

            </div>

          </section>
        ) : (

          <>
            {/* =================================
                HEADER
                ================================= */}

            <header className="header">

              <div>

                <p className="welcome">
                  Welcome back 👋
                </p>

                <h1>
                  {page === "Completed"
                    ? "Completed Tasks"
                    : page === "My Tasks"
                    ? "My Tasks"
                    : "Task Dashboard"}
                </h1>

                <p className="subtitle">
                  {page === "Completed"
                    ? "Review the tasks you have completed."
                    : "Manage your tasks and stay productive."}
                </p>

              </div>

              <button
                className="add-task-btn"
                onClick={openAddTask}
              >
                + Add Task
              </button>

            </header>

            {/* =================================
                STATISTICS
                ================================= */}

            {page === "Dashboard" && (
              <section className="stats">

                <div className="stat-card">
                  <div>
                    <p>
                      Total Tasks
                    </p>

                    <h2>
                      {totalTasks}
                    </h2>
                  </div>

                  <span>
                    📋
                  </span>
                </div>

                <div className="stat-card">
                  <div>
                    <p>
                      Completed
                    </p>

                    <h2>
                      {completedTasks}
                    </h2>
                  </div>

                  <span>
                    ✅
                  </span>
                </div>

                <div className="stat-card">
                  <div>
                    <p>
                      Pending
                    </p>

                    <h2>
                      {pendingTasks}
                    </h2>
                  </div>

                  <span>
                    ⏳
                  </span>
                </div>

                <div className="stat-card">
                  <div>
                    <p>
                      High Priority
                    </p>

                    <h2>
                      {highPriorityTasks}
                    </h2>
                  </div>

                  <span>
                    🔥
                  </span>
                </div>

              </section>
            )}

            {/* =================================
                PRODUCTIVITY
                ================================= */}

            {page === "Dashboard" && (
              <section className="productivity-section">

                <div className="productivity-card">

                  <div className="productivity-header">

                    <div>
                      <p className="productivity-label">
                        PRODUCTIVITY
                      </p>

                      <h2>
                        Your progress
                      </h2>

                      <p>
                        Keep going! Every
                        completed task moves
                        you forward.
                      </p>
                    </div>

                    <div className="progress-circle">
                      <span>
                        {completionPercentage}%
                      </span>
                    </div>

                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${completionPercentage}%`,
                      }}
                    />
                  </div>

                  <div className="productivity-footer">
                    <span>
                      {completedTasks} completed
                    </span>

                    <span>
                      {pendingTasks} remaining
                    </span>
                  </div>

                </div>

              </section>
            )}

            {/* =================================
                CATEGORY OVERVIEW
                ================================= */}

            {page === "Dashboard" && (
              <section className="category-overview">

                <div className="category-overview-header">

                  <div>
                    <p className="productivity-label">
                      TASK BREAKDOWN
                    </p>

                    <h2>
                      Categories
                    </h2>

                    <p>
                      See how your tasks are
                      organized.
                    </p>
                  </div>

                </div>

                <div className="category-grid">

                  <div className="category-card">
                    <div className="category-icon">
                      💻
                    </div>

                    <div className="category-info">
                      <h3>
                        Work
                      </h3>

                      <p>
                        {workTasks}{" "}
                        {workTasks === 1
                          ? "task"
                          : "tasks"}
                      </p>
                    </div>
                  </div>

                  <div className="category-card">
                    <div className="category-icon">
                      📚
                    </div>

                    <div className="category-info">
                      <h3>
                        Study
                      </h3>

                      <p>
                        {studyTasks}{" "}
                        {studyTasks === 1
                          ? "task"
                          : "tasks"}
                      </p>
                    </div>
                  </div>

                  <div className="category-card">
                    <div className="category-icon">
                      🏠
                    </div>

                    <div className="category-info">
                      <h3>
                        Personal
                      </h3>

                      <p>
                        {personalTasks}{" "}
                        {personalTasks === 1
                          ? "task"
                          : "tasks"}
                      </p>
                    </div>
                  </div>

                  <div className="category-card">
                    <div className="category-icon">
                      🛒
                    </div>

                    <div className="category-info">
                      <h3>
                        Shopping
                      </h3>

                      <p>
                        {shoppingTasks}{" "}
                        {shoppingTasks === 1
                          ? "task"
                          : "tasks"}
                      </p>
                    </div>
                  </div>

                  <div className="category-card">
                    <div className="category-icon">
                      📌
                    </div>

                    <div className="category-info">
                      <h3>
                        Other
                      </h3>

                      <p>
                        {otherTasks}{" "}
                        {otherTasks === 1
                          ? "task"
                          : "tasks"}
                      </p>
                    </div>
                  </div>

                </div>

              </section>
            )}

            {/* =================================
                TASK FORM
                ================================= */}

            {showForm && (
              <section className="task-form-container">

                <h2>
                  {editingTask
                    ? "Edit Task"
                    : "Add New Task"}
                </h2>

                <form
                  onSubmit={
                    editingTask
                      ? updateTask
                      : addTask
                  }
                >

                  <input
                    type="text"
                    placeholder="Task title"
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value
                      )
                    }
                  />

                  <input
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                  />

                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(
                        e.target.value
                      )
                    }
                  >
                    <option value="Low">
                      Low Priority
                    </option>

                    <option value="Medium">
                      Medium Priority
                    </option>

                    <option value="High">
                      High Priority
                    </option>
                  </select>

                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(
                        e.target.value
                      )
                    }
                  >
                    <option value="Work">
                      Work
                    </option>

                    <option value="Study">
                      Study
                    </option>

                    <option value="Personal">
                      Personal
                    </option>

                    <option value="Shopping">
                      Shopping
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) =>
                      setDueDate(
                        e.target.value
                      )
                    }
                  />

                  <div className="form-buttons">

                    <button
                      type="submit"
                      className="save-btn"
                    >
                      {editingTask
                        ? "Update Task"
                        : "Add Task"}
                    </button>

                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={resetForm}
                    >
                      Cancel
                    </button>

                  </div>

                </form>

              </section>
            )}

            {/* =================================
                TASKS SECTION
                ================================= */}

            <section className="tasks-section">

              <div className="tasks-header">

                <div>

                  <h2>
                    {page === "Completed"
                      ? "Completed Tasks"
                      : "My Tasks"}

                    <span
                      style={{
                        marginLeft: "10px",
                        fontSize: "14px",
                        fontWeight: "600",
                        background:
                          darkMode
                            ? "#1e3a8a"
                            : "#e8f0ff",
                        color:
                          darkMode
                            ? "#bfdbfe"
                            : "#2563eb",
                        padding:
                          "5px 10px",
                        borderRadius:
                          "20px",
                        verticalAlign:
                          "middle",
                      }}
                    >
                      {displayTasks.length}
                    </span>
                  </h2>

                  <p>
                    Keep track of everything
                    you need to do.
                  </p>

                </div>

                {/* =================================
                    SEARCH + FILTERS
                    ================================= */}

                <div className="task-controls">

                  <input
                    type="text"
                    placeholder="🔍 Search tasks..."
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                  />

                  <select
                    value={filter}
                    onChange={(e) =>
                      setFilter(
                        e.target.value
                      )
                    }
                  >
                    <option value="All">
                      All
                    </option>

                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Completed">
                      Completed
                    </option>
                  </select>

                  {/* CATEGORY FILTER */}

                  <select
                    value={categoryFilter}
                    onChange={(e) =>
                      setCategoryFilter(
                        e.target.value
                      )
                    }
                  >
                    <option value="All Categories">
                      All Categories
                    </option>

                    <option value="Work">
                      Work
                    </option>

                    <option value="Study">
                      Study
                    </option>

                    <option value="Personal">
                      Personal
                    </option>

                    <option value="Shopping">
                      Shopping
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>

                </div>

              </div>

              {/* =================================
                  TASK LIST
                  ================================= */}

              <div className="task-list">

                {displayTasks.length === 0 ? (

                  <div className="empty-state">

                    <div>
                      📋
                    </div>

                    <h3>
                      No tasks found
                    </h3>

                    <p>
                      Add a new task or change
                      your filters.
                    </p>

                  </div>

                ) : (

                  displayTasks.map((task) => {

                    const dueStatus =
                      getDueStatus(task);

                    return (
                      <div
                        className={`task-card ${
                          task.completed
                            ? "completed-task"
                            : ""
                        }`}
                        key={task._id}
                      >

                        {/* CHECKBOX */}

                        <div className="task-check">

                          <input
                            type="checkbox"
                            checked={
                              task.completed
                            }
                            onChange={() =>
                              toggleTask(task)
                            }
                          />

                        </div>

                        {/* TASK INFORMATION */}

                        <div className="task-info">

                          <h3>
                            {task.title}
                          </h3>

                          {task.description && (
                            <p>
                              {
                                task.description
                              }
                            </p>
                          )}

                          <div className="task-meta">

                            {/* PRIORITY */}

                            <span
                              className={`priority ${
                                task.priority.toLowerCase()
                              }`}
                            >
                              {task.priority}
                            </span>

                            {/* CATEGORY */}

                            <span className="task-category">
                              {task.category ||
                                "Other"}
                            </span>

                            {/* DATE */}

                            {task.dueDate && (
                              <span className="due-date">
                                📅{" "}
                                {task.dueDate}
                              </span>
                            )}

                            {/* DUE STATUS */}

                            {dueStatus && (
                              <span
                                className={`due-status ${dueStatus
                                  .toLowerCase()
                                  .replace(
                                    " ",
                                    "-"
                                  )}`}
                              >
                                {dueStatus ===
                                "Overdue"
                                  ? "⚠️"
                                  : dueStatus ===
                                    "Due Today"
                                  ? "🔔"
                                  : "📆"}{" "}
                                {dueStatus}
                              </span>
                            )}

                          </div>

                        </div>

                        {/* ACTIONS */}

                        <div className="task-actions">

                          <button
                            onClick={() =>
                              startEdit(task)
                            }
                            title="Edit task"
                          >
                            ✏️
                          </button>

                          <button
                            onClick={() =>
                              deleteTask(
                                task._id
                              )
                            }
                            title="Delete task"
                          >
                            🗑️
                          </button>

                        </div>

                      </div>
                    );
                  })
                )}

              </div>

            </section>

          </>
        )}

      </main>
    </div>
  );
}

export default App;