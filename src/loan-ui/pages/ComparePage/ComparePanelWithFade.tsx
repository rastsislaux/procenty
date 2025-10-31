import React, { useEffect, useState } from 'react';
import { ComparePanel } from '../../components/ComparePanel';

export function ComparePanelWithFade({ results, names }: { results: any[]; names: Record<string, string> }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className={`transition-opacity duration-[250ms] ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <ComparePanel results={results} names={names} />
    </div>
  );
}


