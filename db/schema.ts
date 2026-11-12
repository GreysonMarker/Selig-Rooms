import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const rooms=sqliteTable('rooms',{code:text('code').primaryKey(),host:text('host').notNull(),status:text('status').notNull(),state:text('state').notNull(),updated:integer('updated').notNull()});
export const players=sqliteTable('players',{id:text('id').primaryKey(),room:text('room').notNull(),token:text('token').notNull(),name:text('name').notNull(),avatar:text('avatar').notNull(),position:text('position').notNull(),updated:integer('updated').notNull()});
export const events=sqliteTable('events',{id:integer('id').primaryKey({autoIncrement:true}),room:text('room').notNull(),player:text('player').notNull(),nonce:text('nonce').notNull().unique(),payload:text('payload').notNull()});
