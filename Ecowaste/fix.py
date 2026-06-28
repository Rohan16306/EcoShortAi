import re

file_path = 'd:/Codes/Vs Code/Ecowaste b/Ecowaste/index.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Trailing slashes
content = re.sub(r'(<link[^>]*?)\s*/>', r'\1>', content)
content = re.sub(r'(<meta[^>]*?)\s*/>', r'\1>', content)
content = re.sub(r'(<img[^>]*?)\s*/>', r'\1>', content)

# 2. Invalid div inside button -> span
# user menu button (line 100)
content = content.replace(
    '<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">\n                                <i class="fa-solid fa-user"></i>\n                            </div>',
    '<span class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600">\n                                <i class="fa-solid fa-user"></i>\n                            </span>'
)

# camera button (line 150)
content = content.replace(
    '<div class="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center -mt-6 shadow-lg border-4 border-white">\n                <i class="fa-solid fa-camera text-xl"></i>\n            </div>',
    '<span class="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center -mt-6 shadow-lg border-4 border-white">\n                <i class="fa-solid fa-camera text-xl"></i>\n            </span>'
)

# capture button (line 1124)
content = content.replace(
    '<div class="w-12 h-12 bg-white rounded-full"></div>',
    '<span class="w-12 h-12 bg-white rounded-full"></span>'
)

# 3. Add sr-only heading to articles
content = content.replace(
    '<article class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">',
    '<article class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">\n                        <h3 class="sr-only">Featured Article</h3>'
)
content = content.replace(
    '<article class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hidden lg:block">',
    '<article class="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hidden lg:block">\n                        <h3 class="sr-only">Featured Article</h3>'
)

# 4. Fix src="" to src="data:image/gif;base64,..."
content = content.replace(
    '<img id="preview-video" class="w-full max-h-96 rounded-lg shadow-md border border-gray-200 object-contain bg-gray-100" alt="Step 2 smart bin preview">',
    '<img id="preview-video" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" class="w-full max-h-96 rounded-lg shadow-md border border-gray-200 object-contain bg-gray-100" alt="Step 2 smart bin preview">'
)
content = content.replace(
    '<img id="ai-image-preview" src="" alt="Attached preview">',
    '<img id="ai-image-preview" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="Attached preview">'
)

# 5. Invalid div inside h3
# Medal icon (line 1154)
content = content.replace(
    '<div class="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mr-3 shadow-inner">\n                        <i class="fa-solid fa-medal text-yellow-500 text-lg"></i>\n                    </div>',
    '<span class="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center mr-3 shadow-inner">\n                        <i class="fa-solid fa-medal text-yellow-500 text-lg"></i>\n                    </span>'
)
# Second medal
content = content.replace(
    '<div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3 shadow-inner">\n                        <i class="fa-solid fa-medal text-emerald-500 text-lg"></i>\n                    </div>',
    '<span class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3 shadow-inner">\n                        <i class="fa-solid fa-medal text-emerald-500 text-lg"></i>\n                    </span>'
)
# Third medal
content = content.replace(
    '<div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3 shadow-inner">\n                        <i class="fa-solid fa-medal text-blue-500 text-lg"></i>\n                    </div>',
    '<span class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3 shadow-inner">\n                        <i class="fa-solid fa-medal text-blue-500 text-lg"></i>\n                    </span>'
)

# 6. Empty h3 (line 1231)
content = content.replace(
    '<h3 id="reward-name" class="text-xl font-bold text-gray-900 mb-2"></h3>',
    '<h3 id="reward-name" class="text-xl font-bold text-gray-900 mb-2">&nbsp;</h3>'
)

# 7. h4 to h3 (line 709)
content = content.replace(
    '<h4 class="font-bold text-gray-900">Sarah Johnson</h4>',
    '<h3 class="font-bold text-gray-900">Sarah Johnson</h3>'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
