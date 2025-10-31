import React, { useMemo, useState } from 'react';
import { Template, PRECONFIGURED_TEMPLATES } from '../../config/loan-templates';
import { loadTemplates, removeUserTemplate, upsertUserTemplate } from '../state/templatesStore';
import { Dialog } from '@headlessui/react';
import { TemplateForm } from '../components/TemplateForm';
import { IconButton } from '../components/IconButton';
import { useI18n } from '../../i18n/context';
import { getTemplateName, getTemplateDescription } from '../../i18n/utils';
import { TemplateConditionsModal } from '../components/TemplateConditionsModal';

export function TemplatesPage({ 
  selectedForComparison, 
  onSelectionChange 
}: { 
  selectedForComparison: string[]; 
  onSelectionChange: (ids: string[]) => void;
}) {
  const { t, language } = useI18n();
  const [state, setState] = useState(loadTemplates());
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [conditionsModalOpen, setConditionsModalOpen] = useState(false);
  const [selectedTemplateForConditions, setSelectedTemplateForConditions] = useState<Template | null>(null);
  
  function toggleSelection(id: string) {
    if (selectedForComparison.includes(id)) {
      onSelectionChange(selectedForComparison.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedForComparison, id]);
    }
  }

  function startCreate() {
    const id = `user-${Date.now()}`;
    setEditing({ id, name: '', currency: 'USD', allowFirstPayment: true, prepaymentsAllowed: true });
    setOpen(true);
  }

  function startEdit(t: Template) {
    setEditing({ ...t });
    setOpen(true);
  }

  function save(t: Template) {
    const next = upsertUserTemplate(state.user, t);
    setState({ ...state, user: next });
    setOpen(false);
  }

  function remove(id: string) {
    const next = removeUserTemplate(state.user, id);
    setState({ ...state, user: next });
  }

  const filteredUser = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.user;
    return state.user.filter((tpl) => {
      const name = getTemplateName(tpl, language as any) || tpl.id;
      return name.toLowerCase().includes(q);
    });
  }, [state.user, query, language]);

  const filteredPreconfigured = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return state.preconfigured;
    return state.preconfigured.filter((tpl) => {
      const name = getTemplateName(tpl, language as any) || tpl.id;
      return name.toLowerCase().includes(q);
    });
  }, [state.preconfigured, query, language]);

  return (
    <div className="space-y-5 flex-1 overflow-y-auto overflow-x-hidden pr-2 min-h-0">
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.templates.searchPlaceholder}
          className="input-base"
        />
      </div>
      <section>
        <div className="flex items-center justify-between mb-3 min-w-0">
          <h2 className="text-base font-semibold text-neutral-900 min-w-0 truncate">{t.templates.yourTemplates}</h2>
          <IconButton label={t.templates.newTemplate} title={t.templates.newTemplate} onClick={startCreate} className="!bg-primary-600 !border-primary-600 hover:!bg-primary-700 flex-shrink-0 shadow-sm hover:shadow-md">
            <span aria-hidden className="text-lg font-semibold text-white">+</span>
          </IconButton>
        </div>
        <TemplateList 
          list={filteredUser} 
          onEdit={startEdit} 
          onDelete={remove} 
          editable={true} 
          language={language} 
          t={t}
          selectedForComparison={selectedForComparison}
          onToggleSelection={toggleSelection}
          onShowConditions={(t) => {
            setSelectedTemplateForConditions(t);
            setConditionsModalOpen(true);
          }}
        />
      </section>
      <section>
        <h2 className="text-base font-semibold text-neutral-900 mb-3">{t.templates.preconfigured}</h2>
        <TemplateList 
          list={filteredPreconfigured} 
          onEdit={() => {}} 
          editable={false} 
          language={language} 
          t={t}
          selectedForComparison={selectedForComparison}
          onToggleSelection={toggleSelection}
          onShowConditions={(t) => {
            setSelectedTemplateForConditions(t);
            setConditionsModalOpen(true);
          }}
        />
      </section>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-large">
            <Dialog.Title className="text-xl font-semibold text-neutral-900 mb-4">{editing?.id?.startsWith('user-') ? t.templates.createTemplate : t.templates.editTemplate}</Dialog.Title>
            {editing && (
              <div className="mt-4">
                <TemplateForm value={editing} onChange={setEditing as any} onSubmit={() => save(editing)} />
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      <TemplateConditionsModal
        template={selectedTemplateForConditions}
        isOpen={conditionsModalOpen}
        onClose={() => {
          setConditionsModalOpen(false);
          setSelectedTemplateForConditions(null);
        }}
      />
    </div>
  );
}

function TemplateList({ 
  list, 
  onEdit, 
  onDelete, 
  editable, 
  language, 
  t,
  selectedForComparison,
  onToggleSelection,
  onShowConditions
}: { 
  list: Template[]; 
  onEdit: (t: Template) => void; 
  onDelete?: (id: string) => void; 
  editable: boolean;
  language: string;
  t: any;
  selectedForComparison: string[];
  onToggleSelection: (id: string) => void;
  onShowConditions?: (t: Template) => void;
}) {
  if (list.length === 0) return <div className="text-sm text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3">{t.templates.noTemplates}</div>;
  return (
    <div className="grid grid-cols-1 gap-3">
      {list.map((template) => (
        <div key={template.id} className={`card-base p-4 min-w-0 transition-all duration-200 ${selectedForComparison.includes(template.id) ? 'bg-primary-50 border-primary-300 border-l-4 border-l-primary-500 shadow-card-hover' : 'hover:shadow-card-hover'}`}>
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-neutral-900 break-words">{getTemplateName(template, language as any) || template.id}</div>
              <div className="text-xs text-neutral-600 break-words mt-1">{getTemplateDescription(template, language as any)}</div>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={selectedForComparison.includes(template.id)}
                onChange={() => onToggleSelection(template.id)}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500 focus:ring-2"
              />
              <span className="text-xs text-neutral-600 whitespace-nowrap hidden sm:inline font-medium">{t.compare.title}</span>
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {onShowConditions && (
              <button 
                onClick={() => onShowConditions(template)}
                className="px-3 py-1.5 rounded-lg border border-primary-300 bg-primary-50 text-xs font-medium text-primary-700 whitespace-nowrap shadow-soft hover:bg-primary-100 hover:shadow-medium transition-all duration-200"
              >
                {language === 'ru' ? 'Условия кредита' : language === 'be' ? 'Умовы крэдыта' : 'Loan Terms'}
              </button>
            )}
            {editable ? (
              <>
                <button className="px-3 py-1.5 rounded-lg border border-neutral-300 bg-white text-xs font-medium text-neutral-700 whitespace-nowrap shadow-soft hover:bg-neutral-50 hover:shadow-medium transition-all duration-200" onClick={() => onEdit(template)}>{t.common.edit}</button>
                {onDelete && <button className="px-3 py-1.5 rounded-lg border border-red-300 bg-white text-xs font-medium text-red-700 whitespace-nowrap shadow-soft hover:bg-red-50 hover:shadow-medium transition-all duration-200" onClick={() => onDelete(template.id)}>{t.common.delete}</button>}
              </>
            ) : <></>}
          </div>
        </div>
      ))}
    </div>
  );
}

