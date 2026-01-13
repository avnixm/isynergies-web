const { mysqlTable, int, varchar, timestamp } = require('drizzle-orm/mysql-core');

// Example schema - customize based on your needs
const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

// Export schemas
module.exports = {
  users,
};
