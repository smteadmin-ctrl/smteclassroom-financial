-- Store LINE Messaging API recipient IDs for individual student reminders.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS line_user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_students_line_user_id
  ON students(line_user_id)
  WHERE line_user_id IS NOT NULL;
