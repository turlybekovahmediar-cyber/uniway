-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  direction TEXT,
  university TEXT,
  companyName TEXT,
  industry TEXT,
  city TEXT,
  about TEXT,
  avatar TEXT,
  createdAt TEXT NOT NULL
);

-- Таблица сессий (заменяет in-memory Map)
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Индекс для быстрого поиска сессий по userId
CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);

-- Таблица заданий (submissions)
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  taskId INTEGER NOT NULL,
  taskTitle TEXT,
  company TEXT,
  direction TEXT,
  status TEXT NOT NULL,
  submittedAt TEXT NOT NULL,
  score INTEGER,
  feedback TEXT,
  solutionText TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Индекс для быстрого получения заданий пользователя
CREATE INDEX IF NOT EXISTS idx_submissions_userId ON submissions(userId);

-- Таблица результатов собеседований
CREATE TABLE IF NOT EXISTS interview_results (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  direction TEXT NOT NULL,
  score INTEGER NOT NULL,
  date TEXT NOT NULL,
  questionsCount INTEGER,
  feedback TEXT,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Индекс для быстрого получения собеседований пользователя
CREATE INDEX IF NOT EXISTS idx_interview_results_userId ON interview_results(userId);
