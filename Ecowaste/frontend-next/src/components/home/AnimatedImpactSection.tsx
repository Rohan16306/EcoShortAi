"use client";

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
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

export function AnimatedImpactSection() {
  return (
    <>
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
    </>
  );
}
