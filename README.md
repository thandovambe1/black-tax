# Black Tax — Small Contributions. Lasting Change.

A transparent, community-driven South African non-profit crowdfunding platform.
Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Drizzle ORM** and **PostgreSQL**.

---

## Deploying to Vercel

### 1. Create a PostgreSQL database

The app needs a hosted Postgres database. Any of these work:

- **Neon** — https://neon.tech (recommended, generous free tier)
- **Supabase** — https://supabase.com
- **Vercel Postgres** — from the Vercel dashboard → Storage

Copy the connection string. It should look like:

```
postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

### 2. Import the project into Vercel

1. Push this repository to GitHub.
2. In Vercel: **Add New → Project → Import** your repo.
3. Framework preset: **Next.js** (auto-detected).
4. Leave Root Directory as `./`, Build Command and Output Directory as default.

### 3. Add environment variables

In **Vercel → Project → Settings → Environment Variables**, add the following
for the **Production**, **Preview** and **Development** environments:

| Variable | Required | Example / Notes |
|---|---|---|
| `DATABASE_URL` | ✅ Yes | `postgresql://user:pass@host/db?sslmode=require` |
| `NEXT_PUBLIC_SITE_URL` | ✅ Yes | `https://your-domain.vercel.app` (no trailing slash) |
| `ADMIN_SESSION_SECRET` | ✅ Yes | Generate with `openssl rand -base64 32` |
| `YOCO_SECRET_KEY` | Optional | From the Yoco portal — enables live card donations |
| `YOCO_WEBHOOK_SECRET` | Optional | From the Yoco portal — verifies webhooks |
| `FNB_ACCOUNT_NAME` | Optional | Payout source account name |
| `FNB_ACCOUNT_NUMBER` | Optional | Payout source account number |
| `FNB_BRANCH_CODE` | Optional | Payout source branch code |
| `FNB_API_BASE_URL` | Optional | Only if you have FNB enterprise API access |
| `FNB_API_KEY` | Optional | Only if you have FNB enterprise API access |

> The site deploys and renders successfully even if the optional variables are
> blank — payment features simply stay dormant until they are configured.

### 4. Create the database tables

After the first deploy, run this once from your machine (with `DATABASE_URL`
pointing at your **production** database):

```bash
npm install
DATABASE_URL="your-production-url" npx drizzle-kit push
```

### 5. Redeploy

Trigger a redeploy in Vercel so the new environment variables take effect.

---

## Admin portal

Sign in at **`/admin/login`**.

| Account | Email | Role |
|---|---|---|
| Owner | `admin1@blacktax.co.za` | Full admin + finance access |
| Admin | `admin@blacktax.co.za` | All admin functions |
| Finance | `finance@blacktax.co.za` | Payments and payouts to service providers |

These three accounts are created automatically on first admin login.

> **Change these passwords before going live.** They are defined in
> `src/lib/admin-auth.ts` (`ADMIN_ACCOUNTS`).

---

## Payments

- **Yoco** — accepts card donations via hosted checkout. Payments are confirmed
  by a signature-verified, idempotent webhook at `/api/payments/yoco/webhook`.
  Register this URL in the Yoco portal.
- **FNB** — releases funds to service providers, either through the FNB API
  (when configured) or via an exported FNB batch CSV for upload in FNB Online
  Banking.

---

## Local development

```bash
npm install
cp .env.example .env      # then edit the values
npx drizzle-kit push      # create tables
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Lint the codebase |
| `npm run typecheck` | TypeScript check |

---

## Troubleshooting

**Vercel shows a 404 after deploying**
The build most likely failed. Open **Vercel → Deployments → the failed build →
Build Logs**. The usual causes are a missing `DATABASE_URL` or `node_modules`
being committed (make sure `.gitignore` is present).

**Database connection errors in production**
Hosted Postgres requires TLS. Ensure your `DATABASE_URL` ends with
`?sslmode=require`. SSL is negotiated automatically for non-local hosts.
