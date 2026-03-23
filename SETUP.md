# Scout — Azure Setup Guide

This guide walks through creating every Azure resource Scout needs, connecting them together, and running the app locally and in production.

**Time to complete:** ~45 minutes for a fresh setup.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Create an Azure Static Web App](#2-create-an-azure-static-web-app)
3. [Create Azure OpenAI](#3-create-azure-openai)
4. [Create Azure Maps](#4-create-azure-maps)
5. [Create Bing Search](#5-create-bing-search)
6. [Configure API Keys on the Static Web App](#6-configure-api-keys-on-the-static-web-app)
7. [Add the GitHub Secret](#7-add-the-github-secret)
8. [Set the Map Key for Local Dev](#8-set-the-map-key-for-local-dev)
9. [Run Locally](#9-run-locally)
10. [Deploy](#10-deploy)
11. [Project Structure](#11-project-structure)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Prerequisites

### Required tools

| Tool | Why | Get it |
|---|---|---|
| Node.js 20+ | Build toolchain | [nodejs.org](https://nodejs.org) |
| Azure Functions Core Tools v4 | Run Functions locally | [docs.microsoft.com/azure/azure-functions/functions-run-local](https://docs.microsoft.com/azure/azure-functions/functions-run-local) |
| SWA CLI | Run React + Functions together locally | `npm install -g @azure/static-web-apps-cli` |
| Git | Version control | [git-scm.com](https://git-scm.com) |

### Required VS Code extensions

Open VS Code, press `Ctrl+Shift+X`, and install:

- **Azure Static Web Apps** (`ms-azuretools.vscode-azurestaticwebapps`)
- **Azure Functions** (`ms-azuretools.vscode-azurefunctions`)
- **Azure Account** (`ms-vscode.azure-account`) — sign in to your Azure tenant

After installing, sign in: press `Ctrl+Shift+P` → **Azure: Sign In** → complete the browser flow.

### Azure subscription

You need a subscription with permission to create resources. If you're working in an org tenant, confirm you have **Contributor** access on at least one resource group, or ask your Azure admin to create the resources and share the keys with you.

---

## 2. Create an Azure Static Web App

This creates the hosting environment for the React app *and* the Azure Functions backend in one resource. It also automatically sets up your GitHub Actions deployment pipeline.

### In VS Code

1. Open the **Azure** panel in the Activity Bar (the Azure icon on the left).
2. Expand your subscription, right-click **Static Web Apps**, and select **Create Static Web App (Advanced)**.
3. Fill in the prompts:

   | Prompt | Value |
   |---|---|
   | Resource group | Create new, e.g. `scout-rg` |
   | Name | `scout-app` (or any name) |
   | Region | Pick the region closest to your users |
   | SKU | **Standard** (required for custom auth + managed Functions) |
   | Framework | **React** |
   | App location | `/` |
   | Build output | `build` |
   | API location | `api` |

4. VS Code will ask to authorize GitHub access if you haven't already. Allow it.
5. It creates the resource and automatically:
   - Adds a **deployment token** to your GitHub repository as `AZURE_STATIC_WEB_APPS_API_TOKEN`
   - Creates a GitHub Actions workflow file (you already have `.github/workflows/azure-static-web-apps.yml` — VS Code may detect the conflict; keep yours)

### Get the resource name for later

After creation, note the **resource URL** shown in VS Code (e.g., `https://purple-pebble-123.azurestaticapps.net`). This is your production URL.

---

## 3. Create Azure OpenAI

### Option A — You already have an Azure OpenAI resource

Skip to **Get the endpoint and key** below.

### Option B — Create a new resource

1. Go to [portal.azure.com](https://portal.azure.com).
2. Search for **Azure OpenAI** in the top search bar and click it.
3. Click **+ Create**.
4. Fill in:

   | Field | Value |
   |---|---|
   | Subscription | Your subscription |
   | Resource group | `scout-rg` (same as above) |
   | Region | `East US` or `East US 2` (best model availability) |
   | Name | `scout-openai` |
   | Pricing tier | Standard S0 |

5. Click **Review + Create**, then **Create**. Wait for deployment (~2 minutes).

### Deploy a model

1. Once the resource is created, click **Go to resource**.
2. Click **Model deployments** in the left sidebar, then **Manage deployments** (opens Azure OpenAI Studio).
3. Click **+ New deployment**.
4. Select:

   | Field | Value |
   |---|---|
   | Model | `gpt-4o` |
   | Deployment name | `gpt-4o-scout` |
   | Version | Latest available |
   | Tokens per minute | 100K (adjust based on your usage) |

5. Click **Create**.

### Get the endpoint and key

1. Back in the Azure portal on your OpenAI resource, click **Keys and Endpoint** in the left sidebar.
2. Copy **Key 1** and the **Endpoint** URL.
3. Build the full endpoint for the Function by appending the deployment path:

   ```
   https://YOUR-RESOURCE.openai.azure.com/openai/deployments/gpt-4o-scout/chat/completions?api-version=2024-08-01-preview
   ```

   Keep both the endpoint URL and key — you'll need them in Step 6.

---

## 4. Create Azure Maps

### Create the resource

1. In the Azure portal, search for **Azure Maps** and click it.
2. Click **+ Create**.
3. Fill in:

   | Field | Value |
   |---|---|
   | Subscription | Your subscription |
   | Resource group | `scout-rg` |
   | Name | `scout-maps` |
   | Pricing tier | **Gen2 (Maps and Location Insights)** |

4. Click **Review + Create**, then **Create**.

### Get the key

1. Go to the resource once deployed.
2. Click **Authentication** in the left sidebar.
3. Copy **Primary Key**. You'll use this in two places:
   - As `AZURE_MAPS_KEY` in the Static Web App configuration (server-side, for geocoding and POI search)
   - As `REACT_APP_AZURE_MAPS_KEY` in your local `.env` (client-side, for map tile rendering only)

### Restrict the client-side key (important)

The map tile key is exposed in the browser bundle. To limit damage if it's ever scraped:

1. In the portal on your Maps resource, click **Authentication**.
2. Under **Shared Key Authentication**, click the settings icon next to Primary Key.
3. Add a **URL restriction** for your production domain:
   ```
   https://purple-pebble-123.azurestaticapps.net
   ```
4. Add `http://localhost:3000` for local development.

This means the key only works when the request originates from those domains.

---

## 5. Create Bing Search

Bing Search is part of Azure AI Services.

1. In the Azure portal, search for **Bing Search v7** and click it.
   - If it doesn't appear, search for **Bing Resources** and look for **Bing Search**.
2. Click **+ Create**.
3. Fill in:

   | Field | Value |
   |---|---|
   | Subscription | Your subscription |
   | Resource group | `scout-rg` |
   | Name | `scout-bing` |
   | Pricing tier | **S1** (3 calls/second, 1000/month free, then pay-per-use) |

4. Click **Review + Create**, then **Create**.

### Get the key

1. Go to the resource once deployed.
2. Click **Keys and Endpoint** in the left sidebar.
3. Copy **Key 1**. Keep this for Step 6.

> **Note:** Bing Search resources are sometimes listed under **AI + Machine Learning** in the Marketplace. If you can't find "Bing Search v7", search for "Bing" and look for the Bing Search tile (not Bing Maps or Bing Autosuggest).

---

## 6. Configure API Keys on the Static Web App

Azure Static Web Apps has **built-in managed Functions** — no separate Function App resource is created. The API code in the `api/` folder is deployed automatically alongside the front end. Environment variables are set directly on the Static Web App resource.

### Via the Azure Portal (recommended)

1. In the Azure portal, open your **Static Web App** resource (`scout-app`).
2. In the left sidebar, click **Configuration**.
3. Under **Application settings**, click **+ Add** for each of the following:

   | Name | Value |
   |---|---|
   | `AZURE_OPENAI_ENDPOINT` | Base endpoint from Step 3, e.g. `https://YOUR-RESOURCE.openai.azure.com` |
   | `AZURE_OPENAI_DEPLOYMENT` | `Azure-Scout` |
   | `AZURE_OPENAI_KEY` | Key 1 from Step 3 |
   | `AZURE_MAPS_KEY` | Primary Key from Step 4 |
   | `BING_SEARCH_KEY` | Key 1 from Step 5 |

4. Click **Save**. The app restarts with the new settings.

### Via VS Code

1. Create `api/local.settings.json` (already in `.gitignore`) for local development:

   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "",
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "AZURE_OPENAI_ENDPOINT": "https://YOUR-RESOURCE.openai.azure.com",
       "AZURE_OPENAI_DEPLOYMENT": "Azure-Scout",
       "AZURE_OPENAI_KEY": "your-openai-key",
       "AZURE_MAPS_KEY": "your-maps-key",
       "BING_SEARCH_KEY": "your-bing-key"
     }
   }
   ```

   This file is used only for `swa start` local dev — it is never deployed.

2. To push these settings to the deployed SWA, go to the portal as described above. (There is no VS Code shortcut to upload settings to a managed SWA Functions environment.)

---

## 7. Add the GitHub Secret

The GitHub Actions workflow needs one secret to authenticate deployments to Azure Static Web Apps.

VS Code usually adds this automatically when you create the SWA resource (Step 2). Verify it exists:

1. Go to your GitHub repository.
2. Click **Settings** → **Secrets and variables** → **Actions**.
3. You should see `AZURE_STATIC_WEB_APPS_API_TOKEN` in the list.

**If it's missing:**

1. In the Azure portal, go to your Static Web App resource.
2. Click **Manage deployment token** in the Overview section.
3. Copy the token.
4. In GitHub, click **New repository secret**, name it `AZURE_STATIC_WEB_APPS_API_TOKEN`, and paste the token.

---

## 8. Set the Map Key for Local Dev

The map tile rendering (the actual map display in the Route Planner) requires the Azure Maps key in the React app's environment. This is the only key that goes in `.env` — everything else stays in `local.settings.json`.

Create a `.env` file in the project root (copy from the example):

```bash
cp .env.example .env
```

Edit `.env`:

```
REACT_APP_AZURE_MAPS_KEY=your-azure-maps-primary-key
```

This key is used only to load map tiles in the browser. All data calls (geocoding, POI search) still go through the Function at `/api/places`.

> `.env` is in `.gitignore` and will never be committed.

---

## 9. Run Locally

Local development uses the SWA CLI to run the React dev server and Azure Functions together, mirroring the production setup.

### First time setup

```bash
# Install dependencies for the React app
npm install

# Install dependencies for the Functions
cd api && npm install && cd ..
```

### Start the dev server

```bash
swa start http://localhost:3000 --api-location api --run "npm start"
```

This command:
- Starts the React dev server on port 3000
- Starts the Functions runtime on port 7071
- Proxies everything through port 4280 (the SWA emulator)
- Routes `/api/*` requests to the local Functions automatically

Open `http://localhost:4280` in your browser.

### Alternative: run React and Functions separately

If you prefer two terminals:

**Terminal 1 — React:**
```bash
npm start
```

**Terminal 2 — Functions:**
```bash
cd api
npm install   # first time only
func start
```

Then open `http://localhost:3000`. API calls to `/api/*` will proxy to the Functions running on port 7071 (React's dev server is configured to proxy these automatically via `package.json`'s `proxy` field — add `"proxy": "http://localhost:7071"` if you use this method).

### Verify everything is working

With the app running, try a territory search. The browser network tab should show:
- `POST /api/scout` → 200
- `POST /api/places` → 200
- `POST /api/search` → 200

If any of these return 500, check `api/local.settings.json` and confirm the keys are set correctly.

---

## 10. Deploy

### Automatic deployment

Every push to `main` triggers the GitHub Actions workflow, which:
1. Builds the React app
2. Packages the Functions
3. Deploys both to Azure Static Web Apps

```bash
git add .
git commit -m "Your message"
git push origin main
```

Monitor progress in the **Actions** tab of your GitHub repository. Deployment typically takes 3-5 minutes.

### Manual deployment via VS Code

1. In the Azure panel, right-click your Static Web App → **Deploy to Static Web App**.
2. Select the `build` folder as the output.

> Note: This deploys only the frontend. The Functions are always deployed via GitHub Actions when the `api/` folder changes.

---

## 11. Project Structure

```
scout-territory/
├── api/                              ← Azure Functions (backend)
│   ├── src/functions/
│   │   ├── scout.js                  ← Azure OpenAI proxy
│   │   ├── places.js                 ← Azure Maps proxy (geocode + POI + routing)
│   │   └── search.js                 ← Bing Search proxy
│   ├── host.json
│   ├── local.settings.json           ← Local env vars (never committed)
│   └── package.json
│
├── src/                              ← React app
│   ├── views/
│   │   ├── TerritoryView.jsx         ← Module 1: Territory Research
│   │   ├── RoutePlannerView.jsx      ← Module 2: Route Planner
│   │   ├── CampaignView.jsx          ← Module 3: Campaign Generator
│   │   ├── CallPrepView.jsx          ← Module 4: Call Prep Cards
│   │   └── ActivityLogView.jsx       ← Module 5: Activity Log
│   ├── components/
│   │   ├── NavBar.jsx                ← Tab navigation
│   │   ├── ProspectCard.jsx          ← Territory research result card
│   │   ├── CallPrepCard.jsx          ← Call prep accordion card
│   │   ├── RouteMap.jsx              ← Azure Maps display
│   │   ├── WeekSchedule.jsx          ← Drag-and-drop weekly schedule
│   │   ├── SearchPanel.jsx           ← Territory search inputs
│   │   ├── SummaryBar.jsx            ← Results summary + export
│   │   ├── Badges.jsx                ← Heat / Brand / Job badges
│   │   └── Spinner.jsx               ← Loading state
│   ├── api.js                        ← Calls /api/scout
│   ├── placesApi.js                  ← Calls /api/places
│   ├── searchApi.js                  ← Calls /api/search
│   ├── prompts.js                    ← All AI prompt templates
│   ├── storage.js                    ← IndexedDB (local persistence)
│   ├── utils/icalExport.js           ← .ics calendar file generator
│   └── App.jsx                       ← Tab routing + cross-module state
│
├── .env                              ← Local only: REACT_APP_AZURE_MAPS_KEY
├── .env.example                      ← Template (committed)
├── staticwebapp.config.json          ← SWA routing config
└── SETUP.md                          ← This file
```

---

## 12. Troubleshooting

### "Server error 500" on any API call

The Static Web App is missing an application setting. Check:
1. Azure portal → your Static Web App → **Configuration** → **Application settings**
2. Confirm all five keys are present: `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_KEY`, `AZURE_MAPS_KEY`, `BING_SEARCH_KEY`
3. After adding or changing settings, click **Save** and wait for the restart

For local dev, check `api/local.settings.json`.

### Functions don't start locally (`func start` fails)

Azure Functions Core Tools v4 must be installed:

```bash
# macOS
brew tap azure/functions && brew install azure-functions-core-tools@4

# Windows (winget)
winget install Microsoft.AzureFunctionsCoreTools

# npm (cross-platform)
npm install -g azure-functions-core-tools@4 --unsafe-perm true
```

Verify with `func --version` — should print `4.x.x`.

### Map doesn't display in Route Planner

`REACT_APP_AZURE_MAPS_KEY` is not set in `.env`. The map component shows a clear message when the key is missing. Add the key and restart the dev server (`Ctrl+C` then `npm start` or `swa start ...`).

### Bing Search returns no results

Bing Search results may be empty in certain regions or for very specific queries — this is expected and handled gracefully (the territory search falls back to AI-only enrichment). Confirm the `BING_SEARCH_KEY` is set and the Bing Search resource is in **Active** state in the portal.

### Deployment fails with "unauthorized"

The `AZURE_STATIC_WEB_APPS_API_TOKEN` GitHub secret is expired or missing. Regenerate it:
1. Azure portal → your Static Web App → **Manage deployment token** → **Regenerate**
2. Copy the new token
3. GitHub → Settings → Secrets → update `AZURE_STATIC_WEB_APPS_API_TOKEN`

### Azure OpenAI returns "model not found" or 404

Check that `AZURE_OPENAI_ENDPOINT` is the **base URL only** (no path) and `AZURE_OPENAI_DEPLOYMENT` matches the name exactly as shown in Azure OpenAI Studio:

| Setting | Correct value |
|---|---|
| `AZURE_OPENAI_ENDPOINT` | `https://YOUR-RESOURCE.openai.azure.com` |
| `AZURE_OPENAI_DEPLOYMENT` | `Azure-Scout` (case-sensitive) |

The function constructs the full path automatically — do **not** include `/openai/deployments/...` in the endpoint value.

### Activity Log coaching nudges never appear

Coaching nudges are only generated when there are logged activities in the last 30 days. Log a few visits or calls first, then navigate away from the Activity tab and back — this re-triggers the nudge generation.

Nudges are also cached for 24 hours in `localStorage`. To force a refresh during testing:
```javascript
// Paste in browser DevTools console
localStorage.removeItem('scout_coaching_nudges');
```
Then reload the page.
