'use client';

import type { AmenityCategory } from '@/lib/metro-network';
import { getAmenityConfig } from '@/lib/amenity-config';

interface AmenityBadgeProps {
  category: AmenityCategory;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  showEmoji?: boolean;
}

interface AmenityBadgeGroupProps {
  categories: AmenityCategory[];
  size?: 'xs' | 'sm' | 'md';
  maxVisible?: number;
  className?: string;
}

function uniqueCategories(categories: AmenityCategory[]): AmenityCategory[] {
  return [...new Set(categories)];
}

function sizeClass(size: 'xs' | 'sm' | 'md'): string {
  if (size === 'xs') return 'px-1.5 py-0.5 text-xs rounded-md';
  if (size === 'md') return 'px-3 py-1 text-sm font-medium rounded-full';
  return 'px-2 py-0.5 text-xs font-medium rounded-full';
}

export default function AmenityBadge({
  category,
  size = 'sm',
  showLabel,
  showEmoji = true,
}: AmenityBadgeProps) {
  const config = getAmenityConfig(category);
  const shouldShowLabel = typeof showLabel === 'boolean' ? showLabel : size !== 'xs';
  const label = size === 'md' ? config.label : config.shortLabel;

  return (
    <span
      className={`inline-flex items-center gap-1 border cursor-default ${sizeClass(size)} ${config.bgColor} ${config.textColor} ${config.borderColor}`}
      title={config.description}
      aria-label={config.label}
    >
      {showEmoji ? <span>{config.emoji}</span> : null}
      {shouldShowLabel ? <span>{label}</span> : null}
    </span>
  );
}

export function AmenityBadgeGroup({
  categories,
  size = 'sm',
  maxVisible,
  className = '',
}: AmenityBadgeGroupProps) {
  const unique = uniqueCategories(categories);

  if (unique.length === 0) {
    return null;
  }

  const visible = typeof maxVisible === 'number' && maxVisible > 0 && unique.length > maxVisible
    ? unique.slice(0, maxVisible - 1)
    : unique;

  const hiddenCount = typeof maxVisible === 'number' && maxVisible > 0 && unique.length > maxVisible
    ? unique.length - visible.length
    : 0;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`.trim()}>
      {visible.map(category => (
        <AmenityBadge key={category} category={category} size={size} />
      ))}
      {hiddenCount > 0 ? (
        <span className={`inline-flex items-center border cursor-default ${sizeClass(size)} bg-gray-100 text-gray-600 border-gray-200`}>
          +{hiddenCount} more
        </span>
      ) : null}
    </div>
  );
}
