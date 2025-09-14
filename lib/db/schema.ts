import { relations } from 'drizzle-orm';
import {
    index,
    integer,
    pgTable,
    serial,
    text,
    timestamp,
    uniqueIndex,
    varchar,
    jsonb,
    bigint, pgEnum,
    boolean,
} from 'drizzle-orm/pg-core';

export const workflowStateEnum = pgEnum('workflow_state', ['scheduling', 'in_progress', 'complete']);
export const organizationStatusEnum = pgEnum('organization_status', ['active', 'suspended', 'inactive']);

// Users table - simplified for authkit integration
export const users = pgTable(
    'users',
    {
        id: serial('id').primaryKey(),
        authkitId: varchar('authkit_id', { length: 255 }).notNull().unique(),
        githubId: bigint('github_id', { mode: 'number' }),
        githubUsername: varchar('github_username', { length: 255 }),
        githubEmail: varchar('github_email', { length: 255 }),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => {
        return {
            authkitIdIndex: uniqueIndex('users_authkit_id_idx').on(table.authkitId),
            githubIdIndex: uniqueIndex('users_github_id_idx').on(table.githubId),
            githubUsernameIndex: uniqueIndex('users_github_username_idx').on(table.githubUsername),
            githubEmailIndex: index('users_github_email_idx').on(table.githubEmail),
        };
    },
);

// Organizations table - based on GitHub organizations
export const organizations = pgTable(
    'organizations',
    {
        id: serial('id').primaryKey(),
        githubId: bigint('github_id', { mode: 'number' }).notNull().unique(), // GitHub organization ID number
        name: varchar('name', { length: 255 }).notNull(), // GitHub organization name
        status: organizationStatusEnum('status').default('active').notNull(),
        githubAppInstalled: boolean('github_app_installed').default(false).notNull(),
        lastSyncAt: timestamp('last_sync_at'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => {
        return {
            githubIdIndex: uniqueIndex('organizations_github_id_idx').on(table.githubId),
            nameIndex: index('organizations_name_idx').on(table.name),
            statusIndex: index('organizations_status_idx').on(table.status),
        };
    },
);

// Organization members table (many-to-many relationship)
export const organizationMembers = pgTable(
    'organization_members',
    {
        id: serial('id').primaryKey(),
        organizationId: integer('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
        userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
        githubMembershipActive: boolean('github_membership_active').default(true).notNull(),
        lastSyncAt: timestamp('last_sync_at'),
        joinedAt: timestamp('joined_at').defaultNow().notNull(),
    },
    (table) => {
        return {
            organizationIdIndex: index('organization_members_organization_id_idx').on(table.organizationId),
            userIdIndex: index('organization_members_user_id_idx').on(table.userId),
            githubActiveIndex: index('organization_members_github_active_idx').on(table.githubMembershipActive),
            uniqueMemberIndex: uniqueIndex('organization_members_unique_idx').on(
                table.organizationId,
                table.userId
            ),
        };
    },
);

// Projects table - linked to GitHub repositories
export const projects = pgTable(
    'projects',
    {
        id: serial('id').primaryKey(),
        organizationId: integer('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
        githubRepositoryId: bigint('github_repository_id', { mode: 'number' }).notNull().unique(), // GitHub repository ID number
        repositoryName: varchar('repository_name', { length: 255 }).notNull(),
        repositoryUrl: varchar('repository_url', { length: 500 }),
        defaultBranch: varchar('default_branch', { length: 255 }).default('main'),
        isPrivate: boolean('is_private').default(true).notNull(),
        lastAnalyzedAt: timestamp('last_analyzed_at'),
        moduleInterlinks: jsonb('module_interlinks').$type<{
            nodes: Array<{
                id: string;
                name: string;
                type: string;
            }>;
            links: Array<{
                source: string;
                target: string;
                type: string;
                weight?: number;
            }>;
        }>(), // Graph data structure with nodes and links
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => {
        return {
            organizationIdIndex: index('projects_organization_id_idx').on(table.organizationId),
            githubRepositoryIdIndex: uniqueIndex('projects_github_repository_id_idx').on(table.githubRepositoryId),
            repositoryNameIndex: index('projects_repository_name_idx').on(table.repositoryName),
            lastAnalyzedIndex: index('projects_last_analyzed_idx').on(table.lastAnalyzedAt),
        };
    },
);

// Workflows table - linked to projects
export const workflows = pgTable(
    'workflows',
    {
        id: serial('id').primaryKey(),
        projectId: integer('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
        state: workflowStateEnum('state').default('scheduling').notNull(),
        results: jsonb('results').$type<unknown>(), // Arbitrary JSON results
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => {
        return {
            projectIdIndex: index('workflows_project_id_idx').on(table.projectId),
            stateIndex: index('workflows_state_idx').on(table.state),
            createdAtIndex: index('workflows_created_at_idx').on(table.createdAt),
        };
    },
);

// GitHub sync logs table
export const githubSyncLogs = pgTable(
    'github_sync_logs',
    {
        id: serial('id').primaryKey(),
        organizationId: integer('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
        syncType: varchar('sync_type', { length: 50 }).notNull(),
        eventType: varchar('event_type', { length: 100 }),
        status: varchar('status', { length: 20 }).notNull(),
        details: jsonb('details'),
        error: text('error'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => {
        return {
            organizationIdIndex: index('github_sync_logs_organization_id_idx').on(table.organizationId),
            syncTypeIndex: index('github_sync_logs_sync_type_idx').on(table.syncType),
            statusIndex: index('github_sync_logs_status_idx').on(table.status),
            createdAtIndex: index('github_sync_logs_created_at_idx').on(table.createdAt),
        };
    },
);

// Pending installations table
export const pendingInstallations = pgTable(
    'pending_installations',
    {
        id: serial('id').primaryKey(),
        githubOrgId: bigint('github_org_id', { mode: 'number' }).notNull().unique(),
        orgName: varchar('org_name', { length: 255 }).notNull(),
        installedAt: timestamp('installed_at').defaultNow().notNull(),
        processedAt: timestamp('processed_at'),
        createdAt: timestamp('created_at').defaultNow().notNull(),
    },
    (table) => {
        return {
            githubOrgIdIndex: uniqueIndex('pending_installations_github_org_id_idx').on(table.githubOrgId),
            processedAtIndex: index('pending_installations_processed_at_idx').on(table.processedAt),
        };
    },
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    organizationMemberships: many(organizationMembers),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
    members: many(organizationMembers),
    projects: many(projects),
    syncLogs: many(githubSyncLogs),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
    organization: one(organizations, {
        fields: [organizationMembers.organizationId],
        references: [organizations.id],
    }),
    user: one(users, {
        fields: [organizationMembers.userId],
        references: [users.id],
    }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [projects.organizationId],
        references: [organizations.id],
    }),
    workflows: many(workflows),
}));

export const workflowsRelations = relations(workflows, ({ one }) => ({
    project: one(projects, {
        fields: [workflows.projectId],
        references: [projects.id],
    }),
}));

export const githubSyncLogsRelations = relations(githubSyncLogs, ({ one }) => ({
    organization: one(organizations, {
        fields: [githubSyncLogs.organizationId],
        references: [organizations.id],
    }),
}));
