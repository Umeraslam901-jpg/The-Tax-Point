// DOM Elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const taskCount = document.getElementById('taskCount');
const completedCount = document.getElementById('completedCount');
const clearCompleted = document.getElementById('clearCompleted');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

// State
let todos = [];
let currentFilter = 'all';
let editingId = null;

// Local Storage Keys
const STORAGE_KEY = 'todos';
const SETTINGS_KEY = 'todoSettings';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    renderTodos();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTodos();
        });
    });

    clearCompleted.addEventListener('click', clearCompletedTodos);
    exportBtn.addEventListener('click', exportTodos);
    importBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', importTodos);
}

// Add todo
function addTodo() {
    const text = todoInput.value.trim();

    if (text === '') {
        alert('Please enter a task!');
        return;
    }

    if (text.length > 200) {
        alert('Task is too long! Maximum 200 characters.');
        return;
    }

    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    todos.push(todo);
    saveTodos();
    renderTodos();
    todoInput.value = '';
    todoInput.focus();
}

// Toggle todo completion
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        todo.updatedAt = new Date().toISOString();
        saveTodos();
        renderTodos();
    }
}

// Edit todo
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const modal = document.getElementById('editModal') || createEditModal();
    const input = modal.querySelector('.modal-input');
    const saveBtn = modal.querySelector('.modal-btn.save');
    const cancelBtn = modal.querySelector('.modal-btn.cancel');

    input.value = todo.text;
    editingId = id;

    modal.classList.add('show');
    input.focus();

    saveBtn.onclick = () => {
        const newText = input.value.trim();
        if (newText === '') {
            alert('Task cannot be empty!');
            return;
        }
        if (newText.length > 200) {
            alert('Task is too long! Maximum 200 characters.');
            return;
        }
        todo.text = newText;
        todo.updatedAt = new Date().toISOString();
        saveTodos();
        renderTodos();
        modal.classList.remove('show');
        editingId = null;
    };

    cancelBtn.onclick = () => {
        modal.classList.remove('show');
        editingId = null;
    };

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && editingId === id) {
            modal.classList.remove('show');
            editingId = null;
        }
    });
}

// Create edit modal
function createEditModal() {
    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Edit Task</h2>
            <input type="text" class="modal-input" placeholder="Edit your task...">
            <div class="modal-buttons">
                <button class="modal-btn save">Save</button>
                <button class="modal-btn cancel">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Delete todo
function deleteTodo(id) {
    if (confirm('Are you sure you want to delete this task?')) {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
    }
}

// Clear completed todos
function clearCompletedTodos() {
    const completedCount = todos.filter(t => t.completed).length;
    if (completedCount === 0) {
        alert('No completed tasks to clear!');
        return;
    }

    if (confirm(`Clear ${completedCount} completed task(s)?`)) {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        renderTodos();
    }
}

// Render todos
function renderTodos() {
    todoList.innerHTML = '';

    let filtered = todos;
    if (currentFilter === 'active') {
        filtered = todos.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filtered = todos.filter(t => t.completed);
    }

    if (filtered.length === 0) {
        emptyState.classList.add('show');
    } else {
        emptyState.classList.remove('show');
    }

    filtered.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input 
                type="checkbox" 
                class="checkbox" 
                ${todo.completed ? 'checked' : ''}
                onchange="toggleTodo(${todo.id})"
            >
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <div class="todo-actions">
                <button class="btn-small btn-edit" onclick="editTodo(${todo.id})">✎</button>
                <button class="btn-small btn-delete" onclick="deleteTodo(${todo.id})">✕</button>
            </div>
        `;
        todoList.appendChild(li);
    });

    updateStats();
}

// Update statistics
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;

    taskCount.textContent = `${total} task${total !== 1 ? 's' : ''}`;
    completedCount.textContent = `${completed} completed`;
}

// Save todos to local storage
function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// Load todos from local storage
function loadTodos() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            todos = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading todos:', e);
            todos = [];
        }
    }
}

// Export todos as JSON
function exportTodos() {
    const dataStr = JSON.stringify(todos, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Import todos from JSON
function importTodos(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                if (confirm('Replace current tasks with imported tasks?')) {
                    todos = imported;
                    saveTodos();
                    renderTodos();
                    alert('Tasks imported successfully!');
                }
            } else {
                alert('Invalid file format!');
            }
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
    fileInput.value = '';
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
