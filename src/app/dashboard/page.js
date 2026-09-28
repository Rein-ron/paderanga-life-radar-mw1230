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

    useEffect(() => {
        fetch("/api/reminders").then((response) => response.ok ? response.json() : Promise.reject()).then(setReminders).catch(() => setReminders([]));
    }, []);

    const visibleReminders = useMemo(() => {
        const filtered = filter === "All" ? reminders : reminders.filter((reminder) => reminder.type === filter);
        return filtered.filter((reminder) => !reminder.done).sort((a, b) => a.date.localeCompare(b.date));
    }, [filter, reminders]);
    const openCount = reminders.filter((reminder) => !reminder.done).length;
    const totalDue = reminders.filter((reminder) => !reminder.done).reduce((sum, reminder) => sum + Number(reminder.amount || 0), 0);

    async function addReminder(event) {
        event.preventDefault();
        if (!form.title.trim() || !form.date) return;
        const response = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, amount: Number(form.amount || 0), category: "Personal", type: form.type, done: false }) });
        if (!response.ok) return;
        const saved = await response.json();
        setReminders([...reminders, { ...form, id: saved.id, amount: Number(form.amount || 0), category: "Personal", done: false }]);
        setForm(blankForm);
        setShowForm(false);
    }

    function toggleReminder(id) {
        setReminders(reminders.map((reminder) => reminder.id === id ? { ...reminder, done: !reminder.done } : reminder));
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-heading"><div><p className="eyebrow">Today</p><h1>Good morning, Jordan.</h1><p className="subheading">Here&apos;s what needs your attention.</p></div><button className="primary-button" onClick={() => setShowForm(true)}>+ Add reminder</button></div>
            <div className="stat-grid"><div className="stat-card stat-card-green"><span className="stat-label">Open reminders</span><strong>{openCount}</strong><span className="stat-note">Across your life</span></div><div className="stat-card"><span className="stat-label">Due this week</span><strong>{formatAmount(totalDue)}</strong><span className="stat-note">Bills and dues</span></div><div className="stat-card stat-card-yellow"><span className="stat-label">Next up</span><strong>{visibleReminders[0] ? formatDate(visibleReminders[0].date) : "All clear"}</strong><span className="stat-note">Your nearest deadline</span></div></div>
            <div className="content-grid"><section className="reminder-panel"><div className="section-heading"><div><h2>Coming up</h2><p>Your next reminders, in order.</p></div><Link href="/reminders" className="text-link">View all <span aria-hidden="true">→</span></Link></div><div className="filter-row" role="tablist" aria-label="Reminder types">{["All", "Bill", "Deadline", "Due"].map((option) => <button className={filter === option ? "filter-active" : ""} key={option} onClick={() => setFilter(option)}>{option}</button>)}</div><div className="reminder-list">{visibleReminders.length === 0 ? <div className="empty-state">Nothing here right now. Your calendar is breathing easy.</div> : visibleReminders.map((reminder, index) => <article className="reminder-row" key={`${reminder.id}-${index}`}><button aria-label={`Mark ${reminder.title} complete`} className="check-button" onClick={() => toggleReminder(reminder.id)}>{reminder.done ? "✓" : ""}</button><div className="reminder-main"><div className="reminder-title-line"><h3>{reminder.title}</h3><span className={`priority priority-${reminder.priority.toLowerCase()}`}>{reminder.priority}</span></div><p>{reminder.type} · {reminder.category}</p></div><div className="reminder-date"><strong>{formatDate(reminder.date)}</strong><span>{formatAmount(reminder.amount)}</span></div></article>)}</div></section><aside className="focus-panel"><span className="focus-kicker">A small nudge</span><h2>Clear space for what matters.</h2><p>Keep the little promises to yourself visible, so they don&apos;t become big surprises later.</p><div className="focus-line"><span>Weekly rhythm</span><strong>3 of 5</strong></div><div className="progress-track"><span /></div></aside></div>
            {showForm && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setShowForm(false)}><form className="quick-form" onSubmit={addReminder}><div className="modal-heading"><div><span className="eyebrow">New item</span><h2>Add a reminder</h2></div><button type="button" className="close-button" onClick={() => setShowForm(false)}>×</button></div><label>What needs doing?<input autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Renew passport" /></label><div className="form-columns"><label>Due date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Bill</option><option>Deadline</option><option>Due</option></select></label></div><div className="form-columns"><label>Amount<input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Optional" /></label><label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label></div><button className="primary-button" type="submit">Save reminder</button></form></div>}
        </div>
    );
}