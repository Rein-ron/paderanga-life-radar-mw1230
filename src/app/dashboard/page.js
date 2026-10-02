"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const blankForm = { title: "", date: "", type: "Bill", amount: "", priority: "Medium" };
function formatDate(date) {
    if (!date) return "No date";
    const parsedDate = new Date(`${String(date).slice(0, 10)}T12:00:00`);
    return Number.isNaN(parsedDate.getTime()) ? "No date" : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parsedDate);
}

function formatAmount(amount) {
    return amount ? `$${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "No amount";
}

export default function Dashboard() {
    const [reminders, setReminders] = useState([]);
    const [filter, setFilter] = useState("All");
    const [form, setForm] = useState(blankForm);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/reminders").then((response) => response.ok ? response.json() : Promise.reject()).then(setReminders).catch(() => setReminders([]));
    }, []);

    const visibleReminders = useMemo(() => {
        const filtered = filter === "All" ? reminders : reminders.filter((reminder) => reminder.type === filter);
        return filtered.filter((reminder) => !reminder.done).sort((a, b) => a.date.localeCompare(b.date));
    }, [filter, reminders]);
    const openCount = reminders.filter((reminder) => !reminder.done).length;
    const totalDue = reminders.filter((reminder) => !reminder.done).reduce((sum, reminder) => sum + Number(reminder.amount || 0), 0);

    async function saveReminder(event) {
        event.preventDefault();
        if (!form.title.trim() || !form.date) return;
        const existing = reminders.find((item) => item.id === editingId);
        const reminder = { ...existing, ...form, amount: Number(form.amount || 0), category: existing?.category || "Personal", description: existing?.description || null, type: form.type, done: existing?.done || false, status: existing?.status || "Pending" };
        setError("");
        try {
            const response = await fetch("/api/reminders", {
                method: editingId === null ? "POST" : "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingId === null ? reminder : { ...reminder, id: editingId }),
            });
            if (!response.ok) throw new Error("Could not save this reminder.");
            if (editingId === null) {
                const saved = await response.json();
                setReminders((current) => [...current, { ...reminder, id: saved.id }]);
            } else {
                setReminders((current) => current.map((item) => item.id === editingId ? { ...item, ...reminder } : item));
            }
        } catch (saveError) {
            setError(saveError.message || "Could not save this reminder.");
            return;
        }
        setForm(blankForm);
        setEditingId(null);
        setShowForm(false);
    }

    function openNewReminder() {
        setEditingId(null);
        setForm(blankForm);
        setError("");
        setShowForm(true);
    }

    function editReminder(reminder) {
        setEditingId(reminder.id);
        setForm({ title: reminder.title, date: String(reminder.date).slice(0, 10), type: reminder.type || "Bill", amount: reminder.amount ?? "", priority: reminder.priority || "Medium" });
        setError("");
        setShowForm(true);
    }

    async function toggleReminder(reminder) {
        const done = !reminder.done;
        const updated = { ...reminder, date: String(reminder.date).slice(0, 10), done, status: done ? "Completed" : "Pending" };
        setError("");
        try {
            const response = await fetch("/api/reminders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
            if (!response.ok) throw new Error("Could not update this reminder.");
            setReminders((current) => current.map((item) => item.id === reminder.id ? updated : item));
        } catch (updateError) {
            setError(updateError.message || "Could not update this reminder.");
        }
    }

    async function deleteReminder(id) {
        if (!window.confirm("Delete this reminder? This cannot be undone.")) return;
        setError("");
        try {
            const response = await fetch(`/api/reminders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Could not delete this reminder.");
            setReminders((current) => current.filter((reminder) => reminder.id !== id));
        } catch (deleteError) {
            setError(deleteError.message || "Could not delete this reminder.");
        }
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-heading"><div><p className="eyebrow">Today</p><h1>Good morning, Jordan.</h1><p className="subheading">Here&apos;s what needs your attention.</p></div><button className="primary-button" onClick={openNewReminder}>+ Add reminder</button></div>
            <div className="stat-grid"><div className="stat-card stat-card-green"><span className="stat-label">Open reminders</span><strong>{openCount}</strong><span className="stat-note">Across your life</span></div><div className="stat-card"><span className="stat-label">Due this week</span><strong>{formatAmount(totalDue)}</strong><span className="stat-note">Bills and dues</span></div><div className="stat-card stat-card-yellow"><span className="stat-label">Next up</span><strong>{visibleReminders[0] ? formatDate(visibleReminders[0].date) : "All clear"}</strong><span className="stat-note">Your nearest deadline</span></div></div>
            {error && !showForm && <p className="form-error" role="alert">{error}</p>}
            <div className="content-grid"><section className="reminder-panel"><div className="section-heading"><div><h2>Coming up</h2><p>Your next reminders, in order.</p></div><Link href="/reminders" className="text-link">View all <span aria-hidden="true">→</span></Link></div><div className="filter-row" role="tablist" aria-label="Reminder types">{["All", "Bill", "Deadline", "Due"].map((option) => <button className={filter === option ? "filter-active" : ""} key={option} onClick={() => setFilter(option)}>{option}</button>)}</div><div className="reminder-list">{visibleReminders.length === 0 ? <div className="empty-state">Nothing here right now. Your calendar is breathing easy.</div> : visibleReminders.map((reminder, index) => <article className="reminder-row" key={`${reminder.id}-${index}`}><button aria-label={`Mark ${reminder.title} complete`} className="check-button" onClick={() => toggleReminder(reminder)}>{reminder.done ? "✓" : ""}</button><div className="reminder-main"><div className="reminder-title-line"><h3>{reminder.title}</h3><span className={`priority priority-${(reminder.priority || "Medium").toLowerCase()}`}>{reminder.priority || "Medium"}</span></div><p>{reminder.type} · {reminder.category}</p></div><div className="reminder-date"><strong>{formatDate(reminder.date)}</strong><span>{formatAmount(reminder.amount)}</span></div><div className="reminder-actions"><button type="button" className="text-button" onClick={() => editReminder(reminder)}>Edit</button><button type="button" className="delete-button" onClick={() => deleteReminder(reminder.id)}>Delete</button></div></article>)}</div></section></div>
            {showForm && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><form className="quick-form" onSubmit={saveReminder}><div className="modal-heading"><div><span className="eyebrow">{editingId === null ? "New item" : "Update item"}</span><h2>{editingId === null ? "Add a reminder" : "Edit reminder"}</h2></div><button type="button" className="close-button" aria-label="Close form" onClick={() => { setShowForm(false); setEditingId(null); }}>×</button></div>{error && <p className="form-error" role="alert">{error}</p>}<label>What needs doing?<input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Renew passport" required /></label><div className="form-columns"><label>Due date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Bill</option><option>Deadline</option><option>Due</option></select></label></div><div className="form-columns"><label>Amount<input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Optional" /></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label></div><button className="primary-button" type="submit">{editingId === null ? "Save reminder" : "Save changes"}</button></form></div>}
        </div>
    );
}