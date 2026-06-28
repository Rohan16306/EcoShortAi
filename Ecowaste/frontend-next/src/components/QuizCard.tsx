'use client';

import { useState, useEffect } from 'react';
import { Trophy, Clock, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import * as motion from 'framer-motion/client';
import { quizService, TriviaQuestion } from '../services/quizService';
import pb from '../lib/pocketbase';

export default function QuizCard() {
  const [canTake, setCanTake] = useState(true);
  const [remainingMs, setRemainingMs] = useState(0);
  const [isTakingQuiz, setIsTakingQuiz] = useState(false);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Track selected answer to show correct/wrong feedback before next question
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Initialize and check cooldown
  useEffect(() => {
    const checkStatus = () => {
      // Need to be logged in to take quiz
      if (!pb.authStore.isValid) {
        setCanTake(false);
        setRemainingMs(0); // Can't take it because not logged in
        return;
      }

      const status = quizService.canTakeQuiz();
      setCanTake(status.canTake);
      setRemainingMs(status.remainingMs);
    };

    checkStatus();
    
    // Listen to auth changes
    pb.authStore.onChange(() => {
      checkStatus();
    });

    const interval = setInterval(() => {
      if (remainingMs > 0) {
        setRemainingMs(prev => Math.max(0, prev - 1000));
        if (remainingMs - 1000 <= 0) {
          setCanTake(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingMs]);

  const startQuiz = async () => {
    if (!pb.authStore.isValid) {
      alert("Please log in to play Eco-Trivia!");
      return;
    }
    
    setLoading(true);
    const qs = await quizService.getQuiz();
    setLoading(false);
    
    if (qs.length === 0) {
      alert("No trivia questions available yet!");
      return;
    }

    setQuestions(qs);
    setCurrentQuestion(0);
    setScore(0);
    setShowResults(false);
    setSelectedAnswer(null);
    setIsTakingQuiz(true);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return; // Already answered this question

    setSelectedAnswer(index);
    const correct = index === questions[currentQuestion].correct_index;
    
    if (correct) {
      setScore(prev => prev + 1);
    }

    setTimeout(async () => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        // Quiz finished!
        setIsSubmitting(true);
        await quizService.submitScore(score + (correct ? 1 : 0));
        setIsSubmitting(false);
        setShowResults(true);
        
        // Reset cooldown status
        const status = quizService.canTakeQuiz();
        setCanTake(status.canTake);
        setRemainingMs(status.remainingMs);
      }
    }, 1500); // 1.5 second pause to see correct answer
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!pb.authStore.isValid && !isTakingQuiz) {
    return (
      <div className="bg-white/10 backdrop-blur border border-white/20 p-6 rounded-2xl text-center">
        <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3 opacity-50" />
        <h3 className="text-xl font-bold mb-2 text-white">Eco-Trivia Hub</h3>
        <p className="text-green-100 text-sm mb-4">Log in to test your knowledge and earn up to 100 points every 3 hours!</p>
        <button disabled className="px-6 py-2 bg-gray-500/50 text-white rounded-lg cursor-not-allowed">
          Login Required
        </button>
      </div>
    );
  }

  // Active Quiz View
  if (isTakingQuiz && !showResults) {
    const q = questions[currentQuestion];
    return (
      <div className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 p-6 rounded-2xl shadow-xl w-full max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-bold text-green-600 dark:text-green-400">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm font-bold bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
            Score: {score * 10}
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">{q.question}</h3>
        
        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            let btnClass = "w-full text-left px-4 py-4 rounded-xl border-2 transition-all font-medium ";
            
            if (selectedAnswer === null) {
              btnClass += "border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 text-slate-700 dark:text-slate-300";
            } else {
              if (idx === q.correct_index) {
                btnClass += "border-green-500 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200"; // Correct!
              } else if (idx === selectedAnswer && idx !== q.correct_index) {
                btnClass += "border-red-500 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200"; // Wrong pick
              } else {
                btnClass += "border-slate-200 dark:border-slate-700 opacity-50"; // Not picked, wrong
              }
            }

            return (
              <button 
                key={idx} 
                onClick={() => handleAnswer(idx)}
                disabled={selectedAnswer !== null}
                className={btnClass}
              >
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {selectedAnswer !== null && idx === q.correct_index && <CheckCircle className="w-5 h-5 text-green-600" />}
                </div>
              </button>
            );
          })}
        </div>

        {isSubmitting && (
          <div className="mt-6 text-center text-sm text-slate-500 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving score...
          </div>
        )}
      </div>
    );
  }

  // Quiz Results View
  if (showResults) {
    return (
      <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-8 rounded-2xl shadow-xl text-center text-white w-full max-w-2xl mx-auto">
        <Trophy className="w-16 h-16 text-yellow-300 mx-auto mb-4 animate-bounce" />
        <h3 className="text-3xl font-extrabold mb-2">Quiz Complete!</h3>
        <p className="text-xl mb-6">You earned <span className="font-bold text-yellow-300">{score * 10} points</span>!</p>
        
        <div className="bg-white/20 backdrop-blur rounded-xl p-4 mb-6">
          <p className="text-sm">The quiz is now on cooldown. Come back in 3 hours to play again and earn more points!</p>
        </div>

        <button 
          onClick={() => { setIsTakingQuiz(false); setShowResults(false); }}
          className="px-8 py-3 bg-white text-green-700 font-bold rounded-xl hover:bg-green-50 transition shadow-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Dashboard Card View
  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 p-6 rounded-2xl text-center relative overflow-hidden group">
      {canTake && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
          LIVE NOW
        </div>
      )}
      
      <Trophy className={`w-12 h-12 mx-auto mb-3 ${canTake ? 'text-yellow-400 animate-pulse' : 'text-slate-400 opacity-50'}`} />
      <h3 className="text-xl font-bold mb-2 text-white">Eco-Trivia Hub</h3>
      
      {canTake ? (
        <>
          <p className="text-green-100 text-sm mb-6">Answer 10 questions to earn up to 100 points right now!</p>
          <button 
            onClick={startQuiz}
            disabled={loading}
            className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400 transition flex items-center justify-center shadow-lg hover:shadow-green-500/50 hover:-translate-y-1"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 mr-2" fill="currentColor" /> Start Quiz</>}
          </button>
        </>
      ) : (
        <>
          <p className="text-green-100/70 text-sm mb-4">Quiz completed. New questions dropping soon!</p>
          <div className="bg-black/20 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-center text-yellow-400 font-mono text-2xl font-bold tracking-wider">
              <Clock className="w-6 h-6 mr-3 text-white/50" />
              {formatTime(remainingMs)}
            </div>
            <p className="text-xs text-white/50 mt-2 uppercase tracking-widest">Cooldown Timer</p>
          </div>
        </>
      )}
    </div>
  );
}
