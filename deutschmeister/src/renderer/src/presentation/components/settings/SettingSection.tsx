/**
 * Setting Section Component
 * Groups related settings with a title and optional description
 */

import React from 'react';

export interface SettingSectionProps {
  title: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
}

export function SettingSection({ title, description, icon, children }: SettingSectionProps) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        {icon && <span className="text-2xl">{icon}</span>}
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}