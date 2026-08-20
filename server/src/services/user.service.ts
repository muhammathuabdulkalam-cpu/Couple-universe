import mongoose from 'mongoose';
import { HTTP_STATUS, ROLES, USER_STATUS, UserRole, UserStatus } from '../constants';
import { Relationship } from '../models/relationship.model';
import { Session } from '../models/session.model';
import { User, IUser } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { AuditLogService } from './auditLog.service';
import { ValidationService } from './validation.service';

export interface CreateUserInput {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  name?: string;
  email: string;
  password?: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  role?: UserRole;
  status?: UserStatus;
  bio?: string;
  avatar?: string;
  relationshipId?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  bio?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  relationshipId?: string;
}

export class UserService {
  static async createUser(input: CreateUserInput, adminId?: string): Promise<IUser> {
    const email = ValidationService.validateEmail(input.email);
    ValidationService.validatePassword(input.password, true);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('User with this email address already exists.', HTTP_STATUS.BAD_REQUEST);
    }

    const fullName = (input.name || input.displayName || `${input.firstName || ''} ${input.lastName || ''}`).trim() || 'New User';
    const role = input.role || ROLES.INVITED_USER;
    const status = input.status || USER_STATUS.ACTIVE;

    const newUser = await User.create({
      name: fullName,
      email,
      password: input.password,
      role,
      status,
      phone: input.phone || '',
      gender: input.gender || '',
      bio: input.bio || '',
      birthday: input.birthday ? new Date(input.birthday) : undefined,
      avatar: input.avatar || '',
      isEmailVerified: true,
    });

    if (input.relationshipId && mongoose.Types.ObjectId.isValid(input.relationshipId)) {
      const rel = await Relationship.findById(input.relationshipId);
      if (rel) {
        rel.members.push({ user: newUser._id, role: 'MEMBER', joinedAt: new Date() });
        await rel.save();
      }
    }

    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
      await AuditLogService.logAction({
        action: 'USER_CREATED',
        adminUser: adminId,
        targetUser: newUser._id.toString(),
        metadata: { email: newUser.email, role: newUser.role },
      });
    }

    return newUser;
  }

  static async updateUser(id: string, input: UpdateUserInput, adminId?: string): Promise<IUser> {
    const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('User record not found.', HTTP_STATUS.NOT_FOUND);
    }

    if (input.email && input.email.toLowerCase() !== user.email) {
      const cleanEmail = ValidationService.validateEmail(input.email);
      const existing = await User.findOne({ email: cleanEmail, _id: { $ne: id } });
      if (existing) {
        throw new AppError('Email address is already in use by another user.', HTTP_STATUS.BAD_REQUEST);
      }
      user.email = cleanEmail;
    }

    if (input.name !== undefined) user.name = input.name.trim();
    if (input.phone !== undefined) user.phone = input.phone.trim();
    if (input.gender !== undefined) user.gender = input.gender;
    if (input.bio !== undefined) user.bio = input.bio;
    if (input.avatar !== undefined) user.avatar = input.avatar;
    if (input.role !== undefined) user.role = input.role;
    if (input.status !== undefined) user.status = input.status;
    if (input.birthday) user.birthday = new Date(input.birthday);

    await user.save();

    if (input.relationshipId && mongoose.Types.ObjectId.isValid(input.relationshipId)) {
      await Relationship.updateMany(
        { 'members.user': user._id },
        { $pull: { members: { user: user._id } } }
      );
      const targetRel = await Relationship.findById(input.relationshipId);
      if (targetRel) {
        targetRel.members.push({
          user: user._id,
          role: user.role === ROLES.SUPER_OWNER || user.role === ROLES.CO_OWNER ? 'OWNER' : 'MEMBER',
          joinedAt: new Date(),
        });
        await targetRel.save();
      }
    }

    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
      await AuditLogService.logAction({
        action: 'USER_UPDATED',
        adminUser: adminId,
        targetUser: user._id.toString(),
        metadata: input,
      });
    }

    return user;
  }

  static async setStatus(id: string, status: UserStatus, adminId?: string): Promise<IUser> {
    const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('User record not found.', HTTP_STATUS.NOT_FOUND);
    }
    user.status = status;
    await user.save();

    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
      await AuditLogService.logAction({
        action: status === USER_STATUS.SUSPENDED ? 'USER_SUSPENDED' : 'USER_ACTIVATED',
        adminUser: adminId,
        targetUser: user._id.toString(),
        metadata: { newStatus: status },
      });
    }

    return user;
  }

  static async softDeleteUser(id: string, adminId: string): Promise<void> {
    const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('User record not found.', HTTP_STATUS.NOT_FOUND);
    }
    user.isDeleted = true;
    user.deletedAt = new Date();
    if (mongoose.Types.ObjectId.isValid(adminId)) {
      user.deletedBy = new mongoose.Types.ObjectId(adminId);
    }
    user.status = USER_STATUS.DELETED;
    await user.save();

    // Pull user from any relationship memberships
    await Relationship.updateMany(
      { 'members.user': user._id },
      { $pull: { members: { user: user._id } } }
    );

    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
      await AuditLogService.logAction({
        action: 'USER_DELETED',
        adminUser: adminId,
        targetUser: user._id.toString(),
      });
    }
  }

  static async restoreUser(id: string, adminId: string): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User record not found.', HTTP_STATUS.NOT_FOUND);
    }
    user.isDeleted = false;
    user.deletedAt = undefined;
    user.deletedBy = undefined;
    user.status = USER_STATUS.ACTIVE;
    await user.save();

    if (adminId && mongoose.Types.ObjectId.isValid(adminId)) {
      await AuditLogService.logAction({
        action: 'USER_RESTORED',
        adminUser: adminId,
        targetUser: user._id.toString(),
      });
    }

    return user;
  }

  static async getPaginatedUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const queryFilter: any = {
      isDeleted: { $ne: true },
      role: { $ne: ROLES.ADMIN },
      email: { $ne: 'admin@gmail.com' },
    };

    if (params.search && params.search.trim()) {
      const regex = new RegExp(params.search.trim(), 'i');
      queryFilter.$or = [{ name: regex }, { email: regex }, { username: regex }, { phone: regex }];
    }

    if (params.role) queryFilter.role = params.role;
    if (params.status) queryFilter.status = params.status;

    const [users, total, pendingInvitedUsers] = await Promise.all([
      User.find(queryFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
      User.countDocuments(queryFilter),
      import('../models/invitedUser.model').then(({ InvitedUser }) =>
        InvitedUser.find({ isDeleted: false, status: { $ne: 'REVOKED' } })
      ).catch(() => []),
    ]);

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);

    const enrichedUsers = await Promise.all(
      users.map(async (usr) => {
        const [rels, activeSession, latestSession] = await Promise.all([
          Relationship.find({ 'members.user': usr._id, isDeleted: { $ne: true } }),
          Session.findOne({ user: usr._id, isValid: true, lastActiveAt: { $gte: fiveMinsAgo } }).sort({ lastActiveAt: -1 }),
          Session.findOne({ user: usr._id }).sort({ lastActiveAt: -1 }),
        ]);

        const primaryRel = rels[0];
        const relationshipName = primaryRel ? primaryRel.name : 'Independent Account';
        const relationshipType = primaryRel ? primaryRel.type : 'N/A';
        const partnerMember = primaryRel?.members.find((m) => m.user.toString() !== usr._id.toString());
        
        let partnerName = 'N/A';
        if (partnerMember) {
          const partnerDoc = await User.findById(partnerMember.user);
          if (partnerDoc) partnerName = partnerDoc.name;
        }

        return {
          id: usr._id.toString(),
          name: usr.name,
          username: usr.username || '',
          email: usr.email,
          phone: usr.phone || '',
          role: usr.role,
          status: usr.status,
          avatar: usr.avatar || '',
          relationshipName,
          relationshipType,
          partnerName,
          isOnline: !!activeSession,
          lastSeen: activeSession?.lastActiveAt || latestSession?.lastActiveAt || usr.lastLoginAt || usr.createdAt,
          lastLoginAt: usr.lastLoginAt || usr.createdAt,
          createdAt: usr.createdAt,
        };
      })
    );

    // Append pending invitation tokens so UsersTable & RelationshipMap stay 100% identical in count & content
    const registeredEmails = new Set(users.map((u) => u.email.toLowerCase()));
    const registeredIds = new Set(users.map((u) => u._id.toString()));

    const pendingUserItems = pendingInvitedUsers
      .filter((inv: any) => inv && inv._id && !registeredIds.has(inv._id.toString()) && (!inv.email || !registeredEmails.has(inv.email.toLowerCase())))
      .map((inv: any) => ({
        id: inv._id.toString(),
        name: inv.name || inv.relationshipName || 'Invited User',
        username: '',
        email: inv.email || 'Pending Token (User has not registered yet)',
        phone: '',
        role: inv.targetRole || 'INVITED_USER',
        status: 'PENDING_INVITE',
        avatar: inv.avatar || '',
        relationshipName: inv.relationshipName || 'Friendship',
        relationshipType: inv.relationshipType || 'Friendship',
        partnerName: inv.ownerName || 'Super Owner',
        tokenCode: inv.tokenCode,
        isOnline: false,
        lastSeen: inv.createdAt,
        lastLoginAt: inv.createdAt,
        createdAt: inv.createdAt,
      }));

    const allCombinedUsers = [...enrichedUsers, ...pendingUserItems];

    return {
      users: allCombinedUsers,
      pagination: {
        total: total + pendingUserItems.length,
        page,
        limit,
        totalPages: Math.ceil((total + pendingUserItems.length) / limit) || 1,
      },
    };
  }

  static async getUserDetailFull(userId: string) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('User record not found.', HTTP_STATUS.NOT_FOUND);
    }

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    const [rels, activeSession, latestSession, deviceCount] = await Promise.all([
      Relationship.find({ 'members.user': user._id, isDeleted: { $ne: true } }),
      Session.findOne({ user: user._id, isValid: true, lastActiveAt: { $gte: fiveMinsAgo } }).sort({ lastActiveAt: -1 }),
      Session.findOne({ user: user._id }).sort({ lastActiveAt: -1 }),
      Session.countDocuments({ user: user._id, isValid: true }),
    ]);

    const primaryRel = rels[0];
    const relationshipName = primaryRel ? primaryRel.name : 'Not Available';
    const relationshipType = primaryRel ? primaryRel.type : 'Not Available';
    const relationshipStatus = primaryRel ? primaryRel.status : 'Not Available';
    
    let partnerName = 'Not Available';
    let startDate = 'Not Available';

    if (primaryRel) {
      if (primaryRel.startDate) {
        startDate = new Date(primaryRel.startDate).toISOString().split('T')[0];
      }
      const partnerMember = primaryRel.members.find((m) => m.user.toString() !== user._id.toString());
      if (partnerMember) {
        const partnerDoc = await User.findById(partnerMember.user);
        if (partnerDoc) partnerName = partnerDoc.name;
      }
    }

    let createdByStr = 'System / Self Registration';
    if (user.deletedBy) {
      const creator = await User.findById(user.deletedBy);
      if (creator) createdByStr = creator.name;
    }

    return {
      id: user._id.toString(),
      name: user.name || 'Not Available',
      displayName: user.name || 'Not Available',
      username: user.username || 'Not Available',
      email: user.email || 'Not Available',
      phone: user.phone || 'Not Available',
      birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : 'Not Available',
      gender: user.gender || 'Not Available',
      bio: user.bio || 'Not Available',
      role: user.role || 'Not Available',
      avatar: user.avatar || '',
      coverImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800',
      relationshipName,
      relationshipType,
      relationshipStatus,
      partnerName,
      startDate,
      isOnline: !!activeSession,
      lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : 'Not Available',
      lastActiveAt: (activeSession?.lastActiveAt || latestSession?.lastActiveAt) ? new Date(activeSession?.lastActiveAt || latestSession?.lastActiveAt!).toISOString() : 'Not Available',
      accountStatus: user.status || 'Not Available',
      createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : 'Not Available',
      updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : 'Not Available',
      createdDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not Available',
      updatedDate: user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'Not Available',
      storageUsed: 'Unavailable',
      loginProvider: 'Email & Password',
      emailVerified: user.isEmailVerified ? 'Verified' : 'Unverified',
      createdBy: createdByStr,
      registeredDeviceCount: deviceCount || 1,
      lastKnownIp: latestSession?.ipAddress || 'Not Available',
      enabledFeatures: [
        { name: 'Private Vault', enabled: true },
        { name: 'Timeline & Memories', enabled: true },
        { name: 'Media Gallery', enabled: true },
        { name: 'Shared Music Player', enabled: true },
        { name: 'Listen Together Engine', enabled: true },
        { name: 'Interactive Calendar', enabled: true },
        { name: 'Couple Chat Engine', enabled: true },
        { name: 'Stealth Calculator Mode', enabled: user.role === ROLES.SUPER_OWNER || user.role === ROLES.CO_OWNER },
      ],
    };
  }

  static async exportUsersCSV(params: {
    search?: string;
    role?: string;
    status?: string;
  }): Promise<string> {
    const queryFilter: any = {
      isDeleted: { $ne: true },
      role: { $ne: ROLES.ADMIN },
      email: { $ne: 'admin@gmail.com' },
    };

    if (params.search && params.search.trim()) {
      const regex = new RegExp(params.search.trim(), 'i');
      queryFilter.$or = [{ name: regex }, { email: regex }, { username: regex }, { phone: regex }];
    }

    if (params.role) queryFilter.role = params.role;
    if (params.status) queryFilter.status = params.status;

    // Export ALL matching users across the DB
    const users = await User.find(queryFilter).sort({ createdAt: -1 }).select('-password');
    const headers = 'ID,Name,Username,Email,Phone,Role,Status,Created At\n';
    const rows = users
      .map(
        (u) =>
          `"${u._id}","${(u.name || '').replace(/"/g, '""')}","${(u.username || '').replace(/"/g, '""')}","${u.email}","${u.phone || ''}","${u.role}","${u.status}","${u.createdAt.toISOString()}"`
      )
      .join('\n');
    return headers + rows;
  }
}
