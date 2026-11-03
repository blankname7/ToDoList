const STORAGE_KEY = 'tasks';
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
                'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

function pad(n) { return String(n).padStart(2, '0'); }

function toKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

function fromKey(key) {
    const parts = key.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDate(key) {
    const text = fromKey(key).toLocaleDateString('ru-RU', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
}

const todayKey = toKey(new Date());

let tasks = [];
try {
    tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
} catch (e) {
    tasks = [];
}
tasks.forEach(function (task) {
    if (!task.date) task.date = todayKey;
});

let view = 'day';
let selectedDate = todayKey;
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

const allButton = document.getElementById('all-button');
const todayButton = document.getElementById('today-button');
const prevMonth = document.getElementById('prev-month');
const nextMonth = document.getElementById('next-month');
const calendarMonth = document.getElementById('calendar-month');
const calendarGrid = document.getElementById('calendar-grid');
const contentTitle = document.getElementById('content-title');
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const dateInput = document.getElementById('task-date');
const container = document.getElementById('task-container');
const emptyMessage = document.getElementById('empty-message');

function renderCalendar() {
    calendarMonth.textContent = MONTHS[calMonth] + ' ' + calYear;
    calendarGrid.innerHTML = '';

    WEEKDAYS.forEach(function (name) {
        const cell = document.createElement('div');
        cell.className = 'calendar-weekday';
        cell.textContent = name;
        calendarGrid.appendChild(cell);
    });

    const offset = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
    for (let i = 0; i < offset; i++) {
        calendarGrid.appendChild(document.createElement('div'));
    }

    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const datesWithTasks = new Set(tasks.map(function (task) { return task.date; }));

    for (let day = 1; day <= daysInMonth; day++) {
        const key = calYear + '-' + pad(calMonth + 1) + '-' + pad(day);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'calendar-day';
        button.dataset.date = key;
        button.textContent = day;

        if (key === todayKey) button.classList.add('today');
        if (view === 'day' && key === selectedDate) button.classList.add('selected');
        if (datesWithTasks.has(key)) button.classList.add('has-tasks');

        calendarGrid.appendChild(button);
    }

    allButton.classList.toggle('active', view === 'all');
}

function createTaskItem(task) {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.dataset.id = task.id;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.done;
    checkbox.setAttribute('aria-label', 'Выполнено');

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = task.text;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'task-delete-button';
    deleteButton.textContent = 'Удалить';

    li.append(checkbox, text, deleteButton);
    return li;
}

function createList(items) {
    const ul = document.createElement('ul');
    ul.className = 'task-list';
    items.forEach(function (task) { ul.appendChild(createTaskItem(task)); });
    return ul;
}

function renderContent() {
    container.innerHTML = '';

    if (view === 'day') {
        contentTitle.textContent = formatDate(selectedDate);
        dateInput.hidden = true;

        const dayTasks = tasks.filter(function (task) { return task.date === selectedDate; });
        if (dayTasks.length > 0) container.appendChild(createList(dayTasks));

        emptyMessage.textContent = 'На этот день задач пока нет';
        emptyMessage.hidden = dayTasks.length > 0;
    } else {
        contentTitle.textContent = 'Все задачи';
        dateInput.hidden = false;

        const groups = {};
        tasks.forEach(function (task) {
            if (!groups[task.date]) groups[task.date] = [];
            groups[task.date].push(task);
        });

        const dates = Object.keys(groups).sort();
        dates.forEach(function (date) {
            const group = document.createElement('section');
            group.className = 'task-group';

            const title = document.createElement('h2');
            title.className = 'task-group-title';
            title.textContent = formatDate(date);

            group.append(title, createList(groups[date]));
            container.appendChild(group);
        });

        emptyMessage.textContent = 'Задач пока нет';
        emptyMessage.hidden = dates.length > 0;
    }
}

function render() {
    renderCalendar();
    renderContent();
}

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const text = input.value.trim();
    if (text === '') return;

    const date = view === 'day' ? selectedDate : (dateInput.value || selectedDate);

    tasks.push({ id: Date.now(), text: text, done: false, date: date });
    saveTasks();
    render();

    input.value = '';
    input.focus();
});

container.addEventListener('click', function (event) {
    const li = event.target.closest('.task-item');
    if (!li) return;

    const id = Number(li.dataset.id);

    if (event.target.classList.contains('task-delete-button')) {
        tasks = tasks.filter(function (task) { return task.id !== id; });
        saveTasks();
        render();
    }

    if (event.target.classList.contains('task-checkbox')) {
        const task = tasks.find(function (t) { return t.id === id; });
        task.done = event.target.checked;
        saveTasks();
        render();
    }
});

calendarGrid.addEventListener('click', function (event) {
    const button = event.target.closest('.calendar-day');
    if (!button) return;

    selectedDate = button.dataset.date;
    view = 'day';
    render();
});

prevMonth.addEventListener('click', function () {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
});

nextMonth.addEventListener('click', function () {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
});

allButton.addEventListener('click', function () {
    view = 'all';
    dateInput.value = selectedDate;
    render();
});

todayButton.addEventListener('click', function () {
    const now = new Date();
    selectedDate = todayKey;
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    view = 'day';
    render();
});

dateInput.value = selectedDate;
render();