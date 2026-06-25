cronAdd("dbBackup", "0 0 * * *", () => { // Runs every night at midnight
    const archivePath = `./pb_data/backups/backup_${Date.now()}.zip`;
    $app.createBackup(archivePath); 
    console.log("Database successfully backed up to: " + archivePath);
});
