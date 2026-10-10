import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import NoteEditor from './NoteEditor';
import type { Note } from '../types';

const mockNote: Note = {
  id: '1',
  title: 'Test Note',
  content: 'This is test content',
  tags: ['work', 'important'],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  isPinned: false,
  isTrashed: false
};

const mockEmptyNote: Note = {
  id: '2',
  title: '',
  content: '',
  tags: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  isPinned: false,
  isTrashed: false
};

describe('NoteEditor', () => {
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnPin = vi.fn();
  const mockOnAddTag = vi.fn();
  const mockOnRemoveTag = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders note content correctly', () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument();
      expect(screen.getByText('This is test content')).toBeInTheDocument();
    });

    it('renders empty note for new creation', () => {
      render(
        <NoteEditor
          note={mockEmptyNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const titleInput = screen.getByPlaceholderText(/title/i);
      expect(titleInput).toHaveValue('');
    });

    it('displays existing tags', () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      expect(screen.getByText('work')).toBeInTheDocument();
      expect(screen.getByText('important')).toBeInTheDocument();
    });
  });

  describe('Text Editing', () => {
    it('updates title on input change', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const titleInput = screen.getByDisplayValue('Test Note');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Updated Title' })
        );
      });
    });

    it('updates content on textarea change', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const contentArea = screen.getByText('This is test content');
      fireEvent.input(contentArea, { target: { textContent: 'New content' } });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Formatting Toolbar', () => {
    it('applies bold formatting when button clicked', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const boldButton = screen.getByRole('button', { name: /bold/i });
      fireEvent.click(boldButton);

      await waitFor(() => {
        expect(boldButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('applies italic formatting', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const italicButton = screen.getByRole('button', { name: /italic/i });
      fireEvent.click(italicButton);

      await waitFor(() => {
        expect(italicButton).toHaveAttribute('aria-pressed', 'true');
      });
    });

    it('toggles formatting off when clicked again', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const boldButton = screen.getByRole('button', { name: /bold/i });
      fireEvent.click(boldButton);
      fireEvent.click(boldButton);

      await waitFor(() => {
        expect(boldButton).toHaveAttribute('aria-pressed', 'false');
      });
    });
  });

  describe('Tag Management', () => {
    it('adds new tag when entered', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const tagInput = screen.getByPlaceholderText(/add tag/i);
      fireEvent.change(tagInput, { target: { value: 'urgent' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockOnAddTag).toHaveBeenCalledWith('1', 'urgent');
      });
    });

    it('removes tag when delete button clicked', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const removeButtons = screen.getAllByRole('button', { name: /remove tag/i });
      fireEvent.click(removeButtons[0]);

      await waitFor(() => {
        expect(mockOnRemoveTag).toHaveBeenCalledWith('1', 'work');
      });
    });

    it('prevents duplicate tags', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const tagInput = screen.getByPlaceholderText(/add tag/i);
      fireEvent.change(tagInput, { target: { value: 'work' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      expect(mockOnAddTag).not.toHaveBeenCalled();
    });
  });

  describe('Note Actions', () => {
    it('pins note when pin button clicked', () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const pinButton = screen.getByRole('button', { name: /pin/i });
      fireEvent.click(pinButton);

      expect(mockOnPin).toHaveBeenCalledWith('1');
    });

    it('deletes note when delete button clicked', () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('Focus Mode', () => {
    it('enters focus mode when toggle clicked', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const focusButton = screen.getByRole('button', { name: /focus/i });
      fireEvent.click(focusButton);

      await waitFor(() => {
        expect(screen.getByTestId('editor-container')).toHaveClass('focus-mode');
      });
    });

    it('exits focus mode on escape key', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const focusButton = screen.getByRole('button', { name: /focus/i });
      fireEvent.click(focusButton);
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.getByTestId('editor-container')).not.toHaveClass('focus-mode');
      });
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('saves note on Ctrl+S', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      fireEvent.keyDown(document, { key: 's', ctrlKey: true });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });

    it('applies bold on Ctrl+B', async () => {
      render(
        <NoteEditor
          note={mockNote}
          onUpdate={mockOnUpdate}
          onDelete={mockOnDelete}
          onPin={mockOnPin}
          onAddTag={mockOnAddTag}
          onRemoveTag={mockOnRemoveTag}
        />
      );

      const contentArea = screen.getByText('This is test content');
      contentArea.focus();
      fireEvent.keyDown(contentArea, { key: 'b', ctrlKey: true });

      await waitFor(() => {
        const boldButton = screen.getByRole('button', { name: /bold/i });
        expect(boldButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });
});
