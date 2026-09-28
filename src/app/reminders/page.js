"use client";

import { useEffect, useState } from "react";

const blankForm = { title: "", description: "", date: "", cost: "", category: "Bills", priority: "Medium", status: "Pending" };
export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetch("/api/reminders").then((response) => response.ok ? response.json() : Promise.reject()).then(setReminders).catch(() => setReminders([]));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.date) return;
    const reminder = { ...form, type: form.category === "Bills" ? "Bill" : "Due", amount: Number(form.cost || 0), done: form.status === "Completed" };
    if (editingId === null) {
      const response = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reminder) });
      if (!response.ok) return;
      const saved = await response.json();
      setReminders([...reminders, { ...reminder, id: saved.id }]);
    } else {
      setReminders(reminders.map((item) => item.id === editingId ? { ...item, ...reminder } : item));
    }
    setForm(blankForm);
    setEditingId(null);
  }

  function handleEdit(reminder) {
    setForm({ title: reminder.title, description: reminder.description || "", date: reminder.date, cost: reminder.cost ?? reminder.amount ?? "", category: reminder.category || "Bills", priority: reminder.priority || "Medium", status: reminder.status || (reminder.done ? "Completed" : "Pending") });
    setEditingId(reminder.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleDelete(id) { setReminders(reminders.filter((reminder) => reminder.id !== id)); }
  function handleChange(event) { setForm({ ...form, [event.target.name]: event.target.value }); }

  return <div className="dashboard-page reminders-page">
    <div className="dashboard-heading"><div><p className="eyebrow">Your life, in focus</p><h1>Reminders</h1><p className="subheading">Keep bills, deadlines, and dues moving before they become urgent.</p></div><span className="reminder-count">{reminders.filter((reminder) => !reminder.done).length} open</span></div>
    <div className="reminders-layout">
      <form className="reminder-editor" onSubmit={handleSubmit}><div className="editor-heading"><div><span className="eyebrow">{editingId !== null ? "Update item" : "New item"}</span><h2>{editingId !== null ? "Edit reminder" : "Add a reminder"}</h2></div>{editingId !== null && <button className="text-button" type="button" onClick={() => { setEditingId(null); setForm(blankForm); }}>Cancel</button>}</div><label>Title<input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Pay electricity bill" /></label><label>Details<textarea name="description" value={form.description} onChange={handleChange} placeholder="Add a note or account detail" rows="3" /></label><div className="form-columns"><label>Due date<input type="date" name="date" value={form.date} onChange={handleChange} /></label><label>Amount<input type="number" name="cost" value={form.cost} onChange={handleChange} placeholder="Optional" min="0" step="0.01" /></label></div><div className="form-columns"><label>Category<select name="category" value={form.category} onChange={handleChange}><option>Bills</option><option>Documents</option><option>Health</option><option>Work</option><option>Personal</option><option>Other</option></select></label><label>Priority<select name="priority" value={form.priority} onChange={handleChange}><option>Low</option><option>Medium</option><option>High</option></select></label></div><label>Status<select name="status" value={form.status} onChange={handleChange}><option>Pending</option><option>Completed</option></select></label><button className="primary-button" type="submit">{editingId !== null ? "Save changes" : "Add reminder"}</button></form>
      <section className="reminders-list-panel"><div className="section-heading"><div><h2>All reminders</h2><p>Everything you&apos;re keeping an eye on.</p></div></div><div className="managed-list">{reminders.length === 0 ? <div className="empty-state">No reminders yet. Add one here or create one from an uploaded document.</div> : reminders.sort((a, b) => a.date.localeCompare(b.date)).map((reminder) => <article className={`managed-reminder ${reminder.done ? "managed-reminder-done" : ""}`} key={reminder.id}><div className="managed-check">{reminder.done ? "✓" : ""}</div><div className="managed-main"><div className="reminder-title-line"><h3>{reminder.title}</h3><span className={`priority priority-${(reminder.priority || "Medium").toLowerCase()}`}>{reminder.priority || "Medium"}</span></div><p>{reminder.description || (reminder.sourceDocument ? `From ${reminder.sourceDocument}` : `${reminder.type || "Reminder"} · ${reminder.category || "Personal"}`)}</p></div><div className="managed-date"><strong>{reminder.date}</strong><span>{reminder.cost || reminder.amount ? `$${Number(reminder.cost || reminder.amount).toFixed(2)}` : "No amount"}</span></div><div className="managed-actions"><button className="text-button" onClick={() => handleEdit(reminder)}>Edit</button><button className="delete-button" onClick={() => handleDelete(reminder.id)}>Delete</button></div></article>)}</div></section>
    </div>
  </div>;
}
