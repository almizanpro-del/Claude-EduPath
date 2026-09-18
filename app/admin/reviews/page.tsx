'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { useAuth } from '@/app/providers'
import { supabase } from '@/lib/supabase'

type AdminReview = {
  id: string
  rating_overall: number | null
  rating_affordability: number | null
  rating_visa_ease: number | null
  rating_job_outcomes: number | null
  rating_campus_safety: number | null
  rating_social_life: number | null
  review_text: string | null
  moderation_status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user: { id: string; name: string | null; email: string } | null
  university: { id: string; name: string; country: string } | null
}

const STATUS_TABS = ['pending', 'approved', 'rejected'] as const

export default function AdminReviewsPage() {
  const { user, loading: authLoading } = useAuth()
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('pending')
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)

  const isAdmin = !!user?.is_admin

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Your session expired. Please sign in again.')
        return
      }

      const res = await fetch(`/api/admin/reviews?status=${status}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Failed to load reviews')
        return
      }
      setReviews(body.reviews || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    if (isAdmin) {
      fetchReviews()
    }
  }, [isAdmin, fetchReviews])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActioningId(id)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setError('Your session expired. Please sign in again.')
        return
      }

      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Failed to update review')
        return
      }
      // The reviewed item no longer belongs in this tab's list.
      setReviews((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      console.error(err)
      setError('Failed to update review')
    } finally {
      setActioningId(null)
    }
  }

  if (authLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>
      </main>
    )
  }

  if (!user || !isAdmin) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 py-16 px-4">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-xl font-bold mb-2">Admins only</h1>
            <p className="text-gray-600 mb-6">
              {user
                ? "Your account doesn't have admin access."
                : 'Please sign in with an admin account to view this page.'}
            </p>
            <Link href="/" className="text-blue-600 hover:underline">
              Back to home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main>
      <Header />
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">Review moderation</h1>
          <p className="text-gray-600 mb-6">Approve or reject student reviews before they go public.</p>

          <div className="flex gap-2 mb-6">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatus(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                  status === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-700">{error}</div>
          )}

          {loading ? (
            <p className="text-gray-500">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-500">No {status} reviews.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold">
                        {review.university?.name ?? 'Unknown university'}
                        {review.university?.country ? `, ${review.university.country}` : ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        {review.user?.name || review.user?.email || 'Unknown reviewer'} ·{' '}
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      Overall: {review.rating_overall ?? '—'}/5
                    </span>
                  </div>

                  <p className="text-gray-800 mb-4 whitespace-pre-wrap">{review.review_text}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-gray-600 mb-4">
                    <span>Affordability: {review.rating_affordability ?? '—'}</span>
                    <span>Visa ease: {review.rating_visa_ease ?? '—'}</span>
                    <span>Job outcomes: {review.rating_job_outcomes ?? '—'}</span>
                    <span>Campus safety: {review.rating_campus_safety ?? '—'}</span>
                    <span>Social life: {review.rating_social_life ?? '—'}</span>
                  </div>

                  {status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(review.id, 'approve')}
                        disabled={actioningId === review.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(review.id, 'reject')}
                        disabled={actioningId === review.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
