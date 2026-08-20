import { Request, Response } from 'express';
import { InviteService } from '../services/invite.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

/** GET /api/v1/invites/validate/:token */
export const validateInviteToken = catchAsync(async (req: Request, res: Response) => {
  const { token } = req.params;
  const preview = await InviteService.getInvitePreview(token);

  return ApiResponse.success(res, 'Invite token preview retrieved successfully', preview);
});
