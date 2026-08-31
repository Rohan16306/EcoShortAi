'use client';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useWasteModel, WasteClassName } from '@/hooks/useWasteModel';
import { Camera, CheckCircle, AlertTriangle, Loader2, MapPin, MapPinOff, ScanFace, HelpCircle } from 'lucide-react';
import { useUserStore } from '@/store/useUserStore';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanService, calculatePoints } from '@/services/scanService';

/**
 * CameraScanner — Truth Mode Rewrite
 *
 * WHAT CHANGED:
 * ─────────────
 * 1. REMOVED the ⚡Fast AI / 🧠Pro AI toggle. There is now ONE engine:
 *    your custom-trained waste model running in the browser via TensorFlow.js.
 * 2. REMOVED the ALLOWED_WASTE_ITEMS hack list (was 60+ generic ImageNet labels).
 *    The model now directly outputs waste categories — no mapping needed.
 * 3. REMOVED the localhost:5000 Flask server call (GPU mode).
 *    The model runs locally in the browser. Zero server dependency.
 * 4. ADDED proper confidence threshold (70%) — prevents wrong answers.
 * 5. ADDED "uncertain" state when top-2 predictions are close (within 15%).
 *    Shows both options and lets the user pick instead of guessing wrong.
 */

// ─── Human-readable display names for the 7 model categories ───
const DISPLAY_NAMES: Record<WasteClassName, string> = {
  glass: 'Glass',
  hard_waste: 'Hard Waste',
  liquid_waste: 'Liquid Waste',
  metal: 'Metal',
  non_organic_waste: 'Non-Organic Waste',
  organic_waste: 'Organic Waste',
  plastic: 'Plastic',
};

// ─── Map model categories → material types for points calculation ───
// Direct 1:1 mapping. No more guessing from ImageNet labels.
function detectMaterial(className: WasteClassName): string {
  const materialMap: Record<WasteClassName, string> = {
    glass: 'glass',
    hard_waste: 'other',
    liquid_waste: 'other',
    metal: 'metal',
    non_organic_waste: 'other',
    organic_waste: 'organic',
    plastic: 'plastic',
  };
  return materialMap[className] || 'other';
}

interface GeoState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  denied: boolean;
}

const GEO_TIMEOUT_MS = 8_000;
const CONFIDENCE_THRESHOLD = 0.70;    // Below this = "try again"
const UNCERTAINTY_GAP = 0.15;          // If top-2 are within 15%, show both

export default function CameraScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isLoading: isModelLoading, predict } = useWasteModel();

  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error' | 'uncertain'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Uncertain state: top-2 predictions
  const [uncertainOptions, setUncertainOptions] = useState<{ className: WasteClassName; probability: number }[]>([]);

  const [geo, setGeo] = useState<GeoState>({ lat: null, lng: null, accuracy: null, denied: false });
  const [isLocating, setIsLocating] = useState(false);

  const { isAuthenticated } = useUserStore();

  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error('Camera error:', err);
      }
    };
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, []);

  const fetchGeo = useCallback((): Promise<GeoState> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ lat: null, lng: null, accuracy: null, denied: true });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            denied: false,
          });
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          resolve({ lat: null, lng: null, accuracy: null, denied: err.code === 1 });
        },
        { enableHighAccuracy: true, timeout: GEO_TIMEOUT_MS, maximumAge: 30_000 }
      );
    });
  }, []);

  useEffect(() => {
    setIsLocating(true);
    fetchGeo().then((g) => {
      setGeo(g);
      setIsLocating(false);
    });
  }, [fetchGeo]);

  const triggerConfetti = () => {
    const end = Date.now() + 1500;
    const colors = ['#22c55e', '#10b981', '#3b82f6'];
    (function frame() {
      confetti({ particleCount: 3, angle: 60,  spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  /**
   * Submit a confirmed scan (used after normal scan OR after user picks from uncertain options)
   */
  const submitScan = async (className: WasteClassName, prob: number, freshGeo: GeoState) => {
    if (!isAuthenticated) {
      setScanStatus('success');
      setResult(DISPLAY_NAMES[className]);
      setConfidence(Math.round(prob * 100));
      triggerConfetti();
      return;
    }

    const material = detectMaterial(className);
    const basePoints = calculatePoints(material);

    const scanResult = await ScanService.submitScan({
      material,
      label: className,
      points_awarded: basePoints,
      geo_lat:      freshGeo.lat      ?? undefined,
      geo_lng:      freshGeo.lng      ?? undefined,
      geo_accuracy: freshGeo.accuracy ?? undefined,
      geo_denied:   freshGeo.denied,
    });

    if (!scanResult.success) {
      setSubmitError(scanResult.error ?? 'Scan rejected. Please try again.');
      setScanStatus('error');
      setErrorMessage(scanResult.error ?? 'Scan rejected.');
      return;
    }

    setScanStatus('success');
    setResult(DISPLAY_NAMES[className]);
    setConfidence(Math.round(prob * 100));
    triggerConfetti();
  };

  const handleScan = async () => {
    if (!videoRef.current || isModelLoading) return;

    setIsScanning(true);
    setScanStatus('scanning');
    setResult(null);
    setSubmitError(null);
    setUncertainOptions([]);

    try {
      setIsLocating(true);
      const freshGeo = await fetchGeo();
      setGeo(freshGeo);
      setIsLocating(false);

      const prediction = await predict(videoRef.current);

      if (!prediction) {
        setScanStatus('error');
        setErrorMessage('Could not analyse frame. Please try again.');
        return;
      }

      const top = prediction.allProbabilities[0];
      const second = prediction.allProbabilities[1];

      // ─── Confidence Gate ───
      if (top.probability < CONFIDENCE_THRESHOLD) {
        setScanStatus('error');
        setConfidence(Math.round(top.probability * 100));
        setResult(DISPLAY_NAMES[top.className]);
        setErrorMessage(
          `Low confidence (${Math.round(top.probability * 100)}%). ` +
          'Move closer, ensure good lighting, and centre the item in the frame.'
        );
        return;
      }

      // ─── Uncertainty Check ───
      // If top-2 predictions are within 15% of each other, the model is confused.
      // Let the user pick instead of guessing wrong.
      if (second && (top.probability - second.probability) < UNCERTAINTY_GAP) {
        setScanStatus('uncertain');
        setUncertainOptions([top, second]);
        // Store geo for later submission
        setGeo(freshGeo);
        return;
      }

      // ─── Clear prediction — submit directly ───
      await submitScan(top.className, top.probability, freshGeo);

    } catch (err) {
      console.error(err);
      setScanStatus('error');
      setErrorMessage('AI processing engine encountered a frame error.');
    } finally {
      setIsScanning(false);
      setIsLocating(false);
    }
  };

  /**
   * User picks one of the uncertain options
   */
  const handleUncertainPick = async (picked: { className: WasteClassName; probability: number }) => {
    setIsScanning(true);
    try {
      await submitScan(picked.className, picked.probability, geo);
    } catch (err) {
      console.error(err);
      setScanStatus('error');
      setErrorMessage('Failed to submit scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const GeoBadge = () => {
    if (isLocating) {
      return (
        <span className="flex items-center gap-1 text-xs text-white">
          <Loader2 className="w-3 h-3 animate-spin" /> Locating…
        </span>
      );
    }
    if (geo.denied) {
      return (
        <span className="flex items-center gap-1 text-xs text-amber-400">
          <MapPinOff className="w-3 h-3" /> No location (½ pts)
        </span>
      );
    }
    if (geo.lat !== null) {
      return (
        <span className="flex items-center gap-1 text-xs text-green-400">
          <MapPin className="w-3 h-3" /> GPS ±{Math.round(geo.accuracy ?? 0)} m
        </span>
      );
    }
    return null;
  };

  return (
    <div className="max-w-md mx-auto bg-white/10 dark:bg-gray-900/40 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 relative z-10">

      {/* Model status badge */}
      <div className="flex items-center justify-center gap-2 py-3 mx-6 mt-4 mb-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
        {isModelLoading ? (
          <span className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading AI Model…
          </span>
        ) : (
          <span className="flex items-center gap-2 text-sm font-bold text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            🧠 Custom Waste AI — Offline Ready
          </span>
        )}
      </div>

      {/* Camera viewfinder */}
      <div className="relative h-[65vh] w-full bg-black overflow-hidden rounded-[2rem] mx-4 mb-4 border-4 border-gray-800 shadow-inner group">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transition-opacity duration-700 opacity-90" />

        {/* Laser Scanner Animation */}
        {isScanning && (
          <motion.div 
            initial={{ top: "0%" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-1 bg-green-500 shadow-[0_0_20px_5px_rgba(34,197,94,0.5)] z-20"
          />
        )}

        {/* Target overlay */}
        <div className="absolute inset-0 border-2 border-white/20 m-6 rounded-3xl pointer-events-none z-10 transition-all duration-500 group-hover:border-white/40">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-green-400 -mt-0.5 -ml-0.5 rounded-tl-3xl" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-green-400 -mt-0.5 -mr-0.5 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-green-400 -mb-0.5 -ml-0.5 rounded-bl-3xl" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-green-400 -mb-0.5 -mr-0.5 rounded-br-3xl" />
          
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ScanFace className="w-16 h-16 text-green-400/50 animate-pulse" />
            </div>
          )}
        </div>

        {/* Geo badge */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-xl px-3 py-1.5 border border-white/10 z-20">
          <GeoBadge />
        </div>

        {/* Shutter button */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
          <button
            aria-label="Capture scan"
            onClick={handleScan}
            disabled={isScanning || isModelLoading}
            className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-2xl border-4 border-white hover:bg-white/40 active:scale-90 transition-all disabled:opacity-50 group"
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform shadow-lg">
              {isScanning ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            </div>
          </button>
        </div>
      </div>

      {/* Floating Glass Result Panel */}
      <AnimatePresence>
        {scanStatus !== 'idle' && !isScanning && !isModelLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-4 left-4 right-4 z-30"
          >
            {/* ─── SUCCESS ─── */}
            {scanStatus === 'success' ? (
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-green-500/30 rounded-3xl p-5 shadow-[0_10px_40px_-10px_rgba(34,197,94,0.3)]">
                <div className="flex items-center text-green-600 dark:text-green-400 font-bold mb-2 text-lg">
                  <CheckCircle className="w-6 h-6 mr-2" /> Match Found!
                </div>
                <p className="text-gray-900 dark:text-white font-display font-bold text-2xl capitalize leading-tight mb-1">{result}</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3 mb-1">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${confidence}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium text-right mb-4">{confidence}% Match</p>

                {geo.denied && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                    <MapPinOff className="w-4 h-4" /> Location denied (50% points)
                  </p>
                )}

                <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/30 active:scale-95 transition-all flex items-center justify-center">
                  <ScanFace className="w-5 h-5 mr-2" /> {isAuthenticated ? 'Claim Points' : 'Log In to Claim'}
                </button>
              </div>

            /* ─── UNCERTAIN: Top-2 predictions are close ─── */
            ) : scanStatus === 'uncertain' ? (
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-5 shadow-[0_10px_40px_-10px_rgba(245,158,11,0.3)]">
                <div className="flex items-center text-amber-600 dark:text-amber-400 font-bold mb-3 text-lg">
                  <HelpCircle className="w-6 h-6 mr-2" /> Which one is it?
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  The AI detected two possible matches. Please select the correct one:
                </p>
                <div className="flex flex-col gap-2">
                  {uncertainOptions.map((opt) => (
                    <button
                      key={opt.className}
                      onClick={() => handleUncertainPick(opt)}
                      className="w-full flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 active:scale-[0.98] transition-all"
                    >
                      <span className="font-bold text-gray-900 dark:text-white capitalize">
                        {DISPLAY_NAMES[opt.className]}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {Math.round(opt.probability * 100)}%
                      </span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setScanStatus('idle')} 
                  className="mt-3 w-full text-gray-500 dark:text-gray-400 text-sm py-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Neither — scan again
                </button>
              </div>

            /* ─── ERROR ─── */
            ) : (
              <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-5 shadow-[0_10px_40px_-10px_rgba(239,68,68,0.3)]">
                <div className="flex items-center text-red-600 font-bold mb-2 text-lg">
                  <AlertTriangle className="w-6 h-6 mr-2" /> Scan Rejected
                </div>
                <p className="text-gray-800 dark:text-gray-200 font-medium">{errorMessage}</p>
                {submitError && <p className="text-red-500 text-xs mt-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{submitError}</p>}
                
                <button onClick={() => setScanStatus('idle')} className="mt-4 w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 py-3 rounded-xl font-bold transition-colors">
                  Try Again
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
