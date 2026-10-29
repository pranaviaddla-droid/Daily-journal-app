const API = "/api";
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let selectedMood = "Calm";
let entries = [];
let pendingDeleteId = null;

const moodEmoji = { Calm: "😌", Happy: "😊", Grateful: "💛", Anxious: "🌧️", Tired: "😴" };
const dateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const prettyDate = (value, options = { year: "numeric", month: "short", day: "numeric" }) => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, options);
};
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong. Please try again.");
  return body;
}

function setMessage(message, type = "success") {
  const element = $("#form-message");
  element.textContent = message;
  element.className = `form-message ${type}`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function setMood(mood) {
  selectedMood = mood;
  $$(".mood-option").forEach((button) => {
    const active = button.dataset.mood === mood;
    button.classList.toggle("selected", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function resetEditor() {
  $("#entry-form").reset();
  setMood("Calm");
  $("#editor-heading").textContent = "A page for today";
  $("#editor-subtitle").textContent = "Your thoughts don't have to be perfect.";
  $("#save-btn").innerHTML = "<span>↗</span> Save entry";
  $("#save-btn").dataset.editId = "";
  $("#entry-date").textContent = "TODAY";
  setMessage("");
}

function editEntry(id) {
  const entry = entries.find((item) => item.id === id);
  if (!entry) return;
  $("#entry-title").value = entry.title || "";
  $("#entry-content").value = entry.content;
  setMood(entry.mood);
  $("#editor-heading").textContent = "Edit your reflection";
  $("#editor-subtitle").textContent = `Originally written ${prettyDate(entry.entry_date)}.`;
  $("#save-btn").innerHTML = "<span>✓</span> Update entry";
  $("#save-btn").dataset.editId = entry.id;
  $("#entry-date").textContent = prettyDate(entry.entry_date).toUpperCase();
  $("#entry-form").scrollIntoView({ behavior: "smooth", block: "center" });
  $("#entry-title").focus({ preventScroll: true });
}

function renderEntries() {
  const query = $("#search-input").value.trim().toLowerCase();
  const filtered = entries.filter((entry) =>
    `${entry.title || ""} ${entry.content} ${entry.mood} ${entry.entry_date}`.toLowerCase().includes(query)
  );
  const list = $("#entries-list");
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><strong>${query ? "No matching pages" : "Your story starts here."}</strong>${query ? "Try a different search term." : "Write your first reflection above and it will appear here."}</div>`;
    return;
  }
  list.innerHTML = filtered.map((entry) => {
    const title = entry.title?.trim() || "Untitled reflection";
    const preview = entry.content.length > 190 ? `${entry.content.slice(0, 190)}…` : entry.content;
    return `<article class="entry-card">
      <div class="entry-card-top"><div><h3>${escapeHTML(title)}</h3><div class="entry-meta">${escapeHTML(prettyDate(entry.entry_date))} · ${entry.content.length} characters</div></div><span class="mood-chip">${moodEmoji[entry.mood] || "✦"} ${escapeHTML(entry.mood)}</span></div>
      <p class="entry-preview">${escapeHTML(preview)}</p>
      <div class="entry-card-actions"><small>Saved in your journal</small><div><button class="text-btn" data-edit="${escapeHTML(entry.id)}">Edit</button><button class="text-btn danger" data-delete="${escapeHTML(entry.id)}">Delete</button></div></div>
    </article>`;
  }).join("");
}

function updateStats() {
  $("#stat-total").textContent = entries.length;
  $("#insight-total").textContent = entries.length;
  const counts = {};
  entries.forEach((entry) => { counts[entry.mood] = (counts[entry.mood] || 0) + 1; });
  const mostUsed = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  $("#stat-mood").textContent = mostUsed === "—" ? "—" : `${moodEmoji[mostUsed] || ""} ${mostUsed}`;
  $("#insight-mood").textContent = mostUsed;
  const today = new Date();
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  $("#insight-month").textContent = entries.filter((entry) => entry.entry_date.startsWith(month)).length;
  const days = new Set(entries.map((entry) => entry.entry_date));
  let streak = 0;
  const cursor = new Date();
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  $("#stat-streak").textContent = streak;
}

async function loadEntries() {
  $("#entries-list").innerHTML = '<div class="loading-state">Loading your journal…</div>';
  try {
    const data = await api("/entries");
    entries = data.entries || [];
    renderEntries();
    updateStats();
  } catch (error) {
    $("#entries-list").innerHTML = `<div class="empty-state"><strong>Couldn't load your journal</strong>${escapeHTML(error.message)}<br><br><button class="primary-btn" id="retry-load">Try again</button></div>`;
  }
}

async function saveEntry(event) {
  event.preventDefault();
  const title = $("#entry-title").value.trim();
  const content = $("#entry-content").value.trim();
  if (!content) {
    setMessage("Please write a few words before saving.", "error");
    $("#entry-content").focus();
    return;
  }
  const button = $("#save-btn");
  const editId = button.dataset.editId;
  button.disabled = true;
  button.textContent = editId ? "Updating…" : "Saving…";
  try {
    if (editId) {
      await api(`/entries/${encodeURIComponent(editId)}`, { method: "PUT", body: JSON.stringify({ title, content, mood: selectedMood }) });
      showToast("Your reflection was updated.");
    } else {
      await api("/entries", { method: "POST", body: JSON.stringify({ title, content, mood: selectedMood, entry_date: dateKey() }) });
      showToast("Your reflection was saved.");
    }
    resetEditor();
    await loadEntries();
  } catch (error) {
    setMessage(error.message, "error");
    button.innerHTML = editId ? "<span>✓</span> Update entry" : "<span>↗</span> Save entry";
  } finally {
    button.disabled = false;
  }
}

function showView(view) {
  const journal = view === "journal";
  $("#journal-view").classList.toggle("hidden", !journal);
  $("#insights-view").classList.toggle("hidden", journal);
  $$(".nav-item").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  $("#crumb-title").textContent = journal ? "My journal" : "Reflections";
}

function init() {
  const now = new Date();
  $("#today-date").textContent = now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  $("#date-label").textContent = now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
  $("#year").textContent = now.getFullYear();

  $$(".mood-option").forEach((button) => button.addEventListener("click", () => setMood(button.dataset.mood)));
  $$(".nav-item").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));
  $("#back-to-write").addEventListener("click", () => showView("journal"));
  $("#today-btn").addEventListener("click", () => { showView("journal"); resetEditor(); window.scrollTo({ top: 0, behavior: "smooth" }); });
  $("#entry-form").addEventListener("submit", saveEntry);
  $("#search-input").addEventListener("input", renderEntries);
  $("#entries-list").addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-edit]");
    const deleteButton = event.target.closest("[data-delete]");
    const retryButton = event.target.closest("#retry-load");
    if (editButton) editEntry(editButton.dataset.edit);
    if (retryButton) loadEntries();
    if (deleteButton) {
      pendingDeleteId = deleteButton.dataset.delete;
      $("#delete-dialog").showModal();
    }
  });
  $("#confirm-delete").addEventListener("click", async (event) => {
    if (!pendingDeleteId) return;
    event.preventDefault();
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await api(`/entries/${encodeURIComponent(pendingDeleteId)}`, { method: "DELETE" });
      $("#delete-dialog").close();
      showToast("Entry deleted.");
      if ($("#save-btn").dataset.editId === pendingDeleteId) resetEditor();
      pendingDeleteId = null;
      await loadEntries();
    } catch (error) {
      showToast(error.message);
    } finally {
      button.disabled = false;
    }
  });
  $("#delete-dialog").addEventListener("close", () => { pendingDeleteId = null; });
  loadEntries();
}
document.addEventListener("DOMContentLoaded", init);
