// CampusConnect demo JavaScript
// Data is saved in this browser, not in MySQL.

const DEMO_EVENTS = [
    {
        id: 1,
        title: "Coding Workshop",
        date: "2026-11-05",
        category: "Technical",
        budget: 5000
    },
    {
        id: 2,
        title: "Cultural Fest",
        date: "2026-11-12",
        category: "Cultural",
        budget: 15000
    },
    {
        id: 3,
        title: "Sports Meet",
        date: "2026-11-20",
        category: "Sports",
        budget: 8000
    }
];

function readData(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getEvents() {
    return readData("cc_events", DEMO_EVENTS);
}

function getRegistrations() {
    return readData("cc_registrations", []);
}

function getExpenses() {
    return readData("cc_expenses", []);
}

function getUser() {
    return readData("cc_user", null);
}

function money(amount) {
    return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function safeText(value) {
    const element = document.createElement("span");
    element.textContent = String(value ?? "");
    return element.innerHTML;
}

function showMessage(id, message) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = message;
        element.hidden = false;
    }
}

function getExpenseTotal(eventId) {
    return getExpenses()
        .filter(expense => Number(expense.eventId) === Number(eventId))
        .reduce((total, expense) => total + Number(expense.amount), 0);
}

function getEventRegistrations(eventId) {
    return getRegistrations()
        .filter(registration => Number(registration.eventId) === Number(eventId));
}

function setupEventsPage() {
    const list = document.getElementById("eventList");
    if (!list) return;

    function renderEvents(search = "") {
        const filtered = getEvents().filter(event =>
            `${event.title} ${event.category}`.toLowerCase()
                .includes(search.toLowerCase())
        );

        list.innerHTML = "";

        if (filtered.length === 0) {
            list.textContent = "No matching events found.";
            return;
        }

        filtered.forEach(event => {
            const card = document.createElement("article");
            card.className = "card";

            const title = document.createElement("h3");
            title.textContent = event.title;

            const category = document.createElement("span");
            category.className = "tag";
            category.textContent = event.category;

            const date = document.createElement("p");
            date.className = "muted";
            date.textContent = "Date: " + event.date;

            const description = document.createElement("p");
            description.className = "muted";
            description.textContent = event.description || "No description available.";

            const count = document.createElement("p");
            count.textContent =
                "Registered: " + getEventRegistrations(event.id).length;

            const button = document.createElement("button");
            button.className = "btn";
            button.textContent = "Register";
            button.addEventListener("click", () => {
                const user = getUser();

                if (!user) {
                    alert("Please log in as a student first.");
                    location.href = "Login.html";
                    return;
                }

                if (user.role !== "student") {
                    alert("Only student accounts can register for events.");
                    return;
                }

                const registrations = getRegistrations();
                const alreadyRegistered = registrations.some(registration =>
                    Number(registration.eventId) === Number(event.id) &&
                    registration.email === user.email
                );

                if (alreadyRegistered) {
                    alert("You have already registered for this event.");
                    return;
                }

                registrations.push({
                    eventId: event.id,
                    eventTitle: event.title,
                    date: event.date,
                    name: user.name,
                    email: user.email
                });

                saveData("cc_registrations", registrations);
                alert("Demo registration successful!");
                renderEvents(search);
            });

            card.append(title, category, date, description, count, button);
            list.appendChild(card);
        });
    }

    renderEvents();

    document.getElementById("eventSearch").addEventListener("input", event => {
        renderEvents(event.target.value);
    });
}

function setupLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const role = document.getElementById("loginRole").value;

        if (!email || !password) {
            showMessage("loginMessage", "Enter your email and password.");
            return;
        }

        // Demo only: this does not verify a real password.
        const accounts = readData("cc_accounts", []);
        const account = accounts.find(item =>
            item.email.toLowerCase() === email.toLowerCase() &&
            item.role === role
        );

        const name = account ? account.name : email.split("@")[0];

        saveData("cc_user", { name, email, role });

        const destinations = {
            student: "StudentDashboard.html",
            coordinator: "CoordinatorDashboard.html",
            faculty: "FacultyDashboard.html"
        };

        location.href = destinations[role];
    });
}

function setupRegistration() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const name = document.getElementById("fullName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const role = document.getElementById("registerRole").value;
        const password = document.getElementById("registerPassword").value;

        if (!name || !email || !password) {
            showMessage("registerMessage", "Please complete all fields.");
            return;
        }

        const accounts = readData("cc_accounts", []);

        if (accounts.some(account =>
            account.email.toLowerCase() === email.toLowerCase()
        )) {
            showMessage("registerMessage", "This demo email is already registered.");
            return;
        }

        // Demo only. Never store plain-text passwords in a real application.
        accounts.push({ name, email, role });
        saveData("cc_accounts", accounts);
        saveData("cc_user", { name, email, role });

        showMessage("registerMessage", "Demo account created. Opening dashboard...");

        setTimeout(() => {
            const destinations = {
                student: "StudentDashboard.html",
                coordinator: "CoordinatorDashboard.html",
                faculty: "FacultyDashboard.html"
            };

            location.href = destinations[role];
        }, 600);
    });
}

function setupStudentDashboard() {
    const table = document.getElementById("studentRegistrations");
    if (!table) return;

    const user = getUser();

    if (user) {
        document.getElementById("welcomeText").textContent =
            "Welcome, " + user.name + "! Here are your campus activities.";
    }

    const registrations = getRegistrations().filter(registration =>
        user && registration.email === user.email
    );

    document.getElementById("studentEventCount").textContent = getEvents().length;
    document.getElementById("studentRegCount").textContent = registrations.length;
    document.getElementById("studentEmpty").hidden = registrations.length > 0;

    table.innerHTML = "";

    registrations.forEach(registration => {
        const row = table.insertRow();
        [registration.eventTitle, registration.date, "Registered"].forEach(value => {
            row.insertCell().textContent = value;
        });
    });
}

function setupCoordinatorDashboard() {
    const createForm = document.getElementById("createEventForm");
    if (!createForm) return;

    createForm.addEventListener("submit", event => {
        event.preventDefault();

        const events = getEvents();
        const newEvent = {
            id: Date.now(),
            title: document.getElementById("newEventTitle").value.trim(),
            description: document.getElementById("newEventDescription").value.trim(),
            date: document.getElementById("newEventDate").value,
            category: document.getElementById("newEventCategory").value,
            budget: Number(document.getElementById("newEventBudget").value)
        };

        if (!newEvent.title || !newEvent.date || newEvent.budget < 0) {
            showMessage("createEventMessage", "Enter valid event details.");
            return;
        }

        events.push(newEvent);
        saveData("cc_events", events);
        createForm.reset();
        document.getElementById("newEventBudget").value = "0";

        showMessage("createEventMessage", "Event added to this browser's demo data.");
        renderCoordinatorDashboard();
    });

    const expenseForm = document.getElementById("expenseForm");

    expenseForm.addEventListener("submit", event => {
        event.preventDefault();

        const eventId = Number(document.getElementById("expenseEvent").value);
        const description = document.getElementById("expenseDescription").value.trim();
        const amount = Number(document.getElementById("expenseAmount").value);
        const selectedEvent = getEvents().find(item => item.id === eventId);

        if (!selectedEvent || !description || amount <= 0) {
            showMessage("expenseMessage", "Enter a valid event, description and amount.");
            return;
        }

        if (getExpenseTotal(eventId) + amount > Number(selectedEvent.budget)) {
            showMessage("expenseMessage", "This expense exceeds the allocated demo budget.");
            return;
        }

        const expenses = getExpenses();
        expenses.push({ eventId, description, amount });
        saveData("cc_expenses", expenses);

        expenseForm.reset();
        showMessage("expenseMessage", "Expense recorded in the browser demo.");
        renderCoordinatorDashboard();
    });

    document.getElementById("participantEvent").addEventListener("change", renderParticipants);
    renderCoordinatorDashboard();
}

function renderCoordinatorDashboard() {
    const events = getEvents();
    const registrations = getRegistrations();

    document.getElementById("coordEventCount").textContent = events.length;
    document.getElementById("coordRegCount").textContent = registrations.length;

    const totalBalance = events.reduce((total, event) =>
        total + Number(event.budget) - getExpenseTotal(event.id), 0);

    document.getElementById("coordBalance").textContent = money(totalBalance);

    const eventTable = document.getElementById("coordinatorEventTable");
    eventTable.innerHTML = "";

    events.forEach(event => {
        const row = eventTable.insertRow();

        [
            event.title,
            event.date,
            getEventRegistrations(event.id).length,
            money(event.budget),
            money(getExpenseTotal(event.id))
        ].forEach(value => {
            row.insertCell().textContent = value;
        });

        const actionCell = row.insertCell();
        const deleteButton = document.createElement("button");

        deleteButton.className = "btn";
        deleteButton.style.background = "#d9534f";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            const confirmed = confirm(
                `Delete "${event.title}"? Its registrations and expenses will also be removed from this demo.`
            );

            if (!confirmed) return;

            saveData(
                "cc_events",
                getEvents().filter(item => item.id !== event.id)
            );

            saveData(
                "cc_registrations",
                getRegistrations().filter(
                    item => Number(item.eventId) !== Number(event.id)
                )
            );

            saveData(
                "cc_expenses",
                getExpenses().filter(
                    item => Number(item.eventId) !== Number(event.id)
                )
            );

            renderCoordinatorDashboard();
        });

        actionCell.appendChild(deleteButton);
    });

    ["expenseEvent", "participantEvent"].forEach(id => {
        const select = document.getElementById(id);
        const previousValue = select.value;

        select.innerHTML = "";

        events.forEach(event => {
            const option = document.createElement("option");
            option.value = event.id;
            option.textContent = event.title;
            select.appendChild(option);
        });

        if (events.some(event => String(event.id) === previousValue)) {
            select.value = previousValue;
        }
    });

    renderParticipants();
}

function renderParticipants() {
    const select = document.getElementById("participantEvent");
    const table = document.getElementById("participantTable");

    if (!select || !table) return;

    const eventId = Number(select.value);
    const registrations = getEventRegistrations(eventId);

    table.innerHTML = "";

    registrations.forEach(registration => {
        const row = table.insertRow();
        [
            registration.eventTitle,
            registration.name,
            registration.email
        ].forEach(value => row.insertCell().textContent = value);
    });
}

function setupFacultyDashboard() {
    const table = document.getElementById("facultyEventTable");
    if (!table) return;

    const events = getEvents();
    const registrations = getRegistrations();
    const expenses = getExpenses();

    document.getElementById("facultyEventCount").textContent = events.length;
    document.getElementById("facultyRegCount").textContent = registrations.length;
    document.getElementById("facultyExpenses").textContent =
        money(expenses.reduce((sum, expense) => sum + Number(expense.amount), 0));

    table.innerHTML = "";

    events.forEach(event => {
        const expenseTotal = getExpenseTotal(event.id);
        const row = table.insertRow();

        [
            event.title,
            event.date,
            getEventRegistrations(event.id).length,
            money(event.budget),
            money(expenseTotal),
            money(Number(event.budget) - expenseTotal)
        ].forEach(value => row.insertCell().textContent = value);
    });

    const expenseTable = document.getElementById("facultyExpenseTable");
    expenseTable.innerHTML = "";

    expenses.forEach(expense => {
        const event = events.find(item => item.id === expense.eventId);
        const row = expenseTable.insertRow();

        [
            event ? event.title : "Unknown event",
            expense.description,
            money(expense.amount)
        ].forEach(value => row.insertCell().textContent = value);
    });
}

function setupLogout() {
    document.querySelectorAll("[data-logout]").forEach(link => {
        link.addEventListener("click", event => {
            event.preventDefault();
            localStorage.removeItem("cc_user");
            location.href = "Login.html";
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    setupEventsPage();
    setupLogin();
    setupRegistration();
    setupStudentDashboard();
    setupCoordinatorDashboard();
    setupFacultyDashboard();
    setupLogout();
});