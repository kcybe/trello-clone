# Deployment Errors - Trello Clone Project

## Summary
The build process failed with multiple TypeScript errors. The main categories of errors are:
1. Missing modules/dependencies
2. Type definition mismatches
3. Property access errors on typed objects
4. Test configuration issues

## Detailed Error Report

### 1. Missing Modules & Dependencies

#### Error 1.1: @radix-ui/react-checkbox not found
- **File:** `src/components/ui/checkbox.tsx`
- **Line:** 3
- **Error:** `Cannot find module '@radix-ui/react-checkbox' or its corresponding type declarations`
- **Fix:** Install the missing dependency: `npm install @radix-ui/react-checkbox`

#### Error 1.2: @/components/ui/select not found
- **File:** `src/features/card-relations/components/CardRelations.tsx`
- **Line:** 21
- **Error:** `Cannot find module '@/components/ui/select' or its corresponding type declarations`
- **Fix:** Create the missing Select component or verify the import path

#### Error 1.3: prisma/models.test.ts setup module not found
- **File:** `prisma/models.test.ts`
- **Line:** 8
- **Error:** `Cannot find module './setup' or its corresponding type declarations`
- **Fix:** Create the missing test setup file or remove the import

#### Error 1.4: socket test types not found
- **File:** `src/lib/socket/__tests__/useCollaborativeBoard.test.ts`
- **Lines:** 4, 346
- **Error:** `Cannot find module '../../types'`
- **Fix:** Create missing types file or fix import path

### 2. Type Definition Mismatches - AI Suggestions

#### Error 2.1: CardAISuggestion type inconsistency
- **File:** `src/features/ai-suggestions/types/index.ts`
- **Lines:** 21, 29
- **Error:** `Interface 'CardLabelsSuggestion'/'CardChecklistSuggestion' incorrectly extends interface 'CardAISuggestion'`
- **Details:** 
  - `CardLabelsSuggestion.suggestions` is `{ text: string; color: string; }[]` 
  - But `CardAISuggestion.suggestions` expects `string[]`
  - Similar issue with `CardChecklistSuggestion` and `{ text: string; checked: boolean; }[]`
- **Fix:** Update `CardAISuggestion` interface to use generic type or update extending interfaces

#### Error 2.2: AI Suggestions modal type errors
- **File:** `src/features/ai-suggestions/components/AISuggestionsModal.tsx`
- **Multiple Lines:** 21, 96, 100, 102, 110, 112, 116, 118, 188, 211, 290
- **Error:** Type mismatch between string arrays and typed object arrays
- **Fix:** Ensure consistent type usage throughout the AI suggestions feature

#### Error 2.3: AI API route type errors
- **File:** `src/app/api/ai/suggestions/route.ts`
- **Lines:** 224, 249, 268
- **Error:** Type `{ text: string; color: string; }[]` not assignable to `string[]`
- **Fix:** Update return types or response format

### 3. Card Relations API Errors

#### Error 3.1: Missing sourceCard/targetCard properties
- **File:** `src/app/api/cards/[cardId]/relations/route.ts`
- **Lines:** 89-94, 121-126
- **Error:** Property 'sourceCard'/'targetCard' does not exist on relation type
- **Details:** The Prisma query returns relation objects but TypeScript doesn't recognize the nested properties
- **Fix:** Update Prisma include statements or add proper type casting

#### Error 3.2: ZodError errors property missing
- **File:** `src/app/api/cards/[cardId]/relations/route.ts`
- **Line:** 244
- **Error:** Property 'errors' does not exist on type 'ZodError<unknown>'
- **Fix:** Use proper ZodError typing or access method

### 4. Board Hooks Type Errors

#### Error 4.1: useCardActions missing properties
- **File:** `src/features/board/hooks/useCardActions.ts`
- **Lines:** 101-112
- **Error:** Multiple properties (id, title, description, labels, etc.) don't exist on type
- **Details:** The destructured object type doesn't match the actual card properties
- **Fix:** Update the destructured object type definition

#### Error 4.2: useCardModal dueDate type mismatch
- **File:** `src/features/board/hooks/useCardModal.ts`
- **Line:** 71
- **Error:** Type 'string | Date' not assignable to type 'string'
- **Fix:** Normalize dueDate to string type consistently

#### Error 4.3: useCards comment type error
- **File:** `src/features/board/hooks/useCards.ts`
- **Lines:** 309, 450
- **Error:** Type mismatch for Comment creation and assignee assignment
- **Fix:** Add missing properties to comment object or fix assignee type

### 5. Template API Errors

#### Error 5.1: Missing boardTemplate property
- **File:** `src/app/api/templates/copy/route.ts` and `src/app/api/templates/route.ts`
- **Lines:** 73, 85, 108, 110, 48, 52
- **Error:** Property 'boardTemplate' does not exist on PrismaClient
- **Fix:** Add boardTemplate to Prisma schema or remove references

#### Error 5.2: Column color property missing
- **File:** `src/app/api/templates/copy/route.ts` and `src/app/api/templates/save/route.ts`
- **Lines:** 108, 130, 48
- **Error:** Property 'color' does not exist on Column type
- **Fix:** Add color field to Column model in Prisma schema or remove color references

### 6. Invite API Errors

#### Error 6.1: Missing canEdit property
- **File:** `src/app/api/invite/[code]/accept/route.ts` and `src/app/api/invite/[code]/route.ts`
- **Lines:** 56, 59
- **Error:** Property 'canEdit' does not exist on board type
- **Fix:** Add canEdit to the board type or update the query to include it

### 7. Search API Errors

#### Error 7.1: ZodError errors property missing
- **File:** `src/app/api/search/route.ts`
- **Lines:** 255, 412
- **Error:** Property 'errors' does not exist on type 'ZodError<unknown>'
- **Fix:** Use proper ZodError typing

### 8. UI Component Type Errors

#### Error 8.1: ActivityLog and CommentsThread null type
- **Files:** `src/components/ActivityLog.tsx`, `src/features/board/components/CommentsThread/CommentsThread.tsx`
- **Lines:** 157, 96
- **Error:** Type 'string | null | undefined' not assignable to 'string | Blob | undefined'
- **Fix:** Handle null values properly before assignment

#### Error 8.2: CardLabel import missing
- **File:** `src/features/search/types/search.ts`
- **Line:** 34
- **Error:** Cannot find name 'CardLabel'
- **Fix:** Import CardLabel from correct location

#### Error 8.3: CardRelations implicit any type
- **File:** `src/features/card-relations/components/CardRelations.tsx`
- **Line:** 223
- **Error:** Parameter 'v' implicitly has 'any' type
- **Fix:** Add explicit type annotation

### 9. Test Configuration Errors

#### Error 9.1: Missing testing-library jest matchers
- **File:** `src/features/auth/components/AuthForm/AuthForm.test.tsx`
- **Multiple Lines:** 26-59
- **Error:** Property 'toBeInTheDocument' does not exist on type 'Assertion<HTMLElement>'
- **Fix:** Install and configure `@testing-library/jest-dom`

## Priority Fix Order

1. **Critical (Blocking):**
   - Missing dependencies (@radix-ui/react-checkbox)
   - Missing test setup files
   - Missing type imports

2. **High Priority:**
   - AI Suggestions type inconsistencies
   - Card Relations API property access
   - Board hooks type definitions

3. **Medium Priority:**
   - Template API missing properties
   - Invite API missing properties
   - UI component type fixes

4. **Low Priority:**
   - Test configuration (non-blocking)
   - Minor type refinements

## Recommended Fixes

### Step 1: Install Missing Dependencies
```bash
npm install @radix-ui/react-checkbox
npm install -D @testing-library/jest-dom
```

### Step 2: Create Missing Files
- Create `prisma/setup.ts` or adjust test imports
- Create `@/components/ui/select.tsx` component
- Create or fix `src/lib/socket/types.ts`

### Step 3: Fix Type Definitions
- Update `src/features/ai-suggestions/types/index.ts` with proper generic types
- Add missing properties to Prisma schema
- Fix object type definitions in hooks

### Step 4: Verify Prisma Generation
```bash
npx prisma generate
```

## Build Command Test
After fixes, verify with:
```bash
npm run build
```
Should complete without TypeScript errors.
