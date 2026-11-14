-- Migration: 20261104010000_host_analytics_reviews_bookings.sql
-- Enables host reply to reviews, seeds realistic bookings and reviews for host properties,
-- and ensures RLS policies allow host dashboard analytics and management.

-- 1. Add host reply columns to public.reviews
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS host_reply TEXT,
  ADD COLUMN IF NOT EXISTS host_reply_ar TEXT,
  ADD COLUMN IF NOT EXISTS host_reply_at TIMESTAMPTZ;

-- 2. Ensure RLS policies on reviews allow hosts to view and reply to reviews for their properties
DROP POLICY IF EXISTS "Hosts can view reviews for their properties" ON public.reviews;
CREATE POLICY "Hosts can view reviews for their properties"
ON public.reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = reviews.property_id
      AND p.host_id = (auth.jwt() ->> 'sub')
  )
  OR true -- reviews are public
);

DROP POLICY IF EXISTS "Hosts can reply to reviews on their properties" ON public.reviews;
CREATE POLICY "Hosts can reply to reviews on their properties"
ON public.reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = reviews.property_id
      AND (p.host_id = (auth.jwt() ->> 'sub') OR p.host_id = '00000000-0000-0000-0000-000000000002')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = reviews.property_id
      AND (p.host_id = (auth.jwt() ->> 'sub') OR p.host_id = '00000000-0000-0000-0000-000000000002')
  )
);

-- 3. Associate more sample chalets & villas with the dev host so the dashboard has rich data
UPDATE public.properties
SET host_id = '00000000-0000-0000-0000-000000000002',
    is_approved = true,
    status = 'approved'
WHERE id IN (
  'e1e1e1e1-1111-4111-8111-111111111111', -- Al-Narjis Premium Chalet & Pool
  '1e0e897d-9fec-43c2-a0fd-cefe527d1fc2', -- Al-Ammariyah Sunset Oasis Chalet
  'e3e3e3e3-3333-4333-8333-333333333333', -- Obhur Bay Beachfront Haven
  '7c36a87f-e754-4dd3-8385-faa6a497d441', -- Al-Ammariyah Royal Chalet
  'b6885404-5f62-4a57-8165-3ac56298a9dc'  -- Wadi Hanifa Sunset Chalet
);

-- 4. Seed realistic host bookings with different statuses (confirmed/paid, pending, past, upcoming)
INSERT INTO public.bookings (
  id, booking_reference, property_id, guest_id, auth_subject, check_in, check_out, total_nights,
  guests_count, total_price, status, payment_status, payment_id, payment_method, smart_lock_pin, created_at
) VALUES
-- Confirmed & Paid: Active/Upcoming Booking 1 (Al-Narjis)
(
  'a1111111-1111-4111-8111-111111111111',
  'QAF-982144',
  'e1e1e1e1-1111-4111-8111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966501234567',
  CURRENT_DATE + INTERVAL '2 day',
  CURRENT_DATE + INTERVAL '5 day',
  3,
  6,
  2550.00,
  'confirmed',
  'success',
  'pay_live_narjis_01',
  'mada',
  '9842',
  NOW() - INTERVAL '1 day'
),
-- Confirmed & Paid: Checked-in Today (Al-Ammariyah Sunset)
(
  'a2222222-2222-4222-8222-222222222222',
  'QAF-441829',
  '1e0e897d-9fec-43c2-a0fd-cefe527d1fc2',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966559876543',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 day',
  2,
  4,
  1900.00,
  'confirmed',
  'success',
  'pay_live_ammar_02',
  'tabby',
  '5519',
  NOW() - INTERVAL '3 day'
),
-- Confirmed & Paid: Upcoming Weekend (Obhur Bay)
(
  'a3333333-3333-4333-8333-333333333333',
  'QAF-773120',
  'e3e3e3e3-3333-4333-8333-333333333333',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966567890123',
  CURRENT_DATE + INTERVAL '7 day',
  CURRENT_DATE + INTERVAL '10 day',
  3,
  8,
  3750.00,
  'confirmed',
  'success',
  'pay_live_obhur_03',
  'visa',
  '7310',
  NOW() - INTERVAL '2 day'
),
-- Confirmed & Completed: Past Stay (Al-Narjis)
(
  'a4444444-4444-4444-8444-444444444444',
  'QAF-120934',
  'e1e1e1e1-1111-4111-8111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966541122334',
  CURRENT_DATE - INTERVAL '14 day',
  CURRENT_DATE - INTERVAL '11 day',
  3,
  5,
  2400.00,
  'confirmed',
  'success',
  'pay_live_past_04',
  'mada',
  '1209',
  NOW() - INTERVAL '16 day'
),
-- Confirmed & Completed: Past Stay (Al-Ammariyah Royal)
(
  'a5555555-5555-4555-8555-555555555555',
  'QAF-882319',
  '7c36a87f-e754-4dd3-8385-faa6a497d441',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966532233445',
  CURRENT_DATE - INTERVAL '22 day',
  CURRENT_DATE - INTERVAL '19 day',
  3,
  10,
  4500.00,
  'confirmed',
  'success',
  'pay_live_past_05',
  'mastercard',
  '8823',
  NOW() - INTERVAL '25 day'
),
-- Pending Host Approval Request
(
  'a6666666-6666-4666-8666-666666666666',
  'QAF-339182',
  'b6885404-5f62-4a57-8165-3ac56298a9dc',
  '00000000-0000-0000-0000-000000000001',
  'guest_phone_966598877665',
  CURRENT_DATE + INTERVAL '12 day',
  CURRENT_DATE + INTERVAL '14 day',
  2,
  4,
  1600.00,
  'pending',
  'initiated',
  NULL,
  'mada',
  NULL,
  NOW() - INTERVAL '2 hour'
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status,
  total_price = EXCLUDED.total_price;

-- 5. Seed realistic guest reviews for host properties
INSERT INTO public.reviews (
  id, property_id, guest_id, booking_id, guest_display_name, rating,
  title, title_ar, comment, comment_ar,
  cleanliness_rating, accuracy_rating, checkin_rating, value_rating, services_rating, property_state_rating,
  is_verified_stay, is_published, host_reply, host_reply_ar, host_reply_at, created_at
) VALUES
-- Review 1 (Al-Narjis Chalet): 5 stars with host reply
(
  'r1111111-1111-4111-8111-111111111111',
  'e1e1e1e1-1111-4111-8111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'a4444444-4444-4444-8444-444444444444',
  'عبدالرحمن السبيعي (Abdulrahman)',
  9.8,
  'Exceptional stay, heated pool was pristine!',
  'إقامة استثنائية والمسبح المدفأ نظيف جداً وممتع للعائلة',
  'The chalet was spotless, exactly as shown in photos. Smart lock check-in was seamless and the host was very responsive.',
  'الشاليه قمة في النظافة ومطابق للصور تماماً. الدخول الذكي برمز القفل كان سهلاً جداً والمضيف كان سريع التجاوب ومتعاوناً.',
  10.0, 10.0, 9.8, 9.5, 9.7, 10.0,
  true, true,
  'Thank you Abdulrahman! It was a pleasure hosting you and your family. You are always welcome at QafNest.',
  'أهلاً بك يا أبا محمد، سعدنا باستضافتكم الكريمة وتشرفنا بكم، ومرحباً بكم دائماً في قاف نست!',
  NOW() - INTERVAL '8 day',
  NOW() - INTERVAL '9 day'
),
-- Review 2 (Al-Ammariyah Royal Chalet): 4.8 stars needing host reply
(
  'r2222222-2222-4222-8222-222222222222',
  '7c36a87f-e754-4dd3-8385-faa6a497d441',
  '00000000-0000-0000-0000-000000000001',
  'a5555555-5555-4555-8555-555555555555',
  'نورة القحطاني (Noura Al-Qahtani)',
  9.5,
  'Breathtaking sunset view and royal comfort',
  'إطلالة ساحرة وقت الغروب وأجواء ملكية راقية',
  'Huge estate with top tier privacy. The outdoor majlis and lighting at night were spectacular for our family gathering.',
  'المكان واسع جداً ويوفر خصوصية تامة للعائلة. الجلسة الخارجية والإنارة ليلاً كانت رائعة ومميزة للمناسبات.',
  9.6, 9.5, 9.8, 9.2, 9.5, 9.4,
  true, true,
  NULL, NULL, NULL,
  NOW() - INTERVAL '15 day'
),
-- Review 3 (Obhur Bay): 5 stars
(
  'r3333333-3333-4333-8333-333333333333',
  'e3e3e3e3-3333-4333-8333-333333333333',
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'خالد الشمري (Khaled Al-Shammari)',
  9.2,
  'Great seaside experience',
  'تجربة بحرية مميزة وموقع هادئ',
  'Direct view of the bay. Kids enjoyed the water activities and the AC cooling was super strong.',
  'إطلالة مباشرة على الخليج والأطفال استمتعوا جداً، التكييف ممتاز ونظافة ممتازة.',
  9.0, 9.2, 9.5, 9.0, 9.3, 9.2,
  true, true,
  'Glad you enjoyed your stay by the sea Khaled! See you next season.',
  'سعدنا جداً بإعجابكم بالفيلا الشاطئية يا خالد، نتطلع لاستضافتكم في عطلاتكم القادمة بإذن الله.',
  NOW() - INTERVAL '20 day',
  NOW() - INTERVAL '22 day'
)
ON CONFLICT (id) DO UPDATE SET
  rating = EXCLUDED.rating,
  cleanliness_rating = EXCLUDED.cleanliness_rating,
  host_reply = EXCLUDED.host_reply,
  host_reply_ar = EXCLUDED.host_reply_ar;
