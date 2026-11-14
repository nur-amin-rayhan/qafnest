import crypto from "node:crypto";

const GUEST_URL = "http://localhost:3000";
const HOST_URL = "http://localhost:3001";
const CMS_URL = "http://localhost:3002/cms";
const ADMIN_URL = "http://localhost:3003/admin";

const ADMIN_SECRET_KEY = "qafnest_secure_admin_jwt_signature_secret_key_2026";
const DEV_HOST_ID = "00000000-0000-0000-0000-000000000002";

function generateAdminToken() {
  const data = Buffer.from(
    JSON.stringify({
      email: "admin@qafnest.com",
      role: "admin",
      exp: Date.now() + 3600000,
    })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ADMIN_SECRET_KEY)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

async function runE2ETests() {
  console.log("\n========================================================");
  console.log("🧪 QAFNEST END-TO-END (E2E) COMPREHENSIVE VERIFICATION");
  console.log("   Testing Finance, Payouts, ZATCA Invoices & Security");
  console.log("========================================================\n");

  let passedCount = 0;
  let failedCount = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`⏳ ${name}... `);
      await fn();
      console.log(`\x1b[32m✔ PASS\x1b[0m`);
      passedCount++;
    } catch (err) {
      console.log(`\x1b[31m✖ FAIL\x1b[0m`);
      console.error(`   Error: ${err.message}`);
      failedCount++;
    }
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message || "Assertion failed");
    }
  }

  // 1. Port Health Checks
  await test("1.1 Dev Server Guest Port 3000 is Healthy", async () => {
    const res = await fetch(`${GUEST_URL}/`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("1.2 Dev Server Host Port 3001 is Healthy", async () => {
    const res = await fetch(`${HOST_URL}/`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await test("1.3 Dev Server Admin Port 3003 is Healthy", async () => {
    const res = await fetch(`${ADMIN_URL}/login`, { redirect: "manual" });
    assert(res.status === 200 || res.status === 307 || res.status === 308, `Expected 200, 307, or 308, got ${res.status}`);
  });

  // 2. Guest Flow & Invoicing
  await test("2.1 Guest App /my-bookings Route is Accessible", async () => {
    const res = await fetch(`${GUEST_URL}/my-bookings`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const text = await res.text();
    assert(text.includes("Qaf") || text.includes("bookings"), "Expected booking page content");
  });

  await test("2.2 Guest Property Search Route is Accessible", async () => {
    const res = await fetch(`${GUEST_URL}/search?category=chalet`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // 3. Host Financials & Invoices Security & API
  await test("3.1 Host Financials rejects unauthenticated requests (Security Check)", async () => {
    const res = await fetch(`${HOST_URL}/api/host/financials`);
    assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
  });

  let hostFinancialsData;
  await test("3.2 Host Financials returns computed KPIs & remittances with dev auth", async () => {
    const res = await fetch(`${HOST_URL}/api/host/financials`, {
      headers: { "x-dev-host-id": DEV_HOST_ID },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    hostFinancialsData = await res.json();
    assert(hostFinancialsData.success === true, "Expected success: true");
    assert(hostFinancialsData.kpis?.totalGrossRevenue, "Expected totalGrossRevenue KPI");
    assert(hostFinancialsData.iban?.iban, "Expected host IBAN");
    assert(Array.isArray(hostFinancialsData.remittances), "Expected remittances array");
    assert(Array.isArray(hostFinancialsData.vatInvoices), "Expected vatInvoices array");
  });

  await test("3.3 Host Remittances contain detailed guest booking items", async () => {
    const rem = hostFinancialsData.remittances[0];
    assert(rem && rem.id.startsWith("TR-"), "Expected remittance ID starting with TR-");
    assert(Array.isArray(rem.bookings) && rem.bookings.length > 0, "Expected included bookings");
    assert(rem.bookings[0].bookingReference, "Expected booking reference in breakdown");
  });

  await test("3.4 Host IBAN Update enforces SAMA Validation (Rejects invalid IBAN)", async () => {
    const res = await fetch(`${HOST_URL}/api/host/financials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dev-host-id": DEV_HOST_ID,
      },
      body: JSON.stringify({
        action: "update_iban",
        iban: "INVALID12345",
        accountHolder: "Renad Al-Mutairi",
      }),
    });
    assert(res.status === 500 || res.status === 400, `Expected validation failure, got ${res.status}`);
  });

  await test("3.5 Host IBAN Update validates & detects Alinma Bank successfully", async () => {
    const res = await fetch(`${HOST_URL}/api/host/financials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dev-host-id": DEV_HOST_ID,
      },
      body: JSON.stringify({
        action: "update_iban",
        iban: "SA4405000000000000000000",
        accountHolder: "Renad Al-Mutairi",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
    assert(data.iban.bankNameAr === "مصرف الإنماء", `Expected Alinma Bank, got ${data.iban.bankNameAr}`);
  });

  await test("3.6 Host Instant Payout Request generates new pending remittance", async () => {
    const res = await fetch(`${HOST_URL}/api/host/financials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dev-host-id": DEV_HOST_ID,
      },
      body: JSON.stringify({
        action: "request_payout",
        amount: 850,
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
    assert(data.remittance?.status === "processing", "Expected processing status for payout");
  });

  await test("3.7 Host Settlement Statement and active dispute adjustments returned", async () => {
    const res = await fetch(`${HOST_URL}/api/host/financials`, {
      headers: { "x-dev-host-id": DEV_HOST_ID },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.settlement, "Expected settlement object");
    assert(typeof data.settlement.grossRevenue === "number", "Expected numeric grossRevenue");
    assert(Array.isArray(data.settlement.adjustments), "Expected adjustments array");
    assert(data.settlement.settings?.payoutFrequency, "Expected payoutFrequency setting");
  });

  await test("3.8 Host Settlement Settings Update successfully updates preferences", async () => {
    const res = await fetch(`${HOST_URL}/api/host/financials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dev-host-id": DEV_HOST_ID,
      },
      body: JSON.stringify({
        action: "update_settlement_settings",
        settings: {
          payoutFrequency: "biweekly",
          minPayoutThreshold: 1000,
          autoReleaseAfterCheckin: true,
          notifySms: true,
        },
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
    assert(data.settings?.payoutFrequency === "biweekly", "Expected biweekly frequency");
    assert(data.settings?.minPayoutThreshold === 1000, "Expected min payout threshold 1000");
  });

  await test("3.9 Host Settlement Statement CSV Export generates valid file", async () => {
    const res = await fetch(`${HOST_URL}/api/host/financials?format=statement_csv`, {
      headers: { "x-dev-host-id": DEV_HOST_ID },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const csv = await res.text();
    assert(csv.includes("Item_Type"), "Expected Item_Type column in statement CSV");
    assert(csv.includes("GROSS-SALES"), "Expected GROSS-SALES reference");
  });

  // 4. Admin Operations & Governance
  const adminToken = generateAdminToken();

  await test("4.1 Admin Financials rejects unauthenticated access (Security Check)", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/financials`);
    assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
  });

  let adminFinancialsData;
  await test("4.2 Admin Financials returns GMV, commissions & Payouts Ledger with session", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/financials`, {
      headers: { cookie: `qafnest_admin_session=${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    adminFinancialsData = await res.json();
    assert(adminFinancialsData.success === true, "Expected success: true");
    assert(adminFinancialsData.metrics?.totalGrossVolume > 0, "Expected GMV > 0");
    assert(Array.isArray(adminFinancialsData.payouts), "Expected payouts array");
    assert(Array.isArray(adminFinancialsData.invoices), "Expected invoices array");
  });

  await test("4.3 Admin Payout Status update (PATCH) sets payout to disbursed", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/financials`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: `qafnest_admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        payoutId: "pay-002",
        status: "disbursed",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
    assert(data.payout.status === "disbursed", "Expected status to be disbursed");
    assert(data.payout.disbursedAt, "Expected disbursedAt timestamp");
  });

  await test("4.4 Admin SAMA SARIE Batch Export generates authentic CSV", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/financials?format=csv`, {
      headers: { cookie: `qafnest_admin_session=${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const csv = await res.text();
    assert(csv.includes("Transfer_Reference"), "Expected Transfer_Reference column");
    assert(csv.includes("Beneficiary_IBAN"), "Expected Beneficiary_IBAN column");
    assert(csv.includes("Net_Payout_SAR"), "Expected Net_Payout_SAR column");
  });

  await test("4.5 Admin ZATCA Tax Journal Export generates authentic CSV", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/financials?format=tax_journal_csv`, {
      headers: { cookie: `qafnest_admin_session=${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const csv = await res.text();
    assert(csv.includes("Invoice_Number"), "Expected Invoice_Number column");
    assert(csv.includes("VAT_Amount_SAR"), "Expected VAT_Amount_SAR column");
    assert(csv.includes("ZATCA_Status"), "Expected ZATCA_Status column");
  });

  await test("4.6 Admin Payout Hold with Custom Dispute Reason", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/financials`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: `qafnest_admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        payoutId: "pay-003",
        status: "on_hold",
        holdReason: "Guest Damage Dispute under Investigation",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
    assert(data.payout.status === "on_hold", "Expected on_hold status");
    assert(data.payout.holdReason === "Guest Damage Dispute under Investigation", "Expected holdReason preserved");
  });

  await test("4.7 Admin Batch Update Payouts to Processing", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/financials`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: `qafnest_admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        action: "batch_update_status",
        payoutIds: ["pay-002", "pay-003"],
        status: "processing",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
    assert(data.payouts.length === 2, "Expected 2 payouts updated");
  });

  await test("4.8 Admin SAMA SARIE Settlement Batch Process", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/financials`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: `qafnest_admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        action: "process_settlement",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
    assert(typeof data.settledCount === "number", "Expected numeric settledCount");
  });

  // 5. ZATCA Phase 2 (Fatoorah) E-Invoicing Compliance Engine
  await test("5.1 ZATCA Endpoint rejects unauthenticated access (Security Check)", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/zatca`);
    assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
  });

  let egsStateBefore;
  await test("5.2 ZATCA GET returns EGS Device State & Active CSID Certificate", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/zatca`, {
      headers: { cookie: `qafnest_admin_session=${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
    assert(data.egs?.egsSerialNumber === "QAFNEST-EGS-RIYADH-01", "Expected valid EGS serial");
    assert(data.egs?.csidStatus === "Active & Valid", "Expected active CSID");
    assert(typeof data.egs?.currentIcv === "number", "Expected numeric ICV");
    egsStateBefore = data.egs;
  });

  let inspectedXmlData;
  await test("5.3 ZATCA inspect_xml generates canonical UBL 2.1 XML & SHA-256 Hash", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/zatca`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `qafnest_admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        action: "inspect_xml",
        invoiceId: "inv_adm_001",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    inspectedXmlData = await res.json();
    assert(inspectedXmlData.success === true, "Expected success: true");
    assert(inspectedXmlData.xml?.includes("<Invoice"), "Expected UBL 2.1 XML <Invoice> root tag");
    assert(inspectedXmlData.xml?.includes("PIH"), "Expected Previous Invoice Hash reference");
    assert(inspectedXmlData.hash, "Expected computed SHA-256 invoice hash");
    assert(inspectedXmlData.signature, "Expected digital signature");
  });

  await test("5.4 ZATCA report clears invoice, advances ICV & chains PIH", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/zatca`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `qafnest_admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        action: "report",
        invoiceId: "inv_adm_001",
      }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const reportData = await res.json();
    assert(reportData.success === true, "Expected success: true");
    assert(reportData.clearanceStatus === "REPORTED", "Expected REPORTED clearance status");
    assert(reportData.validationResults?.status === "PASS", "Expected validation PASS");

    // Verify state progression
    const checkRes = await fetch(`${ADMIN_URL}/api/admin/zatca`, {
      headers: { cookie: `qafnest_admin_session=${adminToken}` },
    });
    const checkData = await checkRes.json();
    assert(checkData.egs.currentIcv === egsStateBefore.currentIcv + 1, "Expected ICV to increment by 1");
    assert(checkData.egs.latestPih === reportData.invoiceHash, "Expected latest PIH to match reported hash");
  });

  await test("5.5 ZATCA download_xml delivers application/xml attachment", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/zatca?action=download_xml&invoiceId=inv_adm_001`, {
      headers: { cookie: `qafnest_admin_session=${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.headers.get("content-type")?.includes("application/xml"), "Expected application/xml content-type");
    const xml = await res.text();
    assert(xml.startsWith("<?xml") && xml.includes("urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"), "Expected authentic UBL 2.1 header");
  });

  await test("5.6 ZATCA Live Developer Portal Gateway Handshake connects to gw-fatoora.zatca.gov.sa", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/zatca`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `qafnest_admin_session=${adminToken}`,
      },
      body: JSON.stringify({ action: "test_handshake" }),
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
    assert(data.handshake?.connected === true, "Expected gateway handshake connected");
    assert(data.handshake?.gatewayUrl.includes("zatca.gov.sa"), "Expected official zatca.gov.sa domain");
    assert(data.handshake?.latencyMs > 0, "Expected positive network latency");
  });

  console.log("\n--- SECTION 6: PLATFORM FEE CONFIGURATION & SIMULATION ---");

  await test("6.1 Admin Platform Fee GET returns valid configuration", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/financials/fees`, {
      headers: { cookie: `qafnest_admin_session=${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
    assert(typeof data.config.baseCommissionPercent === "number", "Expected numeric baseCommissionPercent");
    assert(data.config.baseCommissionPercent >= 5 && data.config.baseCommissionPercent <= 30, "Expected valid percentage range");
  });

  await test("6.2 Admin Platform Fee POST updates commission rate and audit trail", async () => {
    // Read original
    const initialRes = await fetch(`${ADMIN_URL}/api/admin/financials/fees`, {
      headers: { cookie: `qafnest_admin_session=${adminToken}` },
    });
    const initialData = await initialRes.json();
    const originalRate = initialData.config.baseCommissionPercent;

    // Update to 14%
    const updateRes = await fetch(`${ADMIN_URL}/api/admin/financials/fees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `qafnest_admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        baseCommissionPercent: 14,
        lastUpdatedBy: "Super Admin (Finance Officer)",
        notes: "E2E automated test commission update",
      }),
    });
    assert(updateRes.status === 200, `Expected 200, got ${updateRes.status}`);
    const updateData = await updateRes.json();
    assert(updateData.success === true, "Expected success: true");
    assert(updateData.config.baseCommissionPercent === 14, "Expected commission rate updated to 14");
    assert(typeof updateData.config.lastUpdatedBy === "string" && updateData.config.lastUpdatedBy.length > 0, "Expected audit trail user set");

    // Revert back to original rate
    const revertRes = await fetch(`${ADMIN_URL}/api/admin/financials/fees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `qafnest_admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        baseCommissionPercent: originalRate,
        notes: "E2E automated test rollback to original rate",
      }),
    });
    assert(revertRes.status === 200, `Expected 200 on revert, got ${revertRes.status}`);
    const revertData = await revertRes.json();
    assert(revertData.config.baseCommissionPercent === originalRate, `Expected rate restored to ${originalRate}`);
  });

  await test("6.3 Admin Platform Fee Simulator accurately calculates breakdown", async () => {
    const res = await fetch(`${ADMIN_URL}/api/admin/financials/fees?simulate_amount=2000`, {
      headers: { cookie: `qafnest_admin_session=${adminToken}` },
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const data = await res.json();
    assert(data.success === true, "Expected success: true");
    const calc = data.calculation;
    assert(calc.grossAmount === 2000, "Expected gross amount 2000");
    assert(calc.appliedRatePercent > 0, "Expected positive rate percent");
    const expectedFee = Math.round(2000 * (calc.appliedRatePercent / 100) * 100) / 100;
    assert(calc.commissionAmount === expectedFee, `Expected fee ${expectedFee}, got ${calc.commissionAmount}`);
    const expectedVat = Math.round(calc.commissionAmount * 0.15 * 100) / 100;
    assert(calc.vatAmount === expectedVat, `Expected VAT ${expectedVat}, got ${calc.vatAmount}`);
    assert(calc.netHostPayout === Math.round((calc.grossAmount - calc.totalDeductions) * 100) / 100, "Expected net host payout calculation");
  });

  await test("6.4 Real-Time Sync: Admin Base Commission synchronizes with Guest App Service Fee", async () => {
    const beforeRes = await fetch(`${ADMIN_URL}/api/admin/financials/fees`, {
      headers: { cookie: `qafnest_admin_session=${adminToken}` },
    });
    const beforeData = await beforeRes.json();
    const originalCfg = beforeData?.config || {};

    try {
      // 1. Admin sets commission to 13%
      const updateRes = await fetch(`${ADMIN_URL}/api/admin/financials/fees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `qafnest_admin_session=${adminToken}`,
        },
        body: JSON.stringify({
          baseCommissionPercent: 13,
          lastUpdatedBy: "Super Admin (Finance Officer)",
        }),
      });
      assert(updateRes.status === 200, `Expected 200 from admin update, got ${updateRes.status}`);

      // 2. Query Guest App platform fees endpoint
      const guestRes = await fetch(`${GUEST_URL}/api/platform/fees`);
      assert(guestRes.status === 200, `Expected 200 from guest fee api, got ${guestRes.status}`);
      const guestData = await guestRes.json();
      assert(guestData.success === true, "Expected success: true from guest fee api");
      assert(guestData.baseCommissionPercent === 13, `Expected guest baseCommissionPercent 13, got ${guestData.baseCommissionPercent}`);
      assert(guestData.serviceFeeRate === 0.13, `Expected guest serviceFeeRate 0.13, got ${guestData.serviceFeeRate}`);
      assert(guestData.serviceFeePercent === 13, `Expected guest serviceFeePercent 13, got ${guestData.serviceFeePercent}`);
      assert(guestData.syncGuestServiceFee === true, "Expected syncGuestServiceFee to be true");
    } finally {
      await fetch(`${ADMIN_URL}/api/admin/financials/fees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: `qafnest_admin_session=${adminToken}`,
        },
        body: JSON.stringify({
          baseCommissionPercent: originalCfg.baseCommissionPercent ?? 15,
          welcomeBonusAmountSar: originalCfg.welcomeBonusAmountSar ?? 50,
          welcomeBonusEnabled: originalCfg.welcomeBonusEnabled ?? true,
          lastUpdatedBy: originalCfg.lastUpdatedBy || "admin@qafnest.com",
          notes: originalCfg.notes || "Baseline QafNest platform fee policy (15% Host commission, 13% Guest service fee, 15% ZATCA VAT, 50 SAR welcome bonus)",
        }),
      });
    }
  });

  console.log("\n--------------------------------------------------------");
  console.log(`📊 E2E Test Suite Summary:`);
  console.log(`   Passed: \x1b[32m${passedCount}\x1b[0m`);
  console.log(`   Failed: ${failedCount > 0 ? `\x1b[31m${failedCount}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);
  console.log("--------------------------------------------------------\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runE2ETests().catch((e) => {
  console.error("Fatal E2E runner error:", e);
  process.exit(1);
});
