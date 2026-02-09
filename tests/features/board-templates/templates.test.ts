/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { BoardTemplate, TemplateCategory } from '../../src/features/board-templates/types';

describe('Template Types', () => {
  it('should support built-in template structure', () => {
    const template: BoardTemplate = {
      id: 'builtin-1',
      name: 'Built-in Template',
      description: 'Description',
      category: 'kanban' as TemplateCategory,
      icon: '📋',
      columns: [
        { id: 'c1', name: 'Column 1' },
        { id: 'c2', name: 'Column 2' },
      ],
    };

    expect(template.columns).toBeInstanceOf(Array);
    expect(template.columns).toHaveLength(2);
  });

  it('should support database template structure with JSON columns', () => {
    const template: BoardTemplate = {
      id: 'db-1',
      name: 'Database Template',
      description: 'Description',
      category: 'scrum' as TemplateCategory,
      icon: '🏃',
      columns: JSON.stringify([
        { id: 'c1', name: 'Backlog' },
        { id: 'c2', name: 'Sprint' },
      ]),
      ownerId: 'user-123',
    };

    expect(typeof template.columns).toBe('string');
    expect(template.ownerId).toBe('user-123');

    // Should be able to parse the columns
    const parsedColumns = JSON.parse(template.columns as string);
    expect(parsedColumns).toHaveLength(2);
  });

  it('should parse template columns correctly', () => {
    const getColumns = (template: BoardTemplate) => {
      if (typeof template.columns === 'string') {
        return JSON.parse(template.columns);
      }
      return template.columns;
    };

    const builtinTemplate: BoardTemplate = {
      id: 'builtin',
      name: 'Built-in',
      description: 'Test',
      category: 'kanban',
      icon: '📋',
      columns: [{ id: 'c1', name: 'Todo' }],
    };

    const dbTemplate: BoardTemplate = {
      id: 'db',
      name: 'Database',
      description: 'Test',
      category: 'kanban',
      icon: '📋',
      columns: JSON.stringify([{ id: 'c1', name: 'Todo' }]),
    };

    expect(getColumns(builtinTemplate)).toHaveLength(1);
    expect(getColumns(dbTemplate)).toHaveLength(1);
  });
});

describe('Template Category Types', () => {
  it('should have valid category values', () => {
    const categories: TemplateCategory[] = [
      'kanban',
      'scrum',
      'bug-tracking',
      'marketing',
      'weekly-review',
    ];

    expect(categories).toHaveLength(5);
    expect(categories).toContain('kanban');
    expect(categories).toContain('scrum');
    expect(categories).toContain('bug-tracking');
  });
});

describe('Template Data Structure', () => {
  it('should create valid template object', () => {
    const template: BoardTemplate = {
      id: 'test-1',
      name: 'Test Template',
      description: 'A comprehensive test template',
      category: 'kanban',
      icon: '📋',
      columns: [
        { id: 'col-1', name: 'Backlog', color: '#6b7280' },
        { id: 'col-2', name: 'To Do', color: '#3b82f6' },
        { id: 'col-3', name: 'In Progress', color: '#f59e0b' },
        { id: 'col-4', name: 'Done', color: '#22c55e' },
      ],
      ownerId: 'user-1',
    };

    expect(template.id).toBe('test-1');
    expect(template.name).toBe('Test Template');
    expect(template.columns).toHaveLength(4);
    expect(template.columns[0]).toHaveProperty('color');
  });

  it('should handle template with optional fields', () => {
    const minimalTemplate: BoardTemplate = {
      id: 'minimal',
      name: 'Minimal',
      description: 'Minimal template',
      category: 'kanban',
      icon: '📋',
      columns: [],
    };

    expect(minimalTemplate.ownerId).toBeUndefined();
    expect(minimalTemplate.preview).toBeUndefined();
  });
});