import { Request, Response } from 'express';
import { InviteService } from '../services/invite.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

/** GET /api/v1/invites/validate/:token */
export const validateInviteToken = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { invite, relationship } = await InviteService.validateToken(token);

  return ApiResponse.success(res, 'Invite token is valid', {
    code: invite.code,
    targetRole: invite.targetRole,
    relationshipId: invite.relationship,
    relationshipType: invite.relationshipType,
    relationshipName: (invite.metadata as any)?.relationshipName || relationship?.name || 'Unknown',
    expiresAt: invite.expiresAt,
    status: invite.status,
  });
});
