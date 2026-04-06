// storage.js
// Persistent storage layer using IndexedDB via idb.
// All modules read/write through these typed async functions.

import { openDB } from 'idb';

const DB_NAME = 'scout-db';
const DB_VERSION = 3;

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Territory Research: saved search result sets
      if (!db.objectStoreNames.contains('searches')) {
        const searches = db.createObjectStore('searches', {
          keyPath: 'id',
          autoIncrement: true,
        });
        searches.createIndex('by-timestamp', 'timestamp');
      }

      // Prospect status tracking: contacted, in-campaign, non-viable
      if (!db.objectStoreNames.contains('prospectStatuses')) {
        db.createObjectStore('prospectStatuses', { keyPath: 'prospectName' });
      }

      // Route Planner: pinned stops (prospects + existing clients)
      if (!db.objectStoreNames.contains('pinnedStops')) {
        const stops = db.createObjectStore('pinnedStops', { keyPath: 'id' });
        stops.createIndex('by-name', 'name');
      }

      // Activity Log: rep-logged visits, calls, emails
      if (!db.objectStoreNames.contains('activities')) {
        const activities = db.createObjectStore('activities', {
          keyPath: 'id',
          autoIncrement: true,
        });
        activities.createIndex('by-date', 'date');
        activities.createIndex('by-prospect', 'prospectName');
      }

      // Campaign Content: generated outreach sequences
      if (!db.objectStoreNames.contains('generatedContent')) {
        const content = db.createObjectStore('generatedContent', { keyPath: 'id' });
        content.createIndex('by-timestamp', 'generatedAt');
      }

      // Call Prep Cards: one-pager cards per prospect
      if (!db.objectStoreNames.contains('callPrepCards')) {
        const cards = db.createObjectStore('callPrepCards', { keyPath: 'prospectName' });
        cards.createIndex('by-timestamp', 'generatedAt');
      }

      // Prospect Database: full account records with contacts + notes
      if (!db.objectStoreNames.contains('prospects')) {
        const p = db.createObjectStore('prospects', { keyPath: 'id' });
        p.createIndex('by-companyName', 'companyName');
        p.createIndex('by-status', 'status');
        p.createIndex('by-updatedAt', 'updatedAt');
      }
    },
  });
}

// ─── Territory Research ───────────────────────────────────────────────────────

export async function saveSearch(location, data, params = {}) {
  const db = await getDB();
  return db.add('searches', { location, timestamp: Date.now(), data, ...params });
}

export async function getRecentSearches(limit = 10) {
  const db = await getDB();
  const all = await db.getAllFromIndex('searches', 'by-timestamp');
  return all.reverse().slice(0, limit);
}

export async function getLatestSearch() {
  const db = await getDB();
  const all = await db.getAllFromIndex('searches', 'by-timestamp');
  return all.length > 0 ? all[all.length - 1] : null;
}

// ─── Prospect Status ──────────────────────────────────────────────────────────

// status: 'contacted' | 'in-campaign' | 'non-viable'
export async function saveProspectStatus(prospectName, status) {
  const db = await getDB();
  return db.put('prospectStatuses', { prospectName, status, updatedAt: Date.now() });
}

export async function getProspectStatuses() {
  const db = await getDB();
  const all = await db.getAll('prospectStatuses');
  return Object.fromEntries(all.map((r) => [r.prospectName, r.status]));
}

export async function clearProspectStatus(prospectName) {
  const db = await getDB();
  return db.delete('prospectStatuses', prospectName);
}

// ─── Pinned Stops (Route Planner) ─────────────────────────────────────────────

export async function savePinnedStop(stop) {
  // stop: { id, name, address, lat, lng, type: 'prospect'|'client', brand, heatScore, notes }
  const db = await getDB();
  return db.put('pinnedStops', stop);
}

export async function getPinnedStops() {
  const db = await getDB();
  return db.getAll('pinnedStops');
}

export async function deletePinnedStop(id) {
  const db = await getDB();
  return db.delete('pinnedStops', id);
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export async function logActivity(activity) {
  // activity: { prospectName, type: 'Visit'|'Call'|'Email'|'Demo', outcome, date, notes }
  const db = await getDB();
  return db.add('activities', { ...activity, date: activity.date ?? Date.now() });
}

export async function getActivities(sinceDaysAgo = 90) {
  const db = await getDB();
  const cutoff = Date.now() - sinceDaysAgo * 24 * 60 * 60 * 1000;
  const all = await db.getAllFromIndex('activities', 'by-date', IDBKeyRange.lowerBound(cutoff));
  return all.reverse();
}

export async function getActivitiesForProspect(prospectName) {
  const db = await getDB();
  const all = await db.getAllFromIndex('activities', 'by-prospect', prospectName);
  return all.reverse();
}

// Returns a compact summary array suitable for the AI coaching prompt
export async function getActivitySummaryForCoaching() {
  const db = await getDB();
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = await db.getAllFromIndex('activities', 'by-date', IDBKeyRange.lowerBound(cutoff));

  const byProspect = {};
  for (const a of recent) {
    if (!byProspect[a.prospectName]) {
      byProspect[a.prospectName] = { prospect: a.prospectName, touchCount: 0, lastTouched: 0, lastOutcome: null };
    }
    byProspect[a.prospectName].touchCount++;
    if (a.date > byProspect[a.prospectName].lastTouched) {
      byProspect[a.prospectName].lastTouched = a.date;
      byProspect[a.prospectName].lastOutcome = a.outcome;
    }
  }

  return Object.values(byProspect).map((s) => ({
    ...s,
    lastTouched: new Date(s.lastTouched).toISOString().split('T')[0],
  }));
}

// ─── Generated Content (Campaign Generator) ───────────────────────────────────

export async function saveGeneratedContent(content) {
  // content: { id, prospectType, companyName, email, voicemail, linkedin, followUps[], generatedAt }
  const db = await getDB();
  return db.put('generatedContent', { ...content, generatedAt: Date.now() });
}

export async function getRecentGeneratedContent(limit = 20) {
  const db = await getDB();
  const all = await db.getAllFromIndex('generatedContent', 'by-timestamp');
  return all.reverse().slice(0, limit);
}

// ─── Call Prep Cards ──────────────────────────────────────────────────────────

export async function saveCallPrepCard(card) {
  // card: { prospectName, companySnapshot, likelyPainPoints[], suggestedTalkingPoints[],
  //         questionsToAsk[], objectionHandling{}, brandFit, iceBreakers[] }
  const db = await getDB();
  return db.put('callPrepCards', { ...card, generatedAt: Date.now() });
}

export async function getCallPrepCard(prospectName) {
  const db = await getDB();
  return db.get('callPrepCards', prospectName);
}

export async function getRecentCallPrepCards(limit = 20) {
  const db = await getDB();
  const all = await db.getAllFromIndex('callPrepCards', 'by-timestamp');
  return all.reverse().slice(0, limit);
}

// ─── Prospect Database ─────────────────────────────────────────────────────────
// prospect: { id, companyName, address, industry, phone, website,
//             status, heatScore, notes, contacts[], createdAt, updatedAt }
// contact:  { id, name, title, phone, email, linkedin }

function prospectId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function saveProspect(prospect) {
  const db = await getDB();
  const now = Date.now();
  const record = { ...prospect, updatedAt: now };
  if (!record.id) { record.id = prospectId(); record.createdAt = now; }
  await db.put('prospects', record);
  return record;
}

export async function getProspect(id) {
  const db = await getDB();
  return db.get('prospects', id);
}

export async function getAllProspects() {
  const db = await getDB();
  const all = await db.getAllFromIndex('prospects', 'by-updatedAt');
  return all.reverse();
}

export async function deleteProspect(id) {
  const db = await getDB();
  return db.delete('prospects', id);
}

export async function getProspectByName(companyName) {
  const db = await getDB();
  return db.getFromIndex('prospects', 'by-companyName', companyName);
}
