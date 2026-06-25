with open('js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

target1 = '''function getEvaluationFromPredictions(predictions, duplicate = null, locationDuplicate = null) {
            let itemName = predictions[0].className.split(',')[0];
            let confidence = (predictions[0].probability * 100).toFixed(1);
            let material = 'Other';
            let isRecyclable = false;
            let materialColor = 'bg-gray-200 text-gray-700';
            let credits = 0;
            let prob = predictions[0].probability;'''

replacement1 = '''function getEvaluationFromPredictions(predictions, duplicate = null, locationDuplicate = null) {
            if (!predictions || predictions.length === 0) {
                return { itemName: 'Unknown', material: 'Other', isRecyclable: false, materialColor: 'bg-gray-200 text-gray-700', confidence: 0, isDuplicate: !!duplicate || !!locationDuplicate, finalCredits: 0 };
            }
            let itemName = predictions[0].className.split(',')[0];
            let confidence = (predictions[0].probability * 100).toFixed(1);
            let material = 'Other';
            let isRecyclable = false;
            let materialColor = 'bg-gray-200 text-gray-700';
            let credits = 0;
            let prob = predictions[0].probability;'''

if target1 in js:
    js = js.replace(target1, replacement1)

target2_analyzeImage = '''            const geoTagPromise = getCurrentGeoTag();
            const predictionsPromise = model.classify(imgElement);
            const [predictions, geoTag] = await Promise.all([predictionsPromise, geoTagPromise]);
            currentGeoTag = geoTag;
            const locationDuplicate = findDuplicateLocation(currentGeoTag);
            const evaluation = getEvaluationFromPredictions(predictions, duplicate, locationDuplicate);
            
            // Check for location-based credits (at least 100m away from previous detections)
            const locationCreditCheck = checkLocationCredits(currentGeoTag);
            evaluation.locationCreditEligible = locationCreditCheck.eligible;
            evaluation.locationCreditDistance = locationCreditCheck.distance;
            evaluation.locationCreditCredits = locationCreditCheck.credits;
            evaluation.locationCreditMessage = locationCreditCheck.message;

            // Wait for at least 1.5s total loading time to make it feel like AI is working
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 1500) {
                await new Promise(resolve => setTimeout(resolve, 1500 - elapsedTime));
            }'''

replacement2_analyzeImage = '''            let predictions, geoTag;
            try {
                const geoTagPromise = getCurrentGeoTag();
                const predictionsPromise = model.classify(imgElement);
                [predictions, geoTag] = await Promise.all([predictionsPromise, geoTagPromise]);
            } catch (err) {
                console.error("Scan Error:", err);
                document.getElementById('loading-area').classList.add('hidden');
                alert("Failed to analyze image. Ensure the image is valid. Error: " + err.message);
                
                const scanOverlay = document.getElementById('scan-overlay');
                if (scanOverlay) scanOverlay.classList.add('hidden');
                if (window.__laserInterval) clearInterval(window.__laserInterval);
                return;
            }

            currentGeoTag = geoTag;
            const locationDuplicate = findDuplicateLocation(currentGeoTag);
            const evaluation = getEvaluationFromPredictions(predictions, duplicate, locationDuplicate);
            
            // Check for location-based credits (at least 100m away from previous detections)
            const locationCreditCheck = checkLocationCredits(currentGeoTag);
            evaluation.locationCreditEligible = locationCreditCheck.eligible;
            evaluation.locationCreditDistance = locationCreditCheck.distance;
            evaluation.locationCreditCredits = locationCreditCheck.credits;
            evaluation.locationCreditMessage = locationCreditCheck.message;

            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
            }'''

if target2_analyzeImage in js:
    js = js.replace(target2_analyzeImage, replacement2_analyzeImage)

target3_analyzeVideo = '''            const geoTagPromise = getCurrentGeoTag();
            const predictionsPromise = model.classify(imgElement);
            const [predictions, geoTag] = await Promise.all([predictionsPromise, geoTagPromise]);
            
            step2GeoTag = geoTag;
            const step2LocationDuplicate = findDuplicateLocation(step2GeoTag);
            const step2Evaluation = getEvaluationFromPredictions(predictions, duplicate, step2LocationDuplicate);

            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 1500) {
                await new Promise(resolve => setTimeout(resolve, 1500 - elapsedTime));
            }'''

replacement3_analyzeVideo = '''            let predictions, geoTag;
            try {
                const geoTagPromise = getCurrentGeoTag();
                const predictionsPromise = model.classify(imgElement);
                [predictions, geoTag] = await Promise.all([predictionsPromise, geoTagPromise]);
            } catch (err) {
                console.error("Step 2 Scan Error:", err);
                updateVideoScanStatus('Error analyzing image. Please try again.', 'red');
                const scanOverlay = document.getElementById('video-scan-overlay');
                if (scanOverlay) scanOverlay.classList.add('hidden');
                if (window.__laserInterval) clearInterval(window.__laserInterval);
                return;
            }
            
            step2GeoTag = geoTag;
            const step2LocationDuplicate = findDuplicateLocation(step2GeoTag);
            const step2Evaluation = getEvaluationFromPredictions(predictions, duplicate, step2LocationDuplicate);

            const elapsedTime = Date.now() - startTime;
            if (elapsedTime < 500) {
                await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
            }'''

if target3_analyzeVideo in js:
    js = js.replace(target3_analyzeVideo, replacement3_analyzeVideo)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
print('Updated app.js with try/catch and error handling')
