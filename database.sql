-- Universities Table
CREATE TABLE IF NOT EXISTS universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100),
  website_url VARCHAR(500),
  logo_url VARCHAR(500),
  description TEXT,
  intl_tuition_usd DECIMAL(10, 2),
  living_cost_usd DECIMAL(10, 2),
  intl_student_percentage DECIMAL(5, 2),
  acceptance_rate DECIMAL(5, 2),
  avg_ielts DECIMAL(3, 1),
  avg_gpa DECIMAL(3, 2),
  ranking_global INT,
  ranking_country INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Programs Table
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  degree_level VARCHAR(50), -- bachelor, master, phd, diploma
  field_of_study VARCHAR(100),
  duration_years INT,
  language_of_instruction VARCHAR(50),
  application_deadline DATE,
  tuition_usd DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Scholarships Table
CREATE TABLE IF NOT EXISTS scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount_usd DECIMAL(10, 2),
  eligibility_criteria TEXT,
  application_deadline DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  country VARCHAR(100),
  field_of_interest VARCHAR(100),
  profile_picture_url VARCHAR(500),
  is_student BOOLEAN DEFAULT true,
  is_university_recruiter BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  rating_overall DECIMAL(3, 1),
  rating_affordability DECIMAL(3, 1),
  rating_visa_ease DECIMAL(3, 1),
  rating_job_outcomes DECIMAL(3, 1),
  rating_campus_safety DECIMAL(3, 1),
  rating_social_life DECIMAL(3, 1),
  review_text TEXT,
  keywords TEXT[], -- array of tags like ['cheap living', 'easy visa']
  helpful_count INT DEFAULT 0,
  unhelpful_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Saved Lists Table
CREATE TABLE IF NOT EXISTS saved_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  list_name VARCHAR(255),
  universities UUID[], -- JSONB array of university IDs
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comparison History Table (for tracking user comparisons)
CREATE TABLE IF NOT EXISTS comparison_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_ids UUID[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Email Alerts Table
CREATE TABLE IF NOT EXISTS email_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  alert_type VARCHAR(50), -- deadline_change, new_review, scholarship_update
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_universities_country ON universities(country);
CREATE INDEX idx_universities_intl_tuition ON universities(intl_tuition_usd);
CREATE INDEX idx_universities_living_cost ON universities(living_cost_usd);
CREATE INDEX idx_programs_university ON programs(university_id);
CREATE INDEX idx_programs_field ON programs(field_of_study);
CREATE INDEX idx_scholarships_university ON scholarships(university_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_university ON reviews(university_id);
CREATE INDEX idx_reviews_rating ON reviews(rating_overall);
CREATE INDEX idx_saved_lists_user ON saved_lists(user_id);
CREATE INDEX idx_email_alerts_user ON email_alerts(user_id);
CREATE INDEX idx_users_email ON users(email);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for reviews table
CREATE POLICY "Anyone can read reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for saved_lists table
CREATE POLICY "Users can read their own lists" ON saved_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create lists" ON saved_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lists" ON saved_lists
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for email_alerts table
CREATE POLICY "Users can read their own alerts" ON email_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own alerts" ON email_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON email_alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Public universities, programs, scholarships are readable by all
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Universities are readable by all" ON universities
  FOR SELECT USING (true);

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programs are readable by all" ON programs
  FOR SELECT USING (true);

ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scholarships are readable by all" ON scholarships
  FOR SELECT USING (true);
