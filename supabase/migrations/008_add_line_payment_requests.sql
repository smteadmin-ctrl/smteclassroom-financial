-- Payment requests created from LINE rich menu / webhook flows.

CREATE TABLE IF NOT EXISTS line_payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  line_user_id TEXT NOT NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  method VARCHAR(20) CHECK (method IN ('kplus', 'cash', 'truemoney')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(30) NOT NULL DEFAULT 'selecting' CHECK (
    status IN ('selecting', 'awaiting_slip', 'pending_review', 'cash_pending', 'approved', 'rejected', 'expired')
  ),
  slip_url TEXT,
  slip_pathname TEXT,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_line_payment_requests_line_status
  ON line_payment_requests(line_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_line_payment_requests_schedule_status
  ON line_payment_requests(schedule_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_line_payment_requests_student_schedule
  ON line_payment_requests(student_id, schedule_id, created_at DESC);

DROP TRIGGER IF EXISTS update_line_payment_requests_updated_at ON line_payment_requests;
CREATE TRIGGER update_line_payment_requests_updated_at
  BEFORE UPDATE ON line_payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
