import { supabase } from './supabase'
import type { University, SearchFilters, ComparisonResult, CostCalculation } from './types'

export async function searchUniversities(filters: SearchFilters) {
  let query = supabase.from('universities').select('*')

  if (filters.country) {
    query = query.eq('country', filters.country)
  }

  if (filters.minTuition !== undefined) {
    query = query.gte('intl_tuition_usd', filters.minTuition)
  }

  if (filters.maxTuition !== undefined) {
    query = query.lte('intl_tuition_usd', filters.maxTuition)
  }

  if (filters.minLivingCost !== undefined) {
    query = query.gte('living_cost_usd', filters.minLivingCost)
  }

  if (filters.maxLivingCost !== undefined) {
    query = query.lte('living_cost_usd', filters.maxLivingCost)
  }

  if (filters.minAcceptanceRate !== undefined) {
    query = query.gte('acceptance_rate', filters.minAcceptanceRate)
  }

  if (filters.maxAcceptanceRate !== undefined) {
    query = query.lte('acceptance_rate', filters.maxAcceptanceRate)
  }

  // Handle sorting
  if (filters.sortBy === 'tuition_asc') {
    query = query.order('intl_tuition_usd', { ascending: true })
  } else if (filters.sortBy === 'tuition_desc') {
    query = query.order('intl_tuition_usd', { ascending: false })
  } else if (filters.sortBy === 'rating') {
    query = query.order('ranking_global', { ascending: true })
  }

  // Handle pagination
  const offset = ((filters.page || 1) - 1) * (filters.limit || 20)
  query = query.range(offset, offset + (filters.limit || 20) - 1)

  const { data, error } = await query

  if (error) {
    console.error('Error searching universities:', error)
    return null
  }

  return data as University[]
}

export async function getUniversityById(id: string) {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching university:', error)
    return null
  }

  return data as University
}

export async function getUniversitiesByCountry(country: string) {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .eq('country', country)
    .order('intl_tuition_usd', { ascending: true })

  if (error) {
    console.error('Error fetching universities by country:', error)
    return null
  }

  return data as University[]
}

export async function getUniversityPrograms(universityId: string) {
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('university_id', universityId)

  if (error) {
    console.error('Error fetching programs:', error)
    return null
  }

  return data
}

export async function getUniversityScholarships(universityId: string) {
  const { data, error } = await supabase
    .from('scholarships')
    .select('*')
    .eq('university_id', universityId)

  if (error) {
    console.error('Error fetching scholarships:', error)
    return null
  }

  return data
}

export async function getUniversityReviews(universityId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('university_id', universityId)
    .eq('moderation_status', 'approved')
    .order('helpful_count', { ascending: false })

  if (error) {
    console.error('Error fetching reviews:', error)
    return null
  }

  return data
}

export async function getUniversityAverageRating(universityId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('rating_overall')
    .eq('university_id', universityId)
    .eq('moderation_status', 'approved')

  if (error) {
    console.error('Error fetching average rating:', error)
    return 0
  }

  if (!data || data.length === 0) return 0

  const sum = data.reduce((acc, review) => acc + (review.rating_overall || 0), 0)
  return sum / data.length
}

export async function compareUniversities(universityIds: string[]): Promise<ComparisonResult | null> {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .in('id', universityIds)

  if (error) {
    console.error('Error comparing universities:', error)
    return null
  }

  const universities = data as University[]
  const totalCost4Years: { [key: string]: number } = {}
  const averageRating: { [key: string]: number } = {}
  const scholarshipCount: { [key: string]: number } = {}

  for (const uni of universities) {
    // Calculate total cost
    const tuition = uni.intl_tuition_usd || 0
    const living = uni.living_cost_usd || 0
    totalCost4Years[uni.id] = (tuition + living) * 4

    // Get average rating
    const rating = await getUniversityAverageRating(uni.id)
    averageRating[uni.id] = rating

    // Count scholarships
    const scholarships = await getUniversityScholarships(uni.id)
    scholarshipCount[uni.id] = scholarships?.length || 0
  }

  return {
    universities,
    totalCost4Years,
    averageRating,
    scholarshipCount,
  }
}

export function calculateCost(
  tuitionPerYear: number,
  livingCostPerYear: number,
  years: number
): CostCalculation {
  const totalTuition = tuitionPerYear * years
  const totalLiving = livingCostPerYear * years
  const totalCost = totalTuition + totalLiving
  const costPerMonth = totalCost / (years * 12)

  return {
    universityId: '',
    tuition: tuitionPerYear,
    livingCostPerYear,
    years,
    totalTuition,
    totalLiving,
    totalCost,
    costPerMonth,
  }
}

export async function getCountries(): Promise<string[]> {
  const { data, error } = await supabase
    .from('universities')
    .select('country')
    .order('country')

  if (error) {
    console.error('Error fetching countries:', error)
    return []
  }

  const countries = data
    .map((item: any) => item.country)
    .filter((country: string, index: number, self: string[]) => self.indexOf(country) === index)

  return countries
}

export async function getFieldsOfStudy(): Promise<string[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('field_of_study')
    .order('field_of_study')

  if (error) {
    console.error('Error fetching fields:', error)
    return []
  }

  const fields = data
    .map((item: any) => item.field_of_study)
    .filter((field: string | null): field is string => field !== null)
    .filter((field: string, index: number, self: string[]) => self.indexOf(field) === index)

  return fields
}

export async function getFeaturedUniversities(): Promise<University[]> {
  const { data, error } = await supabase
    .from('universities')
    .select('*')
    .order('ranking_global', { ascending: true })
    .limit(6)

  if (error) {
    console.error('Error fetching featured universities:', error)
    return []
  }

  return (data || []) as University[]
}
