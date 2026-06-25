with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

target = '''const topPrediction = predictions[0];
            const itemName = topPrediction.className.split(',')[0];
            const confidence = (topPrediction.probability * 100).toFixed(1);

            let material = 'Other';
            let isRecyclable = false;
            let materialColor = 'bg-gray-200 text-gray-700';
            let credits = 0;

            const lowerName = itemName.toLowerCase();
            if (MATERIAL_MAP.plastic.some(k => lowerName.includes(k))) {
                material = 'Plastic'; isRecyclable = true; materialColor = 'bg-red-100 text-red-800'; credits = 15;
            } else if (MATERIAL_MAP.metal.some(k => lowerName.includes(k))) {
                material = 'Metal'; isRecyclable = true; materialColor = 'bg-yellow-100 text-yellow-800'; credits = 20;
            } else if (MATERIAL_MAP.glass.some(k => lowerName.includes(k))) {
                material = 'Glass'; isRecyclable = true; materialColor = 'bg-blue-100 text-blue-800'; credits = 25;
            } else if (MATERIAL_MAP.paper.some(k => lowerName.includes(k))) {
                material = 'Paper'; isRecyclable = true; materialColor = 'bg-green-100 text-green-800'; credits = 10;
            }

            if (topPrediction.probability > 0.8) credits += 5;'''

replacement = '''let itemName = predictions[0].className.split(',')[0];
            let confidence = (predictions[0].probability * 100).toFixed(1);
            let material = 'Other';
            let isRecyclable = false;
            let materialColor = 'bg-gray-200 text-gray-700';
            let credits = 0;
            let prob = predictions[0].probability;

            // Check top 3 predictions to increase robustness against camera jitter
            for (let i = 0; i < Math.min(3, predictions.length); i++) {
                const p = predictions[i];
                const lowerName = p.className.toLowerCase();
                
                if (MATERIAL_MAP.plastic.some(k => lowerName.includes(k))) {
                    material = 'Plastic'; isRecyclable = true; materialColor = 'bg-red-100 text-red-800'; credits = 15;
                    itemName = p.className.split(',')[0]; confidence = (p.probability * 100).toFixed(1); prob = p.probability; break;
                } else if (MATERIAL_MAP.metal.some(k => lowerName.includes(k))) {
                    material = 'Metal'; isRecyclable = true; materialColor = 'bg-yellow-100 text-yellow-800'; credits = 20;
                    itemName = p.className.split(',')[0]; confidence = (p.probability * 100).toFixed(1); prob = p.probability; break;
                } else if (MATERIAL_MAP.glass.some(k => lowerName.includes(k))) {
                    material = 'Glass'; isRecyclable = true; materialColor = 'bg-blue-100 text-blue-800'; credits = 25;
                    itemName = p.className.split(',')[0]; confidence = (p.probability * 100).toFixed(1); prob = p.probability; break;
                } else if (MATERIAL_MAP.paper.some(k => lowerName.includes(k))) {
                    material = 'Paper'; isRecyclable = true; materialColor = 'bg-green-100 text-green-800'; credits = 10;
                    itemName = p.className.split(',')[0]; confidence = (p.probability * 100).toFixed(1); prob = p.probability; break;
                }
            }

            if (prob > 0.8) credits += 5;'''

if target in js:
    js = js.replace(target, replacement)
    with open('js/app.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print('Updated app.js robustness logic')
else:
    print('Target not found in app.js')
