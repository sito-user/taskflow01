import { useEffect, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';
import TaskCard from './TaskCard';
import { list } from '../api/tasks';
import styles from './TaskList.module.css';

const INITIAL = { status: 'idle', data: [], error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':   return { ...INITIAL, status: 'loading' };
    case 'FETCH_SUCCESS': return { status: 'success', data: action.payload, error: null };
    case 'FETCH_ERROR':   return { status: 'error', data: [], error: action.payload };
    default:              return state;
  }
}

function SkeletonCard() {
  return (
    <li className={styles.skeletonCard} aria-hidden="true">
      <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
      <div className={styles.skeletonBadges}>
        <div className={`${styles.skeletonLine} ${styles.skeletonBadge}`} />
        <div className={`${styles.skeletonLine} ${styles.skeletonBadge}`} />
      </div>
      <div className={`${styles.skeletonLine} ${styles.skeletonMeta}`} />
    </li>
  );
}

export default function TaskList({ projectId }) {
  const [{ status, data, error }, dispatch] = useReducer(reducer, INITIAL);

  const fetchTasks = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    const { data: tasks, error: err } = await list({ projectId });
    if (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message ?? 'Failed to load tasks.' });
    } else {
      dispatch({ type: 'FETCH_SUCCESS', payload: tasks ?? [] });
    }
  }, [projectId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  if (status === 'idle' || status === 'loading') {
    return (
      <section className={styles.container} aria-label="Loading tasks" aria-busy="true">
        <ul className={styles.list} role="list">
          {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} />)}
        </ul>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className={styles.container} aria-label="Task list error">
        <div className={styles.feedback} role="alert">
          <p className={styles.feedbackMessage}>{error}</p>
          <button type="button" className={styles.retryButton} onClick={fetchTasks} aria-label="Retry loading tasks">Retry</button>
        </div>
      </section>
    );
  }

  if (status === 'success' && data.length === 0) {
    return (
      <section className={styles.container} aria-label="Task list">
        <div className={styles.feedback}><p className={styles.feedbackMessage}>No tasks yet.</p></div>
      </section>
    );
  }

  return (
    <section className={styles.container} aria-label="Task list">
      <ul className={styles.list} role="list">
        {data.map((task) => (
          <li key={task.id} className={styles.item}><TaskCard task={task} /></li>
        ))}
      </ul>
    </section>
  );
}

TaskList.propTypes = { projectId: PropTypes.string.isRequired };
