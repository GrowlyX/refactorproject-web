// lib/actions.ts
'use server';

import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from './drizzle';
import {
  organizations,
  organizationMembers,
  recordings,
  recordingResults,
  users
} from './schema';

// Organization schemas
const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  description: z.string().optional(),
});

const inviteMemberSchema = z.object({
  organizationId: z.number(),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member']),
});

// Recording schemas
const createRecordingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  organizationId: z.number(),
  audioUrl: z.string().optional(), // Storage URL for the audio file
  shouldAnalyze: z.boolean().optional().default(false),
});

const updateRecordingStateSchema = z.object({
  recordingId: z.number(),
  state: z.enum(['queued', 'processing', 'processed']),
  result: z.string().optional(), // Base64 encoded result
});

// Helper function to get current user
async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

// Helper function to check organization membership
async function checkOrgMembership(userId: number, organizationId: number, requiredRole?: 'admin' | 'member') {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.organizationId, organizationId)
    ),
  });

  if (!membership) {
    throw new Error('Not a member of this organization');
  }

  if (requiredRole === 'admin' && membership.role !== 'admin') {
    throw new Error('Admin access required');
  }

  return membership;
}

// Organization actions
export async function createOrganizationAction(_: any, formData: FormData) {
  let newOrg;
  const rawFormData = {
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
  };

  try {
    const user = await getCurrentUser();
    const validatedFields = createOrganizationSchema.parse(rawFormData);

    // Check if slug is already taken
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.slug, validatedFields.slug),
    });

    if (existingOrg) {
      return { error: 'Organization slug already exists', previous: rawFormData };
    }

    // Create organization
    [newOrg] = await db
      .insert(organizations)
      .values({
        ...validatedFields,
        ownerId: user.id,
        isPersonal: false,
      })
      .returning();

    // Add creator as admin
    await db.insert(organizationMembers).values({
      organizationId: newOrg.id,
      userId: user.id,
      role: 'admin',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, previous: rawFormData };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to create organization',
      previous: rawFormData,
    };
  }

  revalidatePath('/organizations');
  redirect(`/organizations/${newOrg.slug}`);
}

export async function createRecordingAction(_: any, formData: FormData) {
  let newRecording;
  const rawFormData = {
    name: formData.get('name'),
    organizationId: parseInt(formData.get('organizationId') as string),
    audioUrl: formData.get('audioUrl'),
    shouldAnalyze: formData.get('shouldAnalyze') === 'true',
  };

  try {
    const user = await getCurrentUser();
    const validatedFields = createRecordingSchema.parse(rawFormData);

    // Check membership
    await checkOrgMembership(user.id, validatedFields.organizationId);

    // Create recording with audio URL if provided
    [newRecording] = await db
      .insert(recordings)
      .values({
        name: validatedFields.name,
        organizationId: validatedFields.organizationId,
        createdBy: user.id,
        audioUrl: rawFormData.audioUrl,
        state: 'queued',
        // Store the audio URL in the name field or add a new field to your schema
        // You might want to add an audioUrl field to your recordings table
      })
      .returning();

    // If audio was uploaded and analysis is requested, trigger piano analysis
    if (validatedFields.audioUrl && validatedFields.shouldAnalyze) {
      // Trigger analysis asynchronously
      processPianoAnalysisAsync(newRecording.id, validatedFields.audioUrl);
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, previous: rawFormData };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to create recording',
      previous: rawFormData,
    };
  }

  revalidatePath('/recordings');
  redirect(`/recordings/${newRecording.id}`);
}

// Async function to process piano analysis without blocking
async function processPianoAnalysisAsync(recordingId: number, audioUrl: string) {
  try {
    // Call the piano analysis function
    await processPianoAnalysis(recordingId, audioUrl);

    // Optionally send a notification or update UI
    console.log(`Piano analysis completed for recording ${recordingId}`);
  } catch (error) {
    console.error(`Piano analysis failed for recording ${recordingId}:`, error);

    // Update recording state to indicate analysis failed
    await db
      .update(recordings)
      .set({
        state: 'queued', // Reset to queued so it can be retried
        updatedAt: new Date(),
      })
      .where(eq(recordings.id, recordingId));
  }
}

export async function inviteMemberAction(_: any, formData: FormData) {
  const rawFormData = {
    organizationId: parseInt(formData.get('organizationId') as string),
    email: formData.get('email'),
    role: formData.get('role'),
  };

  try {
    const user = await getCurrentUser();
    const validatedFields = inviteMemberSchema.parse(rawFormData);

    // Check if current user is admin
    await checkOrgMembership(user.id, validatedFields.organizationId, 'admin');

    // Find or create user by email
    let invitedUser = await db.query.users.findFirst({
      where: eq(users.email, validatedFields.email),
    });

    if (!invitedUser) {
      // Create a placeholder user (they'll complete profile on first login)
      [invitedUser] = await db
        .insert(users)
        .values({
          email: validatedFields.email,
          username: validatedFields.email.split('@')[0] + Date.now(), // Temporary unique username
        })
        .returning();
    }

    // Check if already a member
    const existingMembership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, invitedUser.id),
        eq(organizationMembers.organizationId, validatedFields.organizationId)
      ),
    });

    if (existingMembership) {
      return { error: 'User is already a member', previous: rawFormData };
    }

    // Add member
    await db.insert(organizationMembers).values({
      organizationId: validatedFields.organizationId,
      userId: invitedUser.id,
      role: validatedFields.role,
    });

    return { success: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, previous: rawFormData };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to Add Member',
      previous: rawFormData,
    };
  }
}

export async function removeMemberAction(_: any, formData: FormData) {
  const organizationId = parseInt(formData.get('organizationId') as string);
  const memberId = parseInt(formData.get('memberId') as string);

  try {
    const user = await getCurrentUser();

    // Check if current user is admin
    await checkOrgMembership(user.id, organizationId, 'admin');

    // Can't remove the owner
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (org?.ownerId === memberId) {
      return { error: 'Cannot remove organization owner' };
    }

    // Remove member
    await db
      .delete(organizationMembers)
      .where(
        and(
          eq(organizationMembers.userId, memberId),
          eq(organizationMembers.organizationId, organizationId)
        )
      );

    revalidatePath(`/organizations`);
    return { success: true, error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to remove member',
    };
  }
}

export async function updateRecordingStateAction(_: any, formData: FormData) {
  const rawFormData = {
    recordingId: parseInt(formData.get('recordingId') as string),
    state: formData.get('state'),
    result: formData.get('result'),
  };

  try {
    const user = await getCurrentUser();
    const validatedFields = updateRecordingStateSchema.parse(rawFormData);

    // Get recording to check organization
    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.id, validatedFields.recordingId),
    });

    if (!recording) {
      return { error: 'Recording not found' };
    }

    // Check membership
    await checkOrgMembership(user.id, recording.organizationId);

    let resultId = recording.resultId;

    // If processing is complete and we have a result, save it
    if (validatedFields.state === 'processed' && validatedFields.result) {
      const [newResult] = await db
        .insert(recordingResults)
        .values({
          result: validatedFields.result,
        })
        .returning();

      resultId = newResult.id;
    }

    // Update recording
    await db
      .update(recordings)
      .set({
        state: validatedFields.state,
        resultId: resultId,
        updatedAt: new Date(),
      })
      .where(eq(recordings.id, validatedFields.recordingId));

    revalidatePath('/recordings');
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message, previous: rawFormData };
    }
    return {
      error: error instanceof Error ? error.message : 'Failed to update recording',
      previous: rawFormData,
    };
  }
}

export async function deleteRecordingAction(_: any, formData: FormData) {
  const recordingId = parseInt(formData.get('recordingId') as string);

  try {
    const user = await getCurrentUser();

    // Get recording to check organization
    const recording = await db.query.recordings.findFirst({
      where: eq(recordings.id, recordingId),
    });

    if (!recording) {
      return { error: 'Recording not found' };
    }

    // Check if user is admin of the organization
    await checkOrgMembership(user.id, recording.organizationId, 'admin');

    // Delete recording (will cascade delete result if exists)
    await db.delete(recordings).where(eq(recordings.id, recordingId));

    // If there was a result, delete it
    if (recording.resultId) {
      await db.delete(recordingResults).where(eq(recordingResults.id, recording.resultId));
    }

    revalidatePath('/recordings');
    return { success: true, error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to delete recording',
    };
  }
}
