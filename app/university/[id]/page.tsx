'use client'

import { use, useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { useAuth } from '@/app/providers'
import {
  getUniversityById,
  getUniversityPrograms,
  getUniversityScholarships,
  getUniversityReviews,
  getUniversityAverageRating,
} from '@/lib/universities'
import { createReview } from '@/lib/reviews'
import type { University, Program, Scholarship, Review } from '@/lib/types'

export default function UniversityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params)
  const { user } = useAuth()
  const [university, setUniversity] = useState<University | null>(null)
  const [programs, setPrograms] = useState<Program[]>([])
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reviewForm, setReviewForm] = useState({
    rating_overall: 5,
    rating_affordability: 5,
    rating_visa_ease: 5,
    rating_job_outcomes: 5,
    review_text: '',
  })
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [uniData, progData, scholData, revData, rating] = await Promise.all([
          getUniversityById(id),
          getUniversityPrograms(id),
          getUniversityScholarships(id),
          getUniversityReviews(id),
          getUniversityAverageRating(id),
        ])

        setUniversity(uniData)
        setPrograms(progData || [])
        setScholarships(scholData || [])
        setReviews(revData || [])
        setAvgRating(rating)
      } catch (error) {
        console.error('Error loading university:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      alert('Please sign in to leave a review')
      return
    }

    setSubmittingReview(true)
    try {
      const newReview = await createReview({
        user_id: user.id,
        university_id: id,
        rating_overall: reviewForm.rating_overall,
        rating_affordability: reviewForm.rating_affordability,
        rating_visa_ease: reviewForm.rating_visa_ease,
        rating_job_outcomes: reviewForm.rating_job_outcomes,
        rating_campus_safety: null,
        rating_social_life: null,
        review_text: reviewForm.review_text,
        keywords: [],
        helpful_count: 0,
        unhelpful_count: 0,
        is_verified: false,
      })

      if (newReview) {
        setReviews([newReview, ...reviews])
        setReviewForm({
          rating_overall: 5,
          rating_affordability: 5,
          rating_visa_ease: 5,
          rating_job_outcomes: 5,
          review_text: '',
        })
        alert('Review submitted! It will be verified soon.')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Error submitting review')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <main>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">Loading university information...</p>
        </div>
      </main>
    )
  }

  if (!university) {
    return (
      <main>
        <Header />
        <div className="container max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">University not found</p>
        </div>
      </main>
    )
  }

  return (
    <main>
      <Header />

      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* University Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="md:col-span-2">
            <h1 className="text-4xl font-bold mb-2">{university.name}</h1>
            <p className="text-xl text-gray-600 mb-4">
              {university.city}, {university.country}
            </p>

            {university.description && (
              <p className="text-gray-700 mb-6 leading-relaxed">{university.description}</p>
            )}

            <div className="flex flex-wrap gap-4 mb-6">
              {university.website_url && (
                <a
                  href={university.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Visit Website
                </a>
              )}
              <button className="btn-outlined">Save to List</button>
            </div>
          </div>

          {/* Summary Card */}
          <div className="card">
            {university.logo_url && (
              <img
                src={university.logo_url}
                alt={university.name}
                className="w-full h-32 object-cover rounded-lg mb-6"
              />
            )}

            <div className="space-y-4">
              <div>
                <p className="text-gray-600 text-sm">Annual Tuition (International)</p>
                <p className="text-2xl font-bold text-blue-600">
                  ${university.intl_tuition_usd || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Annual Living Cost</p>
                <p className="text-2xl font-bold">${university.living_cost_usd || 'N/A'}</p>
              </div>

              <div>
                <p className="text-gray-600 text-sm">Student Rating</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
                  <span className="text-yellow-400">★</span>
                </div>
              </div>

              {university.acceptance_rate && (
                <div>
                  <p className="text-gray-600 text-sm">Acceptance Rate</p>
                  <p className="text-2xl font-bold">{university.acceptance_rate}%</p>
                </div>
              )}

              {university.intl_student_percentage && (
                <div>
                  <p className="text-gray-600 text-sm">International Students</p>
                  <p className="text-2xl font-bold">{university.intl_student_percentage}%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Programs Section */}
        {programs.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Programs Available</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {programs.slice(0, 6).map((program) => (
                <div key={program.id} className="card">
                  <h3 className="text-lg font-semibold mb-2">{program.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {program.field_of_study} • {program.degree_level}
                  </p>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-gray-600">Duration:</span> {program.duration_years} years
                    </p>
                    {program.tuition_usd && (
                      <p>
                        <span className="text-gray-600">Tuition:</span> ${program.tuition_usd}/year
                      </p>
                    )}
                    {program.language_of_instruction && (
                      <p>
                        <span className="text-gray-600">Language:</span> {program.language_of_instruction}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Scholarships Section */}
        {scholarships.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Available Scholarships</h2>
            <div className="space-y-4">
              {scholarships.map((scholarship) => (
                <div key={scholarship.id} className="card">
                  <h3 className="text-lg font-semibold mb-2">{scholarship.name}</h3>
                  {scholarship.amount_usd && (
                    <p className="text-2xl font-bold text-green-600 mb-2">
                      ${scholarship.amount_usd}
                    </p>
                  )}
                  {scholarship.eligibility_criteria && (
                    <p className="text-gray-700 mb-2">{scholarship.eligibility_criteria}</p>
                  )}
                  {scholarship.application_deadline && (
                    <p className="text-sm text-gray-600">
                      Deadline: {scholarship.application_deadline}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Student Reviews ({reviews.length})</h2>

          {/* Review Form */}
          {user ? (
            <div className="card mb-8">
              <h3 className="text-lg font-semibold mb-4">Share Your Experience</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Overall Rating</label>
                    <select
                      className="input"
                      value={reviewForm.rating_overall}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          rating_overall: parseInt(e.target.value),
                        })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} Stars
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Affordability</label>
                    <select
                      className="input"
                      value={reviewForm.rating_affordability}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          rating_affordability: parseInt(e.target.value),
                        })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} Stars
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Visa Process</label>
                    <select
                      className="input"
                      value={reviewForm.rating_visa_ease}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          rating_visa_ease: parseInt(e.target.value),
                        })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} Stars
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Job Outcomes</label>
                    <select
                      className="input"
                      value={reviewForm.rating_job_outcomes}
                      onChange={(e) =>
                        setReviewForm({
                          ...reviewForm,
                          rating_job_outcomes: parseInt(e.target.value),
                        })
                      }
                    >
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} Stars
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Your Review</label>
                  <textarea
                    className="input"
                    rows={4}
                    placeholder="Share your honest experience..."
                    value={reviewForm.review_text}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        review_text: e.target.value,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          ) : (
            <div className="card mb-8 text-center py-8">
              <p className="text-gray-600 mb-4">Sign in to write a review</p>
              <a href="/auth/login" className="btn-primary">
                Sign In
              </a>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">Anonymous Student</p>
                      <p className="text-sm text-gray-600">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < Math.round(review.rating_overall || 0) ? 'text-yellow-400' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{review.review_text}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-gray-600">Affordability</p>
                      <p className="font-semibold">{review.rating_affordability} / 5</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Visa</p>
                      <p className="font-semibold">{review.rating_visa_ease} / 5</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Job Outcomes</p>
                      <p className="font-semibold">{review.rating_job_outcomes} / 5</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Helpful</p>
                      <p className="font-semibold">{review.helpful_count} people</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="text-sm text-blue-600 hover:underline">Helpful</button>
                    <button className="text-sm text-gray-600 hover:underline">Not Helpful</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state py-12">
              <p className="text-lg text-gray-600">No reviews yet</p>
              <p className="text-gray-600">Be the first to share your experience!</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
