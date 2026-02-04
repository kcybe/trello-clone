# Export to PDF/CSV

Export board data for reporting and sharing.

## Overview

Users can export their board data in various formats for external use.

## Export Formats

1. **CSV Export**
   - One row per card
   - Columns: Title, List, Members, Labels, Due Date, Description
   - UTF-8 BOM for Excel compatibility

2. **PDF Export**
   - Print-friendly board view
   - Include card details
   - Page breaks between lists

3. **JSON Export**
   - Full board backup
   - Includes all card data

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards/:id/export/csv` | Download CSV |
| GET | `/api/boards/:id/export/pdf` | Generate PDF |
| GET | `/api/boards/:id/export/json` | Download JSON |

## Implementation

### CSV Export
```typescript
async function exportToCSV(boardId: string) {
  const cards = await fetchCards(boardId);
  const headers = ['Title', 'List', 'Members', 'Labels', 'Due Date'];
  const rows = cards.map(c => [
    c.title,
    c.list.name,
    c.members.map(m => m.username).join('; '),
    c.labels.map(l => l.name).join('; '),
    c.dueDate?.toISOString() || ''
  ]);
  
  return csvContent;
}
```

### PDF Export
- Use `react-to-print` or similar
- Create print-specific styles
- Handle page breaks

## Complexity: Easy
- Data transformation
- File download handling
- PDF generation
