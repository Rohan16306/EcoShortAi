onRecordBeforeCreateRequest((e) => {
    const userId = e.record.get("user");
    const newLat = e.record.getFloat("geo_lat");
    const newLng = e.record.getFloat("geo_lng");

    if (!newLat || !newLng) return;

    let lastScan = null;
    try {
        lastScan = $app.dao().findFirstRecordByFilter("scans", `user = '${userId}'`, "-created");
    } catch (err) {
        // No previous scan
    }

    if (lastScan) {
        const oldLat = lastScan.getFloat("geo_lat");
        const oldLng = lastScan.getFloat("geo_lng");
        
        if (!oldLat || !oldLng) return;

        // Basic Haversine implementation
        const R = 6371; // km
        const dLat = (newLat - oldLat) * (Math.PI/180);
        const dLng = (newLng - oldLng) * (Math.PI/180);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(oldLat * (Math.PI/180)) * Math.cos(newLat * (Math.PI/180)) * Math.sin(dLng/2) * Math.sin(dLng/2);
        const distanceKm = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));

        const timeDiffHours = (new Date().getTime() - new Date(lastScan.get("created")).getTime()) / 3600000;
        
        // If they traveled faster than 120km/h to get from Point A to Point B
        if (timeDiffHours > 0 && (distanceKm / timeDiffHours) > 120) {
            throw new BadRequestError("Velocity check failed. Invalid scan location.");
        }
    }
}, "scans");
