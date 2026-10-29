# Daily Journal App — Daybook

A clean, responsive daily journal where you can write an entry, record your mood, search past entries, edit or delete a page, and view simple writing insights. Entries are stored persistently in Supabase PostgreSQL.

> **Important MVP limitation:** This version is designed as a single-user college demonstration app and does not include login or account separation. Do not deploy it publicly with private journal data. The Express server uses a privileged Supabase server key, so anyone who can reach the deployed API could potentially read or change all entries. For a public deployment, add Supabase Auth, per-user ownership, authorization checks, and matching RLS policies first.

## 1. Problem and objectives

Daily thoughts are easy to forget. Daybook provides one simple place to capture daily reflections and moods. The objectives are to practice a real full-stack flow, form validation, REST APIs, SQL constraints, and Git/GitHub.

## 2. Features

- Create one journal entry per date with an optional title, text, and mood.
- List recent entries from the database.
- Edit or delete an entry, with a delete confirmation.
- Search entries by title, content, mood, or date.
- Dashboard counts, most-used mood, current consecutive-day writing streak, and monthly count.
- Responsive layout, form validation, loading/error/empty states.
- Express health endpoint and server-side input validation.

Not included: user accounts, multi-user data separation, cloud hosting, export/backup, rich text, or AI writing suggestions.

## 3. Technology stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js and Express.js
- Supabase PostgreSQL using `@supabase/supabase-js`
- Git and GitHub
- Small backend packages: `dotenv` (environment configuration), `helmet` (security headers), and `express-rate-limit` (basic request rate limiting).

## 4. Folder structure

```text
daily-journal-app/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── middleware/
│   │   └── validate.js
│   ├── routes/
│   │   └── entries.js
│   ├── .env                 # create locally; do not commit
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── server.js
│   └── supabase.js
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

`package-lock.json` is created by `npm install` and should be committed for reproducible dependency installs.

## 5. Prerequisites

Install these on Windows:

- Visual Studio Code: https://code.visualstudio.com/
- Node.js LTS (npm is included): https://nodejs.org/
- Git: https://git-scm.com/download/win
- A free Supabase account: https://supabase.com/

After installing Node.js and Git, close and reopen VS Code, then run in the VS Code terminal:

```powershell
node --version
npm --version
git --version
```

Each command should print a version. If Windows says a command is not recognized, restart the terminal/computer and check the installer added the program to PATH.

## 6. Supabase setup

1. Sign in to Supabase and create a new project.
2. Choose a project name and a strong database password. Save the password privately.
3. Wait for the project to finish provisioning.
4. Open **SQL Editor → New query**.
5. Open `database/schema.sql` in VS Code, copy the complete file into the SQL Editor, and click **Run**.
6. Open **Table Editor** and confirm `journal_entries` exists with columns `id`, `title`, `content`, `mood`, `entry_date`, `created_at`, and `updated_at`.
7. In the Supabase project settings/API section, copy the Project URL and the server-side service-role/secret key shown for your project. Supabase may label newer keys as secret keys (`sb_secret_...`); use the server-side secret key supported by your project and never use a publishable/anon key for this server-only setup.

The SQL enables Row Level Security (RLS) with no public policies. The browser never connects directly to Supabase. The Express server uses the server-side key and validates requests. Because that key bypasses RLS, this demo is only suitable for local/single-user demonstration until proper authentication and ownership policies are added.

## 7. Configure environment variables

From the project root:

```powershell
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env` and replace the placeholders:

```dotenv
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=PASTE_YOUR_SERVER_SIDE_SECRET_KEY_HERE
```

- `PORT`: local Express port.
- `NODE_ENV`: development mode locally.
- `SUPABASE_URL`: Project URL from your Supabase dashboard.
- `SUPABASE_SERVICE_ROLE_KEY`: privileged server-side key/secret for this demo.

`.env` contains private credentials and is ignored by Git. `.env.example` documents variable names only and is safe to commit. Never put the privileged key in `frontend/app.js`, HTML, or GitHub.

## 8. Install and run

Open VS Code → **Terminal → New Terminal**. Run commands from the project root unless noted:

```powershell
cd backend
npm install
npm run check
npm start
```

Expected terminal message:

```text
Daily Journal App running at http://localhost:3000
Health check: http://localhost:3000/api/health
```

Open http://localhost:3000 in your browser. To verify the server, open http://localhost:3000/api/health; it should return JSON similar to:

```json
{"status":"ok","service":"daily-journal-api"}
```

Keep the terminal running while using the site. Stop the server with `Ctrl+C`. For development with automatic restart, use `npm run dev`.

## 9. Architecture

1. The browser loads `frontend/index.html`, `styles.css`, and `app.js` from Express.
2. Frontend JavaScript calls `/api/entries` with `fetch()`.
3. Express routes validate the request and use the Supabase client.
4. Supabase PostgreSQL stores the journal entry and returns the result.
5. Express sends JSON back; the page renders it.

## 10. API reference

All responses are JSON. This MVP has no login or user roles.

| Method | Path | Purpose | Body | Success | Common errors |
|---|---|---|---|---|---|
| GET | `/api/health` | Check server | None | `200 {status, service}` | — |
| GET | `/api/entries` | List latest entries (max 500) | None | `200 {entries: [...]}` | `500` server/database issue |
| POST | `/api/entries` | Create an entry | `{title, content, mood, entry_date}` | `201 {entry: {...}}` | `400` invalid data, `409` date already has an entry |
| PUT | `/api/entries/:id` | Update an entry | `{title, content, mood}` | `200 {entry: {...}}` | `400` invalid ID/data, `404` missing entry |
| DELETE | `/api/entries/:id` | Delete an entry | None | `200 {message}` | `400` invalid ID, `404` missing entry |

Allowed moods: `Calm`, `Happy`, `Grateful`, `Anxious`, `Tired`. Content is required and limited to 12,000 characters; title is optional and limited to 120 characters. The database enforces one entry per date.

## 11. Try the application

1. Open the homepage.
2. Type a title and a short reflection.
3. Choose a mood and click **Save entry**.
4. Confirm it appears under **Recent pages** and the statistics update.
5. Use the search box to find a word from the entry.
6. Click **Edit**, change the text, and save.
7. Click **Delete** and confirm the dialog.
8. Open **Reflections** to see the summary cards.

Because this MVP permits only one entry per calendar date, use **Edit** for another reflection on the same date.

## 12. Testing checklist

- [ ] `/api/health` returns HTTP 200 and JSON.
- [ ] Valid entry saves and appears after page refresh.
- [ ] Title can be blank; content cannot be blank.
- [ ] Invalid mood, overly long title/content, and invalid date are rejected.
- [ ] Creating a second entry for the same date returns HTTP 409.
- [ ] Search filters by title/content/mood/date.
- [ ] Edit persists after refresh.
- [ ] Delete removes the entry after refresh.
- [ ] Empty journal shows an empty state.
- [ ] Mobile width has no horizontal overflow.
- [ ] Invalid Supabase credentials produce a friendly API error while server details remain in the terminal.

No live Supabase project or browser was available to verify during project generation. Run these checks after configuring your own credentials.

## 13. Troubleshooting

**`npm` or `node` is not recognized:** Install the Node.js LTS Windows installer from https://nodejs.org/, ensure the option to add Node to PATH is enabled, finish setup, close all terminals, reopen VS Code, and retry `node --version` and `npm --version`.

**`Cannot find module`:** Run `npm install` from inside `backend/`.

**Missing environment variable:** Check `backend/.env` exists, its variable names match `.env.example`, and values do not have placeholder text. Restart the server after editing it.

**Supabase 401/403 or failed requests:** Confirm the Project URL and server-side key belong to the same project. Confirm you ran `database/schema.sql` and that `journal_entries` exists.

**Port already in use:** Change `PORT=3001` in `backend/.env`, restart, and visit `http://localhost:3001`.

**Entry date conflict:** The schema allows one entry per date. Edit the existing page for that date.

**CSS/JS changes not visible:** Refresh the browser with `Ctrl+F5`.

**PowerShell copy command issue:** Run `Copy-Item backend/.env.example backend/.env` from the root folder. In Command Prompt use `copy backend\\.env.example backend\\.env`.

## 14. GitHub upload

Create an empty repository on https://github.com/new. Do not add a README there if you already have this local README. From the project root, run:

```powershell
git init
git status
git add .
git status
git commit -m "Build Daily Journal App"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your repository URL, such as the HTTPS URL shown by GitHub. Check the final `git status` output and the repository page to verify the files uploaded.

Before committing, confirm `backend/.env` is not staged and `node_modules/` is ignored. `.env.example` should be included. Do not commit private journal data, database exports, or secrets. `.gitignore` does not erase a secret already committed. If a key was exposed, rotate/revoke it in Supabase immediately and clean the repository history if needed.

## 15. Security and limitations

- The privileged Supabase key stays on the server and is not sent to the browser.
- Express validates request bodies, applies security headers, limits JSON body size, rate-limits API requests, and avoids returning raw database errors.
- RLS is enabled without public policies. The server-side privileged key bypasses RLS, so backend route security is critical.
- This is a local college-project MVP, not a secure multi-user private journal. Add Supabase Auth, `user_id` ownership on each row, backend JWT verification, and user-scoped RLS policies before public deployment.
- Google Fonts is optional styling; core functionality does not depend on remote images or APIs.

## 16. Future improvements

- Supabase Auth login and account-specific entries.
- Calendar view, tags, export, and encrypted backups.
- Paginated history and richer mood analytics.
- Deployment with HTTPS and production secret management.
