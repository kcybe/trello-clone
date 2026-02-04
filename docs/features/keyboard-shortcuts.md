# Keyboard Shortcuts Expansion

Comprehensive keyboard navigation for power users.

## Overview

Enable keyboard-only navigation for common actions.

## Shortcut Categories

### Navigation
| Key | Action |
|-----|--------|
| `?` | Show keyboard shortcuts help |
| `n` | New card |
| `/` | Search cards |
| `←`/`→` | Navigate between lists |
| `↑`/`↓` | Navigate between cards |

### Card Actions
| Key | Action |
|-----|--------|
| `e` | Edit card |
| `c` | Copy card |
| `d` | Set due date |
| `l` | Assign label |
| `m` | Assign member |
| `Delete` | Archive card |

### Board Actions
| Key | Action |
|-----|--------|
| `b` | Toggle board sidebar |
| `f` | Open filter menu |
| `s` | Sort cards |
| `q` | Filter by member |

## Implementation

### Global Keyboard Listener

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === '?' && e.shiftKey) {
      e.preventDefault();
      setShowHelp(true);
    }
    // ... other shortcuts
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

## UI Components

1. `KeyboardHelpModal` - Display all shortcuts
2. `ShortcutIndicator` - Hint badge for shortcuts
3. `HotkeyListener` - Global key handler hook

## Implementation Steps

1. Create keyboard shortcuts map
2. Implement global key listener
3. Build help modal
4. Add visual hints
5. Document all shortcuts

## Complexity: Easy
- Global event handling
- Action mapping
- Help UI
