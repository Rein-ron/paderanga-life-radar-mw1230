"use client";

import { useEffect, useState } from "react";

const blankForm = { title: "", description: "", date: "", cost: "", category: "Bills", priority: "Medium", status: "Pending" };
export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editForm, setEditForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/reminders").then((response) => response.ok ? response.json() : Promise.reject()).then(setReminders).catch(() => setReminders([]));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.date) {
      setError("Add a title and due date before saving.");
      return;
    }
    const reminder = { ...form, type: form.category === "Bills" ? "Bill" : "Due", amount: Number(form.cost || 0), done: form.status === "Completed" };
    setError("");
    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminder),
      });
      if (!response.ok) throw new Error("Could not save this reminder.");
      const saved = await response.json();
      setReminders((current) => [...current, { ...reminder, id: saved.id }]);
    } catch (saveError) {
      setError(saveError.message || "Could not save this reminder.");
      return;
    }
    setForm(blankForm);
  }

  function handleEdit(reminder) {
    setEditForm({ title: reminder.title, description: reminder.description || "", date: String(reminder.date).slice(0, 10), cost: reminder.cost ?? reminder.amount ?? "", category: reminder.category || "Bills", priority: reminder.priority || "Medium", status: reminder.status || (reminder.done ? "Completed" : "Pending") });
    setEditingId(reminder.id);
    setError("");
  }

  function closeEdit() {
    setEditingId(null);
    setEditForm(blankForm);
    setError("");
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (!editForm.title.trim() || !editForm.date) {
      setError("Add a title and due date before saving.");
      return;
    }
    const reminder = { ...editForm, type: editForm.category === "Bills" ? "Bill" : "Due", amount: Number(editForm.cost || 0), done: editForm.status === "Completed" };
    setError("");
    try {
      const response = await fetch("/api/reminders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...reminder, id: editingId }),
      });
      if (!response.ok) throw new Error("Could not update this reminder.");
      setReminders((current) => current.map((item) => item.id === editingId ? { ...item, ...reminder } : item));
      closeEdit();
    } catch (updateError) {
      setError(updateError.message || "Could not update this reminder.");
    }
  }

  function handleEditChange(event) {
    setEditForm({ ...editForm, [event.target.name]: event.target.value });
    setError("");
  }
  async function handleDelete(id) {
    if (!window.confirm("Delete this reminder? This cannot be undone.")) return;
    setError("");
    try {
      const response = await fetch(`/api/reminders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Could not delete this reminder.");
      setReminders((current) => current.filter((reminder) => reminder.id !== id));
      if (editingId === id) {
        closeEdit();
      }
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete this reminder.");
    }
  }
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
    setError("");
  }

  return <div className="dashboard-page reminders-page">
    <div className="dashboard-heading">
      <div><h1>Reminders</h1></div>
      <span className="reminder-count">{reminders.filter((reminder) => !reminder.done).length} open</span>
    </div>
    <div className="reminders-layout">
      <form className="reminder-editor" onSubmit={handleSubmit}>
        <div className="editor-heading"><div><span className="eyebrow">New item</span><h2>Add a reminder</h2></div></div>
        {error && editingId === null && <p className="form-error form-error-banner" role="alert">{error}</p>}
        <label>Title<input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Pay electricity bill" required /></label>
        <label>Details<textarea name="description" value={form.description} onChange={handleChange} placeholder="Add a note or account detail" rows="3" /></label>
        <div className="form-columns">
          <label>Due date<input type="date" name="date" value={form.date} onChange={handleChange} required /></label>
          <label>Amount<input type="number" name="cost" value={form.cost} onChange={handleChange} placeholder="Optional" min="0" step="0.01" /></label>
        </div>
        <div className="form-columns">
          <label>Category<select name="category" value={form.category} onChange={handleChange}><option>Bills</option><option>Documents</option><option>Health</option><option>Work</option><option>Personal</option><option>Other</option></select></label>
          <label>Priority<select name="priority" value={form.priority} onChange={handleChange}><option>Low</option><option>Medium</option><option>High</option></select></label>
        </div>
        <label>Status<select name="status" value={form.status} onChange={handleChange}><option>Pending</option><option>Completed</option></select></label>
        <button className="primary-button" type="submit">Add reminder</button>
      </form>
      <section className="reminders-list-panel">
        <div className="section-heading"><div><h2>All reminders</h2><p>Everything you&apos;re keeping an eye on.</p></div></div>
        <div className="managed-list">
          {reminders.length === 0 ? <div className="empty-state">No reminders yet. Add one here or create one from an uploaded document.</div> : [...reminders].sort((a, b) => a.date.localeCompare(b.date)).map((reminder) => <article className={`managed-reminder ${reminder.done ? "managed-reminder-done" : ""}`} key={reminder.id}>
            <div className="managed-check">{reminder.done ? "✓" : ""}</div>
            <div className="managed-main">
              <div className="reminder-title-line"><h3>{reminder.title}</h3><span className={`priority priority-${(reminder.priority || "Medium").toLowerCase()}`}>{reminder.priority || "Medium"}</span></div>
              <p>{reminder.description || (reminder.sourceDocument ? `From ${reminder.sourceDocument}` : `${reminder.type || "Reminder"} · ${reminder.category || "Personal"}`)}</p>
            </div>
            <div className="managed-date"><strong>{reminder.date}</strong><span>{reminder.cost || reminder.amount ? `$${Number(reminder.cost || reminder.amount).toFixed(2)}` : "No amount"}</span></div>
            <div className="managed-actions"><button type="button" className="text-button" onClick={() => handleEdit(reminder)}>Edit</button><button type="button" className="delete-button" onClick={() => handleDelete(reminder.id)}>Delete</button></div>
          </article>)}
        </div>
      </section>
    </div>
    {editingId !== null && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeEdit()}>
      <form className="quick-form reminder-edit-form" onSubmit={handleUpdate} role="dialog" aria-modal="true" aria-labelledby="edit-reminder-title">
        <div className="modal-heading">
          <div><span className="eyebrow">Update item</span><h2 id="edit-reminder-title">Edit reminder</h2></div>
          <button type="button" className="close-button" aria-label="Close edit reminder" onClick={closeEdit}>×</button>
        </div>
        {error && <p className="form-error form-error-banner" role="alert">{error}</p>}
        <label>Title<input autoFocus name="title" value={editForm.title} onChange={handleEditChange} required /></label>
        <label>Details<textarea name="description" value={editForm.description} onChange={handleEditChange} rows="3" /></label>
        <div className="form-columns">
          <label>Due date<input type="date" name="date" value={editForm.date} onChange={handleEditChange} required /></label>
          <label>Amount<input type="number" name="cost" value={editForm.cost} onChange={handleEditChange} min="0" step="0.01" /></label>
        </div>
        <div className="form-columns">
          <label>Category<select name="category" value={editForm.category} onChange={handleEditChange}><option>Bills</option><option>Documents</option><option>Health</option><option>Work</option><option>Personal</option><option>Other</option></select></label>
          <label>Priority<select name="priority" value={editForm.priority} onChange={handleEditChange}><option>Low</option><option>Medium</option><option>High</option></select></label>
        </div>
        <label>Status<select name="status" value={editForm.status} onChange={handleEditChange}><option>Pending</option><option>Completed</option></select></label>
        <button className="primary-button" type="submit">Save changes</button>
      </form>
    </div>}
  </div>;
}
