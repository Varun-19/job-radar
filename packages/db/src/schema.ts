import { pgTable, text, integer, jsonb, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { SearchProfile, WorkspaceSnapshot } from '@jobradar/contracts';
export const workspaceMeta = pgTable('workspace_meta',{id:integer('id').primaryKey(),revision:integer('revision').notNull()});
export const profiles = pgTable('search_profiles',{id:text('id').primaryKey(),config:jsonb('config').$type<SearchProfile>().notNull()});
export const profileVersions = pgTable('search_profile_versions',{profileId:text('profile_id').notNull().references(()=>profiles.id),version:integer('version').notNull(),config:jsonb('config').$type<SearchProfile>().notNull()},t=>[primaryKey({columns:[t.profileId,t.version]})]);
export const jobs = pgTable('opportunity_drafts',{id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>profiles.id),data:jsonb('data').$type<WorkspaceSnapshot['jobs'][number]>().notNull()});
export const preferences = pgTable('company_preferences',{profileId:text('profile_id').notNull().references(()=>profiles.id),company:text('company').notNull(),tier:text('tier').notNull()},t=>[primaryKey({columns:[t.profileId,t.company]})]);
export const activities = pgTable('workspace_activities',{id:uuid('id').primaryKey(),revision:integer('revision').notNull(),type:text('type').notNull(),data:jsonb('data').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull()});
