onRecordAfterCreateRequest((e) => {
    try {
        // Fetch your single document holding universal stats metrics
        const statsRecord = $app.dao().findFirstRecordByFilter("global_stats", "id != ''");
        if (statsRecord) {
            const currentCo2 = statsRecord.getFloat("total_co2_saved");
            const addedCo2 = 0.5; // default 0.5 kg offset per scan for simplicity
            
            statsRecord.set("total_co2_saved", currentCo2 + addedCo2);
            $app.dao().saveRecord(statsRecord);
        }
    } catch (err) {
        console.log("Error updating global counters: " + err);
    }
}, "scans");
