CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cloudflare_meeting_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
