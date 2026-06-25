// --- STATE MANAGEMENT ---
        let model = null;
        let modelLoadPromise = null;
        let currentImage = null;
        let currentImageHash = null;
        let currentGeoTag = null;
        let currentStep2Image = null;
        let pendingVerification = null;
        let stream = null;
        let scrollRevealObserver = null;

        const LOCATION_DUPLICATE_RADIUS_METERS = 20;
        const LOCATION_CREDIT_MIN_DISTANCE_METERS = 100;
        const MAX_ACCEPTABLE_GEO_ACCURACY_METERS = 200;
        const GEOLOCATION_TIMEOUT_MS = 2500;
        const GEOLOCATION_MAX_AGE_MS = 300000;
        const SCAN_IMAGE_MAX_EDGE = 1280;
        const MAX_HISTORY_ITEMS = 200;
        const MAX_IMAGE_HASHES = 200;
        const STORE_SCAN_IMAGE_IN_HISTORY = false;
        
        // Data Store with persistent storage
        let appData = {
            credits: 0,
            history: [],
            claimedRewards: [],
            badges: [],
            imageHashes: [], // Store hashes of scanned images
            lastUpdated: null
        };

        // Auth State
        let currentUser = null;
        let authToken = null;
        function resolveApiBase() {
            if (window.location.protocol === 'file:') {
                return 'http://localhost:3002/api';
            }

            const host = window.location.host.toLowerCase();
            if (host === 'localhost:3002' || host === '127.0.0.1:3002') {
                return '/api';
            }

            return 'http://localhost:3002/api';
        }

        const API_BASE = resolveApiBase();

        // Quiz State
        let quizAnswers = {};
        const correctAnswers = {
            1: 'a', // 9%
            2: 'c', // 66%
            3: 'c', // 300,000
            4: 'b'  // Ingestion and entanglement
        };

        // Reward Definitions
        const BADGES = [
            { id: 'starter', name: 'Eco Starter', icon: 'fa-solid fa-seedling', description: 'Scan your first item', requirement: 1, type: 'scans', color: 'badge-bronze' },
            { id: 'recycler', name: 'Recycler', icon: 'fa-solid fa-recycle', description: 'Scan 10 items', requirement: 10, type: 'scans', color: 'badge-bronze' },
            { id: 'warrior', name: 'Green Warrior', icon: 'fa-solid fa-shield-halved', description: 'Scan 50 items', requirement: 50, type: 'scans', color: 'badge-silver' },
            { id: 'champion', name: 'Eco Champion', icon: 'fa-solid fa-crown', description: 'Scan 100 items', requirement: 100, type: 'scans', color: 'badge-gold' },
            { id: 'master', name: 'Master Recycler', icon: 'fa-solid fa-gem', description: 'Scan 500 items', requirement: 500, type: 'scans', color: 'badge-platinum' },
            { id: 'legend', name: 'Eco Legend', icon: 'fa-solid fa-globe', description: 'Scan 1000 items', requirement: 1000, type: 'scans', color: 'badge-diamond' }
        ];

        const REWARDS = [
            { id: 'coffee', name: 'Free Coffee', description: 'Get a free coffee at participating cafes', cost: 50, icon: 'fa-solid fa-mug-hot', type: 'redeem' },
            { id: 'tote', name: 'Eco Tote Bag', description: 'Reusable shopping bag with EcoSort logo', cost: 100, icon: 'fa-solid fa-bag-shopping', type: 'redeem' },
            { id: 'bottle', name: 'Steel Water Bottle', description: 'Premium insulated water bottle', cost: 200, icon: 'fa-solid fa-bottle-water', type: 'redeem' },
            { id: 'amazon10', name: '$10 Amazon Gift Card', description: 'Digital gift card for Amazon', cost: 300, icon: 'fa-solid fa-gift', type: 'code' },
            { id: 'starbucks20', name: '$20 Starbucks Card', description: 'Digital Starbucks gift card', cost: 500, icon: 'fa-solid fa-coffee', type: 'code' },
            { id: 'plant', name: 'Free Plant Kit', description: 'Grow your own herbs at home', cost: 150, icon: 'fa-solid fa-leaf', type: 'redeem' },
            { id: 'shirt', name: 'EcoSort T-Shirt', description: 'Organic cotton branded t-shirt', cost: 400, icon: 'fa-solid fa-shirt', type: 'redeem' },
            { id: 'amazon50', name: '$50 Amazon Gift Card', description: 'Digital gift card for Amazon', cost: 1000, icon: 'fa-solid fa-gifts', type: 'code' }
        ];

        // Material Mapping
        const MATERIAL_MAP = {
            'plastic': ['bottle', 'cup', 'container', 'jug', 'plastic'],
            'metal': ['can', 'tin', 'aluminum', 'metal', 'foil'],
            'glass': ['glass', 'bottle', 'jar', 'wine'],
            'paper': ['paper', 'cardboard', 'carton', 'newspaper', 'book']
        };

        // --- INITIALIZATION ---
        document.addEventListener('DOMContentLoaded', async () => {
            // Warm up model immediately so first scan waits less.
            startModelLoad().catch((e) => console.warn('Model preload failed:', e.message));
            initThemeToggle();
            await checkAuthStatus();
            await loadData();
            updateGlobalStats();
            await refreshGlobalImpact();
            initScrollAnimations();
            await loadFeaturedMedia();
            await loadCommunityPosts();
            bindCommunityForm();
            initQuiz();

            // Model preload is already started above.
        });

        function startModelLoad() {
            if (model) return Promise.resolve(model);
            if (modelLoadPromise) return modelLoadPromise;

            modelLoadPromise = mobilenet
                .load({ version: 1, alpha: 0.5 })
                .then((loadedModel) => {
                    model = loadedModel;
                    return loadedModel;
                })
                .catch((e) => {
                    modelLoadPromise = null;
                    throw e;
                });

            return modelLoadPromise;
        }

        // --- IMAGE HASHING FOR DUPLICATE DETECTION ---

        // --- GEOTAG (LOCATION) PROTECTION ---
        const GeoTag = {
            HEADER: 'GEO',
            VERSION: '1.0',

            async embedFromDataUrl(dataUrl, data) {
                const image = await this.dataUrlToImage(dataUrl);
                return this.embed(image, data);
            },

            embed(image, data) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const pixels = imageData.data;

                const payload = {
                    header: this.HEADER,
                    version: this.VERSION,
                    lat: Number(data.lat).toFixed(6),
                    lng: Number(data.lng).toFixed(6),
                    accuracy: Math.round(Number(data.accuracy || 0)),
                    creator: data.creator || 'guest',
                    timestamp: data.timestamp || new Date().toISOString()
                };

                const jsonString = JSON.stringify(payload);
                const binaryString = this.textToBinary(jsonString);
                const lengthBinary = jsonString.length.toString(2).padStart(32, '0');
                const checksum = this.calculateChecksum(binaryString);
                const fullBinary = this.textToBinary(this.HEADER) + lengthBinary + binaryString + checksum;

                const maxBits = (pixels.length / 4) * 3;
                if (fullBinary.length > maxBits) {
                    throw new Error('Image too small for geotag payload');
                }

                let bitIndex = 0;
                for (let i = 0; i < pixels.length; i += 4) {
                    if (bitIndex >= fullBinary.length) break;

                    if (bitIndex < fullBinary.length) {
                        pixels[i] = (pixels[i] & 0xFE) | Number(fullBinary[bitIndex]);
                        bitIndex++;
                    }
                    if (bitIndex < fullBinary.length) {
                        pixels[i + 1] = (pixels[i + 1] & 0xFE) | Number(fullBinary[bitIndex]);
                        bitIndex++;
                    }
                    if (bitIndex < fullBinary.length) {
                        pixels[i + 2] = (pixels[i + 2] & 0xFE) | Number(fullBinary[bitIndex]);
                        bitIndex++;
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                return canvas.toDataURL('image/png');
            },

            textToBinary(text) {
                return text
                    .split('')
                    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
                    .join('');
            },

            calculateChecksum(binaryString) {
                let sum = 0;
                for (let i = 0; i < binaryString.length; i += 8) {
                    sum += parseInt(binaryString.substr(i, 8), 2);
                }
                return (sum % 256).toString(2).padStart(8, '0');
            },

            dataUrlToImage(dataUrl) {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error('Failed to read image for geotag'));
                    img.src = dataUrl;
                });
            }
        };

        function updateGeoStatus(message, type = 'info') {
            const el = document.getElementById('geo-status');
            if (!el) return;

            const classes = {
                info: 'text-gray-500',
                success: 'text-green-600',
                warning: 'text-amber-600',
                error: 'text-red-600'
            };

            el.classList.remove('text-gray-500', 'text-green-600', 'text-amber-600', 'text-red-600');
            el.classList.add(classes[type] || classes.info);
            el.textContent = message;
        }

        function getCurrentGeoTag() {
            if (!navigator.geolocation) {
                return Promise.resolve(null);
            }

            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const accuracy = Number(position.coords.accuracy || 0);
                        if (!Number.isFinite(accuracy) || accuracy <= 0 || accuracy > MAX_ACCEPTABLE_GEO_ACCURACY_METERS) {
                            resolve(null);
                            return;
                        }
                        resolve({
                            lat: Number(position.coords.latitude.toFixed(6)),
                            lng: Number(position.coords.longitude.toFixed(6)),
                            accuracy,
                            timestamp: new Date().toISOString()
                        });
                    },
                    () => resolve(null),
                    {
                        enableHighAccuracy: false,
                        timeout: GEOLOCATION_TIMEOUT_MS,
                        maximumAge: GEOLOCATION_MAX_AGE_MS
                    }
                );
            });
        }

        function toRadians(value) {
            return (value * Math.PI) / 180;
        }

        function distanceInMeters(pointA, pointB) {
            const earthRadius = 6371000;
            const dLat = toRadians(pointB.lat - pointA.lat);
            const dLng = toRadians(pointB.lng - pointA.lng);

            const lat1 = toRadians(pointA.lat);
            const lat2 = toRadians(pointB.lat);

            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return earthRadius * c;
        }

        function findDuplicateLocation(geoTag) {
            if (!geoTag || !Array.isArray(appData.history)) return null;

            for (const entry of appData.history) {
                if (!entry || !entry.geoTag || entry.credits <= 0) continue;
                const dist = distanceInMeters(geoTag, entry.geoTag);
                if (dist <= LOCATION_DUPLICATE_RADIUS_METERS) {
                    return {
                        date: entry.date,
                        distance: dist,
                        lat: entry.geoTag.lat,
                        lng: entry.geoTag.lng
                    };
                }
            }
            return null;
        }

        // Find minimum distance from all previous detections for location-based credits
        function findMinDistanceFromHistory(geoTag) {
            if (!geoTag || !Array.isArray(appData.history) || appData.history.length === 0) {
                return Infinity; // First detection or no history
            }

            let minDistance = Infinity;
            for (const entry of appData.history) {
                if (!entry || !entry.geoTag) continue;
                const dist = distanceInMeters(geoTag, entry.geoTag);
                if (dist < minDistance) {
                    minDistance = dist;
                }
            }
            return minDistance;
        }

        // Check if user earns location credits (at least 100m away from previous detections)
        function checkLocationCredits(geoTag) {
            if (!geoTag) {
                return { eligible: false, distance: 0, message: 'No location data available' };
            }

            const minDistance = findMinDistanceFromHistory(geoTag);
            
            if (minDistance === Infinity) {
                return { 
                    eligible: true, 
                    distance: minDistance, 
                    credits: 10,
                    message: 'First detection - location credits awarded!' 
                };
            }

            if (minDistance >= LOCATION_CREDIT_MIN_DISTANCE_METERS) {
                return { 
                    eligible: true, 
                    distance: minDistance, 
                    credits: 10,
                    message: `${Math.round(minDistance)}m from last detection - location credits earned!` 
                };
            }

            return { 
                eligible: false, 
                distance: minDistance, 
                credits: 0,
                message: `Only ${Math.round(minDistance)}m from previous detection. Move at least ${LOCATION_CREDIT_MIN_DISTANCE_METERS}m away to earn location credits.` 
            };
        }
        
        // Generate perceptual hash for an image
        async function generateImageHash(imageSrc) {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = function() {
                    // Create canvas to resize and process image
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Resize to 32x32 for hash generation (perceptual hash)
                    const size = 32;
                    canvas.width = size;
                    canvas.height = size;
                    
                    // Draw image with high quality downsampling
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, size, size);
                    
                    // Get image data
                    const imageData = ctx.getImageData(0, 0, size, size);
                    const data = imageData.data;
                    
                    // Convert to grayscale and compute average
                    let grayPixels = [];
                    let total = 0;
                    
                    for (let i = 0; i < data.length; i += 4) {
                        // Use luminance formula for better perceptual accuracy
                        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                        grayPixels.push(gray);
                        total += gray;
                    }
                    
                    const average = total / grayPixels.length;
                    
                    // Generate hash based on whether pixel is above or below average
                    // This creates a binary perceptual hash (pHash-like)
                    let hash = '';
                    for (let i = 0; i < grayPixels.length; i++) {
                        hash += grayPixels[i] >= average ? '1' : '0';
                    }
                    
                    // Also create a more robust hash using DCT-like approach (simplified)
                    // Divide image into 8x8 blocks and compare averages
                    let blockHash = '';
                    const blockSize = 4; // 32/8 = 4 pixels per block
                    
                    for (let by = 0; by < 8; by++) {
                        for (let bx = 0; bx < 8; bx++) {
                            let blockSum = 0;
                            let blockCount = 0;
                            
                            for (let y = by * blockSize; y < (by + 1) * blockSize; y++) {
                                for (let x = bx * blockSize; x < (bx + 1) * blockSize; x++) {
                                    const idx = y * size + x;
                                    if (idx < grayPixels.length) {
                                        blockSum += grayPixels[idx];
                                        blockCount++;
                                    }
                                }
                            }
                            
                            const blockAvg = blockSum / blockCount;
                            blockHash += blockAvg >= average ? '1' : '0';
                        }
                    }
                    
                    // Combine both hashes for better accuracy
                    resolve(hash + blockHash);
                };
                img.src = imageSrc;
            });
        }

        // Calculate Hamming distance between two hashes
        function calculateHashDistance(hash1, hash2) {
            if (hash1.length !== hash2.length) return Infinity;
            
            let distance = 0;
            for (let i = 0; i < hash1.length; i++) {
                if (hash1[i] !== hash2[i]) distance++;
            }
            return distance;
        }

        // Check if image is a duplicate
        function isDuplicateImage(newHash) {
            if (!appData.imageHashes || appData.imageHashes.length === 0) return null;
            
            // Threshold for similarity (allow some variation for compression/resizing)
            // 64 bits total, allow up to 10 bits different (about 15% tolerance)
            const SIMILARITY_THRESHOLD = 10;
            
            for (const stored of appData.imageHashes) {
                const distance = calculateHashDistance(newHash, stored.hash);
                if (distance <= SIMILARITY_THRESHOLD) {
                    return stored; // Return the matching record
                }
            }
            return null;
        }

        // Store image hash
        function storeImageHash(hash, itemName) {
            if (!appData.imageHashes) appData.imageHashes = [];
            
            appData.imageHashes.push({
                hash: hash,
                itemName: itemName,
                date: new Date().toISOString(),
                timestamp: Date.now()
            });
            
            // Keep bounded hashes to prevent storage bloat
            if (appData.imageHashes.length > MAX_IMAGE_HASHES) {
                appData.imageHashes = appData.imageHashes.slice(-MAX_IMAGE_HASHES);
            }
            
            saveData();
        }

        // --- QUIZ FUNCTIONALITY ---
        function initQuiz() {
            const questions = document.querySelectorAll('.quiz-question');
            
            questions.forEach(question => {
                const options = question.querySelectorAll('.quiz-option');
                const questionNum = question.dataset.question;
                
                options.forEach(option => {
                    option.addEventListener('click', function() {
                        // Remove selected from siblings
                        options.forEach(opt => opt.classList.remove('selected'));
                        // Add selected to clicked
                        this.classList.add('selected');
                        
                        // Store answer
                        quizAnswers[questionNum] = this.dataset.answer;
                        
                        // Check if all answered
                        checkQuizComplete();
                    });
                });
            });
        }

        function checkQuizComplete() {
            if (Object.keys(quizAnswers).length === 4) {
                calculateQuizResults();
            }
        }

        function calculateQuizResults() {
            let score = 0;
            const questions = document.querySelectorAll('.quiz-question');
            
            questions.forEach(question => {
                const qNum = question.dataset.question;
                const selected = question.querySelector('.quiz-option.selected');
                const feedback = question.querySelector('.quiz-feedback');
                const userAnswer = quizAnswers[qNum];
                const correct = correctAnswers[qNum];
                
                feedback.classList.remove('hidden');
                
                if (userAnswer === correct) {
                    score++;
                    selected.classList.add('correct');
                    selected.classList.remove('selected');
                    feedback.className = 'quiz-feedback mt-4 p-4 rounded-lg bg-green-100 text-green-800';
                    
                    // Add explanation based on question
                    const explanations = {
                        1: 'Correct! Only 9% of all plastic ever produced has been recycled. 22% is mismanaged, creating severe environmental consequences.',
                        2: 'Correct! Recycling plastic uses 66% less energy than producing virgin plastic, significantly reducing carbon emissions.',
                        3: 'Correct! An estimated 300,000 whales, dolphins, and porpoises die annually from discarded plastic fishing gear and pollution.',
                        4: 'Correct! Ingestion and entanglement are the primary threats, affecting marine life through direct harm and food chain contamination.'
                    };
                    feedback.innerHTML = `<i class="fa-solid fa-check-circle mr-2"></i>${explanations[qNum]}`;
                } else {
                    selected.classList.add('wrong');
                    selected.classList.remove('selected');
                    const correctOption = question.querySelector(`[data-answer="${correct}"]`);
                    correctOption.classList.add('correct');
                    feedback.className = 'quiz-feedback mt-4 p-4 rounded-lg bg-red-100 text-red-800';
                    feedback.innerHTML = `<i class="fa-solid fa-x-circle mr-2"></i>Incorrect. The correct answer is highlighted above.`;
                }
            });
            
            // Show results
            const resultsDiv = document.getElementById('quiz-results');
            const scoreSpan = document.getElementById('quiz-score');
            const messageP = document.getElementById('quiz-message');
            
            resultsDiv.classList.remove('hidden');
            scoreSpan.textContent = score;
            
            const messages = {
                4: 'Perfect! You are a true Eco Champion!',
                3: 'Great job! You know your recycling facts!',
                2: 'Good effort! Keep learning about sustainability!',
                1: 'Keep trying! Every bit of knowledge helps the planet!',
                0: 'Don\'t worry! Now you know the facts - time to take action!'
            };
            messageP.textContent = messages[score];
            
            // Scroll to results
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // --- STORAGE AND API ---
        function createDefaultAppData() {
            return { credits: 0, history: [], claimedRewards: [], badges: [], imageHashes: [], lastUpdated: new Date().toISOString() };
        }

        function sanitizeHistoryItem(item) {
            if (!item || typeof item !== 'object') return null;
            return {
                id: Number(item.id) || Date.now(),
                name: String(item.name || 'Unknown').slice(0, 120),
                material: String(item.material || 'Other').slice(0, 40),
                credits: Number(item.credits) || 0,
                date: item.date || new Date().toISOString(),
                image: STORE_SCAN_IMAGE_IN_HISTORY ? String(item.image || '') : null,
                isDuplicate: Boolean(item.isDuplicate),
                duplicateType: item.duplicateType || null,
                geoTag: item.geoTag && typeof item.geoTag === 'object'
                    ? {
                        lat: Number(item.geoTag.lat),
                        lng: Number(item.geoTag.lng),
                        accuracy: Number(item.geoTag.accuracy) || 0,
                        timestamp: item.geoTag.timestamp || item.date || new Date().toISOString()
                    }
                    : null
            };
        }

        function clampAppDataSizes(data) {
            const next = data && typeof data === 'object' ? data : createDefaultAppData();
            next.history = (Array.isArray(next.history) ? next.history : [])
                .map(sanitizeHistoryItem)
                .filter(Boolean)
                .slice(0, MAX_HISTORY_ITEMS);
            next.imageHashes = (Array.isArray(next.imageHashes) ? next.imageHashes : [])
                .filter(entry => entry && typeof entry.hash === 'string' && entry.hash.length > 0)
                .slice(0, MAX_IMAGE_HASHES);
            return next;
        }

        function getStorageKey() {
            if (currentUser) {
                return 'ecoSortData_' + currentUser.id;
            }
            return 'ecoSortData_guest';
        }

        function getCurrentUserKey() {
            return 'ecoSortUser';
        }

        function getTokenKey() {
            return 'ecoSortToken';
        }

        function getAuthNetworkErrorMessage() {
            return 'Cannot connect to server. Start backend with "npm start" and open http://localhost:3002';
        }

        function setAuthSubmitState(formId, isLoading, loadingText) {
            const form = document.getElementById(formId);
            if (!form) return;
            const submitBtn = form.querySelector('button[type="submit"]');
            if (!submitBtn) return;

            if (!submitBtn.dataset.originalHtml) {
                submitBtn.dataset.originalHtml = submitBtn.innerHTML;
            }

            submitBtn.disabled = isLoading;
            if (isLoading) {
                submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i>${loadingText}`;
                submitBtn.classList.add('opacity-80', 'cursor-not-allowed');
            } else {
                submitBtn.innerHTML = submitBtn.dataset.originalHtml;
                submitBtn.classList.remove('opacity-80', 'cursor-not-allowed');
            }
        }

        function handlePostAuthRedirect() {
            const redirect = sessionStorage.getItem('redirectAfterLogin');
            if (redirect) {
                sessionStorage.removeItem('redirectAfterLogin');
                router(redirect);
                return;
            }
            router('home');
        }

        async function apiRequest(path, options = {}) {
            const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
            if (authToken) {
                headers.Authorization = 'Bearer ' + authToken;
            }

            let response;
            try {
                response = await fetch(API_BASE + path, {
                    ...options,
                    headers
                });
            } catch (_networkErr) {
                throw new Error(getAuthNetworkErrorMessage());
            }

            let payload = {};
            try {
                payload = await response.json();
            } catch (_e) {}

            if (!response.ok) {
                const message = payload.error || `Request failed (${response.status})`;
                throw new Error(message);
            }

            return payload;
        }

        async function refreshGlobalImpact() {
            try {
                const stats = await apiRequest('/stats/global');
                document.getElementById('home-total-credits').innerText = stats.totalCredits || 0;
                document.getElementById('home-total-items').innerText = stats.totalItems || 0;
                document.getElementById('home-rewards').innerText = stats.totalRewards || 0;
                document.getElementById('home-co2-saved').innerText = stats.co2Saved || 0;
            } catch (e) {
                console.warn('Could not load global impact stats:', e.message);
            }
        }

        function escapeHtml(value) {
            return String(value ?? '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        async function loadFeaturedMedia() {
            const container = document.getElementById('featured-media-grid');
            const status = document.getElementById('featured-media-status');
            if (!container || !status) return;

            try {
                const payload = await apiRequest('/content/featured');
                const items = Array.isArray(payload.items) ? payload.items : [];
                if (!items.length) {
                    status.textContent = 'No media available yet.';
                    container.innerHTML = '';
                    return;
                }

                container.innerHTML = items.map((item) => {
                    const title = escapeHtml(item.title);
                    const description = escapeHtml(item.description);
                    const source = escapeHtml(item.src);

                    if (item.type === 'video') {
                        return `
                            <article class="featured-card scroll-reveal bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <video class="w-full h-56 object-cover" src="${source}" muted loop autoplay playsinline controls></video>
                                <div class="p-5">
                                    <h4 class="text-lg font-bold text-gray-900">${title}</h4>
                                    <p class="text-sm text-gray-600 mt-2">${description}</p>
                                </div>
                            </article>
                        `;
                    }

                    return `
                        <article class="featured-card scroll-reveal bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                            <img class="w-full h-56 object-cover" src="${source}" alt="${title}" loading="lazy">
                            <div class="p-5">
                                <h4 class="text-lg font-bold text-gray-900">${title}</h4>
                                <p class="text-sm text-gray-600 mt-2">${description}</p>
                            </div>
                        </article>
                    `;
                }).join('');

                status.textContent = `Loaded ${items.length} media stories from backend`;
                registerScrollRevealTargets(container);
            } catch (e) {
                console.warn('Could not load featured media:', e.message);
                status.textContent = 'Could not load backend media. Start server with "npm start".';
            }
        }

        function sanitizeCommunityImageUrl(url) {
            const value = String(url || '').trim();
            if (!value) return '';
            if (value.startsWith('assets/')) return value;
            if (/^https?:\/\//i.test(value)) return value;
            return '';
        }

        function formatCommunityDate(value) {
            const d = new Date(value);
            if (Number.isNaN(d.getTime())) return 'Just now';
            return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }

        function renderCommunityPosts(posts) {
            const feed = document.getElementById('community-feed');
            if (!feed) return;

            if (!Array.isArray(posts) || posts.length === 0) {
                feed.innerHTML = '<article class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><p class="text-gray-500">No posts yet. Be the first to share.</p></article>';
                return;
            }

            feed.innerHTML = posts.map((post) => {
                const type = post.type === 'story' ? 'Story' : 'Chat';
                const badgeClass = post.type === 'story'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700';
                const safeAuthor = escapeHtml(post.author || 'Anonymous');
                const safeText = escapeHtml(post.text || '');
                const safeImage = sanitizeCommunityImageUrl(post.imageUrl);
                const safeDate = formatCommunityDate(post.createdAt);

                return `
                    <article class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm scroll-reveal">
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-bold text-gray-900">${safeAuthor}</span>
                                <span class="text-xs px-2 py-1 rounded-full ${badgeClass}">${type}</span>
                            </div>
                            <span class="text-xs text-gray-500">${safeDate}</span>
                        </div>
                        <p class="text-sm text-gray-700 leading-relaxed">${safeText}</p>
                        ${safeImage ? `<img src="${escapeHtml(safeImage)}" onerror="this.style.display='none'" class="mt-3 w-full max-h-72 object-cover rounded-lg border border-gray-200" alt="Community shared photo">` : ''}
                    </article>
                `;
            }).join('');

            registerScrollRevealTargets(feed);
        }

        async function loadCommunityPosts() {
            const updated = document.getElementById('community-updated');
            try {
                const payload = await apiRequest('/community/posts');
                renderCommunityPosts(Array.isArray(payload.posts) ? payload.posts : []);
                if (updated) updated.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            } catch (e) {
                console.warn('Could not load community posts:', e.message);
                const feed = document.getElementById('community-feed');
                if (feed) {
                    feed.innerHTML = '<article class="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"><p class="text-red-600 text-sm">Could not load community posts.</p></article>';
                }
                if (updated) updated.textContent = 'Offline';
            }
        }

        function setCommunityFeedback(message, type) {
            const el = document.getElementById('community-feedback');
            if (!el) return;
            el.textContent = message;
            el.className = 'text-sm';
            el.classList.remove('hidden');
            el.classList.add(type === 'success' ? 'text-emerald-700' : 'text-red-600');
        }

        function bindCommunityForm() {
            const form = document.getElementById('community-form');
            if (!form || form.dataset.bound === '1') return;
            form.dataset.bound = '1';

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const submitBtn = document.getElementById('community-submit');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Posting...';
                }

                const payload = {
                    author: document.getElementById('community-author')?.value?.trim() || '',
                    type: document.getElementById('community-type')?.value || 'chat',
                    text: document.getElementById('community-text')?.value?.trim() || '',
                    imageUrl: document.getElementById('community-image')?.value?.trim() || ''
                };

                try {
                    await apiRequest('/community/posts', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });

                    setCommunityFeedback('Posted successfully to community.', 'success');
                    form.reset();
                    await loadCommunityPosts();
                } catch (e) {
                    setCommunityFeedback(e.message || 'Could not post update.', 'error');
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Post to Community';
                    }
                }
            });
        }

        function setupScrollRevealObserver() {
            if (scrollRevealObserver) return;
            scrollRevealObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('in-view');
                    scrollRevealObserver.unobserve(entry.target);
                });
            }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
        }

        function registerScrollRevealTargets(root = document) {
            setupScrollRevealObserver();
            const elements = root.querySelectorAll ? root.querySelectorAll('.scroll-reveal') : [];
            elements.forEach((el) => {
                if (el.dataset.revealBound === '1') return;
                el.dataset.revealBound = '1';
                scrollRevealObserver.observe(el);
            });
        }

        function initScrollAnimations() {
            registerScrollRevealTargets(document);
        }

        function initThemeToggle() {
            const toggleBtn = document.getElementById('theme-toggle');
            if (!toggleBtn) return;

            const saved = localStorage.getItem('ecoSortTheme') || 'light';
            applyTheme(saved);

            toggleBtn.addEventListener('click', () => {
                const next = document.body.classList.contains('dark') ? 'light' : 'dark';
                applyTheme(next);
                localStorage.setItem('ecoSortTheme', next);
            });
        }

        function applyTheme(mode) {
            const isDark = mode === 'dark';
            document.body.classList.toggle('dark-mode', isDark);
            document.documentElement.classList.toggle('dark', isDark);
            document.body.classList.toggle('dark', isDark);

            const toggleBtn = document.getElementById('theme-toggle');
            if (!toggleBtn) return;
            toggleBtn.innerHTML = isDark
                ? '<i class="fa-solid fa-sun mr-1"></i> Light'
                : '<i class="fa-solid fa-moon mr-1"></i> Dark';
        }

        // --- AUTHENTICATION SYSTEM ---
        async function checkAuthStatus() {
            authToken = localStorage.getItem(getTokenKey());

            if (!authToken) {
                currentUser = null;
                showLoggedOutState();
                return;
            }

            try {
                const payload = await apiRequest('/auth/me');
                currentUser = payload.user;
                localStorage.setItem(getCurrentUserKey(), JSON.stringify(currentUser));
                showLoggedInState();
            } catch (e) {
                console.error('Auth validation failed', e);
                currentUser = null;
                authToken = null;
                localStorage.removeItem(getCurrentUserKey());
                localStorage.removeItem(getTokenKey());
                showLoggedOutState();
            }
        }

        function showLoggedInState() {
            document.getElementById('auth-buttons').classList.add('hidden');
            document.getElementById('user-menu').classList.remove('hidden');
            document.getElementById('user-name').textContent = currentUser.name;
            document.getElementById('dropdown-email').textContent = currentUser.email;
            document.getElementById('guest-notice').classList.add('hidden');
        }

        function showLoggedOutState() {
            document.getElementById('auth-buttons').classList.remove('hidden');
            document.getElementById('user-menu').classList.add('hidden');
            document.getElementById('guest-notice').classList.remove('hidden');
        }

        function openAuthModal(type) {
            const modal = document.getElementById('auth-modal');
            modal.classList.remove('hidden');
            switchAuthTab(type);
        }

        function closeAuthModal() {
            document.getElementById('auth-modal').classList.add('hidden');
            document.getElementById('login-form').reset();
            document.getElementById('signup-form').reset();
        }

        function switchAuthTab(type) {
            const loginTab = document.getElementById('tab-login');
            const signupTab = document.getElementById('tab-signup');
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            const title = document.getElementById('auth-title');
            const subtitle = document.getElementById('auth-subtitle');

            if (type === 'login') {
                loginTab.className = "flex-1 py-2 rounded-md text-sm font-medium transition bg-white text-green-600 shadow-sm";
                signupTab.className = "flex-1 py-2 rounded-md text-sm font-medium transition text-gray-500 hover:text-gray-700";
                loginForm.classList.remove('hidden');
                signupForm.classList.add('hidden');
                title.textContent = 'Welcome Back';
                subtitle.textContent = 'Log in to continue your eco journey';
            } else {
                signupTab.className = "flex-1 py-2 rounded-md text-sm font-medium transition bg-white text-green-600 shadow-sm";
                loginTab.className = "flex-1 py-2 rounded-md text-sm font-medium transition text-gray-500 hover:text-gray-700";
                signupForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
                title.textContent = 'Join EcoSort AI';
                subtitle.textContent = 'Start earning rewards for recycling';
            }
        }

        async function handleLogin(event) {
            event.preventDefault();
            const email = document.getElementById('login-email').value.trim().toLowerCase();
            const password = document.getElementById('login-password').value;

            if (!email || !password) {
                showNotification('Email and password are required.', 'error');
                return;
            }

            setAuthSubmitState('login-form', true, 'Signing In...');

            try {
                const payload = await apiRequest('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });

                currentUser = payload.user;
                authToken = payload.token;
                localStorage.setItem(getCurrentUserKey(), JSON.stringify(currentUser));
                localStorage.setItem(getTokenKey(), authToken);
                await loadData();
                showLoggedInState();
                closeAuthModal();
                updateGlobalStats();
                await refreshGlobalImpact();
                showNotification('Welcome back, ' + currentUser.name + '!', 'success');
                handlePostAuthRedirect();
            } catch (e) {
                const msg = e.message || 'Invalid email or password. Please try again.';
                showNotification(msg, 'error');
            } finally {
                setAuthSubmitState('login-form', false, 'Signing In...');
            }
        }

        async function handleSignup(event) {
            event.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim().toLowerCase();
            const password = document.getElementById('signup-password').value;

            if (!name || !email || !password) {
                showNotification('Name, email and password are required.', 'error');
                return;
            }

            setAuthSubmitState('signup-form', true, 'Creating Account...');

            try {
                const payload = await apiRequest('/auth/signup', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password })
                });

                currentUser = payload.user;
                authToken = payload.token;
                localStorage.setItem(getCurrentUserKey(), JSON.stringify(currentUser));
                localStorage.setItem(getTokenKey(), authToken);

                appData = createDefaultAppData();
                await saveData();

                showLoggedInState();
                closeAuthModal();
                updateGlobalStats();
                await refreshGlobalImpact();
                showNotification('Account created successfully! Welcome, ' + name + '!', 'success');
                handlePostAuthRedirect();
            } catch (e) {
                const msg = e.message || 'Signup failed. Please try again.';
                showNotification(msg, 'error');
            } finally {
                setAuthSubmitState('signup-form', false, 'Creating Account...');
            }
        }

        async function logout() {
            if (confirm('Are you sure you want to log out?')) {
                await saveData();
                // FIX #11: Call server to blacklist the current JWT
                if (authToken) {
                    try {
                        await fetch('/api/auth/logout', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                            }
                        });
                    } catch (_e) { /* Logout even if server is unreachable */ }
                }
                currentUser = null;
                authToken = null;
                localStorage.removeItem(getCurrentUserKey());
                localStorage.removeItem(getTokenKey());
                appData = createDefaultAppData();
                await loadData();
                showLoggedOutState();
                updateGlobalStats();
                await refreshGlobalImpact();
                router('home');
                toggleUserMenu();
                showNotification('Logged out successfully.', 'info');
            }
        }

        function toggleUserMenu() {
            const dropdown = document.getElementById('user-dropdown');
            dropdown.classList.toggle('hidden');
        }

        function checkAuthAndRoute(view) {
            if (!currentUser) {
                openAuthModal('login');
                sessionStorage.setItem('redirectAfterLogin', view);
            } else {
                router(view);
            }
        }

        // --- NOTIFICATION SYSTEM ---
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            const colors = {
                success: 'bg-green-500',
                error: 'bg-red-500',
                info: 'bg-blue-500',
                warning: 'bg-amber-500'
            };

            notification.className = 'fixed top-20 right-4 ' + (colors[type] || colors.info) + ' text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in';
            const iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : type === 'warning' ? 'fa-triangle-exclamation' : 'fa-info-circle';
            notification.innerHTML =
                '<div class="flex items-center">' +
                '<i class="fa-solid ' + iconClass + ' mr-2"></i>' +
                '<span>' + message + '</span>' +
                '</div>';

            document.body.appendChild(notification);

            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        // --- ROUTING ---
        function router(viewName) {
            if ((viewName === 'dashboard' || viewName === 'detect' || viewName === 'rewards' || viewName === 'ai') && !currentUser) {
                openAuthModal('login');
                sessionStorage.setItem('redirectAfterLogin', viewName);
                return;
            }

            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.getElementById('view-' + viewName).classList.add('active');
            document.getElementById('mobile-menu').classList.add('hidden');
            
            const mainNav = document.querySelector('nav');
            if (mainNav) {
                if (viewName === 'ai') {
                    mainNav.classList.add('hidden');
                } else {
                    mainNav.classList.remove('hidden');
                }
            }

            if (viewName === 'dashboard') {
                updateDashboard();
            }
            if (viewName === 'rewards') {
                updateRewardsPage();
            }
            if (viewName === 'detect') {
                resetToNewScan();
                startModelLoad().catch((e) => console.warn('Model preload failed:', e.message));
            }
            if (viewName === 'ai') {
                loadAiHistory();
            }

            window.scrollTo(0,0);
        }

        function toggleMobileMenu() {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        }

        function scrollToSection(sectionId) {
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }

        // --- DATA LOGIC ---
        function normalizeAppData(parsed) {
            return clampAppDataSizes({
                credits: parsed && parsed.credits ? parsed.credits : 0,
                history: parsed && Array.isArray(parsed.history) ? parsed.history : [],
                claimedRewards: parsed && Array.isArray(parsed.claimedRewards) ? parsed.claimedRewards : [],
                badges: parsed && Array.isArray(parsed.badges) ? parsed.badges : [],
                imageHashes: parsed && Array.isArray(parsed.imageHashes) ? parsed.imageHashes : [],
                lastUpdated: parsed && parsed.lastUpdated ? parsed.lastUpdated : new Date().toISOString()
            });
        }

        async function loadData() {
            const storageKey = getStorageKey();
            const saved = localStorage.getItem(storageKey);

            if (currentUser && authToken) {
                try {
                    const payload = await apiRequest('/data/me');
                    appData = normalizeAppData(payload.data);
                    localStorage.setItem(storageKey, JSON.stringify(appData));
                    updateGlobalStats();
                    return;
                } catch (e) {
                    console.warn('Falling back to cached data:', e.message);
                }
            }

            if (saved) {
                try {
                    appData = normalizeAppData(JSON.parse(saved));
                } catch (e) {
                    console.error('Error loading data', e);
                    appData = createDefaultAppData();
                }
            } else {
                appData = createDefaultAppData();
            }

            updateGlobalStats();
        }

        async function saveData() {
            const storageKey = getStorageKey();
            appData = clampAppDataSizes(appData);
            appData.lastUpdated = new Date().toISOString();

            try {
                localStorage.setItem(storageKey, JSON.stringify(appData));
                updateGlobalStats();
            } catch (e) {
                console.error('Error saving data', e);
                if (e.name === 'QuotaExceededError') {
                    showNotification('Storage full! Please clear some history.', 'error');
                }
            }

            if (currentUser && authToken) {
                try {
                    await apiRequest('/data/me', {
                        method: 'PUT',
                        body: JSON.stringify({ data: appData })
                    });
                } catch (e) {
                    console.error('Failed to sync data to backend', e);
                }
            }
        }

        function updateGlobalStats() {
            const creditEl = document.getElementById('global-credits');
            const oldValue = parseInt(creditEl.innerText) || 0;
            const newValue = appData.credits;

            creditEl.innerText = newValue;

            if (newValue > oldValue) {
                const badge = document.getElementById('credit-badge');
                badge.classList.add('credit-update');
                setTimeout(() => badge.classList.remove('credit-update'), 500);
            }
        }
// --- REWARDS SYSTEM ---
        function updateRewardsPage() {
            document.getElementById('rewards-credits').innerText = appData.credits;
            
            renderBadges();
            renderRewards();
            renderClaimedRewards();
        }

        function renderBadges() {
            const container = document.getElementById('badges-container');
            container.innerHTML = '';
            
            const scanCount = appData.history.length;
            
            BADGES.forEach(badge => {
                const isUnlocked = scanCount >= badge.requirement;
                const isClaimed = appData.badges.includes(badge.id);
                
                const badgeEl = document.createElement('div');
                badgeEl.className = `glass-panel p-6 rounded-3xl shadow-sm text-center transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${!isUnlocked ? 'opacity-60 grayscale' : ''}`;
                
                badgeEl.innerHTML = `
                    <div class="badge-icon ${isUnlocked ? badge.color : 'bg-gray-200/50 text-gray-500'} mb-3 mx-auto w-16 h-16 flex items-center justify-center rounded-full text-2xl shadow-inner">
                        <i class="${badge.icon}"></i>
                    </div>
                    <h4 class="font-bold text-gray-900 mb-1">${badge.name}</h4>
                    <p class="text-xs text-gray-600 mb-2">${badge.description}</p>
                    <div class="text-sm font-medium ${isUnlocked ? 'text-green-600' : 'text-gray-500'}">
                        ${isUnlocked ? (isClaimed ? '<i class="fa-solid fa-check mr-1"></i> Claimed' : 'Unlocked!') : `${scanCount}/${badge.requirement} scans`}
                    </div>
                `;
                
                if (isUnlocked && !isClaimed) {
                    badgeEl.innerHTML += `
                        <button onclick="claimBadge('${badge.id}')" class="mt-4 w-full bg-green-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-green-700 hover:shadow-lg transition">
                            Claim Badge
                        </button>
                    `;
                }
                
                container.appendChild(badgeEl);
            });
        }

        function renderRewards() {
            const container = document.getElementById('rewards-container');
            container.innerHTML = '';
            
            REWARDS.forEach(reward => {
                const canAfford = appData.credits >= reward.cost;
                const isClaimed = appData.claimedRewards.some(r => r.rewardId === reward.id);
                
                const rewardEl = document.createElement('div');
                rewardEl.className = `glass-panel p-6 rounded-3xl shadow-sm transform transition-all duration-300 ${!canAfford || isClaimed ? 'opacity-70 grayscale' : 'hover:-translate-y-1 hover:shadow-xl hover:border-emerald-200'}`;
                
                rewardEl.innerHTML = `
                    <div class="flex items-start justify-between mb-4">
                        <div class="text-4xl text-emerald-600 bg-white/60 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner"><i class="${reward.icon}"></i></div>
                        <div class="bg-yellow-100/80 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-300 shadow-sm">
                            <span class="font-bold text-yellow-800">${reward.cost} credits</span>
                        </div>
                    </div>
                    <h4 class="font-bold text-gray-900 mb-2 text-lg">${reward.name}</h4>
                    <p class="text-sm text-gray-600 mb-6 flex-grow">${reward.description}</p>
                    <div class="flex items-center justify-between mt-auto">
                        <span class="text-xs font-semibold text-gray-500 bg-white/50 px-2 py-1 rounded-md">
                            ${reward.type === 'code' ? '<i class="fa-solid fa-ticket"></i> Digital Code' : '<i class="fa-solid fa-box"></i> Physical Item'}
                        </span>
                        ${isClaimed ? 
                            '<span class="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-lg"><i class="fa-solid fa-check"></i> Claimed</span>' :
                            `<button onclick="claimReward('${reward.id}')" class="px-5 py-2 ${canAfford ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md' : 'bg-gray-300 text-gray-500 cursor-not-allowed'} rounded-xl text-sm font-bold transition" ${!canAfford ? 'disabled' : ''}>
                                ${canAfford ? 'Claim Reward' : 'Insufficient Credits'}
                            </button>`
                        }
                    </div>
                `;
                
                container.appendChild(rewardEl);
            });
        }

        function renderClaimedRewards() {
            const tbody = document.getElementById('claimed-rewards-table');
            
            if (appData.claimedRewards.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No rewards claimed yet. Start earning credits!</td></tr>';
                return;
            }
            
            tbody.innerHTML = '';
            // Sort by date, newest first
            const sorted = [...appData.claimedRewards].sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt));
            
            sorted.forEach(reward => {
                const rewardInfo = REWARDS.find(r => r.id === reward.rewardId) || BADGES.find(b => b.id === reward.rewardId);
                if (!rewardInfo) return;
                
                const isCode = reward.code || rewardInfo.type === 'code';
                const date = new Date(reward.claimedAt).toLocaleDateString();
                
                const row = document.createElement('tr');
                row.className = 'hover:bg-white/40 transition border-b border-gray-100/50';
                row.innerHTML = `
                    <td class="px-6 py-4">
                        <div class="flex items-center">
                            <div class="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center text-xl text-emerald-600 shadow-inner mr-3"><i class="${rewardInfo.icon}"></i></div>
                            <div>
                                <div class="font-medium text-gray-900">${rewardInfo.name}</div>
                                <div class="text-xs text-gray-500">${date}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${isCode ? '<i class="fa-solid fa-ticket mr-1"></i> Digital' : '<i class="fa-solid fa-box mr-1"></i> Physical'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${rewardInfo.cost ? rewardInfo.cost + ' credits' : 'Badge Reward'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            <i class="fa-solid fa-check mr-1 mt-0.5"></i> Fulfilled
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        ${isCode ? `
                            <button onclick="showRedeemCode('${reward.code}', '${rewardInfo.name}')" class="text-green-600 hover:text-green-800 font-medium text-sm">
                                <i class="fa-solid fa-eye mr-1"></i> View Code
                            </button>
                        ` : `
                            <span class="text-gray-400 text-sm">Collected</span>
                        `}
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        function claimBadge(badgeId) {
            const badge = BADGES.find(b => b.id === badgeId);
            if (!badge) return;
            
            if (!appData.badges.includes(badgeId)) {
                appData.badges.push(badgeId);
                saveData();
                
                createConfetti();
                showRewardModal(badge, 'badge');
                updateRewardsPage();
            }
        }

        function claimReward(rewardId) {
            const reward = REWARDS.find(r => r.id === rewardId);
            if (!reward) return;
            
            if (appData.credits < reward.cost) {
                showNotification('Insufficient credits!', 'error');
                return;
            }
            
            if (appData.claimedRewards.some(r => r.rewardId === rewardId)) {
                showNotification('You already claimed this reward!', 'error');
                return;
            }
            
            // Deduct credits
            appData.credits -= reward.cost;
            
            // Generate redeem code if applicable
            let code = null;
            if (reward.type === 'code') {
                code = generateRedeemCode();
            }
            
            // Add to claimed rewards
            const claimedReward = {
                rewardId: reward.id,
                claimedAt: new Date().toISOString(),
                code: code
            };
            
            appData.claimedRewards.push(claimedReward);
            saveData();
            
            createConfetti();
            showRewardModal(reward, 'reward', code);
            updateRewardsPage();
            updateGlobalStats();
            
            showNotification(`Successfully claimed ${reward.name}!`, 'success');
        }

        function generateRedeemCode() {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = 'ECO-';
            for (let i = 0; i < 12; i++) {
                if (i > 0 && i % 4 === 0) code += '-';
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        }

        function showRewardModal(item, type, code = null) {
            const modal = document.getElementById('reward-modal');
            
            document.getElementById('reward-icon').innerHTML = `<i class="${item.icon}"></i>`;
            document.getElementById('reward-name').textContent = item.name;
            document.getElementById('reward-description').textContent = type === 'badge' ? 'Achievement Unlocked!' : item.description;
            
            const codeSection = document.getElementById('redeem-code-section');
            const badgeSection = document.getElementById('badge-section');
            
            if (type === 'reward' && code) {
                codeSection.classList.remove('hidden');
                badgeSection.classList.add('hidden');
                document.getElementById('redeem-code-display').textContent = code;
            } else {
                codeSection.classList.add('hidden');
                badgeSection.classList.remove('hidden');
                document.getElementById('badge-display').innerHTML = `<i class="${item.icon}"></i>`;
                document.getElementById('badge-display').className = `badge-icon ${item.color} text-5xl`;
            }
            
            modal.classList.remove('hidden');
        }

        function closeRewardModal() {
            document.getElementById('reward-modal').classList.add('hidden');
        }

        function showRedeemCode(code, name) {
            const modal = document.getElementById('reward-modal');
            document.getElementById('reward-icon').textContent = '🎫';
            document.getElementById('reward-name').textContent = name;
            document.getElementById('reward-description').textContent = 'Your redeem code:';
            document.getElementById('redeem-code-section').classList.remove('hidden');
            document.getElementById('badge-section').classList.add('hidden');
            document.getElementById('redeem-code-display').textContent = code;
            modal.classList.remove('hidden');
        }

        function copyRedeemCode() {
            const code = document.getElementById('redeem-code-display').textContent;
            navigator.clipboard.writeText(code).then(() => {
                showNotification('Code copied to clipboard!', 'success');
            }).catch(() => {
                // Fallback
                const textArea = document.createElement('textarea');
                textArea.value = code;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showNotification('Code copied to clipboard!', 'success');
            });
        }

        function createConfetti() {
            const colors = ['#16a34a', '#fbbf24', '#3b82f6', '#ef4444', '#8b5cf6'];
            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                confetti.style.animationDelay = Math.random() * 0.5 + 's';
                document.body.appendChild(confetti);
                
                setTimeout(() => confetti.remove(), 4000);
            }
        }

        // --- SCANNER LOGIC ---
        function resetToNewScan() {
            currentImage = null;
            currentImageHash = null;
            currentGeoTag = null;
            pendingVerification = null;
            currentStep2Image = null;
            document.getElementById('input-area').classList.remove('hidden');
            document.getElementById('preview-area').classList.add('hidden');
            document.getElementById('video-preview-area').classList.add('hidden');
            document.getElementById('loading-area').classList.add('hidden');
            document.getElementById('result-area').classList.add('hidden');
            document.getElementById('duplicate-warning').classList.add('hidden');
            document.getElementById('duplicate-overlay').classList.add('hidden');
            document.getElementById('verification-actions').classList.add('hidden');
            document.getElementById('open-video-step-btn').classList.add('hidden');
            const banner = document.getElementById('verification-status-banner');
            banner.classList.add('hidden');
            banner.className = 'hidden mb-6 rounded-xl p-4 border';
            document.getElementById('file-upload').value = '';
            document.getElementById('video-upload').value = '';
            document.getElementById('preview-image').src = '';
            const previewVideo = document.getElementById('preview-video');
            previewVideo.src = '';
            updateGeoStatus('Geotag status: waiting for scan.', 'info');
            updateVideoGeoStatus('Geotag status: waiting for scan.', 'info');
        }

        function dismissDuplicateWarning() {
            document.getElementById('duplicate-warning').classList.add('hidden');
        }

        async function handleImageUpload(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async function(e) {
                    currentImage = await normalizeImageForScan(e.target.result);
                    
                    // Generate hash immediately for duplicate detection
                    currentImageHash = await generateImageHash(currentImage);
                    
                    // Check for duplicate
                    const duplicate = isDuplicateImage(currentImageHash);
                    
                    showPreview(currentImage, duplicate);
                    event.target.value = '';
                }
                reader.readAsDataURL(file);
            }
        }

        async function normalizeImageForScan(imageSrc) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    const maxDim = Math.max(img.width, img.height);
                    if (maxDim <= SCAN_IMAGE_MAX_EDGE) {
                        resolve(imageSrc);
                        return;
                    }

                    const scale = SCAN_IMAGE_MAX_EDGE / maxDim;
                    const width = Math.max(1, Math.round(img.width * scale));
                    const height = Math.max(1, Math.round(img.height * scale));

                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = width;
                    canvas.height = height;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                };
                img.onerror = () => resolve(imageSrc);
                img.src = imageSrc;
            });
        }

        function handleVideoUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            if (!pendingVerification || !pendingVerification.verificationId) {
                showNotification('Complete Step 1 photo analysis first.', 'warning');
                event.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                currentStep2Image = e.target.result;

                document.getElementById('input-area').classList.add('hidden');
                document.getElementById('preview-area').classList.add('hidden');
                document.getElementById('result-area').classList.remove('hidden');
                document.getElementById('loading-area').classList.add('hidden');
                document.getElementById('duplicate-warning').classList.add('hidden');
                document.getElementById('duplicate-overlay').classList.add('hidden');
                document.getElementById('video-preview-area').classList.remove('hidden');

                const step2Preview = document.getElementById('preview-video');
                step2Preview.src = currentStep2Image;
                event.target.value = '';
            };
            reader.readAsDataURL(file);
        }

        async function loadImageElement(src) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('Failed to load Step 2 smart-bin image'));
                img.src = src;
            });
        }

        function updateVideoGeoStatus(message, type = 'info') {
            const el = document.getElementById('video-geo-status');
            if (!el) return;
            const classes = {
                info: 'text-gray-500',
                success: 'text-green-600',
                warning: 'text-amber-600',
                error: 'text-red-600'
            };
            el.classList.remove('text-gray-500', 'text-green-600', 'text-amber-600', 'text-red-600');
            el.classList.add(classes[type] || classes.info);
            el.textContent = message;
        }

        function setVerificationBanner(type, message) {
            const el = document.getElementById('verification-status-banner');
            if (!el) return;
            const map = {
                info: 'bg-blue-50 border-blue-200 text-blue-800',
                success: 'bg-green-50 border-green-200 text-green-800',
                warning: 'bg-amber-50 border-amber-200 text-amber-800',
                error: 'bg-red-50 border-red-200 text-red-800'
            };
            el.className = `mb-6 rounded-xl p-4 border ${map[type] || map.info}`;
            el.innerHTML = message;
            el.classList.remove('hidden');
        }

        function getEvaluationFromPredictions(predictions, duplicate = null, locationDuplicate = null) {
            const topPrediction = predictions[0];
            const itemName = topPrediction.className.split(',')[0];
            const confidence = (topPrediction.probability * 100).toFixed(1);

            let material = 'Other';
            let isRecyclable = false;
            let materialColor = 'bg-gray-200 text-gray-700';
            let credits = 0;

            const lowerName = itemName.toLowerCase();
            if (MATERIAL_MAP.plastic.some(k => lowerName.includes(k))) {
                material = 'Plastic'; isRecyclable = true; materialColor = 'bg-red-100 text-red-800'; credits = 15;
            } else if (MATERIAL_MAP.metal.some(k => lowerName.includes(k))) {
                material = 'Metal'; isRecyclable = true; materialColor = 'bg-yellow-100 text-yellow-800'; credits = 20;
            } else if (MATERIAL_MAP.glass.some(k => lowerName.includes(k))) {
                material = 'Glass'; isRecyclable = true; materialColor = 'bg-blue-100 text-blue-800'; credits = 25;
            } else if (MATERIAL_MAP.paper.some(k => lowerName.includes(k))) {
                material = 'Paper'; isRecyclable = true; materialColor = 'bg-green-100 text-green-800'; credits = 10;
            }

            if (topPrediction.probability > 0.8) credits += 5;

            const isDuplicate = duplicate !== null;
            const isLocationDuplicate = locationDuplicate !== null;
            const finalCredits = isDuplicate ? 0 : credits;

            return {
                topPrediction,
                itemName,
                confidence,
                material,
                isRecyclable,
                materialColor,
                credits,
                finalCredits,
                isDuplicate,
                isLocationDuplicate
            };
        }

        function renderScanResult(predictions, evaluation, duplicate = null, locationDuplicate = null, geoTag = null) {
            const duplicateBanner = document.getElementById('duplicate-result-banner');
            if (evaluation.isDuplicate) {
                duplicateBanner.classList.remove('hidden');
                document.getElementById('result-duplicate-date').textContent = new Date(duplicate.date).toLocaleString();
                const detail = duplicateBanner.querySelector('p.text-sm');
                if (detail) detail.textContent = 'This image was previously scanned on ' + new Date(duplicate.date).toLocaleString();
                updateGeoStatus('Geotag captured, but image duplicate already blocks credits.', 'warning');
            } else {
                duplicateBanner.classList.add('hidden');
                if (geoTag) {
                    updateGeoStatus(
                        `Geotag saved: ${geoTag.lat.toFixed(6)}, ${geoTag.lng.toFixed(6)} (+/-${Math.round(geoTag.accuracy)}m)`,
                        'success'
                    );
                } else {
                    updateGeoStatus('Location unavailable. Image was scanned without geotag.', 'warning');
                }
                if (locationDuplicate) {
                    updateGeoStatus(
                        `Same area detected (~${Math.round(locationDuplicate.distance)}m). Scan allowed, but no location bonus this time.`,
                        'warning'
                    );
                }
            }

            document.getElementById('res-name').innerText = evaluation.itemName;
            document.getElementById('res-confidence').innerText = evaluation.confidence + '%';

            const matBadge = document.getElementById('res-material-badge');
            matBadge.innerText = evaluation.material;
            matBadge.className = `px-3 py-1 rounded-full text-xs font-bold uppercase ${evaluation.materialColor}`;

            const recBadge = document.getElementById('res-recyclable-badge');
            if (evaluation.isRecyclable) {
                recBadge.innerText = 'Recyclable';
                recBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase bg-green-500 text-white';
                document.getElementById('res-desc').innerText = `Great job! This ${evaluation.material.toLowerCase()} item can be recycled.`;
            } else {
                recBadge.innerText = 'Non-Recyclable';
                recBadge.className = 'px-3 py-1 rounded-full text-xs font-bold uppercase bg-gray-500 text-white';
                document.getElementById('res-desc').innerText = 'This item is not typically recyclable in standard bins. Please dispose of it in general waste.';
            }

            const creditsBox = document.getElementById('credits-box');
            const duplicateCreditsBox = document.getElementById('duplicate-credits-box');
            const creditEl = document.getElementById('earned-credits');
            creditsBox.classList.remove('hidden');
            duplicateCreditsBox.classList.add('hidden');
            creditEl.innerText = evaluation.finalCredits;
            creditEl.classList.remove('text-green-600');
            document.getElementById('credit-reason').innerText = 'Pending Step 2 smart-bin image verification.';
            
            // Display location credits information
            const locationCreditInfo = document.getElementById('location-credit-info');
            if (locationCreditInfo) {
                locationCreditInfo.classList.remove('hidden');
                if (evaluation.locationCreditEligible) {
                    locationCreditInfo.className = 'mt-3 p-2 bg-green-50 border border-green-200 rounded-lg';
                    locationCreditInfo.innerHTML = `
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-green-700">
                                <i class="fa-solid fa-location-dot mr-1"></i>Location Credits
                            </span>
                            <span class="text-lg font-bold text-green-600">+${evaluation.locationCreditCredits}</span>
                        </div>
                        <p class="text-xs text-green-600 mt-1">${evaluation.locationCreditMessage}</p>
                    `;
                } else {
                    locationCreditInfo.className = 'mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg';
                    locationCreditInfo.innerHTML = `
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-amber-700">
                                <i class="fa-solid fa-location-dot mr-1"></i>Location Credits
                            </span>
                            <span class="text-lg font-bold text-amber-600">+0</span>
                        </div>
                        <p class="text-xs text-amber-600 mt-1">${evaluation.locationCreditMessage}</p>
                    `;
                }
            }

            const othersList = document.getElementById('other-predictions');
            othersList.innerHTML = '';
            predictions.slice(1, 4).forEach(p => {
                const li = document.createElement('li');
                li.className = 'flex justify-between border-b border-gray-100 pb-1';
                li.innerHTML = `<span>${p.className.split(',')[0]}</span> <span class="text-gray-400">${(p.probability*100).toFixed(0)}%</span>`;
                othersList.appendChild(li);
            });
        }

        async function startBackendVerificationSession(photoEvaluation, geoTag = null) {
            try {
                const payload = await apiRequest('/scan/verify/start', {
                    method: 'POST',
                    body: JSON.stringify({
                        photo: {
                            label: photoEvaluation.itemName,
                            material: photoEvaluation.material,
                            isRecyclable: photoEvaluation.isRecyclable,
                            predictedCredits: photoEvaluation.finalCredits,
                            duplicateBlocked: photoEvaluation.isDuplicate,
                            location: geoTag ? {
                                lat: geoTag.lat,
                                lng: geoTag.lng,
                                accuracy: geoTag.accuracy
                            } : null
                        }
                    })
                });
                return payload.verificationId || null;
            } catch (e) {
                console.error('Could not create verification session', e);
                return null;
            }
        }

        async function completeBackendVerificationSession(verificationId, step2Evaluation, step2GeoTag = null) {
            return apiRequest('/scan/verify/complete', {
                method: 'POST',
                body: JSON.stringify({
                    verificationId,
                    step2: {
                        label: step2Evaluation.itemName,
                        material: step2Evaluation.material,
                        isRecyclable: step2Evaluation.isRecyclable,
                        location: step2GeoTag ? {
                            lat: step2GeoTag.lat,
                            lng: step2GeoTag.lng,
                            accuracy: step2GeoTag.accuracy
                        } : null
                    }
                })
            });
        }

        async function commitVerifiedResult(photoEvaluation, geoTag, awardedCredits) {
            if (!photoEvaluation.isDuplicate && currentImageHash) {
                storeImageHash(currentImageHash, photoEvaluation.itemName);
            }

            let geotaggedImage = STORE_SCAN_IMAGE_IN_HISTORY ? currentImage : null;
            if (STORE_SCAN_IMAGE_IN_HISTORY && geoTag && currentImage) {
                try {
                    geotaggedImage = await GeoTag.embedFromDataUrl(currentImage, {
                        lat: geoTag.lat,
                        lng: geoTag.lng,
                        accuracy: geoTag.accuracy,
                        creator: currentUser ? currentUser.name : 'guest',
                        timestamp: geoTag.timestamp
                    });
                } catch (e) {
                    console.warn('Failed to embed geotag in image:', e);
                }
            }

            const historyItem = {
                id: Date.now(),
                name: photoEvaluation.itemName,
                material: photoEvaluation.material,
                credits: awardedCredits,
                date: new Date().toISOString(),
                image: geotaggedImage,
                isDuplicate: photoEvaluation.isDuplicate,
                duplicateType: photoEvaluation.isDuplicate ? 'image' : null,
                geoTag: geoTag
            };

            appData.history.unshift(historyItem);
            if (appData.history.length > MAX_HISTORY_ITEMS) {
                appData.history = appData.history.slice(0, MAX_HISTORY_ITEMS);
            }

            appData.credits += awardedCredits;
            if (awardedCredits > 0) {
                showNotification(`+${awardedCredits} credits earned! Total: ${appData.credits}`, 'success');
            } else if (photoEvaluation.isDuplicate) {
                showNotification('Duplicate image - no credits awarded', 'warning');
            } else {
                showNotification('No credits awarded for this item.', 'info');
            }

            await saveData();
        }

        function showPreview(src, duplicate = null) {
            document.getElementById('input-area').classList.add('hidden');
            document.getElementById('preview-area').classList.remove('hidden');
            document.getElementById('result-area').classList.add('hidden');
            document.getElementById('preview-image').src = src;
            
            // Show duplicate warning if detected
            if (duplicate) {
                document.getElementById('duplicate-warning').classList.remove('hidden');
                document.getElementById('duplicate-overlay').classList.remove('hidden');
                document.getElementById('duplicate-date').textContent = new Date(duplicate.date).toLocaleString();
                
                // Disable analyze button or modify it
                const analyzeBtn = document.getElementById('analyze-btn');
                analyzeBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation mr-2"></i> Analyze (No Credits)';
                analyzeBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                analyzeBtn.classList.add('bg-amber-500', 'hover:bg-amber-600');
            } else {
                document.getElementById('duplicate-warning').classList.add('hidden');
                document.getElementById('duplicate-overlay').classList.add('hidden');
                
                // Reset button
                const analyzeBtn = document.getElementById('analyze-btn');
                analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i> Analyze Step 1 (Photo)';
                analyzeBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                analyzeBtn.classList.remove('bg-amber-500', 'hover:bg-amber-600');
            }

            updateGeoStatus('Geotag will be captured when you tap Analyze.', 'info');
        }

        function resetScan() {
            resetToNewScan();
        }

        async function analyzeImage() {
            if (!model) {
                try {
                    updateGeoStatus('Loading AI model, please wait...', 'info');
                    await startModelLoad();
                } catch (e) {
                    console.error('Model failed to load', e);
                    alert("AI model failed to load. Please check your internet connection and try again.");
                    return;
                }
            }

            const imgElement = document.getElementById('preview-image');
            
            document.getElementById('preview-area').classList.add('hidden');
            document.getElementById('loading-area').classList.remove('hidden');

            // Check for duplicate again (in case hash wasn't generated yet)
            if (!currentImageHash) {
                currentImageHash = await generateImageHash(currentImage);
            }
            
            const duplicate = isDuplicateImage(currentImageHash);
            const geoTagPromise = getCurrentGeoTag();
            const predictionsPromise = model.classify(imgElement);
            const [predictions, geoTag] = await Promise.all([predictionsPromise, geoTagPromise]);
            currentGeoTag = geoTag;
            const locationDuplicate = findDuplicateLocation(currentGeoTag);
            const evaluation = getEvaluationFromPredictions(predictions, duplicate, locationDuplicate);
            
            // Check for location-based credits (at least 100m away from previous detections)
            const locationCreditCheck = checkLocationCredits(currentGeoTag);
            evaluation.locationCreditEligible = locationCreditCheck.eligible;
            evaluation.locationCreditDistance = locationCreditCheck.distance;
            evaluation.locationCreditCredits = locationCreditCheck.credits;
            evaluation.locationCreditMessage = locationCreditCheck.message;
            
            // Add location credits to final credits if eligible
            if (locationCreditCheck.eligible && !evaluation.isDuplicate) {
                evaluation.finalCredits += locationCreditCheck.credits;
            }
            
            renderScanResult(predictions, evaluation, duplicate, locationDuplicate, currentGeoTag);

            const verificationId = await startBackendVerificationSession(evaluation, currentGeoTag);
            if (!verificationId) {
                document.getElementById('loading-area').classList.add('hidden');
                document.getElementById('result-area').classList.remove('hidden');
                setVerificationBanner('error', '<strong>Step 1 failed:</strong> Could not start backend verification. Please retry.');
                return;
            }

            pendingVerification = {
                verificationId,
                photoEvaluation: evaluation,
                geoTag: currentGeoTag,
                imageDataUrl: currentImage,
                imageHash: currentImageHash
            };
            setVerificationBanner('info', '<strong>Step 1 complete.</strong> Continue to Step 2 smart-bin image verification. Credits stay locked until outputs and location both pass.');
            document.getElementById('verification-actions').classList.remove('hidden');
            document.getElementById('open-video-step-btn').classList.remove('hidden');
            
            document.getElementById('loading-area').classList.add('hidden');
            document.getElementById('result-area').classList.remove('hidden');
            document.getElementById('result-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        async function analyzeVideo() {
            const step2Image = document.getElementById('preview-video');
            if (!step2Image || !step2Image.src) {
                showNotification('Please select a Step 2 smart-bin image first.', 'warning');
                return;
            }
            if (!pendingVerification || !pendingVerification.verificationId) {
                showNotification('Run Step 1 photo analysis first.', 'warning');
                return;
            }

            if (!model) {
                try {
                    updateGeoStatus('Loading AI model, please wait...', 'info');
                    await startModelLoad();
                } catch (e) {
                    console.error('Model failed to load', e);
                    alert("AI model failed to load. Please check your internet connection and try again.");
                    return;
                }
            }

            document.getElementById('video-preview-area').classList.add('hidden');
            document.getElementById('loading-area').classList.remove('hidden');

            try {
                currentImage = step2Image.src;
                currentImageHash = await generateImageHash(currentImage);

                const duplicate = isDuplicateImage(currentImageHash);
                const liveStep2Geo = await getCurrentGeoTag();
                currentGeoTag = liveStep2Geo || pendingVerification.geoTag || null;
                const locationDuplicate = findDuplicateLocation(currentGeoTag);

                await new Promise(r => setTimeout(r, 350));

                const imgElement = await loadImageElement(currentImage);
                const predictions = await model.classify(imgElement);
                const step2Evaluation = getEvaluationFromPredictions(predictions, duplicate, locationDuplicate);
                renderScanResult(predictions, step2Evaluation, duplicate, locationDuplicate, currentGeoTag);
                updateVideoGeoStatus('Step 2 smart-bin image analyzed successfully.', 'success');

                const verifyResponse = await completeBackendVerificationSession(
                    pendingVerification.verificationId,
                    step2Evaluation,
                    currentGeoTag
                );

                if (verifyResponse.matched) {
                    document.getElementById('verification-actions').classList.add('hidden');
                    document.getElementById('open-video-step-btn').classList.add('hidden');
                    currentImage = pendingVerification.imageDataUrl;
                    currentImageHash = pendingVerification.imageHash;
                    await commitVerifiedResult(
                        pendingVerification.photoEvaluation,
                        pendingVerification.geoTag,
                        Number(verifyResponse.awardedCredits) || 0
                    );
                    document.getElementById('earned-credits').innerText = Number(verifyResponse.awardedCredits) || 0;
                    document.getElementById('credit-reason').innerText = verifyResponse.reason || 'Verification successful.';
                    setVerificationBanner('success', `<strong>Verification passed.</strong> ${verifyResponse.reason}`);
                    pendingVerification = null;
                } else {
                    document.getElementById('earned-credits').innerText = '0';
                    document.getElementById('credit-reason').innerText = verifyResponse.reason || 'Step 2 verification failed.';
                    setVerificationBanner('error', `<strong>Verification failed.</strong> ${verifyResponse.reason} Please retry Step 2 to continue.`);
                    const retryVerificationId = await startBackendVerificationSession(
                        pendingVerification.photoEvaluation,
                        pendingVerification.geoTag
                    );
                    if (!retryVerificationId) {
                        pendingVerification = null;
                        document.getElementById('verification-actions').classList.add('hidden');
                        document.getElementById('open-video-step-btn').classList.add('hidden');
                        setVerificationBanner('error', '<strong>Verification failed.</strong> Could not create retry session. Please run Step 1 again.');
                        showNotification('Step 2 failed and retry session could not be created. Run Step 1 again.', 'error');
                        document.getElementById('loading-area').classList.add('hidden');
                        document.getElementById('result-area').classList.remove('hidden');
                        return;
                    }
                    pendingVerification.verificationId = retryVerificationId;
                    document.getElementById('verification-actions').classList.remove('hidden');
                    document.getElementById('open-video-step-btn').classList.remove('hidden');
                    showNotification('Step 2 failed. Credits remain locked until match + location validation pass.', 'warning');
                }

                document.getElementById('loading-area').classList.add('hidden');
                document.getElementById('result-area').classList.remove('hidden');
                document.getElementById('result-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (error) {
                console.error('Step 2 analysis failed:', error);
                document.getElementById('loading-area').classList.add('hidden');
                document.getElementById('video-preview-area').classList.remove('hidden');
                showNotification('Could not analyze this Step 2 image. Try another one.', 'error');
            }
        }

        // --- CAMERA LOGIC ---
        async function startCamera() {
            const modal = document.getElementById('camera-modal');
            const video = document.getElementById('camera-video');
            
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                video.srcObject = stream;
                modal.classList.remove('hidden');
            } catch (err) {
                alert("Could not access camera: " + err);
            }
        }

        function closeCamera() {
            const modal = document.getElementById('camera-modal');
            const video = document.getElementById('camera-video');
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            video.srcObject = null;
            modal.classList.add('hidden');
        }

        async function capturePhoto() {
            const video = document.getElementById('camera-video');
            const canvas = document.getElementById('camera-canvas');
            
            const vw = video.videoWidth || 0;
            const vh = video.videoHeight || 0;
            const maxDim = Math.max(vw, vh);
            const scale = maxDim > SCAN_IMAGE_MAX_EDGE ? (SCAN_IMAGE_MAX_EDGE / maxDim) : 1;

            canvas.width = Math.max(1, Math.round(vw * scale));
            canvas.height = Math.max(1, Math.round(vh * scale));
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // JPEG reduces payload size and speeds image decode/hash/classification.
            currentImage = canvas.toDataURL('image/jpeg', 0.85);
            
            // Generate hash for camera capture too
            currentImageHash = await generateImageHash(currentImage);
            const duplicate = isDuplicateImage(currentImageHash);
            
            closeCamera();
            showPreview(currentImage, duplicate);
        }

        // --- DASHBOARD LOGIC ---
        let matChartInstance = null;
        let credChartInstance = null;

        function updateDashboard() {
            document.getElementById('dash-credits').innerText = appData.credits;
            document.getElementById('dash-items').innerText = appData.history.length;
            document.getElementById('dash-rewards').innerText = appData.claimedRewards.length;
            
            const recyclableItems = appData.history.filter(i => i.credits > 0).length;
            const rate = appData.history.length > 0 ? Math.round((recyclableItems / appData.history.length) * 100) : 0;
            document.getElementById('dash-rate').innerText = rate + "%";

            const tbody = document.getElementById('history-table-body');
            tbody.innerHTML = '';
            if (appData.history.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-8 text-center text-gray-400">No activity yet. Start scanning!</td></tr>';
            } else {
                appData.history.slice(0, 10).forEach(item => {
                    const date = new Date(item.date).toLocaleDateString();
                    const row = `
                        <tr class="hover:bg-gray-50 transition ${item.isDuplicate ? 'bg-red-50/50' : ''}">
                            <td class="px-6 py-4 font-medium text-gray-900">
                                ${item.name}
                                ${item.isDuplicate ? '<span class="ml-2 text-xs text-red-500 font-bold">(DUPLICATE)</span>' : ''}
                            </td>
                            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-bold ${getMaterialColor(item.material)}">${item.material}</span></td>
                            <td class="px-6 py-4">${date}</td>
                            <td class="px-6 py-4 text-right font-bold ${item.credits > 0 ? 'text-green-600' : 'text-gray-400'}">${item.credits > 0 ? '+' + item.credits : 0}</td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            }

            updateCharts();
        }

        function getMaterialColor(mat) {
            if (mat === 'Plastic') return 'bg-red-100 text-red-800';
            if (mat === 'Metal') return 'bg-yellow-100 text-yellow-800';
            if (mat === 'Glass') return 'bg-blue-100 text-blue-800';
            if (mat === 'Paper') return 'bg-green-100 text-green-800';
            return 'bg-gray-100 text-gray-800';
        }

        function initCharts() {
            // Empty init
        }

        function updateCharts() {
            const matCounts = { 'Plastic': 0, 'Metal': 0, 'Glass': 0, 'Paper': 0, 'Other': 0 };
            appData.history.forEach(i => {
                if (matCounts[i.material] !== undefined) matCounts[i.material]++;
                else matCounts['Other']++;
            });

            const ctxMat = document.getElementById('materialChart').getContext('2d');
            if (matChartInstance) matChartInstance.destroy();
            
            matChartInstance = new Chart(ctxMat, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(matCounts),
                    datasets: [{
                        data: Object.values(matCounts),
                        backgroundColor: ['#ef4444', '#eab308', '#3b82f6', '#22c55e', '#9ca3af']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

            const last7 = appData.history.slice(0, 7).reverse();
            const labels = last7.map(i => new Date(i.date).toLocaleDateString(undefined, {month:'short', day:'numeric'}));
            const dataPoints = last7.map(i => i.credits);

            const ctxCred = document.getElementById('creditsChart').getContext('2d');
            if (credChartInstance) credChartInstance.destroy();

            credChartInstance = new Chart(ctxCred, {
                type: 'bar',
                data: {
                    labels: labels.length ? labels : ['No Data'],
                    datasets: [{
                        label: 'Credits Earned',
                        data: dataPoints.length ? dataPoints : [0],
                        backgroundColor: '#16a34a',
                        borderRadius: 4
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }

        function clearHistory() {
            if(confirm("Clear all history and credits? This cannot be undone.")) {
                appData = { credits: 0, history: [], claimedRewards: [], badges: [], imageHashes: [], lastUpdated: new Date().toISOString() };
                saveData();
                updateDashboard();
                updateGlobalStats();
                showNotification('History cleared successfully.', 'info');
            }
        }

        // Check for redirect after login
        window.addEventListener('load', () => {
            const redirect = sessionStorage.getItem('redirectAfterLogin');
            if (redirect && currentUser) {
                sessionStorage.removeItem('redirectAfterLogin');
                router(redirect);
            }
        });

        // Auto-save on page unload
        window.addEventListener('beforeunload', () => {
            saveData();
        });

        // --- SUSTAINASSIST PRO NATIVE INTEGRATION ---
        let aiMessages = [];
        let isAiTyping = false;
        let currentAiImageBase64 = null;
        let currentAiImageMime = null;

        function handleAiImageUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                currentAiImageBase64 = e.target.result.split(',')[1];
                currentAiImageMime = file.type;
                
                const previewImg = document.getElementById('ai-image-preview');
                const previewContainer = document.getElementById('ai-image-preview-container');
                
                if (previewImg && previewContainer) {
                    previewImg.src = e.target.result;
                    previewContainer.classList.remove('hidden');
                }
            };
            reader.readAsDataURL(file);
        }

        function removeAiImage() {
            currentAiImageBase64 = null;
            currentAiImageMime = null;
            
            const fileInput = document.getElementById('ai-image-upload');
            if (fileInput) fileInput.value = '';
            
            const previewContainer = document.getElementById('ai-image-preview-container');
            if (previewContainer) previewContainer.classList.add('hidden');
        }

        async function loadAiHistory() {
            if (!authToken) return;
            try {
                const res = await fetch('/api/sustainai/history', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.messages && data.messages.length > 0) {
                        aiMessages = data.messages;
                    } else {
                        aiMessages = [];
                    }
                    renderAiChat();
                }
            } catch (e) {
                console.error("Failed to load AI history", e);
                renderAiChat();
            }
        }

        function renderAiChat() {
            const container = document.getElementById('ai-messages-container');
            if (!container) return;

            if (aiMessages.length === 0 && !isAiTyping) {
                container.innerHTML = `
                    <div class="ai-welcome-card">
                        <div class="ai-welcome-icon"><i class="fa-solid fa-leaf"></i></div>
                        <h3 class="ai-welcome-title">Welcome to SustainAssist Pro</h3>
                        <p class="ai-welcome-subtitle">I'm your AI guide to recycling, sustainability, and the circular economy. Ask me anything about plastic types, recycling methods, or how to earn credits on EcoSort!</p>
                    </div>
                `;
                renderAiSidebarHistory();
                return;
            }

            container.innerHTML = '';

            aiMessages.forEach(msg => {
                const isUser = msg.role === 'user';
                const row = document.createElement('div');
                row.className = `ai-msg-row ${isUser ? 'user' : 'assistant'}`;
                
                let contentHtml = msg.content || '';
                if (typeof marked !== 'undefined') {
                    contentHtml = marked.parse(contentHtml);
                } else {
                    contentHtml = contentHtml.replace(/\n/g, '<br/>');
                }

                let imageHtml = '';
                if (msg.imagePreview) {
                    imageHtml = `<img src="${msg.imagePreview}" style="max-width: 200px; border-radius: 8px; margin-bottom: 8px; display: block;" />`;
                }

                if (isUser) {
                    row.innerHTML = `
                        <div class="ai-msg-avatar"><i class="fa-solid fa-user"></i></div>
                        <div class="ai-msg-bubble">${imageHtml}${contentHtml}</div>
                    `;
                } else {
                    row.innerHTML = `
                        <div class="ai-msg-avatar"><i class="fa-solid fa-leaf"></i></div>
                        <div class="ai-msg-bubble">${contentHtml}</div>
                    `;
                }
                container.appendChild(row);
            });

            if (isAiTyping) {
                const typing = document.createElement('div');
                typing.className = 'ai-msg-row assistant';
                typing.innerHTML = `
                    <div class="ai-msg-avatar"><i class="fa-solid fa-leaf"></i></div>
                    <div class="ai-typing-dots"><span></span><span></span><span></span></div>
                `;
                container.appendChild(typing);
            }

            container.scrollTop = container.scrollHeight;
            renderAiSidebarHistory();
        }

        function renderAiSidebarHistory() {
            const historyList = document.getElementById('ai-history-list');
            if (!historyList) return;
            historyList.innerHTML = '';
            
            const userQueries = aiMessages.filter(msg => msg.role === 'user');
            if (userQueries.length === 0) {
                historyList.innerHTML = '<p class="text-sm text-gray-500 italic p-4">No recent history.</p>';
                return;
            }
            
            userQueries.reverse().forEach(q => {
                const item = document.createElement('div');
                item.className = 'ai-history-item';
                let text = q.content || 'Attached Image';
                if (text.length > 30) text = text.substring(0, 30) + '...';
                item.textContent = text;
                item.title = q.content;
                // scroll to msg logic could be added here
                historyList.appendChild(item);
            });
        }

        function fillAiPrompt(text) {
            const input = document.getElementById('ai-chat-input');
            if (input) {
                input.value = text;
                input.focus();
                input.style.height = 'auto';
                input.style.height = (input.scrollHeight) + 'px';
            }
        }

        document.addEventListener('DOMContentLoaded', () => {
            const aiChatForm = document.getElementById('ai-chat-form');
            if (aiChatForm) {
                aiChatForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if (isAiTyping) return;

                    const input = document.getElementById('ai-chat-input');
                    const submitBtn = document.getElementById('ai-chat-submit');
                    const content = input.value.trim();
                    
                    if (!content && !currentAiImageBase64) return;

                    const userMessage = { 
                        id: Date.now().toString(), 
                        role: 'user', 
                        content 
                    };
                    
                    if (currentAiImageBase64) {
                        userMessage.image = currentAiImageBase64;
                        userMessage.mimeType = currentAiImageMime;
                        const previewEl = document.getElementById('ai-image-preview');
                        if (previewEl) userMessage.imagePreview = previewEl.src;
                    }

                    aiMessages.push(userMessage);
                    input.value = '';
                    input.style.height = 'auto';
                    isAiTyping = true;
                    submitBtn.disabled = true;
                    removeAiImage();
                    renderAiChat();

                    try {
                        const res = await fetch('/api/chat', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`
                            },
                            body: JSON.stringify({ messages: aiMessages })
                        });

                        if (res.ok) {
                            const data = await res.json();
                            aiMessages.push({ id: Date.now().toString(), role: 'assistant', content: data.reply });
                            
                            // Save history silently
                            fetch('/api/sustainai/history', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${authToken}`
                                },
                                body: JSON.stringify({ messages: aiMessages })
                            }).catch(() => {});
                        } else {
                            // FIX #12: Handle rate limit and auth errors gracefully
                            let errorMsg = 'Sorry, I encountered an error. Please try again later.';
                            try {
                                const errData = await res.json();
                                if (res.status === 429) {
                                    const retrySeconds = errData.retryAfterSeconds || 60;
                                    errorMsg = `⏳ You're sending messages too quickly. Please wait ${retrySeconds} seconds before trying again.`;
                                } else if (res.status === 401) {
                                    errorMsg = '🔒 Your session has expired. Please log in again.';
                                } else if (errData.error || errData.reply) {
                                    errorMsg = errData.error || errData.reply;
                                }
                            } catch (e) {}
                            console.error('Chat API Error:', res.status, errorMsg);
                            aiMessages.push({ id: Date.now().toString(), role: 'assistant', content: `${errorMsg}` });
                        }
                    } catch (err) {
                        console.error('Chat Network Error:', err);
                        aiMessages.push({ id: Date.now().toString(), role: 'assistant', content: 'Network error. Could not reach the server.' });
                    } finally {
                        isAiTyping = false;
                        submitBtn.disabled = false;
                        renderAiChat();
                    }
                });
            }

            // Auto-resize textarea
            const aiChatInput = document.getElementById('ai-chat-input');
            if (aiChatInput) {
                aiChatInput.addEventListener('input', function() {
                    this.style.height = 'auto';
                    this.style.height = (this.scrollHeight) + 'px';
                });
                aiChatInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const form = document.getElementById('ai-chat-form');
                        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                    }
                });
            }
        });

        async function clearAiChat() {
            if (!confirm("Are you sure you want to clear your chat history?")) return;
            aiMessages = [];
            renderAiChat();
            if (authToken) {
                await fetch('/api/sustainai/history', {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
            }
        }

