/**
 * Debug utilities for inspecting templates and adapters
 * Accessible via window.Debug in browser console
 */

import { loadTemplates } from '../../loan-ui/state/templatesStore';
import { Template } from '../../config/loan-templates';

type DebugAPI = {
  /**
   * Get all templates (preconfigured, user, and dynamic)
   */
  getTemplates(): {
    preconfigured: Template[];
    user: Template[];
    dynamic: Template[];
    all: Template[];
  };

  /**
   * Get a specific template by ID
   */
  getTemplate(id: string): Template | undefined;

  /**
   * Get templates by name (partial match)
   */
  findTemplates(name: string): Template[];

  /**
   * Get adapter source code (returns URL to source file if available)
   */
  getAdapterSource(adapterName: string): Promise<string | null>;

  /**
   * Get all available adapters
   */
  getAdapters(): Promise<Array<{ bankId: string; bankName: string }>>;

  /**
   * Refresh dynamic templates
   */
  refreshDynamicTemplates(): Promise<{ templates: Template[]; errors: string[] }>;

  /**
   * Export template as JSON (for copying)
   */
  exportTemplate(id: string): string | null;

  /**
   * Export all templates as JSON
   */
  exportAllTemplates(): string;

  /**
   * Get template statistics
   */
  getStats(): {
    preconfigured: number;
    user: number;
    dynamic: number;
    total: number;
    byBank: Record<string, number>;
  };
};

async function getAdapterSource(adapterName: string): Promise<string | null> {
  try {
    const { initializeAdapters, getAllAdapters } = await import('../../config/bank-adapters');
    initializeAdapters();
    const adapters = getAllAdapters();
    const adapter = adapters.find(a => a.bankId === adapterName || a.bankName.includes(adapterName));
    
    if (!adapter) {
      console.warn(`Adapter "${adapterName}" not found. Available adapters:`, adapters.map(a => a.bankId));
      return null;
    }

    const sourcePath = `/src/config/bank-adapters/${adapter.bankId}-adapter.ts`;
    
    // Try multiple methods to get source code
    // Method 1: Direct fetch (works in Vite dev server)
    try {
      const response = await fetch(sourcePath);
      if (response.ok) {
        const source = await response.text();
        return `// Source: ${sourcePath}\n// Adapter: ${adapter.bankName} (${adapter.bankId})\n\n${source}`;
      }
    } catch (e) {
      // Continue to next method
    }

    // Method 2: Try with ?raw query (Vite raw import)
    try {
      const response = await fetch(`${sourcePath}?raw`);
      if (response.ok) {
        const source = await response.text();
        return `// Source: ${sourcePath}\n// Adapter: ${adapter.bankName} (${adapter.bankId})\n\n${source}`;
      }
    } catch (e) {
      // Continue to next method
    }

    // Fallback: Return adapter info and file path
    console.info(`Source file not accessible via HTTP. File location: ${sourcePath}`);
    console.info('You can find the source code at:', {
      path: `src/config/bank-adapters/${adapter.bankId}-adapter.ts`,
      bankId: adapter.bankId,
      bankName: adapter.bankName,
    });

    return `// Adapter: ${adapter.bankName} (${adapter.bankId})\n// Source file: src/config/bank-adapters/${adapter.bankId}-adapter.ts\n//\n// Note: Source code not accessible via HTTP in this environment.\n// Please check the file at the path above in your codebase.`;
  } catch (error) {
    console.error('Error fetching adapter source:', error);
    return null;
  }
}

async function getAdapters(): Promise<Array<{ bankId: string; bankName: string }>> {
  try {
    const { initializeAdapters, getAllAdapters } = await import('../../config/bank-adapters');
    initializeAdapters();
    const adapters = getAllAdapters();
    return adapters.map(a => ({ bankId: a.bankId, bankName: a.bankName }));
  } catch (error) {
    console.error('Error getting adapters:', error);
    return [];
  }
}

async function refreshDynamicTemplates(): Promise<{ templates: Template[]; errors: string[] }> {
  try {
    const { refreshDynamicTemplates } = await import('../../loan-ui/state/templatesStore');
    return await refreshDynamicTemplates();
  } catch (error) {
    console.error('Error refreshing templates:', error);
    return { templates: [], errors: [error instanceof Error ? error.message : String(error)] };
  }
}

function exportTemplate(id: string): string | null {
  const state = loadTemplates();
  const all = [...state.preconfigured, ...state.user, ...state.dynamic];
  const template = all.find(t => t.id === id);
  if (!template) {
    console.warn(`Template "${id}" not found`);
    return null;
  }
  return JSON.stringify(template, null, 2);
}

function exportAllTemplates(): string {
  const state = loadTemplates();
  return JSON.stringify({
    preconfigured: state.preconfigured,
    user: state.user,
    dynamic: state.dynamic,
  }, null, 2);
}

function getStats() {
  const state = loadTemplates();
  const all = [...state.preconfigured, ...state.user, ...state.dynamic];
  
  const byBank: Record<string, number> = {};
  all.forEach(template => {
    if (template.id.startsWith('belarusbank-')) {
      byBank['belarusbank'] = (byBank['belarusbank'] || 0) + 1;
    } else if (template.id.includes('belinvestbank')) {
      byBank['belinvestbank'] = (byBank['belinvestbank'] || 0) + 1;
    } else if (template.id.includes('priorbank')) {
      byBank['priorbank'] = (byBank['priorbank'] || 0) + 1;
    } else {
      byBank['other'] = (byBank['other'] || 0) + 1;
    }
  });

  return {
    preconfigured: state.preconfigured.length,
    user: state.user.length,
    dynamic: state.dynamic.length,
    total: all.length,
    byBank,
  };
}

export const Debug: DebugAPI = {
  getTemplates() {
    const state = loadTemplates();
    return {
      preconfigured: state.preconfigured,
      user: state.user,
      dynamic: state.dynamic,
      all: [...state.preconfigured, ...state.user, ...state.dynamic],
    };
  },

  getTemplate(id: string) {
    const state = loadTemplates();
    const all = [...state.preconfigured, ...state.user, ...state.dynamic];
    return all.find(t => t.id === id);
  },

  findTemplates(name: string) {
    const state = loadTemplates();
    const all = [...state.preconfigured, ...state.user, ...state.dynamic];
    const searchName = name.toLowerCase();
    return all.filter(t => 
      t.name.toLowerCase().includes(searchName) ||
      t.id.toLowerCase().includes(searchName) ||
      t.description?.toLowerCase().includes(searchName)
    );
  },

  getAdapterSource,
  getAdapters,
  refreshDynamicTemplates,
  exportTemplate,
  exportAllTemplates,
  getStats,
};

/**
 * Initialize debug API on window object
 * Only available in browser environment
 */
export function initDebug(): void {
  if (typeof window !== 'undefined') {
    (window as any).Debug = Debug;
    console.log('%cDebug API initialized', 'color: #4CAF50; font-weight: bold;');
    console.log('%cAvailable commands:', 'color: #2196F3; font-weight: bold;');
    console.log('  Debug.getTemplates() - Get all templates');
    console.log('  Debug.getTemplate(id) - Get template by ID');
    console.log('  Debug.findTemplates(name) - Search templates by name');
    console.log('  Debug.getAdapterSource(adapterName) - Get adapter source code');
    console.log('  Debug.getAdapters() - Get all adapters');
    console.log('  Debug.refreshDynamicTemplates() - Refresh dynamic templates');
    console.log('  Debug.exportTemplate(id) - Export template as JSON');
    console.log('  Debug.exportAllTemplates() - Export all templates as JSON');
    console.log('  Debug.getStats() - Get template statistics');
    console.log('%cExample: Debug.getTemplates().all', 'color: #FF9800;');
  }
}

