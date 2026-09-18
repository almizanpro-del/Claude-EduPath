import { supabase } from './supabase'
import type { Review } from './types'

export async function createReview(review: Omit<Review, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('reviews')
    .insert([review])
    .select()
    .single()

  if (error) {
    console.error('Error creating review:', error)
    return null
  }

  return data as Review
}

export async function updateReview(id: string, updates: Partial<Review>) {
  const { data, error } = await supabase
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating review:', error)
    return null
  }

  return data as Review
}

export async function deleteReview(id: string) {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting review:', error)
    return false
  }

  return true
}

export async function markReviewHelpful(reviewId: string, helpful: boolean) {
  const { data: review } = await supabase
    .from('reviews')
    .select('helpful_count, unhelpful_count')
    .eq('id', reviewId)
    .single()

  if (!review) return null

  const updates = helpful
    ? { helpful_count: (review.helpful_count || 0) + 1 }
    : { unhelpful_count: (review.unhelpful_count || 0) + 1 }

  return updateReview(reviewId, updates)
}

export async function getUserReviews(userId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user reviews:', error)
    return []
  }

  return (data || []) as Review[]
}

export async function getReviewsByKeywords(keywords: string[]) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .overlaps('keywords', keywords)
    .eq('is_verified', true)
    .order('helpful_count', { ascending: false })

  if (error) {
    console.error('Error fetching reviews by keywords:', error)
    return []
  }

  return (data || []) as Review[]
}
