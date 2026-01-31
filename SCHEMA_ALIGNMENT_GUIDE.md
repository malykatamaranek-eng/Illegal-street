# Schema Alignment Guide

## Overview
The controllers have been implemented but need schema alignment. This document outlines all required changes.

## Issues Found

### 1. Field Name Casing Mismatch
**Problem**: Prisma schema uses `snake_case` but controllers use `camelCase`

**Affected Fields**:
- `user_id` → `userId`
- `module_id` → `moduleId`  
- `quiz_id` → `quizId`
- `product_id` → `productId`
- `category_id` → `categoryId`
- `created_at` → `createdAt`
- `updated_at` → `updatedAt`
- `avatar_url` → `avatar`
- `total_points` → `points`
- `total_price` → `total`
- `completed_at` → `completedAt`
- `started_at` → `startedAt`

**Solution**: Use Prisma's `@map()` directive to expose camelCase in TypeScript:

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  avatar_url   String?  @map("avatar_url")
  avatarUrl    String?  @map("avatar_url") // TypeScript field
  total_points Int      @default(0) @map("total_points")
  points       Int      @default(0) @map("total_points") // TypeScript field
  created_at   DateTime @default(now()) @map("created_at")
  createdAt    DateTime @default(now()) @map("created_at") // TypeScript field
  // ...
}
```

Or configure Prisma generator:
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fieldReference"]
}
```

### 2. Missing Models

The following models are used in controllers but don't exist in schema:

#### UserModuleProgress
**Used in**: `progressController.ts`, `moduleController.ts`, `adminController.ts`
**Purpose**: Track user progress through modules
**Replacement**: Use existing `UserProgress` model

**Required Changes**:
```typescript
// Change all occurrences of:
prisma.userModuleProgress → prisma.userProgress

// Update field references:
moduleId → module_id (in where clauses)
userId → user_id (in where clauses)
```

#### UserActivity
**Used in**: `progressController.ts`, `adminController.ts`
**Purpose**: Track daily user activity for streak calculation
**Status**: MISSING - needs to be added to schema

**Suggested Schema**:
```prisma
model UserActivity {
  id      String   @id @default(uuid())
  user_id String
  date    DateTime @default(now())
  type    String   // LOGIN, MODULE_COMPLETE, etc.
  
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@unique([user_id, date])
  @@index([user_id])
  @@index([date])
  @@map("user_activities")
}
```

#### UserGoal
**Used in**: `progressController.ts`
**Purpose**: User-defined learning goals
**Status**: MISSING - needs to be added to schema

**Suggested Schema**:
```prisma
model UserGoal {
  id           String   @id @default(uuid())
  user_id      String
  title        String
  description  String?
  target_date  DateTime
  target_value Int
  current_value Int     @default(0)
  created_at   DateTime @default(now())
  
  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@index([user_id])
  @@map("user_goals")
}
```

#### AuditLog
**Used in**: `adminController.ts`
**Purpose**: System audit logging
**Status**: MISSING - needs to be added to schema

**Suggested Schema**:
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  user_id   String?
  action    String
  entity    String
  entity_id String?
  changes   Json?
  ip        String?
  timestamp DateTime @default(now())
  
  user User? @relation(fields: [user_id], references: [id], onDelete: SetNull)
  
  @@index([user_id])
  @@index([action])
  @@index([timestamp])
  @@map("audit_logs")
}
```

#### ModuleCategory
**Used in**: `moduleController.ts`, `adminController.ts`
**Purpose**: Categorize modules
**Status**: MISSING - Module has category as String, not relation

**Current Schema**:
```prisma
model Module {
  category String  // Just a string!
}
```

**Options**:
1. Keep as string (simpler)
2. Create ModuleCategory model (more flexible):

```prisma
model ModuleCategory {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  created_at  DateTime @default(now())
  
  modules Module[]
  
  @@map("module_categories")
}

model Module {
  // Change:
  category    String
  // To:
  category_id String?
  category    ModuleCategory? @relation(fields: [category_id], references: [id])
}
```

#### MessageReaction
**Used in**: `chatController.ts`
**Purpose**: Emoji reactions to messages
**Status**: MISSING - needs to be added to schema

**Suggested Schema**:
```prisma
model MessageReaction {
  id         String   @id @default(uuid())
  message_id String
  user_id    String
  emoji      String
  created_at DateTime @default(now())
  
  message ChatMessage @relation(fields: [message_id], references: [id], onDelete: Cascade)
  user    User        @relation(fields: [user_id], references: [id], onDelete: Cascade)
  
  @@unique([message_id, user_id, emoji])
  @@index([message_id])
  @@index([user_id])
  @@map("message_reactions")
}
```

#### ChatAttachment
**Used in**: `chatController.ts`
**Purpose**: File attachments in chat
**Status**: MISSING - needs to be added to schema

**Suggested Schema**:
```prisma
model ChatAttachment {
  id         String   @id @default(uuid())
  user_id    String
  message_id String?
  filename   String
  mimetype   String
  size       Int
  path       String
  created_at DateTime @default(now())
  
  user    User         @relation(fields: [user_id], references: [id], onDelete: Cascade)
  message ChatMessage? @relation(fields: [message_id], references: [id], onDelete: SetNull)
  
  @@index([user_id])
  @@index([message_id])
  @@map("chat_attachments")
}
```

### 3. Missing Fields

#### User Model Missing Fields
```prisma
model User {
  // Missing:
  points        Int      @default(0)  // Used for ranking
  monthlyPoints Int      @default(0)  // Used for monthly ranking
  isOnline      Boolean  @default(false)
  lastSeen      DateTime?
  status        String   @default("ACTIVE")  // ACTIVE, BANNED, SUSPENDED
  bannedUntil   DateTime?
  lastLoginAt   DateTime?
}
```

#### Module Model Missing Fields
```prisma
model Module {
  // Missing:
  level       String?  // BEGINNER, INTERMEDIATE, ADVANCED
  published   Boolean  @default(false)
  sales       Int      @default(0)  // If modules can be sold
}
```

#### Product Model Missing Fields
```prisma
model Product {
  // Missing:
  sales Int @default(0)  // Track number of sales
}
```

#### Order Model Missing Fields
```prisma
model Order {
  // Missing:
  shippingAddress String
  paymentMethod   String
}
```

#### ChatMessage Model Missing Fields
```prisma
model ChatMessage {
  // Missing:
  edited    Boolean  @default(false)
  replyToId String?  @map("reply_to_id")
  replyTo   ChatMessage? @relation("MessageReplies", fields: [replyToId], references: [id])
  replies   ChatMessage[] @relation("MessageReplies")
}
```

### 4. Relation Mismatches

#### Lesson Model
**Problem**: Controllers reference `prisma.lesson` but schema has no Lesson model
**Solution**: Lessons might be part of Course model or need to be added

```prisma
model Lesson {
  id          String   @id @default(uuid())
  module_id   String
  title       String
  content     String
  order       Int
  duration    Int?
  created_at  DateTime @default(now())
  
  module Module @relation(fields: [module_id], references: [id], onDelete: Cascade)
  
  @@index([module_id])
  @@index([order])
  @@map("lessons")
}
```

#### Module Enrollments
**Problem**: Controllers query `module.enrollments` but relation doesn't exist
**Current**: Module has `userProgress UserProgress[]`
**Fix**: Use `userProgress` instead of `enrollments`

```typescript
// Change:
orderBy: { enrollments: { _count: 'desc' } }
// To:
orderBy: { userProgress: { _count: 'desc' } }
```

#### Quiz Questions/Options
**Problem**: Controllers reference `questions.options` but Quiz stores questions as JSON
**Current Schema**: `questions Json`
**Solution**: Keep as JSON or create separate QuizQuestion and QuizOption models

#### Order Items
**Problem**: Controllers reference `order.items` relation but Order stores items as JSON
**Current Schema**: `items Json`
**Solution**: Keep as JSON or create OrderItem model:

```prisma
model OrderItem {
  id         String  @id @default(uuid())
  order_id   String
  product_id String
  quantity   Int
  price      Decimal @db.Decimal(10, 2)
  
  order   Order   @relation(fields: [order_id], references: [id], onDelete: Cascade)
  product Product @relation(fields: [product_id], references: [id], onDelete: Restrict)
  
  @@index([order_id])
  @@index([product_id])
  @@map("order_items")
}
```

## Fix Priority

### Critical (Breaking Compilation)
1. ✅ Field name mismatches (user_id vs userId, etc.)
2. ✅ Replace `userModuleProgress` with `userProgress`
3. ✅ Fix Admin model userId field
4. ✅ Fix Session model userId field
5. ✅ Fix Order aggregation (total_price instead of total)

### High (Missing Core Features)
1. ⚠️ Add UserActivity model (for streaks)
2. ⚠️ Add AuditLog model (for admin logging)
3. ⚠️ Add MessageReaction model (for chat reactions)
4. ⚠️ Add ChatAttachment model (for file uploads)
5. ⚠️ Add Lesson model (for module content)

### Medium (Nice to Have)
1. 📝 Add UserGoal model
2. 📝 Add ModuleCategory model
3. 📝 Add OrderItem model (vs JSON)
4. 📝 Add User.points, User.monthlyPoints fields
5. 📝 Add User.isOnline, User.lastSeen fields

### Low (Optional)
1. 💡 Add User.status, User.bannedUntil
2. 💡 Add Module.published field
3. 💡 Add Product.sales field
4. 💡 Split Quiz JSON into QuizQuestion/QuizOption models

## Quick Fix Implementation

### Step 1: Update Prisma Schema Field Mappings
Add these to your schema:

```prisma
generator client {
  provider = "prisma-client-js"
}

// Then for each model, add @map() for snake_case fields
```

### Step 2: Add Critical Missing Models
Run these migrations:

```bash
# Add UserActivity
npx prisma migrate dev --name add-user-activity

# Add AuditLog  
npx prisma migrate dev --name add-audit-log

# Add MessageReaction
npx prisma migrate dev --name add-message-reaction

# Add ChatAttachment
npx prisma migrate dev --name add-chat-attachment

# Add Lesson
npx prisma migrate dev --name add-lesson-model
```

### Step 3: Generate Prisma Client
```bash
npx prisma generate
```

### Step 4: Update Controller References
Use find/replace:
- `userModuleProgress` → `userProgress`
- `enrollments` → `userProgress`
- `userId:` → `user_id:` (in Prisma queries)
- `moduleId:` → `module_id:` (in Prisma queries)

### Step 5: Test Build
```bash
npm run build
```

## Automated Fix Script

Create `scripts/fix-schema-alignment.ts`:

```typescript
// Script to automatically update field references
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const replacements = [
  { from: /prisma\.userModuleProgress/g, to: 'prisma.userProgress' },
  { from: /userId:/g, to: 'user_id:' },
  { from: /moduleId:/g, to: 'module_id:' },
  { from: /quizId:/g, to: 'quiz_id:' },
  { from: /productId:/g, to: 'product_id:' },
  { from: /categoryId:/g, to: 'category_id:' },
  // Add more as needed
];

function fixFile(filePath: string) {
  let content = readFileSync(filePath, 'utf-8');
  
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  writeFileSync(filePath, content);
  console.log(`Fixed: ${filePath}`);
}

// Fix all controllers
const controllersDir = join(__dirname, '../src/controllers');
readdirSync(controllersDir)
  .filter(f => f.endsWith('.ts'))
  .forEach(f => fixFile(join(controllersDir, f)));
```

Run with:
```bash
ts-node scripts/fix-schema-alignment.ts
```

## Testing After Fixes

1. Build: `npm run build`
2. Type check: `npm run type-check`
3. Run tests: `npm test`
4. Start server: `npm run dev`

## Summary

Total Changes Needed:
- 🔴 **70+ field reference updates** (snake_case alignment)
- 🟡 **6 missing models** to add
- 🟢 **10+ missing fields** to add
- 🔵 **20+ relation fixes**

Estimated Time:
- Quick fixes (field names): 2-3 hours
- Add missing models: 3-4 hours
- Test and verify: 1-2 hours
- **Total**: 6-9 hours

Once these changes are made, all 130+ endpoints will be fully functional!
