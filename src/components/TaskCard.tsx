import { Calendar, Clock, AlertCircle } from "lucide-react";

type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string | number | Date;
  due_date?: string | number | Date;
  date?: string | number | Date;
};

type Props = {
  task: Task;
  onToggle?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function formatDueDate(dueDate: string | number | Date): string {
  const date = new Date(dueDate);
  const months = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function isOverdue(dueDate: string | number | Date): boolean {
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function isDueToday(dueDate: string | number | Date): boolean {
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date.getTime() === today.getTime();
}

export default function TaskCard({ task, onToggle, onDelete }: Props) {
  const dueDate = task.dueDate || task.due_date || task.date;
  const overdue = dueDate && isOverdue(dueDate);
  const dueToday = dueDate && isDueToday(dueDate);

  const handleToggle = () => {
    if (onToggle) {
      onToggle(task.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(task.id);
    }
  };

  return (
    <div
      className="task-card"
      onClick={handleToggle}
      style={{
        backgroundColor: "var(--surface-2)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-4)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        border: "1px solid var(--surface-3)",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "var(--surface-3)";
        e.currentTarget.style.borderColor = "var(--accent)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "var(--surface-2)";
        e.currentTarget.style.borderColor = "var(--surface-3)";
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: "var(--space-3)",
          alignItems: "start",
        }}
      >
        {/* Checkbox */}
        <div
          style={{
            marginTop: "2px",
          }}
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            style={{
              width: "18px",
              height: "18px",
              cursor: "pointer",
              accentColor: "var(--accent)",
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            display: "grid",
            gap: "var(--space-2)",
          }}
        >
          <div
            style={{
              fontSize: "var(--text-base)",
              color: task.completed ? "var(--text-muted)" : "var(--text-primary)",
              textDecoration: task.completed ? "line-through" : "none",
              lineHeight: 1.5,
            }}
          >
            {task.title}
          </div>

          {task.description && (
            <div
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {task.description}
            </div>
          )}

          {/* Due date badge */}
          {dueDate && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-1) var(--space-3)",
                borderRadius: "999px",
                fontSize: "var(--text-xs)",
                fontWeight: 500,
                width: "fit-content",
                backgroundColor: overdue
                  ? "rgba(239, 68, 68, 0.1)"
                  : dueToday
                  ? "rgba(251, 191, 36, 0.1)"
                  : "var(--surface-3)",
                color: overdue
                  ? "#ef4444"
                  : dueToday
                  ? "#fbbf24"
                  : "var(--text-secondary)",
                border: overdue
                  ? "1px solid rgba(239, 68, 68, 0.3)"
                  : dueToday
                  ? "1px solid rgba(251, 191, 36, 0.3)"
                  : "1px solid var(--surface-4)",
              }}
            >
              {overdue ? (
                <AlertCircle size={12} />
              ) : dueToday ? (
                <Clock size={12} />
              ) : (
                <Calendar size={12} />
              )}
              <span>
                {overdue && "Gecikmiş · "}
                {dueToday && "Bugün · "}
                {formatDueDate(dueDate)}
              </span>
            </div>
          )}
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={handleDelete}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border: "none",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--surface-4)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
