with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

preview_overlay = '''
                            <!-- NEW: Location display over captured image -->
                            <div id="preview-location-overlay" class="absolute bottom-2 left-2 bg-black/60 text-green-400 px-2 py-1 rounded font-mono text-[10px] sm:text-xs backdrop-blur hidden">
                                <i class="fa-solid fa-location-dot mr-1"></i> <span id="preview-coords"></span>
                            </div>'''

video_preview_overlay = '''
                            <!-- NEW: Location display over captured image -->
                            <div id="video-preview-location-overlay" class="absolute bottom-2 left-2 bg-black/60 text-green-400 px-2 py-1 rounded font-mono text-[10px] sm:text-xs backdrop-blur hidden">
                                <i class="fa-solid fa-location-dot mr-1"></i> <span id="video-preview-coords"></span>
                            </div>'''

if 'id="preview-location-overlay"' not in html:
    html = html.replace('<!-- Scanning Laser Overlay -->', preview_overlay + '\n                            <!-- Scanning Laser Overlay -->')

if 'id="video-preview-location-overlay"' not in html:
    html = html.replace('<button aria-label="Reset scan"', video_preview_overlay + '\n                            <button aria-label="Reset scan"')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Updated index.html with preview overlays.")

with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add a global variable to store last fetched location
if 'let lastFetchedLocation = null;' not in js:
    js = js.replace('let currentCameraStep = 1;', 'let currentCameraStep = 1;\n        let lastFetchedLocation = null;')

# Update startCamera to store lastFetchedLocation
js = js.replace(
    '''position => {
                                coordsDisplay.innerText = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
                            },''',
    '''position => {
                                lastFetchedLocation = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
                                coordsDisplay.innerText = lastFetchedLocation;
                            },'''
)

# Update showPreview to use lastFetchedLocation
js = js.replace(
    '''document.getElementById('preview-area').classList.remove('hidden');''',
    '''document.getElementById('preview-area').classList.remove('hidden');
            
            const overlay = document.getElementById('preview-location-overlay');
            const coordsDisplay = document.getElementById('preview-coords');
            if (overlay && coordsDisplay) {
                if (lastFetchedLocation) {
                    coordsDisplay.innerText = lastFetchedLocation;
                    overlay.classList.remove('hidden');
                } else {
                    overlay.classList.add('hidden');
                }
            }'''
)

# Update showStep2Preview to use lastFetchedLocation
js = js.replace(
    '''document.getElementById('video-preview-area').classList.remove('hidden');''',
    '''document.getElementById('video-preview-area').classList.remove('hidden');
            
            const overlay = document.getElementById('video-preview-location-overlay');
            const coordsDisplay = document.getElementById('video-preview-coords');
            if (overlay && coordsDisplay) {
                if (lastFetchedLocation) {
                    coordsDisplay.innerText = lastFetchedLocation;
                    overlay.classList.remove('hidden');
                } else {
                    overlay.classList.add('hidden');
                }
            }'''
)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print("Updated app.js with preview overlays logic.")
