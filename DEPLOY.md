# Deploying to Netlify

## 1. Set up Turso (database)

```bash
# Install the Turso CLI
brew install tursodatabase/tap/turso

# Log in
turso auth login

# Create the database
turso db create recipe-saver

# Get the database URL
turso db show recipe-saver --url

# Create an auth token
turso db tokens create recipe-saver
```

## 2. Run the production migration

With the credentials from step 1:

```bash
TURSO_DATABASE_URL=libsql://your-db-name-your-org.turso.io \
TURSO_AUTH_TOKEN=your-token \
node scripts/migrate.mjs
```

## 3. Connect your repo to Netlify

1. Push this project to GitHub
2. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
3. Select your GitHub repo

## 4. Configure build settings in Netlify

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish directory | `.output/public` |
| Node version | `20` |

The `netlify.toml` in the repo sets these automatically, but double-check them in the UI.

## 5. Add environment variables

In Netlify: **Site settings → Environment variables → Add a variable**

| Key | Value |
|---|---|
| `TURSO_DATABASE_URL` | `libsql://your-db-name-your-org.turso.io` |
| `TURSO_AUTH_TOKEN` | your Turso auth token |
| `ANTHROPIC_API_KEY` | your Anthropic API key (optional — see below) |

## 6. Deploy

Trigger a deploy from the Netlify UI, or just push to your main branch — Netlify auto-deploys on every push.

---

## Notes

**Anthropic API key is optional.** Without it, the app falls back to parsing structured recipe data (schema.org/Recipe) embedded in the page. This works on most major recipe sites (AllRecipes, Serious Eats, NYT Cooking, Food Network, BBC Good Food). Adding the key enables AI extraction for any site.

**Local dev vs production DB.** Local dev uses `file:local.db` (a local SQLite file). Production uses your Turso cloud database. The migration script in step 2 only needs to be run once when setting up production.

**Re-deploying.** After the initial setup, just push to GitHub. No need to re-run the migration.
