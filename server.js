// server.js - Task Board Monolithic Application

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database connection
const db = new sqlite3.Database('./database/tasks.db', (err) => {
    if (err) console.error('Error connecting to database:', err.message);
    else console.log('✅ Connected to SQLite database');
});

// =====================
// API ROUTES
// =====================

// Get all tasks
app.get('/api/tasks', (req, res) => {
    const sql = 'SELECT * FROM tasks ORDER BY created_at DESC';
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch tasks' });
        res.json({ tasks: rows });
    });
});

// Get single task by ID
app.get('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM tasks WHERE id = ?';
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch task' });
        if (!row) return res.status(404).json({ error: 'Task not found' });
        res.json({ task: row });
    });
});

// Create task
app.post('/api/tasks', (req, res) => {
    const { title, description, priority } = req.body;
    if (!title || title.trim() === '') return res.status(400).json({ error: 'Title is required' });

    const sql = `INSERT INTO tasks (title, description, status, priority, created_at) VALUES (?, ?, 'TODO', ?, ?)`;
    const createdAt = new Date().toISOString();

    db.run(sql, [title, description || '', priority || 'MEDIUM', createdAt], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to create task' });

        // คืน object task เต็มให้ frontend
        const newTask = {
            id: this.lastID,
            title: title,
            description: description || '',
            status: 'TODO',
            priority: priority || 'MEDIUM',
            created_at: createdAt
        };

        res.status(201).json({ message: 'Task created successfully', task: newTask });
    });
});


// Update task
app.put('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;

    const updates = [];
    const values = [];
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (priority !== undefined) { updates.push('priority = ?'); values.push(priority); }
    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
    values.push(id);

    db.run(sql, values, function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update task' });
        if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task updated successfully' });
    });
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM tasks WHERE id = ?';
    db.run(sql, [id], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to delete task' });
        if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted successfully' });
    });
});

// Update task status
app.patch('/api/tasks/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const sql = 'UPDATE tasks SET status = ? WHERE id = ?';
    db.run(sql, [status, id], function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update task status' });
        if (this.changes === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task status updated successfully' });
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Task Board application started`);
    console.log(`📊 Architecture: Monolithic`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) console.error('Error closing database:', err.message);
        else console.log('✅ Database connection closed');
        process.exit(0);
    });
});
