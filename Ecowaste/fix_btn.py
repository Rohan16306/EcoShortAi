with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

html = html.replace(
    '''<button id="continue-step2-btn" onclick="document.getElementById('video-upload').click()" class="hidden flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg mt-6 mx-auto">
                                <i class="fa-solid fa-binoculars mr-2"></i> Continue to Step 2: Smart Bin Image Check
                            </button>''',
    '''<div id="continue-step2-btn" class="hidden mt-6 mx-auto flex gap-4 justify-center">
                                <button onclick="document.getElementById('video-upload').click()" class="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-lg">
                                    <i class="fa-solid fa-upload mr-2"></i> Step 2: Upload
                                </button>
                                <button onclick="startCamera(2)" class="flex items-center px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition shadow-lg">
                                    <i class="fa-solid fa-camera mr-2"></i> Step 2: Camera
                                </button>
                            </div>'''
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Updated continue-step2-btn in index.html')
