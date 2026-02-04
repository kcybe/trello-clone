# Card Cover Images

Add visual cover images to cards for better visual distinction.

## Overview

Users can add cover images to cards from Unsplash or upload their own.

## User Stories

- As a user, I want to add a cover image from Unsplash
- As a user, I want to upload my own image
- As a user, I want to remove the cover image
- As a user, I want to choose cover size (small, medium, large)

## Data Model

```typescript
interface CardCover {
  id: string;
  cardId: string;
  imageUrl: string;
  source: 'upload' | 'unsplash';
  size: 'small' | 'medium' | 'large';
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/cards/:id/cover` | Add cover |
| DELETE | `/api/cards/:id/cover` | Remove cover |
| PUT | `/api/cards/:id/cover` | Update cover settings |

## UI Components

1. `CoverSelector` - Unsplash integration
2. `CoverUploader` - File upload
3. `CoverDisplay` - Render cover on card
4. `CoverSizeToggle` - Size controls

## Implementation

### Unsplash Integration
1. Create Unsplash app (free tier)
2. Use Unsplash SDK for searching
3. Attribution required for photos

### Image Upload
1. Use existing S3/upload infrastructure
2. Validate file type (jpg, png, gif, webp)
3. Max size 5MB
4. Auto-resize to reduce storage

## Complexity: Easy
- Image upload service
- Unsplash API integration
- CSS for cover display
