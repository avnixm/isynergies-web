import { mysqlTable, int, varchar, timestamp } from 'drizzle-orm/mysql-core';

// Example schema - replace with your actual tables
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Add more tables here as needed
// Example:
// export const posts = mysqlTable('posts', {
//   id: int('id').primaryKey().autoincrement(),
//   title: varchar('title', { length: 255 }).notNull(),
//   content: text('content'),
//   userId: int('user_id').references(() => users.id),
//   createdAt: timestamp('created_at').defaultNow(),
// });
