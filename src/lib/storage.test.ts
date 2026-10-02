import { describe, it, expect, beforeEach } from "vitest"
import {
  loadBoards,
  saveBoards,
  loadTasks,
  saveTasks,
  loadActiveBoardId,
  saveActiveBoardId,
  migrateData,
  STORAGE_KEYS,
  DEFAULT_BOARD_TITLE,
} from "./storage"
import type { Task, Board } from "@/types"

describe("storage & legacy migration", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("migrates legacy sprintboard.tasks.v1 to default 'İlk panom' board", () => {
    const legacyTasks: Partial<Task>[] = [
      { id: "legacy-1", title: "Eski Görev 1", status: "backlog" },
      { id: "legacy-2", title: "Eski Görev 2", status: "done", priority: "high" },
    ]
    localStorage.setItem("sprintboard.tasks.v1", JSON.stringify(legacyTasks))

    const { boards, tasks, activeBoardId } = migrateData()

    expect(boards).toHaveLength(1)
    expect(boards[0].title).toBe(DEFAULT_BOARD_TITLE)
    expect(activeBoardId).toBe(boards[0].id)
    expect(tasks).toHaveLength(2)
    expect(tasks[0].boardId).toBe(boards[0].id)
    expect(tasks[0].title).toBe("Eski Görev 1")
    expect(tasks[1].boardId).toBe(boards[0].id)
    expect(tasks[1].priority).toBe("high")
  })

  it("is idempotent and does not duplicate tasks on repeated migrations", () => {
    const legacyTasks = [{ id: "legacy-1", title: "Eski Görev 1", status: "backlog" }]
    localStorage.setItem("sprintboard.tasks.v1", JSON.stringify(legacyTasks))

    const firstRun = migrateData()
    expect(firstRun.tasks).toHaveLength(1)

    const secondRun = migrateData()
    expect(secondRun.tasks).toHaveLength(1)
    expect(secondRun.boards).toHaveLength(1)
  })

  it("isolates tasks per board", () => {
    const board1: Board = { id: "b-1", title: "Pano 1", createdAt: new Date().toISOString() }
    const board2: Board = { id: "b-2", title: "Pano 2", createdAt: new Date().toISOString() }
    const tasks: Task[] = [
      { id: "t-1", boardId: "b-1", title: "Pano 1 Görevi", status: "backlog", priority: "normal", createdAt: "" },
      { id: "t-2", boardId: "b-2", title: "Pano 2 Görevi", status: "in-progress", priority: "high", createdAt: "" },
    ]

    saveBoards([board1, board2])
    saveTasks(tasks)
    saveActiveBoardId("b-1")

    const loadedBoards = loadBoards()
    const loadedTasks = loadTasks()
    const activeId = loadActiveBoardId()

    expect(loadedBoards).toHaveLength(2)
    expect(activeId).toBe("b-1")

    const board1Tasks = loadedTasks.filter((t) => t.boardId === "b-1")
    const board2Tasks = loadedTasks.filter((t) => t.boardId === "b-2")

    expect(board1Tasks).toHaveLength(1)
    expect(board1Tasks[0].title).toBe("Pano 1 Görevi")
    expect(board2Tasks).toHaveLength(1)
    expect(board2Tasks[0].title).toBe("Pano 2 Görevi")
  })

  it("creates default board when localStorage is completely empty", () => {
    const { boards, tasks, activeBoardId } = migrateData()
    expect(boards).toHaveLength(1)
    expect(boards[0].title).toBe(DEFAULT_BOARD_TITLE)
    expect(tasks).toEqual([])
    expect(activeBoardId).toBe(boards[0].id)
  })
})
