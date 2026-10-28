# 🦅 QAFNEST: কমপ্লিট মাস্টার প্ল্যান ও ডেভলপমেন্ট রোডম্যাপ
> **Next.js 14 (App Router) + Supabase (Auth, Database, Storage) + Vercel Deployment**

---

## ১. ওভারভিউ ও প্রজেক্ট লক্ষ্য (Executive Summary)

**QAFNEST** হলো সৌদি আরবের বিলাসবহুল শ্যলে (Chalet), প্রাইভেট ভিলা (Private Villa), ঐতিহ্যবাহী ফার্ম এবং ক্যাম্পিং অবকাশ কেন্দ্র বুকিংয়ের একটি প্রিমিয়াম প্ল্যাটফর্ম।

বর্তমান ফ্রন্টএন্ড স্ট্যাটিক ডেমো ডেটা নির্ভর। এই মাস্টার প্ল্যানের লক্ষ্য হলো:
1. **সুপারবেস (Supabase)** ব্যবহার করে ব্যাকএন্ড, অথেন্টিকেশন, ইউজার ও হোস্ট ম্যানেজমেন্ট, এবং ডেটাবেস সিস্টেম তৈরি করা।
2. গিটহাবে নিরাপদভাবে কোড পুশ করা (ক্রেডেনশিয়ালস প্রোটেক্টেড রেখে)।
3. **Vercel**-এ প্রোডাকশন লাইভ ডেপ্লয়মেন্ট সম্পন্ন করা।
4. পরবর্তীতে ধাপে ধাপে ডেমো ডেটা রিপ্লেস করে রিয়েল হোস্ট লিস্টিং ও সিকিউর বুকিং সিস্টেম কার্যকর করা।

---

## ২. সিস্টেম আর্কিটেকচার (Tech Stack & Architecture)

- **Frontend:** Next.js 14.2 (App Router, React 18, TypeScript)
- **Styling & UI:** Tailwind CSS, Framer Motion, Lenis Smooth Scroll, Lucide Icons
- **Backend & Database:** **Supabase** (Managed PostgreSQL)
- **Authentication & RBAC:** **Supabase Auth** (Email/Password, Phone OTP, Google/Apple OAuth)
- **Security & Authorization:** **Row Level Security (RLS)** + Next.js `middleware.ts`
- **File & Image Storage:** **Supabase Storage** (Buckets for Property Photos & Host KYC Docs)
- **Hosting & CI/CD:** **GitHub** + **Vercel**

```
┌────────────────────────────────────────────────────────┐
│                   Vercel Deployment                    │
│   ┌────────────────────────────────────────────────┐   │
│   │         Next.js 14 Frontend & Middleware       │   │
│   │  (Public Landing, Guest Dash, Host Portal)     │   │
│   └───────────────────────┬────────────────────────┘   │
└───────────────────────────┼────────────────────────────┘
                            │ (Secure HTTPS / Edge SSR)
┌───────────────────────────▼────────────────────────────┐
│                    Supabase Cloud                      │
│   ┌─────────────────┐ ┌───────────────┐ ┌──────────┐   │
│   │  Supabase Auth  │ │ PostgreSQL DB │ │ Storage  │   │
│   │  (Guest / Host) │ │  (RLS Enabled)│ │ (Photos) │   │
│   └─────────────────┘ └───────────────┘ └──────────┘   │
└────────────────────────────────────────────────────────┘
```

---

## ৩. সুপারবেস ডাটাবেস ও ইউজার আর্কিটেকচার (Supabase Schema & SQL)

সুপারবেসে `auth.users` টেবিলটি ডিফল্ট থাকে। আমরা একটি পাবলিক `profiles` টেবিল তৈরি করব যা ইউজার তৈরি হওয়ার সাথে সাথে অটোমেটিক ট্রিগারের মাধ্যমে ডেটা সংরক্ষণ করবে।

### ৩.১ ইউজার রোলস (User Roles)
1. **`guest`**: সাধারণ ব্যবহারকারী (বুকিং, উইশলিস্ট, রিভিউ)।
2. **`host`**: প্রোপার্টির মালিক (লিস্টিং তৈরি, ক্যালেন্ডার ম্যানেজ, আয় হিসাব)।
3. **`admin`**: সুপার অ্যাডমিন (হোস্ট লাইসেন্স ভেরিফিকেশন, প্ল্যাটফর্ম মনিটরিং)।

### ৩.২ Supabase SQL Editor-এ রান করার জন্য প্রস্তুত স্ক্রিপ্ট

```sql
-- ১. ইউজার রোলস এর জন্য ENUM তৈরি
CREATE TYPE user_role AS ENUM ('guest', 'host', 'admin');
CREATE TYPE host_status AS ENUM ('none', 'pending', 'verified', 'suspended');

-- ২. পাবলিক প্রোফাইল টেবিল
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'guest'::user_role NOT NULL,
  host_status host_status DEFAULT 'none'::host_status NOT NULL,
  tourism_license_no TEXT,
  national_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ৩. Row Level Security (RLS) সক্রিয়করণ
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ইউজার শুধু নিজের প্রোফাইল দেখতে ও এডিট করতে পারবে
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ৪. স্বয়ংক্রিয় প্রোফাইল তৈরি করার ট্রিগার (যখন নতুন ইউজার সাইন আপ করবে)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, host_status)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'guest'::user_role),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'host' THEN 'pending'::host_status
      ELSE 'none'::host_status
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ৫. প্রোপার্টি টেবিল (ভবিষ্যতে হোস্টের রিয়েল লিস্টিংয়ের জন্য)
CREATE TABLE public.properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'chalet', 'villa', 'farm', 'camp', 'penthouse'
  city TEXT NOT NULL,     -- 'riyadh', 'jeddah', 'alula', etc.
  specs TEXT,
  base_price DECIMAL NOT NULL,
  images TEXT[] DEFAULT '{}',
  features TEXT[] DEFAULT '{}',
  instant_book BOOLEAN DEFAULT false,
  has_pool BOOLEAN DEFAULT false,
  self_checkin BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- যেকেউ অনুমোদিত প্রোপার্টি দেখতে পারবে
CREATE POLICY "Approved properties are viewable by everyone" 
ON public.properties FOR SELECT USING (is_approved = true OR auth.uid() = host_id);

-- কেবল ভেরিফায়েড হোস্ট নতুন প্রোপার্টি ইনসার্ট করতে পারবে
CREATE POLICY "Verified hosts can create properties" 
ON public.properties FOR INSERT 
WITH CHECK (
  auth.uid() = host_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'host' OR role = 'admin')
  )
);
```

---

## ৪. ডেমো ডেটা ট্রানজিশন পলিসি (Demo Data Transition)

ডেমো ডেটা মুছে ফেলা হবে না, এটি হবে **স্মার্ট ট্রানজিশন**:
1. **Fallback Strategy:**
   - যখন ডাটাবেস সম্পূর্ণ নতুন থাকবে, তখন অ্যাপ বর্তমান [`src/data/properties.ts`](file:///Volumes/APPLE%20SSD/Build/qafnest-next/src/data/properties.ts) থেকে ডেটা দেখাবে।
2. **Database Seeding:**
   - ডেমো ডাটাকে একটি সিড স্ক্রিপ্ট দিয়ে সুপারবেসে ইমপোর্ট করে রাখা যাবে, যাতে প্রথম থেকেই ডাটাবেস কার্যকর থাকে।
3. **Real Host Insertion:**
   - হোস্ট যখন লগইন করে নতুন কোনো লিস্টিং তৈরি করবে, সেটি সরাসরি ডাটাবেসে সেভ হবে এবং হোমপেজের ফিল্টারে যুক্ত হবে।
4. **Admin Toggle:**
   - পরবর্তীতে অ্যাডমিন সেটিংস থেকে এক ক্লিকেই "Show Demo Listings: Off" করা যাবে।

---

## ৫. ক্রেডেনশিয়াল ম্যানেজমেন্ট ও নিরাপদ গিটহাব পুশ (GitHub & Security)

গিটহাবে কোড পুশ করার সময় যেন কোনো গোপন তথ্য ফাঁস না হয়, তার সুনির্দিষ্ট প্রোটোকল:

### ৫.১ ফাইল বিভাজন:
- **`.env.local`**: এতে থাকবে আপনার মূল Supabase API Keys। এই ফাইলটি গিটহাবে **কখনোই আপলোড হবে না** (এটি `.gitignore`-এ যুক্ত আছে)।
- **`.env.example`**: এতে ডামি ভ্যালু থাকবে, যাতে প্রজেক্ট ক্লোন করলে যেকেউ বুঝতে পারে কোন কোন কি (Keys) লাগবে।

### ৫.২ গিটহাব পুশ সিকোয়েন্স:
```bash
# ১. গিট স্ট্যাটাস চেক
git status

# ২. নিশ্চিত হওয়া যে .env.local ফাইলে কোনো কী কমিট হচ্ছে না
# ৩. পরিবর্তনগুলো স্টেজ ও কমিট করা
git add .
git commit -m "feat: complete master plan, supabase schema and env setup"

# ৪. গিটহাব রিমোট যুক্ত করা (যদি এখনো না করা থাকে)
git remote add origin https://github.com/YOUR_USERNAME/qafnest-next.git
git branch -M main

# ৫. গিটহাবে পুশ
git push -u origin main
```

---

## ৬. ভারসেল লাইভ ডেপ্লয়মেন্ট গাইড (Vercel Live Deployment)

1. [vercel.com](https://vercel.com)-এ লগইন করুন এবং **Add New Project** বাটনে ক্লিক করুন।
2. আপনার GitHub অ্যাকাউন্ট কানেক্ট করে `qafnest-next` রিপোজিটরিটি **Import** করুন।
3. **Environment Variables** সেকশনে নিচের তিনটি ভ্যালু দিন:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key` (ঐচ্ছিক/সার্ভার সাইড ব্যবহারের জন্য)
4. **Deploy** বাটনে ক্লিক করুন। ২ মিনিটের মধ্যে আপনার ওয়েবসাইট লাইভ ইউআরএল (যেমন: `qafnest.vercel.app`)-এ চালু হয়ে যাবে!

---

## ৭. সম্পূর্ণ বাস্তবায়ন রোডম্যাপ (Step-by-Step Roadmap)

```
[Phase 1: Setup & Deploy] ──► [Phase 2: Auth & Profiles] ──► [Phase 3: Host Portal]
           │                                │                              │
           ▼                                ▼                              ▼
Supabase Project + Keys             Guest & Host Login             Add/Edit Properties
Git Push & Vercel Live              Role Middleware & Guard         Storage & KYC Upload
           │                                │                              │
           ▼                                ▼                              ▼
[Phase 4: Dynamic Pages]  ──► [Phase 5: Payments]        ──► [Phase 6: Admin Audit]
           │                                │                              │
Property Details (/id)              Tabby, Tamara, Mada            Host Approval Panel
Booking Calendar Locking            Instant SMS/WhatsApp           Final Production Launch
```

### 🔹 ফেজ ১: সুপারবেস সেটআপ ও লাইভ ডেপ্লয়মেন্ট (বর্তমান ধাপ)
- সুপারবেস প্রোজেক্ট ওপেন করে URL ও Anon Key সংগ্রহ।
- `.env.local` কনফিগারেশন।
- `@supabase/ssr` ও `@supabase/supabase-js` লাইব্রেরি ইন্সটলেশন।
- গিটহাবে পুশ এবং ভারসেলে লাইভ করা।

### 🔹 ফেজ ২: অথেন্টিকেশন ও ইউজার সিস্টেম (Guest & Host)
- ইউনিফাইড সাইন-ইন ও সাইন-আপ মোডাল/পেজ তৈরি।
- হোস্ট রেজিস্ট্রেশনের জন্য পৃথক অনবোর্ডিং (ট্যুরিজম লাইসেন্স ফিল্ড সহ)।
- Next.js Middleware তৈরি করে হোস্ট রুট প্রটেক্ট করা (`/dashboard/host/*`)।

### 🔹 ফেজ ৩: হোস্ট প্রোপার্টি লিস্টিং ও সুপারবেস স্টোরেজ
- হোস্টদের জন্য নতুন প্রোপার্টি যোগ করার মাল্টিপল-স্টেপ ফর্ম।
- প্রোপার্টির ছবি আপলোডের জন্য Supabase Storage Bucket সেটআপ।
- লিস্টিং এডিট এবং প্রাইস ম্যানেজমেন্ট ড্যাশবোর্ড।

### 🔹 ফেজ ৪: ডাইনামিক প্রোপার্টি ও বুকিং ইঞ্জিন
- `/properties/[id]` ডাইনামিক পেজ তৈরি (ফটো গ্যালারি, সুবিধা, হোস্ট ডিটেইলস)।
- লাইভ বুকিং ক্যালেন্ডার (বুক করা ডেট স্বয়ংক্রিয় লক হয়ে যাওয়া)।
- প্রাইস সামারি ও ট্যাক্স ক্যালকুলেটর।

### 🔹 ফেজ ৫: পেমেন্ট গেটওয়ে ও কনফার্মেশন অটোমেশন
- সৌদি পেমেন্ট গেটওয়ে (Mada, Apple Pay, Tabby/Tamara) ওয়েব-হুক ইন্টিগ্রেশন।
- পেমেন্ট কনফার্মেশনের পর স্বয়ংক্রিয় স্মার্ট লক পিন প্রদান ও মেসেজিং।

### 🔹 ফেজ ৬: সুপার অ্যাডমিন ও প্রোডাকশন হার্ডেনিং
- অ্যাডমিনদের জন্য হোস্ট লাইসেন্স ও লিস্টিং রিভিউ ড্যাশবোর্ড।
- সিকিউরিটি হেডার্স ও রেট লিমিটিং পলিসি ফাইনাল অডিট।
