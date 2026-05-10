import PropTypes from 'prop-types';
import styles from './TaskCard.module.css';

const STATUS_COLOR = { todo: 'var(--color-text-secondary)', in_progress: 'var(--color-accent)', done: 'var(--color-success)' };
const PRIORITY_COLOR = { low: 'var(--color-text-secondary)', medium: 'var(--color-warning)', high: 'var(--color-error)' };
const STATUS_LABEL = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

function formatDate(raw) {
  if (!raw) return 'No due date';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return 'No due date';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
}

function Badge({ label, color, ariaLabel }) {
  return <span className={styles.badge} style={{ color, borderColor: color }} aria-label={ariaLabel}>{label}</span>;
}

Badge.propTypes = { label: PropTypes.string.isRequired, color: PropTypes.string.isRequired, ariaLabel: PropTypes.string.isRequired };

export default function TaskCard({ task, onClick }) {
  const { title, status = 'todo', priority = 'low', assigned_to, due_date } = task;
  const isClickable = typeof onClick === 'function';
const assignedLabel = assigned_to || task.created_by_name || 'Me';
  const dueDateLabel = formatDate(due_date);

  return (
    <article
  className={`${styles.card} ${isClickable ? styles.clickable : ''}`}
  data-priority={priority}
  onClick={isClickable ? onClick : undefined}
  role={isClickable ? 'button' : undefined}
  tabIndex={isClickable ? 0 : undefined}
  aria-label={`Task: ${title}. Status: ${STATUS_LABEL[status]}. Priority: ${priority}.`}
  onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick(e) : undefined}
>
      <header className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.badges}>
          <Badge label={STATUS_LABEL[status] ?? status} color={STATUS_COLOR[status] ?? 'var(--color-text-secondary)'} ariaLabel={`Status: ${STATUS_LABEL[status]}`} />
          <Badge label={priority.charAt(0).toUpperCase() + priority.slice(1)} color={PRIORITY_COLOR[priority] ?? 'var(--color-text-secondary)'} ariaLabel={`Priority: ${priority}`} />
        </div>
      </header>
      <footer className={styles.meta}>
        <span className={styles.metaItem} aria-label={`Assigned to: ${assignedLabel}`}>
          <span className={styles.metaIcon} aria-hidden="true">👤</span>{assignedLabel}
        </span>
        <span className={styles.metaItem} aria-label={`Due date: ${dueDateLabel}`}>
          <span className={styles.metaIcon} aria-hidden="true">📅</span>{dueDateLabel}
        </span>
      </footer>
    </article>
  );
}

TaskCard.propTypes = {
  task: PropTypes.shape({ id: PropTypes.string.isRequired, title: PropTypes.string.isRequired, status: PropTypes.oneOf(['todo', 'in_progress', 'done']), priority: PropTypes.oneOf(['low', 'medium', 'high']), assigned_to: PropTypes.string, due_date: PropTypes.string }).isRequired,
  onClick: PropTypes.func,
};
