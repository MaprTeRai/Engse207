// app.js - Frontend Logic

let allTasks = [];
let currentFilter = 'ALL';

const addTaskForm = document.getElementById('addTaskForm');
const statusFilter = document.getElementById('statusFilter');
const loadingOverlay = document.getElementById('loadingOverlay');

const todoTasks = document.getElementById('todoTasks');
const progressTasks = document.getElementById('progressTasks');
const doneTasks = document.getElementById('doneTasks');

const todoCount = document.getElementById('todoCount');
const progressCount = document.getElementById('progressCount');
const doneCount = document.getElementById('doneCount');

async function fetchTasks() {
    showLoading();
    try {
        const response = await fetch('/api/tasks');
        const data = await response.json();
        allTasks = data.tasks;
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        alert('Failed to load tasks. Please refresh the page.');
    } finally {
        hideLoading();
    }
}

async function createTask(taskData) {
    showLoading();
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        if (!response.ok) throw new Error('Failed to create task');
        const data = await response.json();

        const task = data.task || {};
        task.status = task.status || 'TODO';
        task.created_at = task.created_at || new Date().toISOString();

        allTasks.unshift(data.task);
        renderTasks();
        addTaskForm.reset();
        alert('✅ Task created successfully!');
    } catch (error) {
        console.error('Error creating task:', error);
        alert('❌ Failed to create task. Please try again.');
    } finally {
        hideLoading();
    }
}

async function updateTaskStatus(taskId, newStatus) {
    showLoading();
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) throw new Error('Failed to update task status');
        const task = allTasks.find(t => t.id === taskId);
        if (task) task.status = newStatus;
        renderTasks();
    } catch (error) {
        console.error('Error updating task status:', error);
        alert('❌ Failed to update task status. Please try again.');
    } finally {
        hideLoading();
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    showLoading();
    try {
        const response = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete task');
        allTasks = allTasks.filter(t => t.id !== taskId);
        renderTasks();
        alert('✅ Task deleted successfully!');
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('❌ Failed to delete task. Please try again.');
    } finally {
        hideLoading();
    }
}

function renderTasks() {
    todoTasks.innerHTML = '';
    progressTasks.innerHTML = '';
    doneTasks.innerHTML = '';

    let filteredTasks = allTasks.filter(t => t && t.status);

    if (currentFilter !== 'ALL')
        filteredTasks = allTasks.filter(t => t.status === currentFilter);

    const todo = filteredTasks.filter(t => t.status === 'TODO');
    const progress = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
    const done = filteredTasks.filter(t => t.status === 'DONE');

    todoCount.textContent = todo.length;
    progressCount.textContent = progress.length;
    doneCount.textContent = done.length;

    renderTaskList(todo, todoTasks, 'TODO');
    renderTaskList(progress, progressTasks, 'IN_PROGRESS');
    renderTaskList(done, doneTasks, 'DONE');
}

function renderTaskList(tasks, container, currentStatus) {
    if (tasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No tasks yet</p></div>';
        return;
    }
    tasks.forEach(task => container.appendChild(createTaskCard(task, currentStatus)));
}

function createTaskCard(task, currentStatus) {
    const card = document.createElement('div');
    card.className = 'task-card';
    const priorityClass = `priority-${task.priority.toLowerCase()}`;
    card.innerHTML = `
        <div class="task-header">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <span class="priority-badge ${priorityClass}">${task.priority}</span>
        </div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">Created: ${formatDate(task.created_at)}</div>
        <div class="task-actions">
            ${createStatusButtons(task.id, currentStatus)}
            <button class="btn btn-danger btn-sm" onclick="deleteTask(${task.id})">🗑️ Delete</button>
        </div>
    `;
    return card;
}

function createStatusButtons(taskId, currentStatus) {
    const buttons = [];
    if (currentStatus !== 'TODO') buttons.push(`<button class="btn btn-warning btn-sm" onclick="updateTaskStatus(${taskId}, 'TODO')">← To Do</button>`);
    if (currentStatus !== 'IN_PROGRESS') buttons.push(`<button class="btn btn-primary btn-sm" onclick="updateTaskStatus(${taskId}, 'IN_PROGRESS')">→ In Progress</button>`);
    if (currentStatus !== 'DONE') buttons.push(`<button class="btn btn-success btn-sm" onclick="updateTaskStatus(${taskId}, 'DONE')">→ Done</button>`);
    return buttons.join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showLoading() { loadingOverlay.style.display = 'flex'; }
function hideLoading() { loadingOverlay.style.display = 'none'; }

addTaskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    if (!title) { alert('Please enter a task title'); return; }
    createTask({ title, description, priority });
});

statusFilter.addEventListener('change', (e) => { currentFilter = e.target.value; renderTasks(); });

document.addEventListener('DOMContentLoaded', () => { console.log('🚀 Task Board App Initialized'); fetchTasks(); });

window.updateTaskStatus = updateTaskStatus;
window.deleteTask = deleteTask;
