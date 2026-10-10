import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from './test-utils';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Navigation and Basic Flows', () => {
    it('renders main interface with all sections', () => {
      render(<App />);
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByText(/notes/i)).toBeInTheDocument();
    });

    it('creates new note and displays it', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const newNoteButton = screen.getByRole('button', { name: /new note/i });
      await user.click(newNoteButton);
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });

    it('searches and filters notes', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'test query');
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('test query');
      });
    });

    it('toggles focus mode', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const focusButton = screen.getByRole('button', { name: /focus/i });
      await user.click(focusButton);
      
      await waitFor(() => {
        expect(focusButton).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Note Operations', () => {
    it('selects note and displays content', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const noteItem = screen.getAllByRole('listitem')[0];
      await user.click(noteItem);
      
      await waitFor(() => {
        expect(noteItem).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('persists notes to localStorage', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const newNoteButton = screen.getByRole('button', { name: /new note/i });
      await user.click(newNoteButton);
      
      await waitFor(() => {
        const stored = localStorage.getItem('notes');
        expect(stored).toBeTruthy();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('handles keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      await user.keyboard('{Control>}n{/Control}');
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument();
      });
    });
  });
});
