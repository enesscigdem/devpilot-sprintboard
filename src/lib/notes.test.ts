import { describe, it, expect } from 'vitest';
import type { Note } from '@/types';

const mockNotes: Note[] = [
  { id: '1', title: 'First Note', content: 'Content one', createdAt: '2024-01-01', isPinned: false, isTrashed: false },
  { id: '2', title: 'Second Note', content: 'Content two', createdAt: '2024-01-02', isPinned: true, isTrashed: false },
  { id: '3', title: 'Archived', content: 'Old content', createdAt: '2024-01-03', isPinned: false, isTrashed: true },
];

function searchNotes(notes: Note[], query: string): Note[] {
  const lower = query.toLowerCase();
  return notes.filter(n => n.title.toLowerCase().includes(lower) || n.content.toLowerCase().includes(lower));
}

function sortNotesByDate(notes: Note[], order: 'asc' | 'desc' = 'desc'): Note[] {
  return [...notes].sort((a, b) => {
    const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return order === 'asc' ? diff : -diff;
  });
}

function filterActiveNotes(notes: Note[]): Note[] {
  return notes.filter(n => !n.isTrashed);
}

function groupByPinned(notes: Note[]): { pinned: Note[], regular: Note[] } {
  return {
    pinned: notes.filter(n => n.isPinned && !n.isTrashed),
    regular: notes.filter(n => !n.isPinned && !n.isTrashed),
  };
}

describe('searchNotes', () => {
  it('finds notes by title', () => {
    expect(searchNotes(mockNotes, 'First')).toHaveLength(1);
    expect(searchNotes(mockNotes, 'First')[0].id).toBe('1');
  });

  it('finds notes by content', () => {
    expect(searchNotes(mockNotes, 'two')).toHaveLength(1);
  });

  it('returns all notes for empty query', () => {
    expect(searchNotes(mockNotes, '')).toHaveLength(3);
  });
});

describe('sortNotesByDate', () => {
  it('sorts descending by default', () => {
    const sorted = sortNotesByDate(mockNotes);
    expect(sorted[0].id).toBe('3');
    expect(sorted[2].id).toBe('1');
  });

  it('sorts ascending when specified', () => {
    const sorted = sortNotesByDate(mockNotes, 'asc');
    expect(sorted[0].id).toBe('1');
  });
});

describe('filterActiveNotes', () => {
  it('excludes trashed notes', () => {
    const active = filterActiveNotes(mockNotes);
    expect(active).toHaveLength(2);
    expect(active.every(n => !n.isTrashed)).toBe(true);
  });
});

describe('groupByPinned', () => {
  it('separates pinned and regular notes', () => {
    const { pinned, regular } = groupByPinned(mockNotes);
    expect(pinned).toHaveLength(1);
    expect(regular).toHaveLength(1);
  });

  it('excludes trashed notes from both groups', () => {
    const { pinned, regular } = groupByPinned(mockNotes);
    expect([...pinned, ...regular].every(n => !n.isTrashed)).toBe(true);
  });
});
