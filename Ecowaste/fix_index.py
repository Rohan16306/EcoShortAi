with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add camera location overlay
html = html.replace(
    '<canvas id="camera-canvas" class="hidden"></canvas>',
    '''<canvas id="camera-canvas" class="hidden"></canvas>
                    
                    <!-- NEW: Location Display -->
                    <div id="camera-location-overlay" class="absolute top-4 left-4 bg-black/60 text-green-400 px-3 py-2 rounded font-mono text-xs backdrop-blur hidden">
                        <i class="fa-solid fa-location-dot mr-1"></i> <span id="camera-coords">Fetching location...</span>
                    </div>'''
)

# 2. Add Step 2 Camera button
html = html.replace(
    '''<button id="open-video-step-btn" onclick="document.getElementById('video-upload').click()" class="hidden flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg">
                                <i class="fa-solid fa-binoculars mr-2"></i> Step 2: Smart Bin Image Check
                            </button>''',
    '''<button id="open-video-step-btn" onclick="document.getElementById('video-upload').click()" class="hidden flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg">
                                <i class="fa-solid fa-binoculars mr-2"></i> Step 2: Upload Image
                            </button>
                            <button id="open-video-camera-btn" onclick="startCamera(2)" class="hidden flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition shadow-lg">
                                <i class="fa-solid fa-camera mr-2"></i> Step 2: Camera
                            </button>'''
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated index.html')
