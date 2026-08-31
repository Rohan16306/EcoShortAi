"use client";

import React, { useState } from 'react';
import { Gift, Coins, ShoppingBag, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MarketplacePage() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const rewards = [
    {
      id: 1,
      title: "Reusable Bamboo Cutlery Set",
      description: "Perfect for eating on the go without the plastic waste. Includes spoon, fork, knife, and chopsticks in a canvas pouch.",
      cost: 500,
      image: "https://images.unsplash.com/photo-1584346133934-a3afd2a33c4c?auto=format&fit=crop&w=600&q=80",
      inStock: true
    },
    {
      id: 2,
      title: "$10 Off Zero-Waste Grocery",
      description: "Get a $10 discount voucher for your next purchase at our partner zero-waste bulk food stores.",
      cost: 1200,
      image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80",
      inStock: true
    },
    {
      id: 3,
      title: "Stainless Steel Water Bottle",
      description: "Premium insulated water bottle that keeps your drinks cold for 24 hours or hot for 12 hours.",
      cost: 2500,
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
      inStock: false
    },
    {
      id: 4,
      title: "Organic Cotton Tote Bag",
      description: "Durable, ethically-made tote bag perfect for groceries or everyday use. 100% biodegradable.",
      cost: 300,
      image: "https://images.unsplash.com/photo-1597484661643-2f5fef640df1?auto=format&fit=crop&w=600&q=80",
      inStock: true
    },
    {
      id: 5,
      title: "EcoSort Pro Scanner Tool",
      description: "A physical smart-scanner attachment for your phone for perfect sorting accuracy in the dark.",
      cost: 5000,
      image: "https://images.unsplash.com/photo-1550009158-9efff6c97348?auto=format&fit=crop&w=600&q=80",
      inStock: true
    },
    {
      id: 6,
      title: "Recycled Ocean Plastic Sunglasses",
      description: "Stylish UV400 sunglasses made entirely from reclaimed ocean plastics.",
      cost: 1800,
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
      inStock: true
    }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mb-6 shadow-xl shadow-green-500/20">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-display font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
            Rewards Marketplace
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Redeem your hard-earned EcoCredits for exclusive discounts, eco-friendly products, and special experiences.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rewards.map((reward, i) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onHoverStart={() => setHoveredCard(reward.id)}
              onHoverEnd={() => setHoveredCard(null)}
              className={`bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl shadow-sm border border-white/50 dark:border-gray-700/50 overflow-hidden transition-all duration-500 relative group ${!reward.inStock ? 'opacity-70 grayscale-[0.5]' : 'hover:shadow-organic'}`}
            >
              {/* Image Section */}
              <div className="h-60 relative overflow-hidden">
                <motion.img 
                  src={reward.image} 
                  alt={reward.title}
                  animate={{ scale: hoveredCard === reward.id ? 1.05 : 1 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover"
                />
                
                {/* Points Badge */}
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center font-bold shadow-lg border border-white/20">
                  <Coins className="w-5 h-5 mr-1.5 text-yellow-500" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600">
                    {reward.cost}
                  </span>
                </div>

                {!reward.inStock && (
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="bg-black/80 text-white px-6 py-2 rounded-xl font-bold tracking-widest uppercase border border-white/10 shadow-xl">
                      Out of Stock
                    </div>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-6 relative">
                {/* Subtle gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-500/5 dark:to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2 relative z-10">{reward.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 relative z-10 line-clamp-2">{reward.description}</p>
                
                <button 
                  disabled={!reward.inStock} 
                  className={`w-full py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 relative z-10
                    ${reward.inStock 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 active:scale-[0.98]' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                >
                  {reward.inStock ? (
                    <>
                      <Sparkles className="w-5 h-5" /> Redeem Reward
                    </>
                  ) : (
                    'Unavailable'
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
