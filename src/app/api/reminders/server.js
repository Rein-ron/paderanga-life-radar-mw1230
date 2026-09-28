import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";

async function connectToDatabase() {
  return mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "liferadar_db",
  });
}

export async function GET() {
  let db;
  try {
    db = await connectToDatabase();
    const [reminders] = await db.query(
      "SELECT id, title, description, due_date AS date, amount, category, priority, status, type, done, overdue, source_document AS sourceDocument, created_at FROM reminders ORDER BY due_date ASC"
    );
    return Response.json(reminders);
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ message: "Database error" }, { status: 500 });
  } finally {
    await db?.end();
  }
}

export async function POST(request) {
  let db;
  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const dueDate = typeof body.date === "string" ? body.date : "";

    if (!title || !dueDate) {
      return Response.json({ message: "title and date are required" }, { status: 400 });
    }

    db = await connectToDatabase();
    const [result] = await db.execute(
      "INSERT INTO reminders (id, title, description, due_date, amount, category, priority, status, type, done, overdue, source_document) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [randomUUID(), title, body.description || null, dueDate, Number(body.amount || body.cost || 0), body.category || "Personal", body.priority || "Medium", body.status || "Pending", body.type || "Reminder", Boolean(body.done), Boolean(body.overdue), body.sourceDocument || null]
    );

    return Response.json({ message: "Reminder added successfully", id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error("Database error:", error);
    return Response.json({ message: "Database error" }, { status: 500 });
  } finally {
    await db?.end();
  }
}