with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

import re
html = re.sub(r'<!-- NEW: Location display over captured image -->\s*<div id="preview-location-overlay"[^>]+>\s*<i[^>]+></i>\s*<span[^>]+></span>\s*</div>', '', html)
html = re.sub(r'<!-- NEW: Location display over captured image -->\s*<div id="video-preview-location-overlay"[^>]+>\s*<i[^>]+></i>\s*<span[^>]+></span>\s*</div>', '', html)

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

html = html.replace('<!-- Scanning Laser Overlay -->', preview_overlay + '\n                            <!-- Scanning Laser Overlay -->')

html = html.replace('alt="Step 2 smart bin preview">\n                            <button aria-label="Reset scan"', 'alt="Step 2 smart bin preview">\n' + video_preview_overlay + '\n                            <button aria-label="Reset scan"')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Fixed index.html overlays.')
