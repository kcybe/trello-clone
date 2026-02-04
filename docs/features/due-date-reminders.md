# Due Date Reminders & Notifications

Proactive reminders for upcoming and overdue card due dates.

## Overview

Users receive notifications about upcoming and overdue card due dates through multiple channels.

## User Stories

- As a user, I want to receive email reminders 24 hours before a due date
- As a user, I want to receive in-app notifications for overdue cards
- As a user, I want to customize reminder timing (1 hour, 1 day, 3 days)
- As a user, I want to snooze reminders

## Notification Channels

1. **In-App Notifications**
   - Bell icon in header
   - Toast notifications
   - Badge on cards with approaching due dates

2. **Email Notifications**
   - Daily digest of upcoming due dates
   - Immediate notification for overdue cards
   - Configurable frequency (daily, weekly, never)

3. **Browser Notifications**
   - Push notifications if enabled
   - Requires permission grant

## Data Model

```typescript
interface DueDateReminder {
  id: string;
  cardId: string;
  userId: string;
  reminderTime: Date; // ISO 8601
  notified: boolean;
  channel: 'email' | 'in_app' | 'push';
}

interface Card {
  id: string;
  dueDate: Date | null;
  dueDateReminder?: Date;
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cards/:id/reminder` | Set reminder |
| DELETE | `/api/cards/:id/reminder` | Remove reminder |
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |

## UI Components

1. `DueDatePicker` - Date/time picker with reminder options
2. `NotificationCenter` - Dropdown with notification list
3. `ReminderSettings` - Configure default reminder times
4. `OverdueBadge` - Visual indicator for overdue cards

## Implementation Steps

### Phase 1: Core Reminders
1. Add reminder fields to Card model
2. Create notification API endpoints
3. Build notification center UI
4. Implement reminder scheduling (cron job)

### Phase 2: Email Integration
1. Set up email service (Resend/SendGrid)
2. Create email templates
3. Implement email scheduling

### Phase 3: Push Notifications
1. Add browser notification permissions
2. Implement service worker for push
3. Add notification preferences UI

## Complexity: Easy
- Database schema update
- Cron job for checking due dates
- Email service integration
