with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. & 2. & 3. & 4. Camera fixes
js = js.replace(
    '''async function startCamera() {
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
        }''',
    '''let currentCameraStep = 1;

        async function startCamera(step = 1) {
            currentCameraStep = step;
            const modal = document.getElementById('camera-modal');
            const video = document.getElementById('camera-video');
            const locationOverlay = document.getElementById('camera-location-overlay');
            const coordsDisplay = document.getElementById('camera-coords');
            
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                video.srcObject = stream;
                modal.classList.remove('hidden');
                
                if (locationOverlay) {
                    locationOverlay.classList.remove('hidden');
                    coordsDisplay.innerText = "Fetching location...";
                    
                    if ("geolocation" in navigator) {
                        navigator.geolocation.getCurrentPosition(
                            position => {
                                coordsDisplay.innerText = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
                            },
                            err => {
                                coordsDisplay.innerText = "Location access denied";
                            },
                            { enableHighAccuracy: true, timeout: 5000 }
                        );
                    } else {
                        coordsDisplay.innerText = "Location not supported";
                    }
                }
            } catch (err) {
                alert("Could not access camera: " + err);
            }
        }

        function closeCamera() {
            const modal = document.getElementById('camera-modal');
            const video = document.getElementById('camera-video');
            const locationOverlay = document.getElementById('camera-location-overlay');
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            video.srcObject = null;
            modal.classList.add('hidden');
            if (locationOverlay) {
                locationOverlay.classList.add('hidden');
            }
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
            
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            closeCamera();
            
            if (currentCameraStep === 1) {
                currentImage = imgData;
                currentImageHash = await generateImageHash(currentImage);
                const duplicate = isDuplicateImage(currentImageHash);
                showPreview(currentImage, duplicate);
            } else if (currentCameraStep === 2) {
                currentStep2Image = imgData;
                showStep2Preview(currentStep2Image);
            }
        }'''
)

# 5. Fix handleLogin credits
js = js.replace(
    '''                currentUser = {
                    id: data.record.id,
                    name: data.record.name,
                    email: data.record.email,
                    role: data.record.role || 'ROLE_USER',
                    createdAt: data.record.created
                };''',
    '''                currentUser = {
                    id: data.record.id,
                    name: data.record.name,
                    email: data.record.email,
                    role: data.record.role || 'ROLE_USER',
                    createdAt: data.record.created,
                    credits: data.record.credits || 0
                };'''
)

# 6. Fix loadData credits sync
js = js.replace(
    '''                    const payload = await apiRequest('/data/me');
                    appData = normalizeAppData(payload.data);
                    localStorage.setItem(storageKey, JSON.stringify(appData));''',
    '''                    const payload = await apiRequest('/data/me');
                    appData = normalizeAppData(payload.data);
                    if (currentUser && typeof currentUser.credits === 'number') {
                        appData.credits = Math.max(appData.credits || 0, currentUser.credits);
                    }
                    localStorage.setItem(storageKey, JSON.stringify(appData));'''
)

# 7. Add logic to toggle Step 2 camera button alongside Step 2 upload button
js = js.replace(
    '''document.getElementById('open-video-step-btn').classList.remove('hidden');''',
    '''document.getElementById('open-video-step-btn').classList.remove('hidden');
            if(document.getElementById('open-video-camera-btn')) document.getElementById('open-video-camera-btn').classList.remove('hidden');'''
)
js = js.replace(
    '''document.getElementById('open-video-step-btn').classList.add('hidden');''',
    '''document.getElementById('open-video-step-btn').classList.add('hidden');
            if(document.getElementById('open-video-camera-btn')) document.getElementById('open-video-camera-btn').classList.add('hidden');'''
)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Updated js/app.js')
