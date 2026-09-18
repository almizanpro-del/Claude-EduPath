'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { searchUniversities, getCountries, getFieldsOfStudy } from '@/lib/universities'
import type { University, SearchFilters } from '@/lib/types'

export default function ExplorePage() {
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState<string[]>([])
  const [fields, setFields] = useState<string[]>([])

  const [filters, setFilters] = useState<SearchFilters>({
    maxTuition: 30000,
    sortBy: 'tuition_asc',
    page: 1,
    limit: 12,
  })

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      const [countriesData, fieldsData] = await Promise.all([getCountries(), getFieldsOfStudy()])
      setCountries(countriesData)
      setFields(fieldsData)
    }
    loadFilterOptions()
  }, [])

  // Search universities
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true)
      const results = await searchUniversities(filters)
      setUniversities(results || [])
      setLoading(false)
    }
    performSearch()
  }, [filters])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to page 1 when filter changes
    }))
  }

  return (
    <main>
      <Header />

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">Explore Universities</h1>
        <p className="text-gray-600 mb-8">
          Search and filter from 500+ budget-friendly universities worldwide
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="text-xl font-bold mb-6">Filters</h2>

              {/* Country Filter */}
              <div className="mb-6">
                <label className="label">Country</label>
                <select
                  className="input"
                  value={filters.country || ''}
                  onChange={(e) => handleFilterChange('country', e.target.value || undefined)}
                >
                  <option value="">All Countries</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tuition Range */}
              <div className="mb-6">
                <label className="label">Max Tuition/Year</label>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  step="1000"
                  value={filters.maxTuition || 30000}
                  onChange={(e) => handleFilterChange('maxTuition', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-600 mt-2">${filters.maxTuition || 30000}/year</p>
              </div>

              {/* Living Cost */}
              <div className="mb-6">
                <label className="label">Max Living Cost/Year</label>
                <input
                  type="range"
                  min="0"
                  max="30000"
                  step="500"
                  value={filters.maxLivingCost || 20000}
                  onChange={(e) => handleFilterChange('maxLivingCost', parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-gray-600 mt-2">${filters.maxLivingCost || 20000}/year</p>
              </div>

              {/* Field of Study */}
              <div className="mb-6">
                <label className="label">Field of Study</label>
                <select
                  className="input"
                  value={filters.fieldOfStudy || ''}
                  onChange={(e) => handleFilterChange('fieldOfStudy', e.target.value || undefined)}
                >
                  <option value="">All Fields</option>
                  {fields.map((field) => (
                    <option key={field} value={field}>
                      {field}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="mb-6">
                <label className="label">Sort By</label>
                <select
                  className="input"
                  value={filters.sortBy || 'tuition_asc'}
                  onChange={(e) =>
                    handleFilterChange('sortBy', e.target.value as any)
                  }
                >
                  <option value="tuition_asc">Cheapest First</option>
                  <option value="tuition_desc">Most Expensive First</option>
                  <option value="rating">Best Ranking</option>
                  <option value="affordability">Most Affordable</option>
                </select>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() =>
                  setFilters({
                    maxTuition: 30000,
                    sortBy: 'tuition_asc',
                    page: 1,
                    limit: 12,
                  })
                }
                className="btn-secondary w-full"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading universities...</p>
              </div>
            ) : universities.length > 0 ? (
              <>
                <p className="text-gray-600 mb-6">
                  Found <span className="font-semibold">{universities.length}</span> universities
                </p>

                <div className="space-y-4">
                  {universities.map((uni) => (
                    <Link key={uni.id} href={`/university/${uni.id}`}>
                      <div className="card-hover">
                        <div className="flex gap-4">
                          {uni.logo_url && (
                            <img
                              src={uni.logo_url}
                              alt={uni.name}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                          )}

                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">{uni.name}</h3>
                            <p className="text-gray-600 text-sm mb-3">
                              {uni.city}, {uni.country}
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                              {uni.intl_tuition_usd && (
                                <div>
                                  <p className="text-gray-600">Tuition</p>
                                  <p className="font-semibold">${uni.intl_tuition_usd}/yr</p>
                                </div>
                              )}
                              {uni.living_cost_usd && (
                                <div>
                                  <p className="text-gray-600">Living</p>
                                  <p className="font-semibold">${uni.living_cost_usd}/yr</p>
                                </div>
                              )}
                              {uni.acceptance_rate && (
                                <div>
                                  <p className="text-gray-600">Acceptance</p>
                                  <p className="font-semibold">{uni.acceptance_rate}%</p>
                                </div>
                              )}
                              {uni.intl_student_percentage && (
                                <div>
                                  <p className="text-gray-600">Intl Students</p>
                                  <p className="font-semibold">{uni.intl_student_percentage}%</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex gap-4 justify-center">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, (filters.page || 1) - 1))}
                    disabled={(filters.page || 1) === 1}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="flex items-center px-4 py-2">
                    Page {filters.page || 1}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                    disabled={universities.length < (filters.limit || 12)}
                    className="btn-secondary disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <svg
                  className="empty-state-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-lg font-semibold">No universities found</p>
                <p>Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
