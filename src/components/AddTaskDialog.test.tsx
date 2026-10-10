import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test-utils';
import AddTaskDialog from './AddTaskDialog';

describe('AddTaskDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnAdd = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnAdd.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(
      <AddTaskDialog
        isOpen={false}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <AddTaskDialog
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <AddTaskDialog
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should allow entering title and description', () => {
    render(
      <AddTaskDialog
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    const titleInput = screen.getByPlaceholderText(/title/i);
    const descriptionInput = screen.getByPlaceholderText(/description/i);

    fireEvent.change(titleInput, { target: { value: 'Test Task' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });

    expect(titleInput).toHaveValue('Test Task');
    expect(descriptionInput).toHaveValue('Test Description');
  });

  it('should call onAdd with task data when add button is clicked', async () => {
    render(
      <AddTaskDialog
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    const titleInput = screen.getByPlaceholderText(/title/i);
    const descriptionInput = screen.getByPlaceholderText(/description/i);

    fireEvent.change(titleInput, { target: { value: 'New Task' } });
    fireEvent.change(descriptionInput, { target: { value: 'Task details' } });

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledTimes(1);
    });
  });

  it('should clear inputs after successful add', async () => {
    render(
      <AddTaskDialog
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    const titleInput = screen.getByPlaceholderText(/title/i);
    const descriptionInput = screen.getByPlaceholderText(/description/i);

    fireEvent.change(titleInput, { target: { value: 'Task to clear' } });
    fireEvent.change(descriptionInput, { target: { value: 'Description to clear' } });

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(titleInput).toHaveValue('');
      expect(descriptionInput).toHaveValue('');
    });
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <AddTaskDialog
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not call onAdd when title is empty', () => {
    render(
      <AddTaskDialog
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
      />
    );

    const addButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(addButton);

    expect(mockOnAdd).not.toHaveBeenCalled();
  });
});
