"use client";

import React, { useState } from 'react';
import { MapPin, Mail, Phone, Heart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const galleryItems = [
  { 
    id: 1,
    title: "Community Cleanup Day", 
    author: "@sarah_eco",
    likes: 124,
    comments: 12,
    desc: "Volunteer-led cleanup and sorting event at Riverside Park.", 
    img: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=900&q=80",
    height: "h-96"
  },
  { 
    id: 2,
    title: "Sorting Facility Action", 
    author: "@tech_recycle",
    likes: 89,
    comments: 5,
    desc: "AI-assisted sorting line in action detecting PET plastics.", 
    img: "https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=900&q=80",
    height: "h-64"
  },
  { 
    id: 3,
    title: "E-waste Recovery", 
    author: "@green_circuit",
    likes: 210,
    comments: 34,
    desc: "Capturing reusable materials from electronics.", 
    img: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&w=900&q=80",
    height: "h-80"
  },
  { 
    id: 4,
    title: "Smart Drop-off Bins", 
    author: "@city_planner",
    likes: 432,
    comments: 88,
    desc: "Color-coded recycling stations deployed downtown.", 
    img: "https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=900&q=80",
    height: "h-72"
  },
  { 
    id: 5,
    title: "Ocean Plastic Segregation", 
    author: "@ocean_save",
    likes: 567,
    comments: 112,
    desc: "Manual and AI-assisted segregation for better recovery rates.", 
    img: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80",
    height: "h-96"
  },
  { 
    id: 6,
    title: "Upcycled Art", 
    author: "@creative_eco",
    likes: 890,
    comments: 45,
    desc: "Turning discarded cans into beautiful public art.", 
    img: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=900&q=80",
    height: "h-64"
  }
];

export default function GalleryContactPage() {
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen pt-20 relative z-10">
      <header className="py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl inline-block p-10 rounded-[3rem] shadow-sm border border-white/40 dark:border-gray-700/50"
          >
            <p className="uppercase tracking-widest text-xs text-green-600 dark:text-green-400 mb-3 font-bold flex items-center justify-center gap-2">
              <Heart className="w-4 h-4 fill-green-600 dark:fill-green-400" /> Community
            </p>
            <h1 className="text-5xl md:text-6xl font-display font-extrabold text-gray-900 dark:text-white tracking-tight">
              Real-world impact
            </h1>
            <p className="mt-6 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg">
              Our community captures the process from scanning to sorting. Browse field moments, facility footage, and campaigns from top recyclers.
            </p>
          </motion.div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 pb-20 w-full">
        {/* Staggered Masonry-style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[minmax(0,_auto)]">
          {galleryItems.map((item, index) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onHoverStart={() => setHoveredImage(item.id)}
              onHoverEnd={() => setHoveredImage(null)}
              className={`relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer ${item.height} w-full`}
            >
              {/* Image */}
              <motion.img 
                src={item.img} 
                alt={item.title} 
                animate={{ scale: hoveredImage === item.id ? 1.08 : 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full h-full object-cover" 
              />
              
              {/* Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              {/* Top Meta Data */}
              <div className="absolute top-4 right-4 flex gap-3">
                <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white text-sm font-medium">
                  <Heart className="w-4 h-4 fill-white" /> {item.likes}
                </div>
              </div>

              {/* Bottom Content sliding up */}
              <motion.div 
                animate={{ y: hoveredImage === item.id ? 0 : 20, opacity: hoveredImage === item.id ? 1 : 0.9 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 right-0 p-6"
              >
                <p className="text-green-300 text-sm font-bold mb-1">{item.author}</p>
                <h3 className="font-display font-bold text-2xl text-white mb-2 leading-tight">{item.title}</h3>
                
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: hoveredImage === item.id ? 'auto' : 0, opacity: hoveredImage === item.id ? 1 : 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">{item.desc}</p>
                  <div className="flex gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <MessageCircle className="w-4 h-4" /> {item.comments} comments
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 w-full border-t border-gray-200 dark:border-gray-800">
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-[3rem] p-10 shadow-sm border border-white/40 dark:border-gray-700/50">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="uppercase tracking-widest text-xs text-green-600 dark:text-green-400 mb-3 font-bold">Partnerships</p>
              <h2 className="text-4xl font-display font-bold text-gray-900 dark:text-white leading-tight">Host an event in your city.</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-6 text-lg">
                Interested in partnering, running a local challenge, or featuring EcoSort AI in your community?
                Send a note and our team will reply within two business days.
              </p>
              <div className="mt-10 space-y-4 text-gray-600 dark:text-gray-300">
                <div className="flex items-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-2xl">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-4 shrink-0">
                    <MapPin className="text-green-600 dark:text-green-400 w-5 h-5" />
                  </div>
                  <span>EcoSort AI HQ, Green District, Austin</span>
                </div>
                <div className="flex items-center p-4 bg-white/50 dark:bg-gray-900/50 rounded-2xl">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mr-4 shrink-0">
                    <Mail className="text-green-600 dark:text-green-400 w-5 h-5" />
                  </div>
                  <span>hello@ecosort.ai</span>
                </div>
              </div>
            </div>
            <form className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-organic relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
              <div className="grid gap-5">
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Full Name</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 dark:bg-gray-950 transition-all hover:border-green-300" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">Work Email</label>
                  <input type="email" required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 dark:bg-gray-950 transition-all hover:border-green-300" placeholder="jane@organization.com" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1 block">How can we help?</label>
                  <textarea rows={4} required minLength={10} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50 dark:bg-gray-950 transition-all hover:border-green-300 resize-none" placeholder="Tell us about your event..."></textarea>
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all active:scale-[0.98]">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
