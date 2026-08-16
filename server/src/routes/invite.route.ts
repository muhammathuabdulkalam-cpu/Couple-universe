import { Router, Request, Response } from 'express';
import { InviteService } from '../services/invite.service';
import { ApiResponse } from '../utils/ApiResponse';
import { catchAsync } from '../utils/catchAsync';

const router = Router();

/**
 * Public Token Validation & Safe Preview Metadata Endpoint
 * Does NOT expose passwords, JWTs, secrets, or internal user records
 */
router.get(
  '/validate/:token',
  catchAsync(async (req: Request, res: Response) => {
    const { token } = req.params;
    const previewData = await InviteService.getInvitePreview(token);

    return ApiResponse.success(res, 'Invite token preview retrieved', previewData);
  })
);

export default router;
