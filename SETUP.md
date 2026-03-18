# Scout — Setup & Deployment Guide

Scout is an AI-powered territory research tool for Employbridge field sales reps. This guide walks through everything from first-time setup to deploying on GitHub Pages and switching to Azure OpenAI.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Get the Code](#2-get-the-code)
3. [Configure Your API Key](#3-configure-your-api-key)
4. [Run Locally](#4-run-locally)
5. [Deploy to GitHub Pages](#5-deploy-to-github-pages)
6. [Switch to Azure OpenAI](#6-switch-to-azure-openai)
7. [Project Structure](#7-project-structure)
8. [Updating the App](#8-updating-the-app)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

Install these tools before starting. Each link goes to the official download page.

| Tool | Version | Why |
|---|---|---|
| [Node.js](https://nodejs.org/) | 18 or higher | Runs the build toolchain |
| [Git](https://git-scm.com/) | Any recent | Version control |
| A GitHub account | — | Hosts the deployed app |
| An Anthropic API key (or Azure OpenAI) | — | Powers the AI research |

To check if Node and Git are already installed, open a terminal and run:

```bash
node --version
git --version
```

Both should print a version number. If either says "command not found", install that tool first.

---

## 2. Get the Code

### Option A — You're setting this up fresh from the files provided

Create a new folder, copy all the project files into it, and continue to step 3.

### Option B — Cloning from a GitHub repository (after initial push)

```bash
git clone https://github.com/YOUR-USERNAME/scout-territory.git
cd scout-territory
npm install
```

### Option C — Starting from scratch and pushing to a new repo

1. Create a new repository on GitHub. Name it `scout-territory` (or anything you like). Set it to **Private** so your API secrets are not publicly visible in Action logs.

2. In your terminal, inside the project folder:

```bash
git init
git add .
git commit -m "Initial Scout commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/scout-territory.git
git push -u origin main
```

---

## 3. Configure Your API Key

### For local development

1. In the project root, copy the example env file:

```bash
cp .env.example .env
```

2. Open `.env` in any text editor and paste in your Anthropic API key:

```
REACT_APP_USE_AZURE=false
REACT_APP_ANTHROPIC_API_KEY=sk-ant-api03-...your-real-key...
```

3. Save the file. **Never commit `.env` to Git.** It is already listed in `.gitignore`.

### Getting an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign in or create an account
3. Click **API Keys** in the left nav
4. Click **Create Key**, give it a name like "Scout App"
5. Copy the key immediately — it won't be shown again

Note: Anthropic API usage is billed per token. Territory research calls typically cost less than $0.01 each using claude-sonnet. You can set a monthly spend limit in the console under **Billing**.

---

## 4. Run Locally

```bash
npm install       # first time only
npm start
```

The app opens at `http://localhost:3000`. Changes to source files hot-reload automatically.

To build a production bundle without deploying:

```bash
npm run build
```

This creates a `build/` folder with the optimized static files.

---

## 5. Deploy to GitHub Pages

GitHub Pages serves the built app for free from your repository. The included GitHub Actions workflow handles the build and deploy automatically every time you push to `main`.

### Step 1 — Add your API key as a GitHub Secret

Secrets are encrypted and injected at build time. They are never visible in logs or the deployed files.

1. Go to your repository on GitHub
2. Click **Settings** (top nav)
3. In the left sidebar, click **Secrets and variables** then **Actions**
4. Click **New repository secret**
5. Add the following secrets one at a time:

| Secret Name | Value |
|---|---|
| `REACT_APP_USE_AZURE` | `false` |
| `REACT_APP_ANTHROPIC_API_KEY` | Your Anthropic API key |

If using Azure instead (see Section 6), add those secrets instead.

### Step 2 — Enable GitHub Pages

1. In your repository, click **Settings**
2. Scroll down to **Pages** in the left sidebar
3. Under **Source**, select **GitHub Actions**
4. Click **Save**

### Step 3 — Trigger the first deployment

The workflow runs automatically on every push to `main`. To trigger it manually:

1. Go to the **Actions** tab in your repository
2. Click **Deploy Scout to GitHub Pages** in the left sidebar
3. Click **Run workflow** then **Run workflow** again

### Step 4 — Find your live URL

After the workflow completes (usually 2-3 minutes):

1. Go to **Settings** > **Pages**
2. Your live URL is displayed at the top, in the format:

```
https://YOUR-USERNAME.github.io/scout-territory/
```

Share this URL with your team. No login required (consider adding auth if this needs to be restricted — see Section 9).

### Subsequent deploys

After the initial setup, deploying is automatic. Any time you push code changes to `main`, the workflow runs and the live site updates within a few minutes.

---

## 6. Switch to Azure OpenAI

When you're ready to move from Anthropic to your org's Azure OpenAI deployment, the change is entirely in configuration. No code changes needed.

### What you need from Azure

You'll need three things from your Azure portal:

1. **Endpoint URL** — Found in Azure OpenAI Studio under your deployment. Looks like:
   `https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT/chat/completions?api-version=2024-02-01`

2. **API Key** — Found in Azure portal under your OpenAI resource > **Keys and Endpoint**

3. **Model deployment name** — The name you gave your GPT-4o deployment (e.g., `gpt-4o-scout`)

### Update your local `.env`

```
REACT_APP_USE_AZURE=true
REACT_APP_AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT/chat/completions?api-version=2024-02-01
REACT_APP_AZURE_OPENAI_KEY=your-azure-key-here
```

Comment out or remove the Anthropic key lines.

### Update GitHub Secrets

In your repository Settings > Secrets > Actions, update or add:

| Secret Name | Value |
|---|---|
| `REACT_APP_USE_AZURE` | `true` |
| `REACT_APP_AZURE_OPENAI_ENDPOINT` | Your full Azure endpoint URL |
| `REACT_APP_AZURE_OPENAI_KEY` | Your Azure API key |

You can leave the Anthropic secret in place — it just won't be used when `USE_AZURE=true`.

Push any change to `main` (even a blank line in README) to trigger a redeploy with the new config.

---

## 7. Project Structure

```
scout-territory/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-deploy to GitHub Pages on push
├── public/
│   └── index.html              # HTML shell
├── src/
│   ├── components/
│   │   ├── Badges.jsx          # Heat, Brand, and Job count badges
│   │   ├── ProspectCard.jsx    # Individual prospect card with talking points
│   │   ├── SearchPanel.jsx     # Location / radius / industry inputs
│   │   ├── Spinner.jsx         # Loading animation
│   │   └── SummaryBar.jsx      # Results summary + CSV export button
│   ├── api.js                  # AI provider abstraction (Anthropic or Azure)
│   ├── prompts.js              # All AI prompt templates
│   ├── App.jsx                 # Main app logic and state
│   ├── index.js                # React entry point
│   └── index.css               # Tailwind + global styles
├── .env.example                # Template for local env vars
├── .gitignore
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── SETUP.md                    # This file
```

### Key files to know

**`src/prompts.js`** — Edit this to change what Scout researches or how it describes prospects. This is where you'd update the system prompt to add new fields, change the tone of talking points, or add new industries.

**`src/api.js`** — The AI provider switch lives here. You generally won't need to edit this.

**`src/components/ProspectCard.jsx`** — Controls what data shows on each card. If the AI returns new fields, add them here.

---

## 8. Updating the App

### To change the AI prompts or behavior

1. Edit `src/prompts.js`
2. Test locally with `npm start`
3. Commit and push to `main` — auto-deploys

### To add a new field to prospect cards

1. Add the field to the JSON schema description in `src/prompts.js` (inside `TERRITORY_SYSTEM_PROMPT`)
2. Display the field in `src/components/ProspectCard.jsx`
3. Optionally add it to the CSV export in `src/App.jsx` inside `exportToCSV`

### To add the Route Planner module (Phase 2)

1. Create `src/components/RouteMap.jsx` using the Azure Maps React SDK
2. Pass the `prospects` array (already has `location` fields) to the map component
3. Add a tab or toggle in `App.jsx` to switch between Research and Route views

---

## 9. Troubleshooting

### "API key not configured" error in the app

Your `.env` file is missing or the key name is wrong. Confirm:
- The file is named exactly `.env` (not `.env.txt`)
- The variable name is exactly `REACT_APP_ANTHROPIC_API_KEY`
- You restarted `npm start` after editing `.env` (env changes require a restart)

### GitHub Actions workflow fails at "Build app" step

Check the workflow logs in the **Actions** tab. Common causes:

- **Secret not set**: Go to Settings > Secrets and confirm the secret name matches exactly (case-sensitive)
- **Invalid API key**: The key value was pasted with extra spaces or line breaks

### App deployed but shows blank white page

This is almost always a `PUBLIC_URL` path issue. Confirm your repository name matches what's in `deploy.yml`. The workflow sets `PUBLIC_URL` to `/${{ github.event.repository.name }}` automatically, so if your repo is named `scout-territory`, the app expects to be served from `/scout-territory/`.

If you renamed the repo, re-run the workflow from the Actions tab.

### Responses look wrong or garbled

The AI returned something that couldn't be parsed as JSON. This is rare but can happen. The app will show an error message. Try the search again — if it fails consistently for a specific query, check `src/prompts.js` and make sure the system prompt still ends with the instruction to return only JSON.

### Want to restrict access to specific users

GitHub Pages is public by default. Options for adding authentication:

- **GitHub Pages + Cloudflare Access**: Free, uses Google/Microsoft SSO, sits in front of the Pages URL
- **Move to Azure Static Web Apps**: Supports Azure AD authentication natively, which would tie into Employbridge's existing org login
- **Password protect with a simple JS gate**: Minimal security but quick to implement if needed temporarily

---

## Notes on API Key Security

This app calls the AI API directly from the user's browser. This means the API key is embedded in the built JavaScript files and is technically visible to anyone who inspects the page source.

**Acceptable for now because:**
- The app is used internally by trusted employees
- Anthropic keys can be rate-limited and spend-capped in the console
- The key only has access to make AI completions (no data, no admin)

**For a more locked-down future deployment:**
- Route API calls through an Azure Function that holds the key server-side
- Or migrate hosting to Azure Static Web Apps with Azure AD auth + a Function backend

This is already architected for that upgrade — the `api.js` file just needs its `fetch` target changed from the AI provider directly to your Azure Function URL.
