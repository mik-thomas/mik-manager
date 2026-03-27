import { useState, useEffect } from 'react';
import { loadTasks, saveTasks, templateFromTask, TASK_DEFAULTS } from '../lib/taskStore.js';

export default function TaskBuilder({ seedTasks }) {
  const [tasks, setTasks] = useState(() => loadTasks(seedTasks));
  const [form, setForm] = useState({
    title: '',
    detail: '',
    localOffice: '',
    assessor: '',
    eventDate: '',
    remoteSite: TASK_DEFAULTS.remoteSite,
    shadowedBy: '',
  });

  useEffect(() => {
    const sync = () => setTasks(loadTasks(seedTasks));
    window.addEventListener('mik-tasks-updated', sync);
    return () => window.removeEventListener('mik-tasks-updated', sync);
  }, [seedTasks]);

  const applyTemplate = (id) => {
    const t = tasks.find((x) => String(x.id) === String(id));
    if (!t) return;
    setForm((f) => ({ ...f, ...templateFromTask(t) }));
  };

  const handleChange = (field) => (e) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, [field]: v }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `t-${Date.now()}`;
    const row = {
      id,
      title: form.title.trim() || form.localOffice.trim() || 'Untitled task',
      detail: form.detail.trim(),
      localOffice: form.localOffice.trim(),
      assessor: form.assessor.trim(),
      eventDate: form.eventDate.trim(),
      remoteSite: form.remoteSite.trim() || TASK_DEFAULTS.remoteSite,
      shadowedBy: form.shadowedBy.trim(),
    };
    const next = [...tasks, row];
    saveTasks(next);
    setTasks(next);
    setForm({
      title: '',
      detail: '',
      localOffice: '',
      assessor: '',
      eventDate: '',
      remoteSite: TASK_DEFAULTS.remoteSite,
      shadowedBy: '',
    });
  };

  const displayName = (t) => t.title || t.localOffice || `Task ${t.id}`;

  return (
    <>
      <div className="greeting">
        <h1>Task Builder</h1>
        <p>
          Full detail lives here. The day flight screen uses quick checkboxes only — set tasks up once, then tick through
          the day.
        </p>
      </div>

      <div className="dashboard-grid task-builder-grid">
        <form className="timeline-card task-builder-form" onSubmit={handleSave}>
          <h2 className="card-title">
            <span>✏️</span> New task
          </h2>

          <label className="tb-field">
            <span>Clone from previous</span>
            <select
              className="tb-select"
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (v) applyTemplate(v);
                e.target.value = '';
              }}
            >
              <option value="">— Pick a saved task —</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {displayName(t)}
                </option>
              ))}
            </select>
          </label>

          <label className="tb-field">
            <span>Title</span>
            <input className="tb-input" value={form.title} onChange={handleChange('title')} placeholder="Short name" />
          </label>

          <label className="tb-field">
            <span>Detail</span>
            <textarea
              className="notes-area tb-textarea"
              value={form.detail}
              onChange={handleChange('detail')}
              placeholder="Everything someone needs to execute this task…"
              rows={4}
            />
          </label>

          <div className="tb-row">
            <label className="tb-field">
              <span>Office / site</span>
              <input className="tb-input" value={form.localOffice} onChange={handleChange('localOffice')} />
            </label>
            <label className="tb-field">
              <span>Assessor</span>
              <input className="tb-input" value={form.assessor} onChange={handleChange('assessor')} />
            </label>
          </div>

          <div className="tb-row">
            <label className="tb-field">
              <span>Event date</span>
              <input className="tb-input" value={form.eventDate} onChange={handleChange('eventDate')} />
            </label>
            <label className="tb-field">
              <span>Remote / site</span>
              <input className="tb-input" value={form.remoteSite} onChange={handleChange('remoteSite')} />
            </label>
          </div>

          <label className="tb-field">
            <span>Shadowed by</span>
            <input className="tb-input" value={form.shadowedBy} onChange={handleChange('shadowedBy')} />
          </label>

          <button type="submit" className="btn primary">
            Save task to queue
          </button>
        </form>

        <div className="timeline-card">
          <h2 className="card-title">
            <span>📋</span> Saved tasks ({tasks.length})
          </h2>
          <p className="settings-note">These feed the Work Queue. Edit by cloning into the form and saving a new row for now.</p>
          <ul className="tb-saved-list">
            {tasks.map((t) => (
              <li key={t.id}>
                <strong>{displayName(t)}</strong>
                {t.localOffice && <span className="tb-saved-meta">{t.localOffice}</span>}
                {t.detail && <p className="tb-saved-detail">{t.detail.slice(0, 160)}{t.detail.length > 160 ? '…' : ''}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
