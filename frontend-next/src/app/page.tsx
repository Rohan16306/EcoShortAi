"use client";

import Link from 'next/link';
import { Camera, Play, Globe, Recycle, Leaf } from 'lucide-react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import QuizCard from '../components/QuizCard';
import { useEffect } from 'react';

function Counter({ from, to, format, duration = 2 }: { from: number, to: number, format: (val: number) => string, duration?: number }) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => format(latest));

  useEffect(() => {
    const controls = animate(count, to, { duration, ease: "easeOut" });
    return controls.stop;
  }, []);

  return <motion.span>{rounded}</motion.span>;
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 dark:from-green-950 dark:via-emerald-900 dark:to-teal-950 pt-24 pb-20">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-400/30 dark:bg-green-500/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="inline-flex items-center bg-white/60 dark:bg-gray-800/60 backdrop-blur-md px-5 py-2.5 rounded-full mb-8 border border-white/40 dark:border-gray-700/50 shadow-sm"
          >
            <Globe className="text-green-600 dark:text-green-400 w-4 h-4 mr-2 animate-pulse" />
            <span className="text-green-800 dark:text-green-200 font-semibold text-sm tracking-wide">Join 50,000+ Eco-Warriors Worldwide</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-display font-black tracking-tight mb-8 text-gray-900 dark:text-white drop-shadow-sm"
          >
            Turn Waste Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-teal-500 dark:from-green-400 dark:to-teal-300">Worth</span>.<br />
            Save Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">Planet</span>.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="mt-6 max-w-3xl mx-auto text-xl md:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed font-medium"
          >
            Every piece of plastic you recycle saves 2.5 metric tons of CO₂ emissions. 
            Join the revolution that's already diverted <strong className="text-green-700 dark:text-green-400">40 billion waste objects</strong> from landfills using AI-powered sorting.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="mt-12 flex justify-center gap-6 flex-wrap"
          >
            <Link href="/scan" className="px-10 py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full font-bold text-lg shadow-xl shadow-green-500/30 hover:shadow-2xl hover:shadow-green-500/40 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center group">
              <Camera className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" /> Start Scanning
            </Link>
            <Link href="#impact" className="px-10 py-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full font-bold text-lg shadow-lg hover:bg-white dark:hover:bg-gray-800 hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center group">
              <Play className="w-6 h-6 mr-3 group-hover:text-green-500 transition-colors" /> Learn More
            </Link>
          </motion.div>
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
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } }
            }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">Our Collective Impact</h2>
            <p className="text-green-100 max-w-2xl mx-auto text-lg">Together, we are making a measurable difference in reducing global waste and carbon emissions.</p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
            }}
            className="grid md:grid-cols-3 gap-8 text-center"
          >
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} className="bg-white/10 backdrop-blur-md p-10 rounded-[2.5rem] border border-white/20 shadow-2xl hover:bg-white/15 transition-colors">
              <div className="text-6xl font-display font-bold text-green-400 mb-2">
                <Counter from={0} to={40} format={(v) => Math.round(v).toString() + "B+"} />
              </div>
              <div className="text-lg font-medium text-green-50 uppercase tracking-widest">Objects Diverted</div>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} className="bg-white/10 backdrop-blur-md p-10 rounded-[2.5rem] border border-white/20 shadow-2xl hover:bg-white/15 transition-colors">
              <div className="text-6xl font-display font-bold text-blue-400 mb-2">
                <Counter from={0} to={2.5} format={(v) => v.toFixed(1) + "M"} />
              </div>
              <div className="text-lg font-medium text-blue-50 uppercase tracking-widest">Tons CO₂ Saved</div>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }} className="bg-white/10 backdrop-blur-md p-10 rounded-[2.5rem] border border-white/20 shadow-2xl hover:bg-white/15 transition-colors">
              <div className="text-6xl font-display font-bold text-purple-400 mb-2">
                <Counter from={0} to={150} format={(v) => Math.round(v).toString() + "K"} />
              </div>
              <div className="text-lg font-medium text-purple-50 uppercase tracking-widest">Rewards Claimed</div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
