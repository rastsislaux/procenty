import React, { useState } from 'react';
import { TemplatesPage } from './TemplatesPage';
import { ComparePage } from './ComparePage';

export function DashboardPage() {
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  
  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <main className="lg:w-[75%] w-full">
        <ComparePage selectedTemplateIds={selectedForComparison} />
      </main>
      <aside className="lg:w-[25%] w-full flex flex-col min-h-0">
        <TemplatesPage 
          selectedForComparison={selectedForComparison}
          onSelectionChange={setSelectedForComparison}
        />
      </aside>
    </div>
  );
}

