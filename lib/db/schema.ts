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
    bigint,
} from 'drizzle-orm/pg-core';

// Users table - simplified for authkit integration
export const users = pgTable(
    'users',
    {
        id: serial('id').primaryKey(),
        authkitId: varchar('authkit_id', { length: 255 }).notNull().unique(),
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => {
        return {
            authkitIdIndex: uniqueIndex('users_authkit_id_idx').on(table.authkitId),
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
        createdAt: timestamp('created_at').defaultNow().notNull(),
        updatedAt: timestamp('updated_at').defaultNow().notNull(),
    },
    (table) => {
        return {
            githubIdIndex: uniqueIndex('organizations_github_id_idx').on(table.githubId),
            nameIndex: index('organizations_name_idx').on(table.name),
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
        joinedAt: timestamp('joined_at').defaultNow().notNull(),
    },
    (table) => {
        return {
            organizationIdIndex: index('organization_members_organization_id_idx').on(table.organizationId),
            userIdIndex: index('organization_members_user_id_idx').on(table.userId),
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

export const projectsRelations = relations(projects, ({ one }) => ({
    organization: one(organizations, {
        fields: [projects.organizationId],
        references: [organizations.id],
    }),
}));
