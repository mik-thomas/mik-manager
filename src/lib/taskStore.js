/**
 * Work-queue tasks (rich detail). Task Builder reads/writes here; Work Queue lists these.
 */

const STORAGE_KEY = 'mik_tasks_v1';

export const TASK_DEFAULTS = {
  localOffice: '',
  assessor: '',
  eventDate: '',
  remoteSite: 'Site',
  shadowedBy: '',
};

export function loadTasks(fallbackSeed) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (fallbackSeed?.length) {
        const copy = fallbackSeed.map((t) => ({ ...t }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
        return copy;
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    if (fallbackSeed?.length) {
      const copy = fallbackSeed.map((t) => ({ ...t }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
      return copy;
    }
    return [];
  } catch {
    return fallbackSeed ? [...fallbackSeed] : [];
  }
}

export function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event('mik-tasks-updated'));
}

export function addTask(task) {
  const tasks = loadTasks();
  tasks.push(task);
  saveTasks(tasks);
}

/** Pick fields from an existing task for a new draft (Task Builder “from previous”). */
export function templateFromTask(t) {
  return {
    title: t.title || t.localOffice || 'Task',
    detail: t.detail || '',
    localOffice: t.localOffice || '',
    assessor: t.assessor || '',
    eventDate: t.eventDate || '',
    remoteSite: t.remoteSite || TASK_DEFAULTS.remoteSite,
    shadowedBy: t.shadowedBy || '',
  };
}
