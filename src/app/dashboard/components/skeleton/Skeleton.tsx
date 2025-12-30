"use client";
import React from 'react';

type Props = {
  lines?: number;
  height?: string | number;
};

export default function Skeleton({ lines = 6, height = '16px' }: Props) {
  const items = Array.from({ length: lines });
  return (
    <div className="space-y-2">
      {items.map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 animate-pulse rounded"
          style={{ height: typeof height === 'number' ? `${height}px` : height }}
        />
      ))}
    </div>
  );
}
