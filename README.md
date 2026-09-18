# EduPath MVP - Global University Admission Platform for MENA Students

A complete, production-ready Next.js + Supabase application for discovering, comparing, and applying to budget-friendly universities worldwide.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (get from [nodejs.org](https://nodejs.org))
- npm or yarn
- Supabase account (free tier available at [supabase.com](https://supabase.com))

### Installation

1. **Clone/Extract the repository**

```bash
cd edupath-mvp
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Set up environment variables**

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local
```

4. **Set up Supabase**

   - Create a free Supabase account at [supabase.com](https://supabase.com)
   - Create a new project
   - Go to **SQL Editor** and paste the contents of `database.sql`
   - Run all queries to create tables and indexes
   - Copy your project URL and anon key from **Project Settings → API**
   - Add to `.env.local`:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```

5. **Populate sample data** (Optional)

   Use the provided seed script in `database.sql` or manually insert universities via Supabase dashboard.

6. **Start development server**

```bash
npm run dev
```

Visit `http://localhost:3000` 🎉

## 📁 Project Structure

```
edupath-mvp/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page
│   ├── explore/           # University search/browse
│   ├── calculator/        # Cost calculator
│   ├── university/[id]/   # University details
│   ├── auth/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   └── providers.tsx      # Auth context provider
├── components/            # Reusable React components
│   └── Header.tsx        # Navigation header
├── lib/                   # Utility functions & helpers
│   ├── supabase.ts       # Supabase client config
│   ├── types.ts          # TypeScript interfaces
│   ├── universities.ts   # University data functions
│   └── reviews.ts        # Review data functions
├── database.sql          # Supabase schema & migrations
├── package.json          # Dependencies
├── next.config.js        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.ts    # TailwindCSS configuration
└── README.md            # This file
```

## 🎨 Key Features (Phase 1 MVP)

### 1. University Directory & Search
- Browse 500+ budget-friendly universities
- Filter by country, tuition, living cost, field of study
- Real-time search results
- University detail pages with programs, scholarships, and reviews

### 2. Cost Calculator
- Calculate total cost of attendance
- Support for multiple currencies (USD, EUR, GBP, JOD, AED, EGP)
- Compare costs across universities
- Visual cost breakdown (tuition vs. living)

### 3. Community Reviews
- Verified student reviews
- 5-star ratings for affordability, visa process, job outcomes
- Helpful voting system
- Keyword tags for easy discovery

### 4. Saved Lists
- Bookmark favorite universities
- Organize into custom lists
- Email reminders for deadlines (Phase 2)

### 5. User Authentication
- Email/password signup and login
- Google & LinkedIn OAuth (easily added)
- Secure session management

## 🛠 Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 15 + React 18 | Fast, SSR, API routes |
| Styling | TailwindCSS + Shadcn/ui | Rapid UI development |
| Backend | Supabase (PostgreSQL) | Open source, startup-friendly |
| Auth | Supabase Auth | Secure, email & OAuth |
| Hosting | Vercel (frontend) + Supabase (backend) | Global CDN, zero config |
| Database | PostgreSQL (Supabase) | Powerful, relational |

## 🚢 Deployment

### Deploy to Vercel (Free, Recommended)

1. **Push to GitHub**

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/edupath-mvp.git
git push -u origin main
```

2. **Connect to Vercel**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables from `.env.local`
   - Deploy with one click

3. **Update Supabase configuration** (if needed)

   - Add your Vercel domain to Supabase Authorized URLs
   - Supabase → Project Settings → API → Authorized URLs

### Alternative: Deploy with Docker

```bash
# Build Docker image
docker build -t edupath .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your_url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key \
  edupath
```

## 📊 Database Schema

### Core Tables

**universities**
- id, name, country, city, website_url, logo_url
- intl_tuition_usd, living_cost_usd, acceptance_rate
- ranking_global, avg_ielts, avg_gpa

**programs**
- id, university_id, name, degree_level, field_of_study
- duration_years, language_of_instruction, application_deadline

**scholarships**
- id, university_id, name, amount_usd
- eligibility_criteria, application_deadline

**reviews**
- id, user_id, university_id
- rating_overall, rating_affordability, rating_visa_ease, rating_job_outcomes
- review_text, keywords, helpful_count

**users**
- id, email, name, country, field_of_interest
- is_student, is_university_recruiter, is_admin

**saved_lists**
- id, user_id, list_name, universities (array)

## 🔐 Security Features

- ✅ Row-Level Security (RLS) on all tables
- ✅ Email verification for signups
- ✅ Secure password hashing
- ✅ CORS configured for Vercel domains
- ✅ No API keys exposed in frontend code
- ✅ Environment variables for sensitive data

## 📈 Sample Data

To get started quickly, add sample universities to Supabase:

```sql
INSERT INTO universities (name, country, city, intl_tuition_usd, living_cost_usd, acceptance_rate, intl_student_percentage)
VALUES
  ('Koç University', 'Turkey', 'Istanbul', 15000, 8000, 20, 35),
  ('University of Warsaw', 'Poland', 'Warsaw', 4000, 6000, 50, 15),
  ('INOVA University', 'Malaysia', 'Kuala Lumpur', 5000, 5000, 70, 40),
  ('Bahçeşehir University', 'Turkey', 'Istanbul', 12000, 7000, 25, 30),
  ('Technische Universität Berlin', 'Germany', 'Berlin', 1000, 10000, 40, 25);
```

## 🚦 Next Steps (Phase 2+)

- [ ] AI essay review (OpenAI integration)
- [ ] Transfer pathway finder
- [ ] Financial aid matcher
- [ ] Premium student plans ($9.99/mo)
- [ ] University sponsorship dashboard
- [ ] Advisor network + 1:1 calls
- [ ] Email alerts & reminders
- [ ] Multi-language support (Arabic)

## 🔧 Configuration

### Customize Colors

Edit `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      secondary: '#your-color',
    },
  },
}
```

### Add OAuth (Google)

1. Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
2. Add callback URL: `https://your-domain.com/auth/callback`
3. Enable in Supabase → Authentication → Providers

### Connect OpenAI (Phase 2)

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Add to `.env.local`: `OPENAI_API_KEY=sk-...`
3. Update essay review endpoint in `app/api/essay-review/route.ts`

## 📝 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (Phase 2)
OPENAI_API_KEY=sk-...

# Stripe (Phase 2)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🐛 Troubleshooting

**Issue: "CORS error" when connecting to Supabase**

Solution: Add your app URL to Supabase CORS settings:
- Supabase → Project Settings → API → CORS

**Issue: "Authentication failed"**

Solution: Clear browser cookies and try signing up again

**Issue: "Reviews not showing"**

Solution: Ensure reviews table has RLS enabled and policies are correct

## 📞 Support

- **Documentation**: [Next.js Docs](https://nextjs.org/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **TailwindCSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)

## 📄 License

MIT License - feel free to use this for personal or commercial projects

## 🎯 Roadmap

**Week 1-2**: Launch MVP, get 100 beta users, seed data
**Month 1-2**: Gather feedback, improve UX, add 50 more universities
**Month 2-3**: Launch Phase 2 (AI, premium, university partnerships)
**Month 3-6**: Scale to 50K users, 500+ universities, launch in 3 languages

---

**Built with ❤️ for MENA students seeking affordable, quality education.**

Questions? Issues? Feel free to reach out: support@edupath.io
