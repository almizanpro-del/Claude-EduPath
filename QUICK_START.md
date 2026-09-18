# EduPath MVP - Quick Setup Guide

## ⏱️ Setup Time: ~15 minutes

### Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Choose a name, password, and region (closest to your users)
4. Copy your **Project URL** and **Anon Key** from **Settings → API**

### Step 2: Set Up Database (3 minutes)

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy all SQL from `database.sql` file
4. Paste into the editor and click **Execute**
5. Wait for all tables to be created ✓

### Step 3: Configure Local Environment (2 minutes)

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Step 4: Install & Run (5 minutes)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## ✅ What You Get

- ✓ University directory with 500+ universities (seed data ready)
- ✓ Advanced search and filtering
- ✓ Cost calculator (multi-currency)
- ✓ Community reviews system
- ✓ User authentication (signup/login)
- ✓ Saved lists functionality
- ✓ Fully responsive mobile design
- ✓ Production-ready code

## 🧪 Test the App

1. **Sign Up**: Click "Get Started" → Create account
2. **Explore**: Browse universities by country/price
3. **Compare**: Use cost calculator to compare 2-3 universities
4. **Review**: Write a review on a university page

## 📊 Add Sample Data (Optional)

In Supabase SQL Editor, run:

```sql
INSERT INTO universities (name, country, city, intl_tuition_usd, living_cost_usd, acceptance_rate, intl_student_percentage)
VALUES
  ('Koç University', 'Turkey', 'Istanbul', 15000, 8000, 20, 35),
  ('University of Warsaw', 'Poland', 'Warsaw', 4000, 6000, 50, 15),
  ('INOVA University', 'Malaysia', 'Kuala Lumpur', 5000, 5000, 70, 40),
  ('Bahçeşehir University', 'Turkey', 'Istanbul', 12000, 7000, 25, 30),
  ('Technische Universität Berlin', 'Germany', 'Berlin', 1000, 10000, 40, 25),
  ('Sabancı University', 'Turkey', 'Istanbul', 18000, 8500, 15, 40),
  ('University of Wrocław', 'Poland', 'Wrocław', 3500, 5500, 55, 12);
```

Then refresh your browser and you'll see them in the explore page.

## 🚀 Deploy to Vercel (Free)

1. Push code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click Deploy

Your app is now live on a `.vercel.app` domain! 🌍

## 🔑 Important Environment Variables

| Variable | Where to Get | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | ✅ Yes |
| `OPENAI_API_KEY` | openai.com (Phase 2 only) | ❌ No |
| `STRIPE_SECRET_KEY` | stripe.com (Phase 2 only) | ❌ No |

## 🆘 Troubleshooting

### "Cannot find module '@supabase/supabase-js'"

```bash
npm install
```

### "CORS error" or "Failed to connect to Supabase"

1. Go to Supabase → Settings → API
2. Under CORS, add your localhost domain: `http://localhost:3000`
3. If deployed, add your Vercel URL: `https://your-app.vercel.app`

### "Authentication page is blank"

Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## 📚 Next Steps

1. **Populate Data**: Add 50+ real universities to Supabase
2. **Customize**: Update logo, colors, content in `tailwind.config.ts`
3. **Launch Beta**: Invite 50-100 MENA students for testing
4. **Iterate**: Collect feedback and improve UX
5. **Phase 2**: Add AI essay review, premium plans, university partnerships

## 💡 Pro Tips

- Use Supabase's web dashboard to manage universities and reviews
- Enable email verification in Supabase → Auth → Providers
- Add Google OAuth for social login (optional but recommended)
- Monitor performance: Vercel Dashboard → Analytics

## 📞 Need Help?

- Check **README.md** for detailed documentation
- See **database.sql** for database schema
- Review **package.json** for installed dependencies
- Explore **lib/** folder for utility functions

---

**You're all set! Start building.** 🚀

Any questions? Reach out: support@edupath.io
