with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

target1 = 'const GEOLOCATION_TIMEOUT_MS = 15000;'
replacement1 = 'const GEOLOCATION_TIMEOUT_MS = 3000;'

if target1 in js:
    js = js.replace(target1, replacement1)
    print('Updated GEOLOCATION_TIMEOUT_MS to 3000')

target2 = '''            // Artificial delay for visual effect
            await new Promise(resolve => setTimeout(resolve, 1500));'''

if target2 in js:
    js = js.replace(target2, '')
    print('Removed artificial delays')

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
