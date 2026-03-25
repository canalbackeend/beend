import prisma from './db';

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  entityName,
  description,
  metadata,
}: {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  description: string;
  metadata?: any;
}) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId: entityId || null,
        entityName: entityName || null,
        description,
        metadata: metadata || null,
      },
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Não lançar erro para não afetar a operação principal
  }
}

export const ActivityAction = {
  CREATE_CAMPAIGN: 'CREATE_CAMPAIGN',
  UPDATE_CAMPAIGN: 'UPDATE_CAMPAIGN',
  DELETE_CAMPAIGN: 'DELETE_CAMPAIGN',
  CREATE_TERMINAL: 'CREATE_TERMINAL',
  UPDATE_TERMINAL: 'UPDATE_TERMINAL',
  DELETE_TERMINAL: 'DELETE_TERMINAL',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  UPLOAD_LOGO: 'UPLOAD_LOGO',
  RESET_CAMPAIGN_DATA: 'RESET_CAMPAIGN_DATA',
} as const;

export const EntityType = {
  CAMPAIGN: 'CAMPAIGN',
  TERMINAL: 'TERMINAL',
  USER: 'USER',
} as const;
