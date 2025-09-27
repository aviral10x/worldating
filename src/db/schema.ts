import { sqliteTable, integer, text, real, unique, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  age: integer('age').notNull(),
  location: text('location').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  walletAddress: text('wallet_address').unique(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  walletAddressIdx: index('wallet_address_idx').on(table.walletAddress)
}));

export const interests = sqliteTable('interests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
});

export const userInterests = sqliteTable('user_interests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  interestId: integer('interest_id').references(() => interests.id).notNull(),
}, (table) => ({
  uniqueUserInterest: unique().on(table.userId, table.interestId)
}));

export const likes = sqliteTable('likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  likerId: integer('liker_id').references(() => users.id).notNull(),
  likedId: integer('liked_id').references(() => users.id).notNull(),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  uniqueLike: unique().on(table.likerId, table.likedId)
}));

export const dailyPicks = sqliteTable('daily_picks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  pickUserId: integer('pick_user_id').references(() => users.id).notNull(),
  score: real('score').notNull(),
  pickedForDate: text('picked_for_date').notNull(),
  createdAt: integer('created_at').notNull(),
}, (table) => ({
  uniqueDailyPick: unique().on(table.userId, table.pickUserId, table.pickedForDate)
}));

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at').notNull(),
  expiresAt: integer('expires_at').notNull(),
}, (table) => ({
  tokenIdx: index('session_token_idx').on(table.token),
  userIdIdx: index('session_user_id_idx').on(table.userId)
}));