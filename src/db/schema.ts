import { sql } from "drizzle-orm";
import { uuid, text, varchar, pgTable, integer, PgUUID, date, pgEnum } from "drizzle-orm/pg-core";

const statusEnum = pgEnum('status', ['paid', 'pending']);

export const users = pgTable('users', {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    name: varchar({length: 255}).notNull(),
    email: text().notNull().unique(),
    password: text().notNull()
})

export const revenue = pgTable('revenue', {
    month: varchar({length: 4}).notNull().unique(),
    revenue: integer().notNull()
})

export const customers = pgTable('customers', {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    name: varchar({length: 255}).notNull(),
    email: varchar({length: 255}).notNull(),
    image_url: varchar({length: 255}).notNull()
})

export const invoices = pgTable('invoices', {
    id: uuid().primaryKey().default(sql`gen_random_uuid()`),
    customer_id: uuid().notNull(),
    amount: integer().notNull(),
    status: statusEnum().notNull(),
    date: date().notNull()
})
