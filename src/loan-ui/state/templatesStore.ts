import { PRECONFIGURED_TEMPLATES, Template, USER_TEMPLATES_STORAGE_KEY } from '../../config/loan-templates';

export type TemplatesState = {
  preconfigured: Template[];
  user: Template[];
  dynamic: Template[]; // Templates loaded from bank APIs
};

const DYNAMIC_TEMPLATES_STORAGE_KEY = 'procenty.dynamicTemplates.v1';

export function loadTemplates(): TemplatesState {
  let user: Template[] = [];
  try {
    const raw = localStorage.getItem(USER_TEMPLATES_STORAGE_KEY);
    if (raw) user = JSON.parse(raw);
  } catch {}

  let dynamic: Template[] = [];
  try {
    const raw = localStorage.getItem(DYNAMIC_TEMPLATES_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Check if cache is still valid (24 hours)
      if (data.timestamp && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        dynamic = data.templates || [];
      }
    }
  } catch {}

  return { preconfigured: PRECONFIGURED_TEMPLATES, user, dynamic };
}

export function saveDynamicTemplates(templates: Template[]): void {
  try {
    localStorage.setItem(DYNAMIC_TEMPLATES_STORAGE_KEY, JSON.stringify({
      templates,
      timestamp: Date.now(),
    }));
  } catch {}
}

/**
 * Load templates from bank APIs and update state
 */
export async function refreshDynamicTemplates(): Promise<{ templates: Template[]; errors: string[] }> {
  const { initializeAdapters, getAllAdapters } = await import('../../config/bank-adapters');
  
  // Initialize adapters if not already done
  initializeAdapters();
  
  const adapters = getAllAdapters();
  const allTemplates: Template[] = [];
  const allErrors: string[] = [];

  // Fetch from all adapters in parallel
  const results = await Promise.allSettled(
    adapters.map(adapter => adapter.fetchTemplates({ forceRefresh: true }))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allTemplates.push(...result.value.templates);
      allErrors.push(...result.value.errors);
    } else {
      allErrors.push(result.reason?.message || 'Unknown error fetching templates');
    }
  }

  // Save to localStorage
  if (allTemplates.length > 0) {
    saveDynamicTemplates(allTemplates);
  }

  return { templates: allTemplates, errors: allErrors };
}

export function saveUserTemplates(user: Template[]): void {
  localStorage.setItem(USER_TEMPLATES_STORAGE_KEY, JSON.stringify(user));
}

export function upsertUserTemplate(user: Template[], tpl: Template): Template[] {
  const idx = user.findIndex(t => t.id === tpl.id);
  const next = [...user];
  if (idx >= 0) next[idx] = tpl; else next.push(tpl);
  saveUserTemplates(next);
  return next;
}

export function removeUserTemplate(user: Template[], id: string): Template[] {
  const next = user.filter(t => t.id !== id);
  saveUserTemplates(next);
  return next;
}

