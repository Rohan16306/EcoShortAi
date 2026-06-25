with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

video_preview_overlay = '''
                            <!-- NEW: Location display over captured image -->
                            <div id="video-preview-location-overlay" class="absolute bottom-2 left-2 bg-black/60 text-green-400 px-2 py-1 rounded font-mono text-[10px] sm:text-xs backdrop-blur hidden">
                                <i class="fa-solid fa-location-dot mr-1"></i> <span id="video-preview-coords"></span>
                            </div>'''

if 'id="video-preview-location-overlay"' not in html:
    html = html.replace('alt="Step 2 smart bin preview">', 'alt="Step 2 smart bin preview">' + video_preview_overlay)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Fixed video preview overlay.")
else:
    print("Already exists.")
