import dynamic from 'next/dynamic';
import { AnimatedHeroContent } from '../components/home/AnimatedHeroContent';
import { AnimatedImpactSection } from '../components/home/AnimatedImpactSection';

// Lazy load the QuizCard since it's below the fold and heavy on interactivity
const QuizCard = dynamic(() => import('../components/QuizCard'), {
  loading: () => <div className="h-96 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl"></div>,
});

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 dark:from-green-950 dark:via-emerald-900 dark:to-teal-950 pt-24 pb-20">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/30 dark:bg-green-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <AnimatedHeroContent />
        </div>
      </section>

      {/* Eco-Trivia Hub Section */}
      <section className="py-16 bg-white dark:bg-gray-900 relative">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <span className="text-green-600 dark:text-green-400 font-bold uppercase tracking-widest text-sm">Test Your Knowledge</span>
            <h2 className="text-3xl md:text-4xl font-display font-extrabold mt-2 text-gray-900 dark:text-white">Eco-Trivia Hub</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-3">Play our trivia game every 3 hours to earn extra Eco-Credits. Learn about smart sorting, sustainability, and more!</p>
          </div>
          <QuizCard />
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="bg-gradient-to-br from-green-900 via-emerald-950 to-green-900 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('/noise.png')] mix-blend-overlay pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <AnimatedImpactSection />
        </div>
      </section>
    </div>
  );
}
