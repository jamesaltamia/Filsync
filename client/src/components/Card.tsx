import React from 'react';

export const Card: React.FC<{ children: React.ReactNode; title?: string }> = ({ children, title }) => {
  return (
    <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 
      rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-5">

      {title && (
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">
          {title}
        </h2>
      )}

      {children}
    </div>
  );
};