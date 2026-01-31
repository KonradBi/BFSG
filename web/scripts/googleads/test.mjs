import { GoogleAdsApi } from 'google-ads-api';

const required = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
];
for (const k of required) {
  if (!process.env[k]) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
}

const developer_token = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
const client_id = process.env.GOOGLE_ADS_CLIENT_ID;
const client_secret = process.env.GOOGLE_ADS_CLIENT_SECRET;
const refresh_token = process.env.GOOGLE_ADS_REFRESH_TOKEN;

const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || customerId;

const api = new GoogleAdsApi({
  client_id,
  client_secret,
  developer_token,
});

const customer = api.Customer({
  customer_id: customerId,
  login_customer_id: loginCustomerId,
  refresh_token,
});

async function main() {
  // 1) Minimal permission check
  const me = await customer.query(`
    SELECT
      customer.id,
      customer.descriptive_name,
      customer.currency_code,
      customer.time_zone
    FROM customer
    LIMIT 1
  `);
  console.log('Customer OK:', me?.[0]?.customer);

  // 2) Keyword ideas (Germany / German)
  const seedKeywords = [
    'bfsg website barrierefreiheit',
    'barrierefreiheit website prüfen',
    'wcag audit',
    'bitv test',
    'en 301 549',
  ];

  const response = await customer.keywordPlans.generateKeywordIdeas({
    customer_id: customerId,
    language: 'languageConstants/1001', // de
    geo_target_constants: ['geoTargetConstants/2276'], // Germany
    keyword_plan_network: 'GOOGLE_SEARCH_AND_PARTNERS',
    keyword_seed: {
      keywords: seedKeywords,
    },
  });

  const ideas = (response.results || [])
    .map((r) => ({
      text: r.text,
      avgMonthly: r.keyword_idea_metrics?.avg_monthly_searches ?? null,
      competition: r.keyword_idea_metrics?.competition ?? null,
      lowTop: r.keyword_idea_metrics?.low_top_of_page_bid_micros ?? null,
      highTop: r.keyword_idea_metrics?.high_top_of_page_bid_micros ?? null,
    }))
    .sort((a, b) => (b.avgMonthly ?? 0) - (a.avgMonthly ?? 0))
    .slice(0, 50);

  console.log('\nTop keyword ideas (first 50):');
  for (const i of ideas) {
    console.log(JSON.stringify(i));
  }
}

main().catch((e) => {
  console.error('Google Ads API test failed:', e?.message || e);
  if (e?.response?.data) {
    console.error('Response data:', JSON.stringify(e.response.data, null, 2));
  }
  process.exit(1);
});
