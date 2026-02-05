'use client';

import {
  Plus,
  X,
  Search,
  Moon,
  Sun,
  Keyboard,
  Layout,
  LayoutTemplate,
  Grid,
  RotateCcw,
  ArrowUpDown,
  Filter,
  Download,
  Bell,
  BellOff,
  LogIn,
  LogOut,
  Share2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { BoardHeaderProps } from '@/types';

import { useState } from 'react';

import { BOARD_TEMPLATES } from '../../hooks/useBoard';

export function BoardHeader({
  currentBoard,
  boardList,
  view,
  sortBy,
  sortOrder,
  filterLabel,
  filterMember,
  searchQuery,
  isCompact,
  notificationsEnabled,
  user,
  showActivity,
  onSwitchBoard,
  onCreateBoard,
  onDeleteBoard,
  onDuplicateBoard,
  onSetView,
  onSetSortBy,
  onSetSortOrder,
  onSetFilterLabel,
  onSetFilterMember,
  onSetSearchQuery,
  onToggleCompact,
  onToggleNotifications,
  onRequestNotificationPermission,
  onExportBoard,
  onToggleActivity,
  onShowShortcuts,
  onOpenTemplates,
  onOpenShare,
  onSignIn,
  onSignOut,
  onUndo,
  onRedo,
  historyIndex,
  boardHistoryLength,
}: BoardHeaderProps) {
  const [showBoardDropdown, setShowBoardDropdown] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState<string | null>(null);

  const MEMBER_SUGGESTIONS = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
  const LABEL_COLORS = [
    { name: 'Red' },
    { name: 'Orange' },
    { name: 'Yellow' },
    { name: 'Green' },
    { name: 'Blue' },
    { name: 'Purple' },
  ];

  return (
    <header className="border-b p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Trello Clone</h1>

        {/* Board Switcher */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBoardDropdown(!showBoardDropdown)}
            className="gap-1"
          >
            <Layout className="h-4 w-4" />
            {currentBoard?.name || 'Select Board'}
          </Button>
          {showBoardDropdown && (
            <div className="absolute left-0 top-full mt-1 bg-background border rounded-lg shadow-lg z-50 min-w-48">
              <div className="p-2 border-b">
                <span className="text-sm font-medium text-muted-foreground">Boards</span>
              </div>
              {boardList.boards.map(board => (
                <button
                  key={board.id}
                  onClick={() => {
                    onSwitchBoard(board.id);
                    setShowBoardDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-muted ${
                    board.id === boardList.currentBoardId ? 'bg-primary/10 font-medium' : ''
                  }`}
                >
                  {board.name}
                  {board.id === boardList.currentBoardId && ' (current)'}
                </button>
              ))}
              <div className="p-2 border-t space-y-1">
                {/* Templates button */}
                {onOpenTemplates && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setShowBoardDropdown(false);
                      onOpenTemplates();
                    }}
                  >
                    <LayoutTemplate className="h-4 w-4" />
                    Browse Templates
                  </Button>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
                      <Plus className="h-4 w-4" />
                      Create Board
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Board</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Board Name</label>
                        <Input
                          id="new-board-name"
                          placeholder="My Board"
                          defaultValue="New Board"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Choose a Template</label>
                        <div className="grid grid-cols-1 gap-2">
                          {BOARD_TEMPLATES.map(template => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => {
                                const nameInput = document.getElementById(
                                  'new-board-name'
                                ) as HTMLInputElement;
                                const name = nameInput?.value || 'New Board';
                                onCreateBoard(name, template.columns);
                                setShowBoardDropdown(false);
                              }}
                              className="text-left p-3 border rounded-lg hover:bg-muted transition-colors"
                            >
                              <div className="font-medium">{template.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {template.columns.join(' • ')}
                              </div>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const nameInput = document.getElementById(
                                'new-board-name'
                              ) as HTMLInputElement;
                              const name = nameInput?.value || 'New Board';
                              onCreateBoard(name);
                              setShowBoardDropdown(false);
                            }}
                            className="text-left p-3 border rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="font-medium">Blank Board</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Start with empty columns
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center bg-muted rounded-lg p-1">
          <Button
            variant={view === 'board' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSetView('board')}
            className="gap-1"
          >
            <Layout className="h-4 w-4" />
            Board
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onSetView('calendar')}
            className="gap-1"
          >
            <Grid className="h-4 w-4" />
            Calendar
          </Button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={historyIndex <= 0}
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={historyIndex >= boardHistoryLength - 1}
            title="Redo (Ctrl+Y)"
          >
            <RotateCcw className="h-4 w-4 -rotate-180" />
          </Button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={e => onSetSortBy(e.target.value as 'manual' | 'date' | 'title')}
            className="bg-transparent text-sm border rounded px-2 py-1"
          >
            <option value="manual">Manual</option>
            <option value="title">Title</option>
            <option value="date">Due Date</option>
          </select>
          <button
            onClick={() => onSetSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1 hover:bg-muted rounded"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={filterLabel}
            onChange={e => onSetFilterLabel(e.target.value)}
            className="bg-transparent text-sm border rounded px-2 py-1"
          >
            <option value="">All Labels</option>
            {LABEL_COLORS.map(label => (
              <option key={label.name} value={label.name}>
                {label.name}
              </option>
            ))}
          </select>
          <select
            value={filterMember}
            onChange={e => onSetFilterMember(e.target.value)}
            className="bg-transparent text-sm border rounded px-2 py-1"
          >
            <option value="">All Members</option>
            {MEMBER_SUGGESTIONS.map(member => (
              <option key={member} value={member}>
                {member}
              </option>
            ))}
          </select>
          {(filterLabel || filterMember) && (
            <button
              onClick={() => {
                onSetFilterLabel('');
                onSetFilterMember('');
              }}
              className="p-1 hover:bg-muted rounded"
              title="Clear filters"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search-input"
            placeholder="Search cards..."
            className="pl-8 w-48"
            value={searchQuery}
            onChange={e => onSetSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSetSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Shortcuts help */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onShowShortcuts}
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="h-5 w-5" />
        </Button>

        {/* Compact view toggle */}
        <Button
          variant={isCompact ? 'default' : 'ghost'}
          size="icon"
          onClick={onToggleCompact}
          title={isCompact ? 'Expand view' : 'Compact view'}
        >
          <Moon className="h-5 w-5" />
        </Button>

        {/* Notification bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotificationSettingsOpen(!notificationSettingsOpen)}
            title="Notification settings"
          >
            {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          </Button>
          {notificationSettingsOpen && (
            <div className="absolute right-0 top-full mt-1 bg-background border rounded-lg shadow-lg z-50 min-w-64 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Notifications</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setNotificationSettingsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {!notificationsEnabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={onRequestNotificationPermission}
                >
                  Enable Notifications
                </Button>
              ) : (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span>Remind 1 day before</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span>Remind 1 hour before</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300" />
                    <span>Alert for overdue cards</span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Auth UI */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{user.name}</span>
              <Button variant="ghost" size="icon" onClick={onSignOut} title="Sign out">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => setShowAuthDialog(true)}
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>

        {/* Dark mode toggle */}
        <Button variant="ghost" size="icon" onClick={() => {}}>
          <Sun className="h-5 w-5" />
        </Button>

        {/* Export button */}
        <Button variant="ghost" size="icon" onClick={onExportBoard} title="Export board (JSON)">
          <Download className="h-5 w-5" />
        </Button>

        {/* Activity Log toggle */}
        <Button
          variant={showActivity ? 'default' : 'ghost'}
          size="icon"
          onClick={onToggleActivity}
          title="Activity Log"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        {/* Share button */}
        {onOpenShare && (
          <Button variant="outline" size="sm" onClick={onOpenShare} className="gap-1">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        )}
      </div>
    </header>
  );
}
