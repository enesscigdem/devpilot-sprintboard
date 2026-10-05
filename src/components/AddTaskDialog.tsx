import { useState, useRef, useEffect } from "react";
import { X, Calendar, Plus } from "lucide-react";

declare module 'react' {
  interface StyleHTMLAttributes<T> {
    jsx?: boolean;
    global?: boolean;
  }
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: { title: string; description?: string; dueDate?: string }) => void;
};

export default function AddTaskDialog({ isOpen, onClose, onAdd }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
    });

    setTitle("");
    setDescription("");
    setDueDate("");
    onClose();
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="dialog-backdrop" onClick={handleCancel} />
      <div className="dialog-container">
        <div className="dialog-header">
          <h2>Yeni Görev</h2>
          <button
            type="button"
            className="dialog-close"
            onClick={handleCancel}
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="dialog-form">
          <div className="form-field">
            <label htmlFor="task-title">Görev Başlığı</label>
            <input
              ref={titleInputRef}
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Görev başlığı girin"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="task-description">Açıklama (isteğe bağlı)</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Görev detaylarını ekleyin"
              rows={3}
            />
          </div>

          <div className="form-field">
            <label htmlFor="task-due-date">
              <Calendar size={16} />
              Son Tarih (isteğe bağlı)
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              İptal
            </button>
            <button type="submit" className="btn-primary" disabled={!title.trim()}>
              <Plus size={18} />
              Görev Ekle
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .dialog-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(5, 7, 12, 0.8);
          backdrop-filter: blur(4px);
          z-index: 50;
        }

        .dialog-container {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(90vw, 480px);
          background: var(--surface-2, #0F131C);
          border-radius: 16px;
          box-shadow: 0 24px 48px rgba(0, 0, 0, 0.4);
          z-index: 51;
        }

        .dialog-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-5, 1.5rem) var(--space-6, 2rem);
          border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.08));
        }

        .dialog-header h2 {
          font-size: clamp(1.125rem, 1vw + 1rem, 1.25rem);
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--text-primary, #F8FAFC);
          margin: 0;
        }

        .dialog-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: var(--text-secondary, #94A3B8);
          cursor: pointer;
          transition: all 150ms ease;
        }

        .dialog-close:hover {
          background: var(--surface-3, #161D2B);
          color: var(--text-primary, #F8FAFC);
        }

        .dialog-form {
          padding: var(--space-6, 2rem);
          display: grid;
          gap: var(--space-5, 1.5rem);
        }

        .form-field {
          display: grid;
          gap: var(--space-2, 0.5rem);
        }

        .form-field label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary, #CBD5E1);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .form-field input,
        .form-field textarea {
          width: 100%;
          padding: var(--space-3, 0.75rem);
          background: var(--surface-1, #0A0D12);
          border: 1px solid var(--border, rgba(255, 255, 255, 0.08));
          border-radius: 8px;
          color: var(--text-primary, #F8FAFC);
          font-size: 0.9375rem;
          line-height: 1.5;
          transition: all 150ms ease;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          outline: none;
          border-color: var(--accent, #38BDF8);
          box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
        }

        .form-field input::placeholder,
        .form-field textarea::placeholder {
          color: var(--text-tertiary, #64748B);
        }

        .form-field textarea {
          resize: vertical;
          min-height: 72px;
          font-family: inherit;
        }

        .form-field input[type="date"] {
          cursor: pointer;
        }

        .form-field input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6);
          cursor: pointer;
        }

        .dialog-actions {
          display: flex;
          gap: var(--space-3, 0.75rem);
          margin-top: var(--space-2, 0.5rem);
        }

        .btn-primary,
        .btn-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
          border-radius: 999px;
          font-size: 0.9375rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 150ms ease;
        }

        .btn-primary {
          flex: 1;
          background: var(--accent, #38BDF8);
          color: var(--surface-1, #0A0D12);
        }

        .btn-primary:hover:not(:disabled) {
          background: #22A8E8;
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--surface-3, #161D2B);
          color: var(--text-secondary, #CBD5E1);
        }

        .btn-secondary:hover {
          background: var(--surface-4, #1E2636);
          color: var(--text-primary, #F8FAFC);
        }
      `}</style>
    </>
  );
}
