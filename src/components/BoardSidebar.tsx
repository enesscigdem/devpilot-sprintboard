import { useState, type FormEvent } from "react"
import { Plus, MoreVertical, Pencil, Trash2, Kanban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import type { Board } from "@/types/board"

export type BoardSidebarProps = {
  boards: Board[]
  activeBoardId: string | null
  onSelectBoard: (id: string) => void
  onCreateBoard: (name: string) => void
  onRenameBoard: (id: string, newName: string) => void
  onDeleteBoard: (id: string) => void
  className?: string
}

export default function BoardSidebar({
  boards,
  activeBoardId,
  onSelectBoard,
  onCreateBoard,
  onRenameBoard,
  onDeleteBoard,
  className,
}: BoardSidebarProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")

  const [renameTarget, setRenameTarget] = useState<Board | null>(null)
  const [renameBoardName, setRenameBoardName] = useState("")

  const [deleteTarget, setDeleteTarget] = useState<Board | null>(null)

  function handleCreateSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = newBoardName.trim()
    if (!trimmed) return
    onCreateBoard(trimmed)
    setNewBoardName("")
    setIsCreateOpen(false)
  }

  function handleRenameSubmit(e: FormEvent) {
    e.preventDefault()
    if (!renameTarget) return
    const trimmed = renameBoardName.trim()
    if (!trimmed) return
    onRenameBoard(renameTarget.id, trimmed)
    setRenameTarget(null)
  }

  function openRenameDialog(board: Board) {
    setRenameTarget(board)
    setRenameBoardName(board.name)
  }

  return (
    <aside className={cn("flex flex-col w-full md:w-64 border-r bg-card/40 p-4 gap-4 select-none", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Kanban className="h-4 w-4" />
          Panolar ({boards.length})
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => setIsCreateOpen(true)}
          title="Yeni Pano Oluştur"
          aria-label="Yeni Pano Oluştur"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
        {boards.map((board) => {
          const isActive = board.id === activeBoardId
          return (
            <div
              key={board.id}
              className={cn(
                "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-foreground hover:bg-muted/70"
              )}
              onClick={() => onSelectBoard(board.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelectBoard(board.id)
                }
              }}
            >
              <span className="truncate pr-2 flex-1" title={board.name}>
                {board.name}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                      isActive ? "text-primary-foreground hover:bg-primary-foreground/20" : "text-muted-foreground"
                    )}
                    aria-label={`${board.name} seçenekleri`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      openRenameDialog(board)
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Yeniden Adlandır
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteTarget(board)
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Panoyu Sil
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })}
      </div>

      {/* Pano Oluşturma Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Pano Oluştur</DialogTitle>
            <DialogDescription>
              Görevlerinizi organize etmek için yeni bir proje panosu oluşturun.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <Input
              placeholder="Pano adı (örn. Mobil Uygulama, Q2 Planı)"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={!newBoardName.trim()}>
                Oluştur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pano Yeniden Adlandırma Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Panoyu Yeniden Adlandır</DialogTitle>
            <DialogDescription>
              Seçili panonun adını güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4">
            <Input
              placeholder="Pano adı"
              value={renameBoardName}
              onChange={(e) => setRenameBoardName(e.target.value)}
              autoFocus
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
                İptal
              </Button>
              <Button type="submit" disabled={!renameBoardName.trim()}>
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pano Silme Onay Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Panoyu Sil</DialogTitle>
            <DialogDescription>
              <strong>&quot;{deleteTarget?.name}&quot;</strong> panosunu silmek istediğinize emin misiniz? Bu panodaki tüm görevler de kalıcı olarak silinecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              İptal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deleteTarget) {
                  onDeleteBoard(deleteTarget.id)
                  setDeleteTarget(null)
                }
              }}
            >
              Panoyu ve Görevleri Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  )
}
