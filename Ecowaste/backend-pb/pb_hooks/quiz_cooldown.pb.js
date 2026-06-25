onRecordBeforeCreateRequest((e) => {
    const userId = e.record.get("user");
    
    // Find the user's last quiz entry
    let lastQuiz = null;
    try {
        lastQuiz = $app.dao().findFirstRecordByFilter(
            "quiz_attempts", 
            `user = '${userId}'`, 
            "-created" // Sort descending
        );
    } catch (err) {
        // Record not found is expected if it's the first attempt
    }

    if (lastQuiz) {
        const lastTaken = new Date(lastQuiz.get("created")).getTime();
        const now = new Date().getTime();
        const hoursPassed = (now - lastTaken) / (1000 * 60 * 60);

        if (hoursPassed < 3) {
            throw new BadRequestError("You must wait 3 hours between quizzes.");
        }
    }
}, "quiz_attempts");
