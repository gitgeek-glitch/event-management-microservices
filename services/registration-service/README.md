CREATE TABLE registrations (
  id SERIAL PRIMARY KEY,
  student_id INT8 NOT NULL,
  event_id INT8 NOT NULL,
  session_ids INT8,
  registration_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlisted')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  team_name TEXT,
  team_member1 TEXT,
  team_member2 TEXT,
  team_member3 TEXT,
  team_member4 TEXT,
  emergency_contact NUMERIC,
  dietary_requirements TEXT,
  special_needs TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);