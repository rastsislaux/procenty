import React, { useMemo, useState } from 'react';
import { Template, PRECONFIGURED_TEMPLATES } from '../../config/loan-templates';
import { loadTemplates, removeUserTemplate, upsertUserTemplate } from '../state/templatesStore';
import { Dialog, Disclosure, Switch } from '@headlessui/react';
import { TemplateForm } from '../components/TemplateForm';
import { IconButton } from '../components/IconButton';
import { useI18n } from '../../i18n/context';
import { getTemplateName, getTemplateDescription } from '../../i18n/utils';

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
    <div className="space-y-4 max-h-screen overflow-y-auto overflow-x-hidden pr-2">
      <div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.templates.searchPlaceholder}
          className="w-full rounded border px-2 py-2 text-sm"
        />
      </div>
      <section>
        <div className="flex items-center justify-between mb-2 min-w-0">
          <h2 className="font-medium min-w-0 truncate">{t.templates.yourTemplates}</h2>
          <IconButton label={t.templates.newTemplate} title={t.templates.newTemplate} onClick={startCreate} className="bg-blue-600 border-blue-600 hover:bg-blue-700 text-white flex-shrink-0">
            <span aria-hidden className="text-lg font-semibold">+</span>
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
        />
      </section>
      <section>
        <h2 className="font-medium mb-2">{t.templates.preconfigured}</h2>
        <TemplateList 
          list={filteredPreconfigured} 
          onEdit={() => {}} 
          editable={false} 
          language={language} 
          t={t}
          selectedForComparison={selectedForComparison}
          onToggleSelection={toggleSelection}
        />
      </section>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded bg-white p-4">
            <Dialog.Title className="text-lg font-medium">{editing?.id?.startsWith('user-') ? t.templates.createTemplate : t.templates.editTemplate}</Dialog.Title>
            {editing && (
              <div className="mt-4">
                <TemplateForm value={editing} onChange={setEditing as any} onSubmit={() => save(editing)} />
              </div>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
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
  onToggleSelection
}: { 
  list: Template[]; 
  onEdit: (t: Template) => void; 
  onDelete?: (id: string) => void; 
  editable: boolean;
  language: string;
  t: any;
  selectedForComparison: string[];
  onToggleSelection: (id: string) => void;
}) {
  if (list.length === 0) return <div className="text-sm text-gray-500">{t.templates.noTemplates}</div>;
  return (
    <div className="grid grid-cols-1 gap-3">
      {list.map((template) => (
        <div key={template.id} className={`rounded border p-2 min-w-0 ${selectedForComparison.includes(template.id) ? 'bg-blue-50 border-blue-300' : 'bg-white'}`}>
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm break-words">{getTemplateName(template, language as any) || template.id}</div>
              <div className="text-xs text-gray-500 break-words">{getTemplateDescription(template, language as any)}</div>
            </div>
            <label className="flex items-center gap-1 cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={selectedForComparison.includes(template.id)}
                onChange={() => onToggleSelection(template.id)}
                className="rounded border-gray-300"
              />
              <span className="text-xs text-gray-600 whitespace-nowrap hidden sm:inline">{t.compare.title}</span>
            </label>
          </div>
          <div className="mt-2">
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button className="text-xs text-blue-600">{open ? t.templates.hideConfiguration : t.templates.showConfiguration}</Disclosure.Button>
                  <Disclosure.Panel>
                    <pre className="mt-1 text-xs bg-gray-50 rounded p-1 overflow-x-auto overflow-y-auto max-h-60">{JSON.stringify(template, null, 2)}</pre>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {editable ? (
              <>
                <button className="px-2 py-1 rounded border text-xs whitespace-nowrap" onClick={() => onEdit(template)}>{t.common.edit}</button>
                {onDelete && <button className="px-2 py-1 rounded border text-xs whitespace-nowrap" onClick={() => onDelete(template.id)}>{t.common.delete}</button>}
              </>
            ) : <></>}
          </div>
        </div>
      ))}
    </div>
  );
}

