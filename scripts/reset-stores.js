const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'packages', 'shared', 'data');

// 1. zatca-config.json
const zatcaCfgPath = path.join(dataDir, 'zatca-config.json');
if (fs.existsSync(zatcaCfgPath)) {
  const cfg = JSON.parse(fs.readFileSync(zatcaCfgPath, 'utf-8'));
  cfg.currentIcv = 0;
  cfg.totalReportedCount = 0;
  cfg.latestPih = 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';
  cfg.lastReportingTimestamp = '2026-11-26T21:00:00.000Z';
  fs.writeFileSync(zatcaCfgPath, JSON.stringify(cfg, null, 2) + '\n');
  console.log('Reset zatca-config.json (currentIcv = 0, totalReportedCount = 0)');
}

// 2. zatca-invoices.json
fs.writeFileSync(path.join(dataDir, 'zatca-invoices.json'), '[]\n');
console.log('Reset zatca-invoices.json to []');

// 3. booking-financials.json
fs.writeFileSync(path.join(dataDir, 'booking-financials.json'), JSON.stringify({ snapshots: {} }, null, 2) + '\n');
console.log('Reset booking-financials.json');

// 4. host-payouts.json
const hostPayoutsPath = path.join(dataDir, 'host-payouts.json');
let payoutPolicy = {
  payoutRail: 'myfatoorah_split',
  slaHours: 24,
  slaTrigger: 'check_in',
  reminderLeadHours: 6,
  autoNotifyHostOnDisburse: true,
  updatedAt: new Date().toISOString()
};
if (fs.existsSync(hostPayoutsPath)) {
  try {
    const existing = JSON.parse(fs.readFileSync(hostPayoutsPath, 'utf-8'));
    if (existing.policy) payoutPolicy = existing.policy;
  } catch (e) {}
}
fs.writeFileSync(hostPayoutsPath, JSON.stringify({
  policy: payoutPolicy,
  payouts: [],
  hostIbans: {}
}, null, 2) + '\n');
console.log('Reset host-payouts.json');

// 5. booking-refunds.json
fs.writeFileSync(path.join(dataDir, 'booking-refunds.json'), '{}\n');

// 6. booking-slot-configs.json
fs.writeFileSync(path.join(dataDir, 'booking-slot-configs.json'), '{}\n');

// 7. user-governance-activity.json
fs.writeFileSync(path.join(dataDir, 'user-governance-activity.json'), JSON.stringify({ overrides: {}, events: [] }, null, 2) + '\n');

// 8. property-deletion-requests.json
fs.writeFileSync(path.join(dataDir, 'property-deletion-requests.json'), JSON.stringify({ requests: [] }, null, 2) + '\n');

// 9. portal-accounts.json
fs.writeFileSync(path.join(dataDir, 'portal-accounts.json'), '{}\n');

// 10. firebase-guest-profiles.json
fs.writeFileSync(path.join(dataDir, 'firebase-guest-profiles.json'), '{}\n');

// 11. saudi-verified-identities.json
fs.writeFileSync(path.join(dataDir, 'saudi-verified-identities.json'), '{}\n');

// 12. contact-inquiries.json
fs.writeFileSync(path.join(dataDir, 'contact-inquiries.json'), JSON.stringify({
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
}, null, 2) + '\n');

// 13. signup-confirmations.json
fs.writeFileSync(path.join(dataDir, 'signup-confirmations.json'), '{}\n');

// 14. verified-emails.json
fs.writeFileSync(path.join(dataDir, 'verified-emails.json'), '[]\n');

// 15. .qafnest-wallets.json
const walletFilePath = path.join(__dirname, '..', '.qafnest-wallets.json');
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
fs.writeFileSync(walletFilePath, JSON.stringify({
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
}, null, 2) + '\n');
console.log('Reset .qafnest-wallets.json with sample loyalty campaign and 0 wallets');

// 16. .qafnest-promotions.json
const promoFilePath = path.join(__dirname, '..', '.qafnest-promotions.json');
if (fs.existsSync(promoFilePath)) {
  try {
    const promo = JSON.parse(fs.readFileSync(promoFilePath, 'utf-8'));
    if (Array.isArray(promo.coupons)) {
      promo.coupons.forEach(c => { c.used_count = 0; });
    }
    fs.writeFileSync(promoFilePath, JSON.stringify(promo, null, 2) + '\n');
    console.log('Reset .qafnest-promotions.json used_count to 0');
  } catch (e) {}
}

console.log('ALL JSON STORES PURGED AND RESET CLEANLY!');
