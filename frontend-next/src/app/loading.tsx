import React from 'react';

export default function Loading() {
  return (
    <div className="w-full max-w-md mx-auto p-4 space-y-6 pt-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
        <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
      </div>

      {/* Main Card Skeleton */}
      <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
      </div>

      {/* List Skeleton */}
      <div className="space-y-3 pt-4">
        <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-800 rounded-xl w-full"></div>
      </div>
    </div>
  );
}
