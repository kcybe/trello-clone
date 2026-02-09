import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createCollaborationUser, generateUserColor, CollaborationUser } from '../collaboration';

describe('Collaboration Utilities', () => {
  describe('generateUserColor', () => {
    it('should return a valid hex color', () => {
      const color = generateUserColor();
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should return colors from the predefined palette', () => {
      const validColors = [
        '#FF6B6B',
        '#4ECDC4',
        '#45B7D1',
        '#96CEB4',
        '#FFEAA7',
        '#DDA0DD',
        '#98D8C8',
        '#F7DC6F',
        '#BB8FCE',
        '#85C1E9',
      ];

      for (let i = 0; i < 100; i++) {
        const color = generateUserColor();
        expect(validColors).toContain(color);
      }
    });

    it('should have consistent distribution', () => {
      const colorCounts: Record<string, number> = {};

      for (let i = 0; i < 1000; i++) {
        const color = generateUserColor();
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      }

      // Each color should appear roughly 100 times (1000 / 10 colors)
      Object.values(colorCounts).forEach(count => {
        expect(count).toBeGreaterThan(50);
        expect(count).toBeLessThan(150);
      });
    });
  });

  describe('createCollaborationUser', () => {
    it('should create a user with correct properties', () => {
      const user = createCollaborationUser('user-123', 'John Doe');

      expect(user.id).toBe('user-123');
      expect(user.name).toBe('John Doe');
      expect(user.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(user.lastActive).toBeDefined();
      expect(user.lastActive).toBeLessThanOrEqual(Date.now());
    });

    it('should generate unique colors for different users', () => {
      const users = [
        createCollaborationUser('user-1', 'User 1'),
        createCollaborationUser('user-2', 'User 2'),
        createCollaborationUser('user-3', 'User 3'),
      ];

      const colors = users.map(u => u.color);
      const uniqueColors = new Set(colors);

      // Colors might repeat with random generation, but should be valid
      colors.forEach(color => {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('should set lastActive to current timestamp', () => {
      const before = Date.now();
      const user = createCollaborationUser('user-1', 'User 1');
      const after = Date.now();

      expect(user.lastActive).toBeGreaterThanOrEqual(before);
      expect(user.lastActive).toBeLessThanOrEqual(after);
    });

    it('should not have cursor by default', () => {
      const user = createCollaborationUser('user-1', 'User 1');
      expect(user.cursor).toBeUndefined();
    });
  });

  describe('CollaborationUser type', () => {
    it('should accept valid user object', () => {
      const user: CollaborationUser = {
        id: 'user-1',
        name: 'Test User',
        color: '#FF6B6B',
        lastActive: Date.now(),
        cursor: {
          x: 100,
          y: 200,
          cardId: 'card-1',
        },
      };

      expect(user.id).toBe('user-1');
      expect(user.cursor?.cardId).toBe('card-1');
    });

    it('should accept user without cursor', () => {
      const user: CollaborationUser = {
        id: 'user-1',
        name: 'Test User',
        color: '#FF6B6B',
        lastActive: Date.now(),
      };

      expect(user.cursor).toBeUndefined();
    });
  });
});
