import { useState } from 'react';
import { create } from '../api/tasks';
import styles from './TaskCreate.module.css';

const INITIAL = { title: '', description: '', status: 'todo', priority: 'medium', due_date: '' };

export default function TaskCreate({ project_id, onCreated }) {
  const [fields, setFields]           = useState(INITIAL);
  const [fieldErrors, setFieldErrors] = useState({});
  const [banner, setBanner]           = useState(null);
  const [loading, setLoading]         = useState(false);

  function set(key, value) {
    setFields((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const t = fields.title.trim();
    if (!t)             return { title: 'Title is required.' };
    if (t.length > 200) return { title: 'Title must be 200 characters or fewer.' };
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBanner(null);
    const clientErrors = validate();
    if (clientErrors) { setFieldErrors(clientErrors); return; }
    setLoading(true);
    const { data, error } = await create({ ...fields, project_id });
    setLoading(false);
    if (!error) { setFields(INITIAL); setFieldErrors({}); onCreated(data); return; }
    if (error.fields) { setFieldErrors(error.fields); }
    else { setBanner(error.message ?? 'An unexpected error occurred.'); }
  }

  return (
    <div className={styles.wrapper}>
      {banner && (
        <div className={styles.banner} role="alert">
          <span>{banner}</span>
          <button className={styles.dismiss} onClick={() => setBanner(null)} aria-label="Dismiss error">✕</button>
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="tf-title" className={styles.label}>Title <span aria-hidden="true">*</span></label>
          <input id="tf-title" type="text" value={fields.title} onChange={(e) => set('title', e.target.value)} maxLength={200} aria-describedby={fieldErrors.title ? 'tf-title-err' : undefined} aria-invalid={!!fieldErrors.title} className={`${styles.input} ${fieldErrors.title ? styles.inputError : ''}`} />
          {fieldErrors.title && <span id="tf-title-err" className={styles.fieldError} role="alert">{fieldErrors.title}</span>}
        </div>
        <div className={styles.field}>
          <label htmlFor="tf-desc" className={styles.label}>Description</label>
          <textarea id="tf-desc" value={fields.description} onChange={(e) => set('description', e.target.value)} rows={3} className={styles.textarea} />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="tf-status" className={styles.label}>Status</label>
            <select id="tf-status" value={fields.status} onChange={(e) => set('status', e.target.value)} className={styles.select}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="tf-priority" className={styles.label}>Priority</label>
            <select id="tf-priority" value={fields.priority} onChange={(e) => set('priority', e.target.value)} className={styles.select}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="tf-due" className={styles.label}>Due Date</label>
            <input id="tf-due" type="date" value={fields.due_date} onChange={(e) => set('due_date', e.target.value)} className={styles.input} />
          </div>
        </div>
        <button type="submit" disabled={loading} className={styles.submit} aria-busy={loading}>
          {loading ? 'Creating…' : 'Create Task'}
        </button>
      </form>
    </div>
  );
}
