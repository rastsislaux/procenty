import { PRECONFIGURED_TEMPLATES, Template, USER_TEMPLATES_STORAGE_KEY } from '../../config/loan-templates';

export type TemplatesState = {
  preconfigured: Template[];
  user: Template[];
};

export function loadTemplates(): TemplatesState {
  let user: Template[] = [];
  try {
    const raw = localStorage.getItem(USER_TEMPLATES_STORAGE_KEY);
    if (raw) user = JSON.parse(raw);
  } catch {}
  return { preconfigured: PRECONFIGURED_TEMPLATES, user };
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

