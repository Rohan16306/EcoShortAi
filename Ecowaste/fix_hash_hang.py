with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

target2 = '''        async function generateImageHash(imageSrc) {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = function() {
                    // Create canvas to resize and process image
                    const canvas = document.createElement('canvas');'''

replacement2 = '''        async function generateImageHash(imageSrc) {
            return new Promise((resolve) => {
                let isResolved = false;
                const timeoutId = setTimeout(() => {
                    if (!isResolved) {
                        isResolved = true;
                        resolve(null);
                    }
                }, 2000); // 2 second hard timeout for hash

                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = function() {
                    if (isResolved) return;
                    isResolved = true;
                    clearTimeout(timeoutId);
                    
                    // Create canvas to resize and process image
                    const canvas = document.createElement('canvas');'''

target3 = '''                    // Combine both hashes for better accuracy
                    const finalHash = pHash + '\\\\' + colorHash;
                    resolve(finalHash);
                };
                img.onerror = function() {
                    resolve(null);
                };
                img.src = imageSrc;
            });
        }'''

replacement3 = '''                    // Combine both hashes for better accuracy
                    const finalHash = pHash + '\\\\' + colorHash;
                    resolve(finalHash);
                };
                img.onerror = function() {
                    if (isResolved) return;
                    isResolved = true;
                    clearTimeout(timeoutId);
                    resolve(null);
                };
                img.src = imageSrc;
            });
        }'''

if target2 in js and target3 in js:
    js = js.replace(target2, replacement2)
    js = js.replace(target3, replacement3)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Fixed generateImageHash")
else:
    print("Could not find generateImageHash")
