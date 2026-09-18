import Link from 'next/link'
import { Header } from '@/components/Header'
import { getFeaturedUniversities } from '@/lib/universities'

export default async function Home() {
  const featured = await getFeaturedUniversities()

  return (
    <main>
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Find Your Perfect University</h1>
          <p className="text-xl mb-8 opacity-90">
            Discover budget-friendly universities worldwide. Compare costs, read honest reviews, and
            apply with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/explore" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
              Start Exploring
            </Link>
            <Link href="/compare" className="btn-outlined border-white text-white hover:bg-blue-700">
              Compare Universities
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose EduPath?</h2>

          <div className="grid-cols-responsive">
            <div className="card">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold mb-3">Global Universities</h3>
              <p className="text-gray-600">
                Access information on 500+ budget-friendly universities across the world, specially
                curated for MENA students.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-3">Affordable Options</h3>
              <p className="text-gray-600">
                Compare tuition and living costs. Discover hidden pathways to quality education at
                prices you can afford.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold mb-3">Honest Reviews</h3>
              <p className="text-gray-600">
                Read verified reviews from MENA students. Get real insights on affordability, visas,
                and student life.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">🧮</div>
              <h3 className="text-xl font-semibold mb-3">Cost Calculator</h3>
              <p className="text-gray-600">
                Calculate total cost of attendance. Convert to your currency and plan your budget
                accurately.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">🔄</div>
              <h3 className="text-xl font-semibold mb-3">Transfer Pathways</h3>
              <p className="text-gray-600">
                Explore transfer routes. Save thousands by starting at community college or cheaper
                universities.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">💼</div>
              <h3 className="text-xl font-semibold mb-3">Career Support</h3>
              <p className="text-gray-600">
                Track job placement rates and post-graduation outcomes. Make informed decisions about
                your future.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Universities */}
      {featured.length > 0 && (
        <section className="py-16">
          <div className="container max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12">Featured Universities</h2>

            <div className="grid-cols-responsive">
              {featured.map((uni) => (
                <Link href={`/university/${uni.id}`} key={uni.id}>
                  <div className="card-hover h-full">
                    {uni.logo_url && (
                      <img
                        src={uni.logo_url}
                        alt={uni.name}
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="text-lg font-semibold mb-2">{uni.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{uni.country}</p>

                    <div className="space-y-2 text-sm text-gray-600">
                      {uni.intl_tuition_usd && (
                        <p>
                          <span className="font-semibold">Tuition:</span> ${uni.intl_tuition_usd}/year
                        </p>
                      )}
                      {uni.living_cost_usd && (
                        <p>
                          <span className="font-semibold">Living:</span> ${uni.living_cost_usd}/year
                        </p>
                      )}
                      {uni.acceptance_rate && (
                        <p>
                          <span className="font-semibold">Acceptance:</span> {uni.acceptance_rate}%
                        </p>
                      )}
                    </div>

                    <button className="mt-4 btn-primary w-full">View Details</button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-lg mb-8 opacity-90">
            Create an account to save universities, write reviews, and get personalized recommendations.
          </p>
          <Link href="/auth/signup" className="btn-primary bg-white text-blue-600 hover:bg-gray-100">
            Sign Up for Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-white mb-4">About EduPath</h4>
              <p className="text-sm">
                Empowering MENA students to find affordable, quality education worldwide.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="text-sm space-y-2">
                <li>
                  <Link href="/explore" className="hover:text-white transition">
                    Explore Universities
                  </Link>
                </li>
                <li>
                  <Link href="/compare" className="hover:text-white transition">
                    Compare
                  </Link>
                </li>
                <li>
                  <Link href="/calculator" className="hover:text-white transition">
                    Cost Calculator
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="text-sm space-y-2">
                <li>
                  <a href="mailto:support@edupath.io" className="hover:text-white transition">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>&copy; 2026 EduPath. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
