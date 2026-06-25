with open('server.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = '''const materialMatched = session.photo.material === String(step2.material || 'Other');
  const recyclableMatched = session.photo.isRecyclable === Boolean(step2.isRecyclable);'''

replacement = '''// Prototype relaxation: If both are recyclable, treat it as a match to prevent AI camera jitter failures
  const isStep2Recyclable = Boolean(step2.isRecyclable);
  const materialMatched = (session.photo.material === String(step2.material || 'Other')) || (session.photo.isRecyclable && isStep2Recyclable);
  const recyclableMatched = (session.photo.isRecyclable === isStep2Recyclable) || isStep2Recyclable;'''

if target in js:
    js = js.replace(target, replacement)
    with open('server.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print('Updated server.js')
else:
    print('Target not found')
