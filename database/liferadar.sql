CREATE DATABASE IF NOT EXISTS liferadar_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE liferadar_db;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY categories_name_unique (name)
);

CREATE TABLE IF NOT EXISTS reminders (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  due_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  category VARCHAR(80) NOT NULL DEFAULT 'Personal',
  priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  status ENUM('Pending', 'Completed') NOT NULL DEFAULT 'Pending',
  type VARCHAR(40) NOT NULL DEFAULT 'Reminder',
  done BOOLEAN NOT NULL DEFAULT FALSE,
  overdue BOOLEAN NOT NULL DEFAULT FALSE,
  source_document VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX reminders_due_date_index (due_date),
  INDEX reminders_category_index (category)
);