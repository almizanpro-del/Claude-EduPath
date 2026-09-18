export interface University {
  id: string
  name: string
  country: string
  city: string | null
  website_url: string | null
  logo_url: string | null
  description: string | null
  intl_tuition_usd: number | null
  living_cost_usd: number | null
  intl_student_percentage: number | null
  acceptance_rate: number | null
  avg_ielts: number | null
  avg_gpa: number | null
  ranking_global: number | null
  ranking_country: number | null
  created_at: string
  updated_at: string
}

export interface UniversityWithStats extends University {
  total_cost_4_years?: number
  average_rating?: number
  review_count?: number
}

export interface Program {
  id: string
  university_id: string
  name: string
  degree_level: string
  field_of_study: string
  duration_years: number
  language_of_instruction: string
  application_deadline: string | null
  tuition_usd: number | null
}

export interface Scholarship {
  id: string
  university_id: string
  name: string
  amount_usd: number | null
  eligibility_criteria: string | null
  application_deadline: string | null
  description: string | null
}

export interface Review {
  id: string
  user_id: string
  university_id: string
  rating_overall: number | null
  rating_affordability: number | null
  rating_visa_ease: number | null
  rating_job_outcomes: number | null
  rating_campus_safety: number | null
  rating_social_life: number | null
  review_text: string | null
  keywords: string[] | null
  helpful_count: number
  unhelpful_count: number
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string | null
  country: string | null
  field_of_interest: string | null
  profile_picture_url: string | null
  is_student: boolean
  is_university_recruiter: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface SavedList {
  id: string
  user_id: string
  list_name: string
  universities: string[]
  created_at: string
  updated_at: string
}

export interface SearchFilters {
  country?: string
  minTuition?: number
  maxTuition?: number
  minLivingCost?: number
  maxLivingCost?: number
  fieldOfStudy?: string
  minAcceptanceRate?: number
  maxAcceptanceRate?: number
  language?: string
  minRating?: number
  sortBy?: 'tuition_asc' | 'tuition_desc' | 'rating' | 'affordability'
  page?: number
  limit?: number
}

export interface ComparisonResult {
  universities: University[]
  totalCost4Years: { [key: string]: number }
  averageRating: { [key: string]: number }
  scholarshipCount: { [key: string]: number }
}

export interface CostCalculation {
  universityId: string
  tuition: number
  livingCostPerYear: number
  years: number
  totalTuition: number
  totalLiving: number
  totalCost: number
  costPerMonth: number
}
