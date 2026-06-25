onRecordAfterCreateRequest((e) => {
    const record = e.record;
    
    // Check if the scan triggered a high-yield milestone
    if (record.collection().name === "scans" && record.getInt("points_awarded") >= 100) {
        $http.send({
            url: "YOUR_DISCORD_WEBHOOK_URL",
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                content: `🚀 **Milestone Unlocked!** A user just earned **${record.getInt("points_awarded")} credits** by properly disposing of ${record.getString("material")}!`
            })
        });
    }
}, "scans");
