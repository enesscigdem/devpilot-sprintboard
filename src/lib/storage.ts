export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Board {
  id: string;
  name: string;
  createdAt: string;
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppData {
  version: number;
  boards: Board[];
  tasks: Task[];
  activeBoardId: string | null;
}

const STORAGE_KEY_V2 = 'sprintboard.data.v2';
const LEGACY_TASKS_KEY = 'sprintboard.tasks.v1';
export const DEFAULT_BOARD_NAME = 'İlk panom';

function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function normalizeStatus(status: unknown): TaskStatus {
  if (status === 'in-progress' || status === 'in_progress') return 'in_progress';
  if (status === 'done') return 'done';
  return 'todo';
}

function normalizePriority(priority: unknown): TaskPriority {
  if (priority === 'high' || priority === 'Yüksek') return 'high';
  if (priority === 'low' || priority === 'Düşük') return 'low';
  return 'medium';
}

export function loadAppData(): AppData {
  if (typeof window === 'undefined') {
    return { version: 2, boards: [], tasks: [], activeBoardId: null };
  }

  try {
    const storedV2 = localStorage.getItem(STORAGE_KEY_V2);
    if (storedV2) {
      const parsed = JSON.parse(storedV2) as Partial<AppData>;
      const boards = Array.isArray(parsed.boards) ? parsed.boards : [];
      const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      const activeBoardId =
        parsed.activeBoardId && boards.some((b) => b.id === parsed.activeBoardId)
          ? parsed.activeBoardId
          : boards[0]?.id || null;

      return {
        version: 2,
        boards,
        tasks: tasks.map((task) => ({
          ...task,
          status: normalizeStatus(task.status),
          priority: normalizePriority(task.priority),
        })),
        activeBoardId,
      };
    }

    const legacyRaw = localStorage.getItem(LEGACY_TASKS_KEY);
    const defaultBoardId = generateId('board');
    const defaultBoard: Board = {
      id: defaultBoardId,
      name: DEFAULT_BOARD_NAME,
      createdAt: new Date().toISOString(),
    };

    let migratedTasks: Task[] = [];
    if (legacyRaw) {
      try {
        const legacyTasks = JSON.parse(legacyRaw);
        if (Array.isArray(legacyTasks)) {
          migratedTasks = legacyTasks.map((legacyTask: any) => ({
            id: String(legacyTask.id || generateId('task')),
            boardId: defaultBoardId,
            title: String(legacyTask.title || 'Başlıksız Görev'),
            description: legacyTask.description ? String(legacyTask.description) : '',
            status: normalizeStatus(legacyTask.status),
            priority: normalizePriority(legacyTask.priority),
            dueDate: legacyTask.dueDate ? String(legacyTask.dueDate) : undefined,
            createdAt: legacyTask.createdAt ? String(legacyTask.createdAt) : new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.error('Failed to parse legacy sprintboard.tasks.v1 data', err);
      }
    }

    const initialData: AppData = {
      version: 2,
      boards: [defaultBoard],
      tasks: migratedTasks,
      activeBoardId: defaultBoardId,
    };

    saveAppData(initialData);
    return initialData;
  } catch (error) {
    console.error('Failed to load app data from storage', error);
    return { version: 2, boards: [], tasks: [], activeBoardId: null };
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save app data to storage', error);
  }
}
