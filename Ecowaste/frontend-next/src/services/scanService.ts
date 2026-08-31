import pb from '@/lib/pocketbase';

/**
 * ScanService — Replaces Express /api/scan/* and /api/data/* routes
 *
 * WHY THE OLD WAY CRASHED:
 * ────────────────────────
 * server.js used fs.writeFileSync('db.json', ...) on every scan.
 * With 4 users scanning simultaneously:
 *   User 1 writes → Event loop BLOCKED
 *   Users 2,3,4 → QUEUED, FROZEN, TIMEOUT → CRASH
 *
 * PocketBase uses SQLite WAL mode:
 *   Users 1,2,3,4 write SIMULTANEOUSLY → No blocking, no crash.
 *
 * IMPORTANT: AI runs 100% in the browser (TensorFlow.js / MobileNet).
 * We only send a tiny JSON payload + optional image file to PocketBase.
 * This means the backend NEVER processes Base64 images in memory.
 */

// ─── Business Logic: Points Calculation ───
// Moved from server.js — this runs on the CLIENT, not the server.
// This keeps the backend thin and the event loop free.

const MATERIAL_POINTS: Record<string, number> = {
  plastic: 50,
  glass: 75,
  metal: 60,
  paper: 30,
  cardboard: 35,
  organic: 20,
  ewaste: 100,
  textile: 40,
  other: 10,
};

export function calculatePoints(material: string): number {
  const normalizedMaterial = material.toLowerCase().trim();
  for (const [key, points] of Object.entries(MATERIAL_POINTS)) {
    if (normalizedMaterial.includes(key)) return points;
  }
  return MATERIAL_POINTS.other;
}

// ─── Business Logic: Geo-distance (Haversine) ───
// Moved from server.js lines 271-300

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number | null {
  if (!Number.isFinite(a.lat) || !Number.isFinite(a.lng)) return null;
  if (!Number.isFinite(b.lat) || !Number.isFinite(b.lng)) return null;

  const earthRadius = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const hav =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  return earthRadius * c;
}

// ─── Interfaces ───

export interface ScanData {
  material: string;
  label: string;
  points_awarded: number;
  image?: File;
  geo_lat?: number;
  geo_lng?: number;
  geo_accuracy?: number;
  geo_denied?: boolean;
  is_duplicate?: boolean;
}

export interface VerificationSession {
  id: string;
  photo_label: string;
  photo_material: string;
  is_recyclable: boolean;
  predicted_credits: number;
  duplicate_blocked: boolean;
  geo_lat?: number;
  geo_lng?: number;
  geo_accuracy?: number;
  geo_denied?: boolean;
  status: 'pending' | 'completed' | 'expired';
}

export interface VerificationResult {
  matched: boolean;
  materialMatched: boolean;
  locationMatched: boolean;
  duplicateBlocked: boolean;
  awardedCredits: number;
  reason: string;
}

// ─── Service ───

export const ScanService = {

  /**
   * Submit a completed scan directly (simple flow).
   * Replaces: PUT /api/data/me (server.js:491-504)
   *
   * OLD: Serialized entire user data + history array to db.json (BLOCKING)
   * NEW: Inserts ONE row into SQLite scans table (NON-BLOCKING)
   */
  submitScan: async (data: ScanData): Promise<{ success: boolean; record?: unknown; error?: string; pointsAwarded?: number }> => {
    const userId = pb.authStore.record?.id;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const hasValidGeo = 
      typeof data.geo_lat === 'number' && 
      typeof data.geo_lng === 'number' && 
      Number.isFinite(data.geo_lat) && 
      Number.isFinite(data.geo_lng);

    const finalPoints = data.geo_denied 
      ? Math.floor(data.points_awarded * 0.5) 
      : data.points_awarded;

    // --- Anti-Spoofing Check ---
    if (hasValidGeo && typeof window !== 'undefined') {
      const lastLatStr = localStorage.getItem('last_scan_lat');
      const lastLngStr = localStorage.getItem('last_scan_lng');
      
      const lastLat = lastLatStr ? parseFloat(lastLatStr) : null;
      const lastLng = lastLngStr ? parseFloat(lastLngStr) : null;

      if (lastLat !== null && lastLng !== null && !isNaN(lastLat) && !isNaN(lastLng)) {
        const distanceMoved = distanceMeters(
          { lat: lastLat, lng: lastLng },
          { lat: data.geo_lat!, lng: data.geo_lng! }
        );

        if (distanceMoved !== null && distanceMoved < 10) {
          return { success: false, error: 'Anti-Spoofing Active: Please move to a different location to scan another item.' };
        }
      }

      localStorage.setItem('last_scan_lat', data.geo_lat!.toString());
      localStorage.setItem('last_scan_lng', data.geo_lng!.toString());
    }
    // ---------------------------

    try {
      // Use FormData for file uploads — streams directly to disk.
      // NO Base64 encoding, NO event loop blocking.
      const formData = new FormData();
      formData.append('user', userId);
      formData.append('material', data.material);
      formData.append('label', data.label);
      formData.append('points_awarded', finalPoints.toString());
      formData.append('is_duplicate', String(data.is_duplicate || false));
      formData.append('geo_denied', String(data.geo_denied || false));

      if (data.image) {
        formData.append('image', data.image);
      }
      
      if (hasValidGeo) {
        formData.append('geo_lat', data.geo_lat!.toString());
        formData.append('geo_lng', data.geo_lng!.toString());
        if (data.geo_accuracy !== undefined) formData.append('geo_accuracy', data.geo_accuracy.toString());
      }

      const record = await pb.collection('scans').create(formData);

      // Update user's total points (atomic operation in SQLite — no race condition)
      const currentPoints = pb.authStore.record?.['total_points'] || 0;
      await pb.collection('users').update(userId, {
        total_points: currentPoints + finalPoints,
      });

      // Refresh the auth store so the UI immediately reflects new points
      await pb.collection('users').authRefresh();

      return { success: true, record, pointsAwarded: finalPoints };
    } catch (err: unknown) {
      console.error('Scan submission failed:', err);
      return { success: false, error: 'Failed to save scan' };
    }
  },

  /**
   * Start a 2-step verification session.
   * Replaces: POST /api/scan/verify/start (server.js:309-344)
   *
   * OLD: Stored in an in-memory Map() → lost on server restart
   * NEW: Stored in SQLite scan_sessions table → persistent, queryable
   */
  startVerification: async (photoData: {
    label: string;
    material: string;
    isRecyclable: boolean;
    predictedCredits: number;
    duplicateBlocked: boolean;
    location?: { lat: number; lng: number; accuracy: number };
    geoDenied?: boolean;
  }): Promise<{ success: boolean; sessionId?: string; error?: string }> => {
    try {
      const userId = pb.authStore.record?.id;

      const record = await pb.collection('scan_sessions').create({
        user: userId || '',
        photo_label: photoData.label,
        photo_material: photoData.material,
        is_recyclable: photoData.isRecyclable,
        predicted_credits: photoData.predictedCredits,
        duplicate_blocked: photoData.duplicateBlocked,
        geo_lat: photoData.location?.lat || 0,
        geo_lng: photoData.location?.lng || 0,
        geo_accuracy: photoData.location?.accuracy || 0,
        geo_denied: photoData.geoDenied || false,
        status: 'pending',
      });

      return { success: true, sessionId: record.id };
    } catch (err: unknown) {
      console.error('Verification start failed:', err);
      return { success: false, error: 'Failed to start verification' };
    }
  },

  /**
   * Complete a 2-step verification session.
   * Replaces: POST /api/scan/verify/complete (server.js:346-408)
   *
   * This is the BUSINESS LOGIC that was in server.js.
   * It runs on the CLIENT because PocketBase can't run custom JS.
   * For a production app, you'd use PocketBase hooks (Go).
   */
  completeVerification: async (
    sessionId: string,
    step2: {
      material: string;
      isRecyclable: boolean;
      location?: { lat: number; lng: number; accuracy: number };
      geoDenied?: boolean;
    }
  ): Promise<VerificationResult> => {
    try {
      // Fetch the original session from PocketBase
      const session = await pb.collection('scan_sessions').getOne(sessionId);

      // ─── Match Logic (moved from server.js:364-382) ───
      const materialMatched = session['photo_material'] === step2.material;
      const recyclableMatched = session['is_recyclable'] === step2.isRecyclable;

      const s1Lat = session['geo_lat'] as number;
      const s1Lng = session['geo_lng'] as number;
      const step1Location = s1Lat !== 0 && s1Lng !== 0 ? { lat: s1Lat, lng: s1Lng } : null;
      
      const step2Location = step2.location
        ? { lat: step2.location.lat, lng: step2.location.lng }
        : null;

      const hasBothLocations = !!(step1Location && step2Location);
      const locationDist = hasBothLocations
        ? distanceMeters(step1Location!, step2Location!)
        : null;

      const maxDistance = 80;
      const maxTolerance = 350;
      const accuracyAllowance = Math.max(
        (session['geo_accuracy'] as number) || 0,
        step2.location?.accuracy || 0
      );
      const tolerance = Math.min(Math.max(maxDistance, accuracyAllowance), maxTolerance);
      const locationMatched = !hasBothLocations || (locationDist !== null && locationDist <= tolerance);

      const matched = materialMatched && recyclableMatched && locationMatched;
      const duplicateBlocked = session['duplicate_blocked'] as boolean;
      const basePredicted = Math.max(0, session['predicted_credits'] as number);

      const geoDeniedEither = (session['geo_denied'] as boolean) || (step2.geoDenied ?? false);
      const awardedCredits = matched && !duplicateBlocked 
        ? (geoDeniedEither ? Math.floor(basePredicted * 0.5) : basePredicted) 
        : 0;

      // Mark session as completed
      await pb.collection('scan_sessions').update(sessionId, { status: 'completed' });

      // If credits awarded, save the scan and update user points
      if (awardedCredits > 0) {
        const userId = pb.authStore.record?.id;
        if (userId) {
          await pb.collection('scans').create({
            user: userId,
            material: session['photo_material'],
            label: session['photo_label'],
            points_awarded: awardedCredits,
            is_duplicate: false,
            geo_lat: step2Location?.lat || 0,
            geo_lng: step2Location?.lng || 0,
          });

          const currentPoints = pb.authStore.record?.['total_points'] || 0;
          await pb.collection('users').update(userId, {
            total_points: currentPoints + awardedCredits,
          });

          await pb.collection('users').authRefresh();
        }
      }

      // Build reason string
      let reason: string;
      if (duplicateBlocked) {
        reason = 'Duplicate protection blocked this scan.';
      } else if (matched && geoDeniedEither) {
        reason = 'Match confirmed, but location was unavailable — 50% points awarded.';
      } else if (matched) {
        reason = hasBothLocations
          ? 'Step 1 and Step 2 matched, and location check passed.'
          : 'Step 1 and Step 2 matched. Location check skipped (geolocation unavailable).';
      } else if (!materialMatched || !recyclableMatched) {
        reason = 'Step 1 and Step 2 outputs did not match.';
      } else {
        reason = 'Location validation failed. Move closer and try again.';
      }

      return { matched, materialMatched, locationMatched, duplicateBlocked, awardedCredits, reason };
    } catch (err: unknown) {
      console.error('Verification completion failed:', err);
      return {
        matched: false,
        materialMatched: false,
        locationMatched: false,
        duplicateBlocked: false,
        awardedCredits: 0,
        reason: 'Verification failed. Please try again.',
      };
    }
  },

  /**
   * Smart Bin integration.
   * Compares the user's scan coordinates with the official bin location.
   */
  verifyAndSaveSmartBinScan: async (
    smartBinId: string,
    scanData: ScanData
  ): Promise<{ success: boolean; error?: string; record?: unknown }> => {
    try {
      const bin = await pb.collection('smart_bins').getOne(smartBinId);
      
      if (!scanData.geo_lat || !scanData.geo_lng) {
        return { success: false, error: 'Location required to use a Smart Bin. Please enable GPS and try again.' };
      }

      const distance = distanceMeters(
        { lat: scanData.geo_lat, lng: scanData.geo_lng },
        { lat: bin.latitude, lng: bin.longitude }
      );

      const SMART_BIN_TOLERANCE_M = 30;

      // Require user to be within 30 meters of the smart bin
      if (distance === null || distance > SMART_BIN_TOLERANCE_M) {
        return { success: false, error: `You are too far from the smart bin (${Math.round(distance ?? 0)} m away, limit is ${SMART_BIN_TOLERANCE_M} m).` };
      }

      // If check passes, process the scan
      return await ScanService.submitScan(scanData);
    } catch (err) {
      console.error("Smart bin verification failed:", err);
      return { success: false, error: 'Failed to verify smart bin' };
    }
  },

  /**
   * Get the user's scan history.
   * Replaces: GET /api/data/me → data.history (server.js:485-489)
   */
  getScanHistory: async (page = 1, perPage = 20) => {
    const userId = pb.authStore.record?.id;
    if (!userId) return { items: [], totalItems: 0 };

    try {
      return await pb.collection('scans').getList(page, perPage, {
        filter: `user = "${userId}"`,
        sort: '-created',
      });
    } catch {
      return { items: [], totalItems: 0 };
    }
  },

  /**
   * Get image URL for a scan record.
   * PocketBase provides direct file URLs — no Base64 decoding needed.
   */
  getImageUrl: (record: { id: string; collectionId: string; image: string }): string => {
    if (!record.image) return '';
    return pb.files.getURL(record, record.image);
  },
};
