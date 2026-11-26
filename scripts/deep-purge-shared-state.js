const fs = require('fs');
const os = require('os');
const path = require('path');

const localDataDir = path.join(__dirname, '..', 'packages', 'shared', 'data');
const tmpDataDir = path.join(os.tmpdir(), 'qafnest-data');

// Read Supabase config
const adminEnv = fs.readFileSync(path.join(__dirname, '..', 'apps', 'admin', '.env.local'), 'utf-8');
let supabaseUrl = '', serviceKey = '';
for (const line of adminEnv.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) serviceKey = line.split('=')[1].trim();
}

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials!');
  process.exit(1);
}

// Prepare cleaned state objects
const zatcaCfgPath = path.join(localDataDir, 'zatca-config.json');
let zatcaCfg = {};
if (fs.existsSync(zatcaCfgPath)) {
  zatcaCfg = JSON.parse(fs.readFileSync(zatcaCfgPath, 'utf-8'));
}
zatcaCfg.currentIcv = 0;
zatcaCfg.totalReportedCount = 0;
zatcaCfg.latestPih = 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';
zatcaCfg.lastReportingTimestamp = '2026-11-26T21:00:00.000Z';

const sampleOffer = {
  id: 'camp-riyadh-season-2x',
  titleEn: 'Riyadh Season Double Points',
  titleAr: 'موسم الرياض - نقاط مضاعفة 2x',
  descriptionEn: 'Earn 2x loyalty points on all luxury chalets and private villas in Riyadh.',
  descriptionAr: 'احصل على ضعف نقاط الولاء (2x) عند حجز الشاليهات والفلل الفاخرة في الرياض.',
  multiplier: 2.0,
  bonusPoints: 100,
  badgeEn: '2x Points',
  badgeAr: 'نقاط مضاعفة 2x',
  validUntil: '2027-03-31T23:59:59.000Z',
  isActive: true
};

const hostPayouts = {
  policy: {
    payoutRail: 'myfatoorah_split',
    slaHours: 24,
    slaTrigger: 'check_in',
    reminderLeadHours: 6,
    autoNotifyHostOnDisburse: true,
    updatedAt: new Date().toISOString()
  },
  payouts: [],
  hostIbans: {}
};

const walletsState = {
  wallets: {},
  activeOffers: [sampleOffer],
  pendingSplits: {},
  pendingTopUps: {},
  loyaltySettings: {
    loyaltyEnabled: true,
    standardEarnRate: 1,
    redemptionRateSAR: 10,
    redemptionRatePoints: 100,
    walletPaymentMultiplier: 1.5
  },
  processedTopUpPaymentIds: []
};

const cleanStateMap = {
  'zatca-config.json': zatcaCfg,
  'zatca-invoices.json': [],
  'host-payouts.json': hostPayouts,
  'booking-financials.json': { snapshots: {} },
  '.qafnest-wallets.json': walletsState,
  'user-governance-activity.json': { overrides: {}, events: [] },
  'property-deletion-requests.json': { requests: [] },
  'portal-accounts.json': {},
  'firebase-guest-profiles.json': {},
  'saudi-verified-identities.json': {},
  'signup-confirmations.json': {},
  'verified-emails.json': [],
  'booking-refunds.json': {},
  'contact-inquiries.json': {
    settings: {
      recipientEmail: 'support@qafnest.com',
      emailForwardingEnabled: true,
      autoReplyEnabled: true,
      subjectPrefix: '[QafNest Support]',
      responseSlaHours: 2,
      updatedAt: new Date().toISOString(),
      updatedBy: 'System Admin'
    },
    inquiries: []
  }
};

async function syncAll() {
  console.log('--- PURGING ALL SHARED STATE TIERS ---');

  for (const [fileName, val] of Object.entries(cleanStateMap)) {
    const serialized = JSON.stringify(val, null, 2) + '\n';

    // 1. Local packages/shared/data or workspace root
    const localTarget = fileName.startsWith('.')
      ? path.join(__dirname, '..', fileName)
      : path.join(localDataDir, fileName);
    fs.writeFileSync(localTarget, serialized);

    // 2. Local OS tmp dir (os.tmpdir()/qafnest-data)
    if (fs.existsSync(tmpDataDir)) {
      const tmpTarget = path.join(tmpDataDir, fileName);
      fs.writeFileSync(tmpTarget, serialized);
    }

    // 3. Supabase table platform_shared_state
    const headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates'
    };

    const tableRes = await fetch(`${supabaseUrl}/rest/v1/platform_shared_state`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        key: fileName,
        value: val,
        updated_at: new Date().toISOString()
      })
    });
    console.log(`[Supabase Table] ${fileName}: ${tableRes.status}`);

    // 4. Supabase Storage bucket qafnest-private-state/shared-state/
    const storageRes = await fetch(`${supabaseUrl}/storage/v1/object/qafnest-private-state/shared-state/${fileName}`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      },
      body: serialized
    });
    console.log(`[Supabase Storage] ${fileName}: ${storageRes.status}`);
  }

  console.log('--- ALL SHARED TIERS UPDATED SUCCESSFULLY ---');
}

syncAll().catch(console.error);
