/**
 * Automated Verification Script for QafNest Host Settings System
 * Tests:
 * 1. GET /api/host/settings response schema (profile, payout, notifications, security)
 * 2. Unauthenticated access security rejection (401)
 * 3. PUT /api/host/settings - Profile update
 * 4. PUT /api/host/settings - Payout & IBAN update with SAMA validation
 * 5. PUT /api/host/settings - Notification preferences update
 * 6. PUT /api/host/settings - Security & password updates
 */

const HOST_API_BASE = "http://localhost:3001/api/host";
const DEV_HOST_ID = "00000000-0000-0000-0000-000000000002";

async function runTests() {
  console.log("========================================================");
  console.log("⚙️  QAFNEST HOST SETTINGS & SECURITY VERIFICATION SUITE");
  console.log("========================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✔ PASS: ${message}`);
      passed++;
    } else {
      console.error(`✖ FAIL: ${message}`);
      failed++;
    }
  }

  // --- SECTION 1: AUTHENTICATION ENFORCEMENT ---
  console.log("\n--- SECTION 1: SECURITY & AUTHENTICATION ENFORCEMENT ---");

  const unauthRes = await fetch(`${HOST_API_BASE}/settings`);
  assert(unauthRes.status === 401, "GET /api/host/settings rejects unauthenticated request (401)");

  const unauthPut = await fetch(`${HOST_API_BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ section: "profile", data: {} }),
  });
  assert(unauthPut.status === 401, "PUT /api/host/settings rejects unauthenticated request (401)");

  // --- SECTION 2: GET HOST SETTINGS SCHEMA ---
  console.log("\n--- SECTION 2: HOST SETTINGS RETRIEVAL & SCHEMA VALIDATION ---");

  const authHeaders = {
    "Content-Type": "application/json",
    "x-dev-host-id": DEV_HOST_ID,
  };

  const getRes = await fetch(`${HOST_API_BASE}/settings`, {
    headers: authHeaders,
  });
  assert(getRes.status === 200, "GET /api/host/settings returns HTTP 200 with dev auth");

  const getData = await getRes.json();
  assert(getData.success === true, "GET response contains success: true");
  assert(Boolean(getData.settings?.profile), "Settings contain profile section");
  assert(Boolean(getData.settings?.payout), "Settings contain payout section");
  assert(Boolean(getData.settings?.notifications), "Settings contain notifications section");
  assert(Boolean(getData.settings?.security), "Settings contain security section");

  assert(
    typeof getData.settings.profile.fullName === "string",
    "Profile contains host full name"
  );
  assert(
    typeof getData.settings.payout.iban === "string",
    "Payout contains IBAN string"
  );
  assert(
    typeof getData.settings.notifications.smsAlerts === "boolean",
    "Notifications contain smsAlerts boolean"
  );
  assert(
    typeof getData.settings.security.twoFactorEnabled === "boolean",
    "Security contains twoFactorEnabled boolean"
  );

  // --- SECTION 3: PERSONAL INFORMATION UPDATE ---
  console.log("\n--- SECTION 3: PERSONAL INFORMATION UPDATE ---");

  const updateProfileRes = await fetch(`${HOST_API_BASE}/settings`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      section: "profile",
      data: {
        fullName: "Renad Al-Mutairi",
        city: "الرياض",
        bio: "Updated host bio description for luxury hospitality.",
      },
    }),
  });
  assert(updateProfileRes.status === 200, "PUT profile updates successfully with 200");
  const updateProfileJson = await updateProfileRes.json();
  assert(updateProfileJson.success === true, "Profile update returns success: true");
  assert(
    updateProfileJson.profile.fullName === "Renad Al-Mutairi",
    "Profile returns updated full name"
  );

  // --- SECTION 4: PAYOUT & IBAN UPDATE ---
  console.log("\n--- SECTION 4: PAYOUT METHODS & IBAN SAMA VALIDATION ---");

  const updatePayoutRes = await fetch(`${HOST_API_BASE}/settings`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      section: "payout",
      data: {
        iban: "SA4480000418608010049262",
        accountHolder: "Renad Al-Mutairi",
        payoutSchedule: "instant",
        minimumPayoutThreshold: 500,
        autoDisburse: true,
      },
    }),
  });
  assert(updatePayoutRes.status === 200, "PUT payout updates successfully with 200");
  const updatePayoutJson = await updatePayoutRes.json();
  assert(updatePayoutJson.success === true, "Payout update returns success: true");
  assert(
    updatePayoutJson.payout.bankNameEn === "Al Rajhi Bank" || updatePayoutJson.payout.bankNameAr === "مصرف الراجحي",
    "Payout accurately detects Al Rajhi Bank from SAMA IBAN"
  );
  assert(
    updatePayoutJson.payout.minimumPayoutThreshold === 500,
    "Payout updates minimum threshold to 500 SAR"
  );

  // --- SECTION 5: NOTIFICATION PREFERENCES UPDATE ---
  console.log("\n--- SECTION 5: NOTIFICATION PREFERENCES UPDATE ---");

  const updateNotifRes = await fetch(`${HOST_API_BASE}/settings`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      section: "notifications",
      data: {
        smsAlerts: true,
        whatsappAlerts: true,
        emailAlerts: true,
        newBookingAlert: true,
        guestMessageAlert: true,
        payoutAlert: true,
      },
    }),
  });
  assert(updateNotifRes.status === 200, "PUT notifications updates successfully with 200");
  const updateNotifJson = await updateNotifRes.json();
  assert(updateNotifJson.success === true, "Notification preferences return success: true");
  assert(
    updateNotifJson.notifications.whatsappAlerts === true,
    "WhatsApp alerts preference enabled"
  );

  // --- SECTION 6: SECURITY & PASSWORD SETTINGS ---
  console.log("\n--- SECTION 6: SECURITY & PASSWORD SETTINGS ---");

  // Rejects short passwords
  const shortPassRes = await fetch(`${HOST_API_BASE}/settings`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      section: "security",
      data: {
        action: "update_password",
        password: "123",
      },
    }),
  });
  assert(shortPassRes.status === 400, "Short password (< 8 chars) is securely rejected with 400");

  // Valid password update
  const validPassRes = await fetch(`${HOST_API_BASE}/settings`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      section: "security",
      data: {
        action: "update_password",
        password: "StrongPassword2026!",
      },
    }),
  });
  assert(validPassRes.status === 200, "Valid password update returns HTTP 200");

  // Terminate other sessions
  const terminateRes = await fetch(`${HOST_API_BASE}/settings`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify({
      section: "security",
      data: {
        action: "terminate_sessions",
      },
    }),
  });
  assert(terminateRes.status === 200, "Terminate other sessions returns HTTP 200");
  const terminateJson = await terminateRes.json();
  assert(
    terminateJson.result.activeSessionsCount === 1,
    "Active sessions count reduced to 1"
  );

  console.log("\n========================================================");
  console.log(`📊 HOST SETTINGS VERIFICATION SUMMARY:`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);
  console.log("========================================================");

  if (failed > 0) process.exit(1);
}

runTests();

