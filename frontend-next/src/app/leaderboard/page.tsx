'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Trophy, Medal, Award } from 'lucide-react';
import { LeaderboardService, LeaderboardEntry } from '@/services/leaderboardService';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await LeaderboardService.getLeaderboard(10);
        setLeaderboard(data);
      } catch (err) {
        setError('Could not load leaderboard. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'font-bold text-green-700';
    if (rank <= 3) return 'font-bold text-gray-800 dark:text-gray-200';
    return 'font-bold text-gray-700 dark:text-gray-300';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500 inline mr-2" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400 inline mr-2" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600 inline mr-2" />;
    return null;
  };

  return (
    <div className="pt-24 pb-12 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="max-w-7xl mx-auto px-6 text-center mb-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md inline-block p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="uppercase tracking-widest text-xs text-green-600 dark:text-green-400 mb-3 font-bold">Community</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">Leaderboard</h1>
          <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Top contributors keep the ecosystem moving. Earn points by scanning, sharing verified recycling actions,
            and completing weekly challenges.
          </p>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Top 10 This Month</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {isLoading ? 'Loading...' : `Updated ${new Date().toLocaleDateString()}`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-800 dark:text-gray-200 uppercase font-semibold text-xs border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4">Rank</th>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Points</th>
                    <th className="px-6 py-4">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {isLoading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400">Loading leaderboard...</td>
                    </tr>
                  )}
                  {!isLoading && error && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-red-500">{error}</td>
                    </tr>
                  )}
                  {!isLoading && !error && leaderboard.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-gray-400">No leaderboard data yet. Start scanning to appear here.</td>
                    </tr>
                  )}
                  {!isLoading && !error && leaderboard.map((row) => (
                    <tr key={row.id} className={`${row.rank === 1 ? 'bg-green-50/60 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'} transition-colors`}>
                      <td className={`px-6 py-4 ${getRankClass(row.rank)}`}>
                        {getRankIcon(row.rank)}
                        {row.rank}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                        {row.avatar ? (
                          <img src={row.avatar} alt={row.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-700 dark:text-green-300 font-bold text-xs">
                            {row.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {row.name}
                      </td>
                      <td className="px-6 py-4 text-green-600 dark:text-green-400 font-bold">
                        {new Intl.NumberFormat().format(row.total_points)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 py-1 px-2 rounded-lg text-xs font-bold">
                          🔥 {row.current_streak} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">How to earn points</h3>
              <ul className="space-y-3 text-gray-600 dark:text-gray-300 text-sm">
                <li className="flex gap-3 items-start"><span className="h-2 w-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span><span>+10 points for every verified scan.</span></li>
                <li className="flex gap-3 items-start"><span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span><span>+50 points for weekly challenges.</span></li>
                <li className="flex gap-3 items-start"><span className="h-2 w-2 rounded-full bg-yellow-500 mt-1.5 flex-shrink-0"></span><span>+100 points for hosting community events.</span></li>
                <li className="flex gap-3 items-start"><span className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span><span>Bonus points for clean streaks.</span></li>
              </ul>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Weekly Challenge</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Scan 30 aluminum cans and log a facility drop-off to earn a bonus badge.</p>
              <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 rounded-xl p-4">
                <p className="text-xs uppercase text-green-700 dark:text-green-500 font-semibold">Time left</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">4 days</p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Spotlight Team</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Eastside High School logged 2,400 scans in a single month.</p>
              <Link href="/impact" className="inline-flex items-center mt-4 text-green-600 dark:text-green-400 font-semibold hover:text-green-700 dark:hover:text-green-300 transition-colors">
                See impact <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
