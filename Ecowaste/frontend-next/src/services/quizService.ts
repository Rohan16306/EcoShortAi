import pb from '../lib/pocketbase';

export interface TriviaQuestion {
    id: string;
    question: string;
    options: string[];
    correct_index: number;
}

export const quizService = {
    // 1. Fetch random questions (up to 10)
    async getQuiz(): Promise<TriviaQuestion[]> {
        try {
            // PocketBase sort: '@random' fetches random records
            const records = await pb.collection('trivia_questions').getList<TriviaQuestion>(1, 10, {
                sort: '@random', 
            });
            return records.items;
        } catch (error) {
            console.error("Failed to load quiz", error);
            return [];
        }
    },

    // 2. Check if 3 hours have passed since the last quiz
    canTakeQuiz(): { canTake: boolean; remainingMs: number } {
        const user = pb.authStore.record;
        if (!user || !user.last_quiz_time) return { canTake: true, remainingMs: 0 }; // Never taken a quiz before

        const lastTime = new Date(user.last_quiz_time).getTime();
        const currentTime = new Date().getTime();
        
        // 24 hours in milliseconds
        const cooldownMs = 24 * 60 * 60 * 1000;
        const passedMs = currentTime - lastTime;

        if (passedMs >= cooldownMs) {
            return { canTake: true, remainingMs: 0 };
        } else {
            return { canTake: false, remainingMs: cooldownMs - passedMs };
        }
    },

    // 3. Submit Score and start the 3-hour cooldown
    async submitScore(correctAnswersCount: number) {
        try {
            const user = pb.authStore.record;
            if (!user) throw new Error("Not logged in");

            const pointsEarned = correctAnswersCount * 10; // 10 points per right answer
            const newTotal = (user.total_points || 0) + pointsEarned;

            // Update user with new points AND set the current time as their last quiz time
            await pb.collection('users').update(user.id, {
                total_points: newTotal,
                last_quiz_time: new Date().toISOString()
            });

            // Refresh auth store to update the UI
            await pb.collection('users').authRefresh();

            return { success: true, points: pointsEarned };
        } catch (error) {
            console.error("Failed to submit score", error);
            return { success: false, points: 0 };
        }
    }
};
