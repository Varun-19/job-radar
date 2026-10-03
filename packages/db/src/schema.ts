import { pgTable, text, integer, jsonb, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { SearchProfile, WorkspaceSnapshot } from '@jobradar/contracts';
export const workspaceMeta = pgTable('workspace_meta',{id:integer('id').primaryKey(),revision:integer('revision').notNull()});
export const profiles = pgTable('search_profiles',{id:text('id').primaryKey(),config:jsonb('config').$type<SearchProfile>().notNull()});
export const profileVersions = pgTable('search_profile_versions',{profileId:text('profile_id').notNull().references(()=>profiles.id),version:integer('version').notNull(),config:jsonb('config').$type<SearchProfile>().notNull()},t=>[primaryKey({columns:[t.profileId,t.version]})]);
export const jobs = pgTable('opportunity_drafts',{id:text('id').primaryKey(),profileId:text('profile_id').notNull().references(()=>profiles.id),data:jsonb('data').$type<WorkspaceSnapshot['jobs'][number]>().notNull()});
export const preferences = pgTable('company_preferences',{profileId:text('profile_id').notNull().references(()=>profiles.id),company:text('company').notNull(),tier:text('tier').notNull()},t=>[primaryKey({columns:[t.profileId,t.company]})]);
export const activities = pgTable('workspace_activities',{id:uuid('id').primaryKey(),revision:integer('revision').notNull(),type:text('type').notNull(),data:jsonb('data').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull()});

export const resumes = pgTable('resume_versions',{id:text('id').primaryKey(),seriesKey:text('series_key').notNull(),version:integer('version').notNull(),metadata:jsonb('metadata').$type<WorkspaceSnapshot['resumes'][number]>().notNull(),originalBase64:text('original_base64').notNull()});
export const evidence = pgTable('candidate_evidence',{id:text('id').primaryKey(),resumeVersionId:text('resume_version_id').references(()=>resumes.id),data:jsonb('data').$type<WorkspaceSnapshot['evidence'][number]>().notNull()});
export const applications = pgTable('applications',{id:text('id').primaryKey(),jobId:text('job_id').notNull().unique().references(()=>jobs.id),resumeVersionId:text('resume_version_id').references(()=>resumes.id),data:jsonb('data').$type<WorkspaceSnapshot['applications'][number]>().notNull()});

export const boards=pgTable('job_boards',{id:text('id').primaryKey(),data:jsonb('data').$type<WorkspaceSnapshot['boards'][number]>().notNull()});

export const postingRevisions=pgTable('posting_revisions',{id:uuid('id').notNull().unique(),jobId:text('job_id').notNull().references(()=>jobs.id),version:integer('version').notNull(),data:jsonb('data').$type<WorkspaceSnapshot['postingRevisions'][number]>().notNull()},t=>[primaryKey({columns:[t.jobId,t.version]})]);
