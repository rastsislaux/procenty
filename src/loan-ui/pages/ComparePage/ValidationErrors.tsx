import React, { useEffect, useState } from 'react';

export function ValidationErrors({ title, errors }: { title: string; errors: string[] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className={`mt-3 rounded-lg border border-red-300 bg-red-50 p-3 transition-opacity duration-[250ms] ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-xs font-semibold text-red-800 mb-2">{title}:</div>
      <ul className="list-disc list-inside text-xs text-red-700 space-y-1.5">
        {errors.map((err, idx) => (
          <li key={idx}>{err}</li>
        ))}
      </ul>
    </div>
  );
}


