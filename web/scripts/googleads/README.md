# Google Ads API – Quick Test (Keyword Ideas)

This checks whether the current **developer token** + **customer** can access Google Ads APIs (and tries Keyword Planner idea generation).

## 1) Create OAuth credentials

In Google Cloud Console:
- Create/select a project
- Enable **Google Ads API**
- Create **OAuth Client ID** (type: Desktop App)

You will get:
- `GOOGLE_ADS_CLIENT_ID`
- `GOOGLE_ADS_CLIENT_SECRET`

## 2) Get a refresh token

Easiest: use google-auth-library sample script or oauth2l to generate a refresh token.
You need scopes:
- `https://www.googleapis.com/auth/adwords`

Set:
- `GOOGLE_ADS_REFRESH_TOKEN`

## 3) Run

```bash
cd /Users/konrad/clawd/projects/accessibility-lawsuit-shield/web
export GOOGLE_ADS_DEVELOPER_TOKEN='...'
export GOOGLE_ADS_CUSTOMER_ID='5598890186'
export GOOGLE_ADS_LOGIN_CUSTOMER_ID='5598890186' # same unless you have MCC
export GOOGLE_ADS_CLIENT_ID='...'
export GOOGLE_ADS_CLIENT_SECRET='...'
export GOOGLE_ADS_REFRESH_TOKEN='...'

node scripts/googleads/test.mjs
```

## Notes
- If you get permission errors, you likely need **Basic/Standard access** on the developer token and/or correct login_customer_id.
- Keyword Planner sometimes requires additional account eligibility.
