with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Fix 1: getCurrentGeoTag hanging
target1 = '''        function getCurrentGeoTag() {
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
                        enableHighAccuracy: true,
                        timeout: GEOLOCATION_TIMEOUT_MS,
                        maximumAge: GEOLOCATION_MAX_AGE_MS
                    }
                );
            });
        }'''

replacement1 = '''        function getCurrentGeoTag() {
            if (!navigator.geolocation) {
                return Promise.resolve(null);
            }

            return new Promise((resolve) => {
                let isResolved = false;
                const timeoutId = setTimeout(() => {
                    if (!isResolved) {
                        isResolved = true;
                        resolve(null);
                    }
                }, 3000); // 3 second hard timeout

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        if (isResolved) return;
                        isResolved = true;
                        clearTimeout(timeoutId);
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
                    () => {
                        if (isResolved) return;
                        isResolved = true;
                        clearTimeout(timeoutId);
                        resolve(null);
                    },
                    { enableHighAccuracy: true, timeout: 3000, maximumAge: 300000 }
                );
            });
        }'''

if target1 in js:
    js = js.replace(target1, replacement1)
    print("Fixed getCurrentGeoTag")
else:
    print("Could not find getCurrentGeoTag")

# Fix 2: generateImageHash hanging
target2 = '''        async function generateImageHash(imageSrc) {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = function() {
                    // Create canvas to resize and process image
                    const canvas = document.createElement('canvas');'''

replacement2 = '''        async function generateImageHash(imageSrc) {
            return new Promise((resolve) => {
                let isResolved = false;
                const timeoutId = setTimeout(() => {
                    if (!isResolved) {
                        isResolved = true;
                        resolve(null);
                    }
                }, 2000); // 2 second hard timeout for hash

                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = function() {
                    if (isResolved) return;
                    isResolved = true;
                    clearTimeout(timeoutId);
                    
                    // Create canvas to resize and process image
                    const canvas = document.createElement('canvas');'''

target3 = '''                    // Combine both hashes for better accuracy
                    const finalHash = pHash + '\\\\' + colorHash;
                    resolve(finalHash);
                };
                img.onerror = function() {
                    resolve(null);
                };
                img.src = imageSrc;
            });
        }'''

replacement3 = '''                    // Combine both hashes for better accuracy
                    const finalHash = pHash + '\\\\' + colorHash;
                    resolve(finalHash);
                };
                img.onerror = function() {
                    if (isResolved) return;
                    isResolved = true;
                    clearTimeout(timeoutId);
                    resolve(null);
                };
                img.src = imageSrc;
            });
        }'''

if target2 in js and target3 in js:
    js = js.replace(target2, replacement2)
    js = js.replace(target3, replacement3)
    print("Fixed generateImageHash")
else:
    print("Could not find generateImageHash")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
