import { env } from '../config/env.config';
import { logger } from '../config/logger.config';
import { ROLES, USER_STATUS } from '../constants';
import { User } from '../models/user.model';

export const seedAdminAccount = async (): Promise<void> => {
  try {
    const adminEmail = env.ADMIN_EMAIL.toLowerCase();
    const existingAdmin = await User.findOne({
      $or: [{ email: adminEmail }, { role: ROLES.ADMIN }],
    });

    if (!existingAdmin) {
      await User.create({
        name: 'System Admin Console',
        email: adminEmail,
        password: env.ADMIN_PASSWORD,
        role: ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
        isEmailVerified: true,
        avatar: '',
        bio: 'Enterprise Platform Administrator',
      });
      logger.info(`🛡️ Seeded Admin account successfully: ${adminEmail}`);
    } else {
      logger.info(`🛡️ System Admin account ready: ${existingAdmin.email}`);
    }
  } catch (error: any) {
    logger.error(`❌ Admin seeding warning: ${error.message}`);
  }
};
