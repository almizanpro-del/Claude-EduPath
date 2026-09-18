import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Don't throw here: throwing at module load crashes `next build` during
  // static page collection (e.g. for `/`), even on pages that don't actually
  // need live data at build time. Log clearly instead, and fall back to a
  // placeholder URL so the client can be constructed. Any real Supabase call
  // will simply fail at runtime until the real env vars are set in Vercel
  // (Project Settings -> Environment Variables):
  //   NEXT_PUBLIC_SUPABASE_URL
  //   NEXT_PUBLIC_SUPABASE_ANON_KEY
  console.warn(
    '[supabase] NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY are not set. ' +
      'Supabase calls will fail until these are configured in your deployment environment.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
)

export type Database = {
  public: {
    Tables: {
      universities: {
        Row: {
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
        Insert: {
          name: string
          country: string
          city?: string
          website_url?: string
          logo_url?: string
          description?: string
          intl_tuition_usd?: number
          living_cost_usd?: number
          intl_student_percentage?: number
          acceptance_rate?: number
          avg_ielts?: number
          avg_gpa?: number
          ranking_global?: number
          ranking_country?: number
        }
        Update: {
          name?: string
          country?: string
          city?: string
          website_url?: string
          logo_url?: string
          description?: string
          intl_tuition_usd?: number
          living_cost_usd?: number
          intl_student_percentage?: number
          acceptance_rate?: number
          avg_ielts?: number
          avg_gpa?: number
          ranking_global?: number
          ranking_country?: number
        }
      }
      reviews: {
        Row: {
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
        Insert: {
          user_id: string
          university_id: string
          rating_overall?: number
          rating_affordability?: number
          rating_visa_ease?: number
          rating_job_outcomes?: number
          rating_campus_safety?: number
          rating_social_life?: number
          review_text?: string
          keywords?: string[]
        }
        Update: {
          rating_overall?: number
          rating_affordability?: number
          rating_visa_ease?: number
          rating_job_outcomes?: number
          rating_campus_safety?: number
          rating_social_life?: number
          review_text?: string
          keywords?: string[]
        }
      }
      saved_lists: {
        Row: {
          id: string
          user_id: string
          list_name: string
          universities: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          list_name: string
          universities?: string[]
        }
        Update: {
          list_name?: string
          universities?: string[]
        }
      }
      users: {
        Row: {
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
        Insert: {
          id: string
          email: string
          name?: string
          country?: string
          field_of_interest?: string
          is_student?: boolean
          is_university_recruiter?: boolean
        }
        Update: {
          name?: string
          country?: string
          field_of_interest?: string
          profile_picture_url?: string
        }
      }
    }
  }
}
