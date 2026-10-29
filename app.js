const API = "http://localhost:8080/api";

googleFormUrl:
document.getElementById("googleFormUrl")?.value.trim() || null

async function apiFetch(path, options = {}) {
    const response = await fetch(`${API}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}


const DEMO_EVENTS = [
    { id: 1, title: "Coding Workshop", date: "2026-11-05", category: "Technical", budget: 5000 },
    { id: 2, title: "Cultural Fest", date: "2026-11-12", category: "Cultural", budget: 15000 },
    { id: 3, title: "Sports Meet", date: "2026-11-20", category: "Sports", budget: 8000 }
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

async function getEventsFromBackend() {
    const response = await fetch(`${API}/events`);

    if (!response.ok) {
        throw new Error("Could not load events from the backend.");
    }

    const data = await response.json();

    return data.map(event => ({
        id: Number(event.eventId ?? event.event_id),
        title: event.title,
        description: event.description,
        date: event.eventDate ?? event.event_date,
        category: event.category || "General",
        budget: Number(event.budget || 0),
        googleFormUrl: event.googleFormUrl ?? event.google_form_url ?? ""
    }));
}

async function getRegistrationsFromBackend() {
    const response = await fetch(`${API}/registrations`);

    if (!response.ok) {
        throw new Error("Could not load registrations from MySQL.");
    }

    return await response.json();
}

async function getExpensesFromBackend() {
    const response = await fetch(`${API}/expenses`);

    if (!response.ok) {
        throw new Error("Could not load expenses from MySQL.");
    }

    const data = await response.json();

    return data.map(expense => ({
        id: Number(expense.expenseId ?? expense.expense_id ?? expense.id),
        eventId: Number(expense.eventId ?? expense.event_id),
        description: expense.description,
        amount: Number(expense.amount || 0),
        createdAt: expense.createdAt ?? expense.created_at ?? ""
    }));
}

async function refreshExpensesFromBackend() {
    const expenses = await getExpensesFromBackend();
    saveData("cc_expenses", expenses);
    return expenses;
}

async function refreshCoordinatorEvents() {
    const events = await getEventsFromBackend();
    saveData("cc_events", events);
    return events;
}

async function refreshRegistrationsFromBackend() {
    const [registrations, events] = await Promise.all([
        getRegistrationsFromBackend(),
        getEventsFromBackend()
    ]);

    const mapped = registrations.map(registration => {
        const event = events.find(
            item => Number(item.id) === Number(registration.eventId)
        );

        return {
            id: registration.registrationId,
            eventId: Number(registration.eventId),
            eventTitle: event ? event.title : "Unknown event",
            date: event ? event.date : "",
            name: registration.name,
            email: registration.email,
            registeredAt: registration.registeredAt
        };
    });

    saveData("cc_registrations", mapped);
    saveData("cc_events", events);

    return mapped;
}

async function createEventOnBackend(event) {
    const response = await fetch(`${API}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: event.title,
            description: event.description,
            eventDate: event.date,
            budget: Number(event.budget || 0),
            googleFormUrl: event.googleFormUrl || null
        })
    });

    if (!response.ok) {
        throw new Error("Could not save event to MySQL.");
    }

    return await response.json();
}

async function createRegistrationOnBackend(registration) {
    const response = await fetch(`${API}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            eventId: Number(registration.eventId),
            name: registration.name,
            email: registration.email
        })
    });

    if (response.status === 409) {
        throw new Error(
            "This email is already registered for this event, or the event ID is invalid."
        );
    }

    if (!response.ok) {
        throw new Error("Could not save registration to MySQL.");
    }

    return await response.json();
}

async function deleteEventOnBackend(eventId) {
    const response = await fetch(`${API}/events/${eventId}`, {
        method: "DELETE"
    });

    if (!response.ok) {
        throw new Error("Could not delete the event from MySQL.");
    }
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
        .filter(registration =>
            Number(registration.eventId) === Number(eventId)
        );
}

// EVENTS PAGE
function setupEventsPage() {
    const list = document.getElementById("eventList");
    if (!list) return;

    const searchInput = document.getElementById("eventSearch");

    async function renderEvents(search = "") {
        list.textContent = "Loading events...";

        try {
            const [events, registrations] = await Promise.all([
                getEventsFromBackend(),
                getRegistrationsFromBackend()
            ]);

            saveData("cc_events", events);

            saveData(
                "cc_registrations",
                registrations.map(registration => {
                    const event = events.find(
                        item => Number(item.id) === Number(registration.eventId)
                    );

                    return {
                        id: registration.registrationId,
                        eventId: Number(registration.eventId),
                        eventTitle: event ? event.title : "Unknown event",
                        date: event ? event.date : "",
                        name: registration.name,
                        email: registration.email
                    };
                })
            );

            const filtered = events.filter(event =>
                `${event.title} ${event.category}`
                    .toLowerCase()
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
                date.textContent = "Date: " + (event.date || "TBA");

                const description = document.createElement("p");
                description.className = "muted";
                description.textContent =
                    event.description || "No description available.";

                const count = document.createElement("p");
                count.textContent =
                    "Registered: " + getEventRegistrations(event.id).length;


                if (event.googleFormUrl) {
                    const formUrl = event.googleFormUrl.trim();

                    // Only allow HTTP or HTTPS links
                    let validFormUrl = false;

                    try {
                        const parsedUrl = new URL(formUrl);
                        validFormUrl =
                            parsedUrl.protocol === "https:" ||
                            parsedUrl.protocol === "http:";
                    } catch {
                        validFormUrl = false;
                    }

                    if (validFormUrl) {
                        const formButton = document.createElement("a");
                        formButton.className = "btn";
                        formButton.textContent = "Register via Google Forms ↗";
                        formButton.href = formUrl;
                        formButton.target = "_blank";
                        formButton.rel = "noopener noreferrer";
                        card.appendChild(formButton);
                    }
                }

                const button = document.createElement("button");
                button.className = "btn";
                button.textContent = "Register";


                button.addEventListener("click", async () => {
                    const user = getUser();

                    if (!user) {
                        alert("Please log in as a student first.");
                        location.href = "Login.html";
                        return;
                    }

                    if (user.role !== "student") {
                        alert("Only student accounts can register.");
                        return;
                    }

                    button.disabled = true;

                    try {
                        await createRegistrationOnBackend({
                            eventId: event.id,
                            name: user.name,
                            email: user.email
                        });

                        await refreshRegistrationsFromBackend();

                        alert("Registration successful! Saved to MySQL.");
                        await renderEvents(search);
                    } catch (error) {
                        alert(error.message);
                    } finally {
                        button.disabled = false;
                    }
                });

                card.append(
                    title, category, date, description, count, button
                );

                list.appendChild(card);
            });
        } catch (error) {
            console.error("Events page error:", error);
            list.textContent = "Could not load events. Check the backend.";
        }
    }

    renderEvents();

    if (searchInput) {
        searchInput.addEventListener("input", event => {
            renderEvents(event.target.value);
        });
    }
}

// LOGIN — DEMO ACCOUNT SYSTEM

async function setupLogin() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const role = document.getElementById("loginRole").value;

        if (!email || !password) {
            showMessage("loginMessage", "Enter your email and password.");
            return;
        }

        try {
            const user = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            // The server decides the user's role.
            if (user.role !== role) {
                await apiFetch("/auth/logout", {
                    method: "POST"
                });

                showMessage(
                    "loginMessage",
                    `This account belongs to the ${user.role} role. Select the correct role.`
                );
                return;
            }

            saveData("cc_user", {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role
            });

            const destinations = {
                student: "StudentDashboard.html",
                coordinator: "CoordinatorDashboard.html",
                faculty: "FacultyDashboard.html"
            };

            location.href = destinations[user.role];
        } catch (error) {
            showMessage("loginMessage", error.message);
        }
    });
}


// REGISTER ACCOUNT — STILL A DEMO


async function setupRegistration() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    form.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("fullName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const role = document.getElementById("registerRole").value;
        const password = document.getElementById("registerPassword").value;

        if (!name || !email || !password) {
            showMessage("registerMessage", "Please complete all fields.");
            return;
        }

        const destinations = {
            student: "StudentDashboard.html",
            coordinator: "CoordinatorDashboard.html",
            faculty: "FacultyDashboard.html"
        };

        try {
            // Create the account
            const result = await apiFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify({ name, email, password, role })
            });

            // Log in automatically
            const user = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            // Save the logged-in user's details
            saveData("cc_user", {
                userId: user.userId,
                name: user.name,
                email: user.email,
                role: user.role
            });

            // Open the dashboard matching the account's actual role
            const destination = destinations[user.role];

            if (!destination) {
                throw new Error("Unknown account role.");
            }

            location.href = destination;

        } catch (error) {
            showMessage(
                "registerMessage",
                error.message || "Registration failed. Please try again."
            );
        }
    });
}



// STUDENT DASHBOARD
async function setupStudentDashboard() {
    const table = document.getElementById("studentRegistrations");
    if (!table) return;

    const user = getUser();

    if (user) {
        document.getElementById("welcomeText").textContent =
            "Welcome, " + user.name + "! Here are your campus activities.";
    }

    try {
        const [events, registrations] = await Promise.all([
            getEventsFromBackend(),
            refreshRegistrationsFromBackend()
        ]);

        const myRegistrations = registrations.filter(registration =>
            user &&
            registration.email.toLowerCase() === user.email.toLowerCase()
        );

        document.getElementById("studentEventCount").textContent =
            events.length;

        document.getElementById("studentRegCount").textContent =
            myRegistrations.length;

        document.getElementById("studentEmpty").hidden =
            myRegistrations.length > 0;

        table.innerHTML = "";

        myRegistrations.forEach(registration => {
            const row = table.insertRow();

            [
                registration.eventTitle,
                registration.date || "TBA",
                "Registered"
            ].forEach(value => {
                row.insertCell().textContent = value;
            });
        });
    } catch (error) {
        console.error("Student dashboard error:", error);
        showMessage(
            "studentEmpty",
            "Could not load registrations. Check the backend."
        );
    }
}

// COORDINATOR DASHBOARD
function setupCoordinatorDashboard() {
    const createForm = document.getElementById("createEventForm");
    if (!createForm) return;

    createForm.addEventListener("submit", async event => {
        event.preventDefault();


        const newEvent = {
            title: document.getElementById("newEventTitle").value.trim(),
            description: document.getElementById("newEventDescription").value.trim(),
            date: document.getElementById("newEventDate").value,
            category: document.getElementById("newEventCategory").value,
            budget: Number(document.getElementById("newEventBudget").value),
            googleFormUrl: document.getElementById("googleFormUrl").value.trim()
        };


        if (!newEvent.title || !newEvent.date || newEvent.budget < 0) {
            showMessage("createEventMessage", "Enter valid event details.");
            return;
        }

        try {
            await createEventOnBackend(newEvent);
            await refreshCoordinatorEvents();
            await refreshRegistrationsFromBackend();

            createForm.reset();
            document.getElementById("newEventBudget").value = "0";

            showMessage(
                "createEventMessage",
                "Event saved successfully to MySQL!"
            );

            renderCoordinatorDashboard();
        } catch (error) {
            console.error("Create event error:", error);
            showMessage(
                "createEventMessage",
                "Could not save event: " + error.message
            );
        }
    });

    const expenseForm = document.getElementById("expenseForm");

    if (expenseForm) {
        expenseForm.addEventListener("submit", async event => {
            event.preventDefault();

            const eventId = Number(
                document.getElementById("expenseEvent").value
            );

            const description = document
                .getElementById("expenseDescription").value.trim();

            const amount = Number(
                document.getElementById("expenseAmount").value
            );

            const selectedEvent = getEvents().find(
                item => Number(item.id) === eventId
            );

            if (
                !selectedEvent ||
                !description ||
                !Number.isFinite(amount) ||
                amount <= 0
            ) {
                showMessage(
                    "expenseMessage",
                    "Enter a valid event, description and positive amount."
                );
                return;
            }

            try {
                const expenses = await refreshExpensesFromBackend();

                const currentTotal = expenses
                    .filter(expense => Number(expense.eventId) === eventId)
                    .reduce(
                        (total, expense) =>
                            total + Number(expense.amount || 0),
                        0
                    );

                if (
                    currentTotal + amount >
                    Number(selectedEvent.budget || 0)
                ) {
                    showMessage(
                        "expenseMessage",
                        "This expense exceeds the allocated event budget."
                    );
                    return;
                }

                await apiFetch("/expenses", {
                    method: "POST",
                    body: JSON.stringify({
                        eventId,
                        description,
                        amount
                    })
                });

                await refreshExpensesFromBackend();

                expenseForm.reset();

                showMessage(
                    "expenseMessage",
                    "Expense saved successfully to MySQL!"
                );

                renderCoordinatorDashboard();

            } catch (error) {
                console.error("Expense save error:", error);

                showMessage(
                    "expenseMessage",
                    "Could not save expense: " + error.message
                );
            }
        });
    }

    const participantSelect = document.getElementById("participantEvent");

    if (participantSelect) {
        participantSelect.addEventListener("change", renderParticipants);
    }

    Promise.all([
        refreshCoordinatorEvents(),
        refreshRegistrationsFromBackend(),
        refreshExpensesFromBackend()
    ])
        .then(() => renderCoordinatorDashboard())
        .catch(error => {
            console.error("Coordinator dashboard error:", error);
            showMessage(
                "createEventMessage",
                "Could not load data. Check the backend."
            );
        });
}

function renderCoordinatorDashboard() {
    const eventTable = document.getElementById("coordinatorEventTable");
    if (!eventTable) return;

    const events = getEvents();
    const registrations = getRegistrations();

    document.getElementById("coordEventCount").textContent = events.length;
    document.getElementById("coordRegCount").textContent = registrations.length;

    const totalBalance = events.reduce(
        (total, event) =>
            total + Number(event.budget) - getExpenseTotal(event.id),
        0
    );

    document.getElementById("coordBalance").textContent =
        money(totalBalance);

    eventTable.innerHTML = "";

    events.forEach(event => {
        const row = eventTable.insertRow();

        [
            event.title,
            event.date || "TBA",
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

        deleteButton.addEventListener("click", async () => {
            const confirmed = confirm(
                `Delete "${event.title}" from MySQL? Its registrations will also be deleted.`
            );

            if (!confirmed) return;

            deleteButton.disabled = true;

            try {
                await deleteEventOnBackend(event.id);

                saveData(
                    "cc_events",
                    getEvents().filter(item =>
                        Number(item.id) !== Number(event.id)
                    )
                );

                saveData(
                    "cc_expenses",
                    getExpenses().filter(item =>
                        Number(item.eventId) !== Number(event.id)
                    )
                );

                await refreshCoordinatorEvents();
                await refreshRegistrationsFromBackend();

                renderCoordinatorDashboard();

                alert("Event and its registrations deleted from MySQL.");
            } catch (error) {
                console.error("Delete event error:", error);
                alert(error.message);
                deleteButton.disabled = false;
            }
        });

        actionCell.appendChild(deleteButton);
    });

    ["expenseEvent", "participantEvent"].forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

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
        ].forEach(value => {
            row.insertCell().textContent = value || "";
        });
    });
}

// FACULTY DASHBOARD
async function setupFacultyDashboard() {
    const table = document.getElementById("facultyEventTable");
    if (!table) return;

    try {
        await refreshCoordinatorEvents();
        await refreshRegistrationsFromBackend();
        await refreshExpensesFromBackend();

        const events = getEvents();
        const registrations = getRegistrations();
        const expenses = getExpenses();

        document.getElementById("facultyEventCount").textContent =
            events.length;

        document.getElementById("facultyRegCount").textContent =
            registrations.length;

        document.getElementById("facultyExpenses").textContent =
            money(expenses.reduce(
                (sum, expense) => sum + Number(expense.amount),
                0
            ));

        table.innerHTML = "";

        events.forEach(event => {
            const expenseTotal = getExpenseTotal(event.id);
            const row = table.insertRow();

            [
                event.title,
                event.date || "TBA",
                getEventRegistrations(event.id).length,
                money(event.budget),
                money(expenseTotal),
                money(Number(event.budget) - expenseTotal)
            ].forEach(value => {
                row.insertCell().textContent = value;
            });
        });

        const expenseTable = document.getElementById("facultyExpenseTable");

        if (expenseTable) {
            expenseTable.innerHTML = "";

            expenses.forEach(expense => {
                const event = events.find(
                    item => Number(item.id) === Number(expense.eventId)
                );

                const row = expenseTable.insertRow();

                [
                    event ? event.title : "Unknown event",
                    expense.description,
                    money(expense.amount)
                ].forEach(value => {
                    row.insertCell().textContent = value;
                });
            });
        }
    } catch (error) {
        console.error("Faculty dashboard error:", error);
    }
}

// LOGOUT
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
