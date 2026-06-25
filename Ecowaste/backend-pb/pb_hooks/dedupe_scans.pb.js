onRecordBeforeCreateRequest((e) => {
    const uploadedFile = e.record.get("image");
    if (!uploadedFile) return;

    // Generate a quick hash of the file name/size/content to detect exact matches
    const fileHash = $security.md5(uploadedFile.name + uploadedFile.size);
    
    // Check if this hash already exists
    const existing = $app.dao().findRecordsByFilter(
        "scans", 
        `file_hash = '${fileHash}'`
    );

    if (existing && existing.length > 0) {
        throw new BadRequestError("Duplicate scan detected. Points denied.");
    }
    
    e.record.set("file_hash", fileHash);
}, "scans");
