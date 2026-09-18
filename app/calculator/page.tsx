'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { searchUniversities } from '@/lib/universities'
import { getLatestFxRates, FALLBACK_FX_RATES } from '@/lib/fx'
import type { University } from '@/lib/types'

export default function CalculatorPage() {
  const [selectedUniversities, setSelectedUniversities] = useState<University[]>([])
  const [years, setYears] = useState(4)
  const [currency, setCurrency] = useState('USD')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<University[]>([])
  const [loading, setLoading] = useState(false)
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>(FALLBACK_FX_RATES)

  useEffect(() => {
    getLatestFxRates().then(setCurrencyRates)
  }, [])

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    const results = await searchUniversities({ limit: 5 })
    setSearchResults(
      results?.filter(
        (uni) =>
          uni.name.toLowerCase().includes(query.toLowerCase()) ||
          uni.country.toLowerCase().includes(query.toLowerCase())
      ) || []
    )
    setLoading(false)
  }

  const handleAddUniversity = (university: University) => {
    if (!selectedUniversities.find((u) => u.id === university.id)) {
      setSelectedUniversities([...selectedUniversities, university])
      setSearchQuery('')
      setSearchResults([])
    }
  }

  const handleRemoveUniversity = (universityId: string) => {
    setSelectedUniversities(selectedUniversities.filter((u) => u.id !== universityId))
  }

  const calculateTotalCost = (uni: University): number => {
    const tuition = uni.intl_tuition_usd || 0
    const living = uni.living_cost_usd || 0
    return (tuition + living) * years
  }

  const convertCurrency = (amount: number, to: string): number => {
    return amount * (currencyRates[to] || 1)
  }

  return (
    <main>
      <Header />

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-2">Cost Calculator</h1>
        <p className="text-gray-600 mb-8">
          Calculate and compare total cost of attendance across universities
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24 space-y-6">
              {/* Search */}
              <div>
                <label className="label">Add Universities</label>
                <input
                  type="text"
                  placeholder="Search universities..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    handleSearch(e.target.value)
                  }}
                  className="input mb-2"
                />

                {loading ? (
                  <p className="text-sm text-gray-600">Loading...</p>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map((uni) => (
                      <button
                        key={uni.id}
                        onClick={() => handleAddUniversity(uni)}
                        className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition text-sm"
                      >
                        <p className="font-semibold">{uni.name}</p>
                        <p className="text-gray-600">{uni.country}</p>
                      </button>
                    ))}
                  </div>
                ) : searchQuery ? (
                  <p className="text-sm text-gray-600">No results found</p>
                ) : null}
              </div>

              {/* Duration */}
              <div>
                <label className="label">Program Duration (Years)</label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={years}
                  onChange={(e) => setYears(parseInt(e.target.value))}
                  className="input"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="label">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JOD">JOD</option>
                  <option value="AED">AED</option>
                  <option value="EGP">EGP</option>
                </select>
              </div>

              {/* Selected Universities */}
              {selectedUniversities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Selected ({selectedUniversities.length})</h3>
                  <div className="space-y-2">
                    {selectedUniversities.map((uni) => (
                      <div
                        key={uni.id}
                        className="flex items-center justify-between bg-blue-50 p-2 rounded-lg text-sm"
                      >
                        <span className="font-medium truncate">{uni.name}</span>
                        <button
                          onClick={() => handleRemoveUniversity(uni.id)}
                          className="text-red-600 hover:text-red-700 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {selectedUniversities.length > 0 ? (
              <div className="space-y-6">
                {/* Summary Table */}
                <div className="card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-2 font-semibold">University</th>
                        <th className="text-right py-3 px-2 font-semibold">Tuition/Yr</th>
                        <th className="text-right py-3 px-2 font-semibold">Living/Yr</th>
                        <th className="text-right py-3 px-2 font-semibold">Total {years} Years</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUniversities.map((uni) => {
                        const total = calculateTotalCost(uni)
                        const convertedTotal = convertCurrency(total, currency)

                        return (
                          <tr key={uni.id} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="py-3 px-2 font-semibold">{uni.name}</td>
                            <td className="text-right py-3 px-2">
                              {currency}
                              {convertCurrency(uni.intl_tuition_usd || 0, currency).toLocaleString(
                                'en-US',
                                {
                                  maximumFractionDigits: 0,
                                }
                              )}
                            </td>
                            <td className="text-right py-3 px-2">
                              {currency}
                              {convertCurrency(uni.living_cost_usd || 0, currency).toLocaleString(
                                'en-US',
                                {
                                  maximumFractionDigits: 0,
                                }
                              )}
                            </td>
                            <td className="text-right py-3 px-2 font-bold text-blue-600">
                              {currency}
                              {convertedTotal.toLocaleString('en-US', {
                                maximumFractionDigits: 0,
                              })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Detailed Breakdowns */}
                <div className="space-y-4">
                  {selectedUniversities.map((uni) => {
                    const tuition = uni.intl_tuition_usd || 0
                    const living = uni.living_cost_usd || 0
                    const totalTuition = tuition * years
                    const totalLiving = living * years
                    const total = totalTuition + totalLiving

                    return (
                      <div key={uni.id} className="card">
                        <h3 className="text-lg font-semibold mb-4">{uni.name}</h3>

                        <div className="space-y-3 mb-6">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Annual Tuition:</span>
                            <span className="font-semibold">
                              {currency}
                              {convertCurrency(tuition, currency).toLocaleString('en-US', {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Annual Living Cost:</span>
                            <span className="font-semibold">
                              {currency}
                              {convertCurrency(living, currency).toLocaleString('en-US', {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center border-t pt-3">
                            <span className="text-gray-600">Annual Total:</span>
                            <span className="font-semibold">
                              {currency}
                              {convertCurrency(tuition + living, currency).toLocaleString('en-US', {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Cost Breakdown Chart */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span className="text-sm text-gray-600">Tuition ({(tuition / (tuition + living) * 100).toFixed(0)}%)</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${(tuition / (tuition + living)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm text-gray-600">Living ({(living / (tuition + living) * 100).toFixed(0)}%)</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${(living / (tuition + living)) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t">
                          <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold">Total for {years} years:</span>
                            <span className="text-2xl font-bold text-blue-600">
                              {currency}
                              {convertCurrency(total, currency).toLocaleString('en-US', {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Monthly average: {currency}
                            {convertCurrency(total / (years * 12), currency).toLocaleString('en-US', {
                              maximumFractionDigits: 0,
                            })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="empty-state py-12">
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
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-lg font-semibold">Select universities to compare costs</p>
                <p className="text-gray-600">Search for universities on the left to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
