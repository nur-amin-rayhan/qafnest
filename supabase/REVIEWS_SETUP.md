# Verified guest reviews setup

1. Apply `migrations/20261031010000_verified_guest_reviews.sql`, `migrations/20261101010000_reviews_ten_point_scale.sql`, `migrations/20261101020000_admin_review_responses.sql`, then `migrations/20261101030000_gathern_style_reviews.sql` to the Supabase project. These add verified review rules, convert ratings to the 10-point scale, enable allow-listed admin replies, and add the four category averages used by the Gathern-style reviews panel.
2. If guests sign in with Firebase, enable Firebase as a third-party provider in Supabase Auth and configure Firebase ID tokens with the `role: "authenticated"` claim. The app forwards the signed-in token to Supabase for review and booking reads.
3. When a trusted payment callback creates a booking for a Firebase guest, store the Firebase UID in `bookings.auth_subject`. Leave `guest_id` null unless that guest also has a matching Supabase profile. Only trusted server code should set `payment_status = 'success'` and `status = 'completed'`.
4. Add each reviewer-admin account in the Supabase SQL editor. Use that account's Supabase user UUID or Firebase UID as `auth_subject`:

   ```sql
   INSERT INTO public.review_admins (auth_subject, display_name)
   VALUES ('ADMIN_AUTH_SUBJECT', 'QafNest Admin')
   ON CONFLICT (auth_subject) DO UPDATE SET display_name = EXCLUDED.display_name;
   ```

   Once allow-listed, the admin signs in and opens `/admin/reviews`. Admin membership cannot be granted from the client; database policies permit only the listed subject to save a public response.

The review API accepts a submission only when the signed-in subject owns the booking, the booking is paid, its checkout date has passed in Saudi Arabia, and its status is `completed`. A unique index permits one review per booking.

Bundled listing reviews are generated demo content for UI previews. They are explicitly labeled as samples and are never inserted into Supabase.

The current checkout endpoint intentionally fails closed until a real payment gateway and verified callback are configured. Real review submissions therefore require a completed booking created by that trusted payment flow.
