import { Template } from '../config/loan-templates';
import { Language } from './types';

export function getTemplateName(template: Template, language: Language): string {
  if (template.nameI18n?.[language]) {
    return template.nameI18n[language];
  }
  return template.name;
}

export function getTemplateDescription(template: Template, language: Language): string | undefined {
  if (template.descriptionI18n?.[language]) {
    return template.descriptionI18n[language];
  }
  return template.description;
}

