const PocketBase = require('pocketbase/cjs'); // Need PocketBase JS SDK

const POCKETBASE_URL = 'http://127.0.0.1:8090';
// You must set these to your PocketBase admin credentials to run this script
const ADMIN_EMAIL = 'admin@ecosort.ai';
const ADMIN_PASSWORD = 'your-admin-password-here';

const questions = [
  {
    question: "Your AI scanner is broken! A user tries to throw a greasy pizza box into the recycling bin. What do you do?",
    options: ["Recycle it (It's cardboard!)", "Compost it or Trash it (Grease ruins paper recycling)", "Wash the grease off with soap"],
    correct_index: 1
  },
  {
    question: "How long does it take for a standard plastic bottle to decompose in a landfill?",
    options: ["10 years", "50 years", "450 years", "Never"],
    correct_index: 2
  },
  {
    question: "Which of these materials is infinitely recyclable without losing quality?",
    options: ["Plastic", "Paper", "Aluminum", "Wood"],
    correct_index: 2
  },
  {
    question: "You have a coffee cup from a famous chain. Can you throw it in the normal paper recycling bin?",
    options: ["Yes, it's paper.", "No, it's lined with plastic.", "Only if you wash it first."],
    correct_index: 1
  },
  {
    question: "What is 'Wish-cycling'?",
    options: ["Riding a bike instead of driving", "Throwing something in the recycling bin hoping it's recyclable", "A new type of wind turbine"],
    correct_index: 1
  },
  {
    question: "What should you do with plastic grocery bags?",
    options: ["Put them in the standard blue bin", "Take them to a store drop-off location", "Bury them in the garden", "Burn them"],
    correct_index: 1
  },
  {
    question: "Which of these uses the most water to produce?",
    options: ["1 cotton t-shirt", "1 loaf of bread", "1 plastic bottle", "1 glass of wine"],
    correct_index: 0
  },
  {
    question: "Recycling 1 ton of paper saves how many trees?",
    options: ["5", "17", "50", "100"],
    correct_index: 1
  },
  {
    question: "What happens if a recycling batch is too contaminated with non-recyclables?",
    options: ["It gets cleaned by hand", "The whole batch gets sent to a landfill", "It's melted down anyway"],
    correct_index: 1
  },
  {
    question: "What is the primary cause of ocean microplastics?",
    options: ["Plastic straws", "Fishing nets", "Synthetic textiles (washing clothes) and tire wear", "Glass bottles breaking"],
    correct_index: 2
  }
];

async function seed() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  EcoSort AI — Seeding Trivia Questions');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const pb = new PocketBase(POCKETBASE_URL);
  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log(`\n✅ Authenticated as admin`);
  } catch (err) {
    console.error(`\n❌ Failed to authenticate as admin. Check credentials or ensure PB is running.`);
    process.exit(1);
  }

  let created = 0;
  for (const q of questions) {
    try {
      await pb.collection('trivia_questions').create(q);
      created++;
      console.log(`   ✓ Added: "${q.question.substring(0, 30)}..."`);
    } catch (err) {
      console.log(`   ⚠ Skipped (might exist or error): ${err.message}`);
    }
  }

  console.log(`\n✅ Successfully seeded ${created} questions!`);
}

seed().catch(console.error);
