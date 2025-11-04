import { FirstPaymentConfig } from '../../loan-engine';

const APP_STATE_STORAGE_KEY = 'procenty.appState.v1';

export type PerTemplateInputs = {
  principal: string;
  rate?: number;
  term?: number;
  firstPayment?: FirstPaymentConfig;
  prepayments?: any[];
  graceReducedRatePercent?: number;
  graceMonths?: number;
};

export type AppState = {
  selectedTemplateIds: string[];
  inputs: Record<string, PerTemplateInputs>;
  collapsed: Record<string, boolean>;
  baseCurrency: string;
};

const defaultAppState: AppState = {
  selectedTemplateIds: [],
  inputs: {},
  collapsed: {},
  baseCurrency: 'USD',
};

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(APP_STATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults to handle missing fields
      return {
        ...defaultAppState,
        ...parsed,
        inputs: parsed.inputs || {},
        collapsed: parsed.collapsed || {},
      };
    }
  } catch (error) {
    console.warn('Failed to load app state from localStorage:', error);
  }
  return { ...defaultAppState };
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save app state to localStorage:', error);
  }
}

export function updateAppState(updates: Partial<AppState>): AppState {
  const current = loadAppState();
  const updated = { ...current, ...updates };
  saveAppState(updated);
  return updated;
}

