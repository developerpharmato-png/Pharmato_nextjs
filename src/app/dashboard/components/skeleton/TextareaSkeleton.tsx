import React from "react";

const TextareaSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="w-full animate-pulse">
    <div className="h-4 bg-gray-200 rounded mb-2 w-1/3" /> {/* label skeleton */}
    <div
      className="bg-gray-200 rounded-md mb-2"
      style={{ height: `${rows * 1.5}rem` }}
    />
    <div className="mt-2 flex items-center justify-between text-xs">
      <div className="h-3 bg-gray-200 rounded w-1/6" />
      <div className="h-3 bg-gray-200 rounded w-1/12" />
    </div>
  </div>
);

export default TextareaSkeleton;
