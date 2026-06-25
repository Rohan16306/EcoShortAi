with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

target = '''<button onclick="document.getElementById('video-upload').click()" class="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg">
                                <i class="fa-solid fa-binoculars mr-2"></i> Continue to Step 2: Smart Bin Image Check
                            </button>'''

replacement = '''<div class="flex flex-col sm:flex-row justify-center items-center gap-4">
                                <button onclick="document.getElementById('video-upload').click()" class="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg w-full sm:w-auto">
                                    <i class="fa-solid fa-upload mr-2"></i> Step 2: Upload Image
                                </button>
                                <button onclick="startCamera(2)" class="px-8 py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 transition shadow-lg w-full sm:w-auto">
                                    <i class="fa-solid fa-camera mr-2"></i> Step 2: Camera
                                </button>
                            </div>'''

if target in html:
    html = html.replace(target, replacement)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully replaced verification-actions buttons.")
else:
    print("Target not found.")
