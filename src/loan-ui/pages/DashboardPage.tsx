import React, { useState } from 'react';
import { TemplatesPage } from './TemplatesPage';
import { ComparePage } from './ComparePage';

export function DashboardPage() {
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  
  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <aside className="lg:w-[25%] w-full">
        <TemplatesPage 
          selectedForComparison={selectedForComparison}
          onSelectionChange={setSelectedForComparison}
        />
      </aside>
      <main className="lg:w-[75%] w-full">
        <ComparePage selectedTemplateIds={selectedForComparison} />
      </main>
    </div>
  );
}

