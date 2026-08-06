import mongoose from 'mongoose';
import { HTTP_STATUS, ROLES, USER_STATUS, UserRole, UserStatus } from '../constants';
import { Relationship } from '../models/relationship.model';
import { User, IUser } from '../models/user.model';
import { AppError } from '../utils/AppError';
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
  static async createUser(input: CreateUserInput): Promise<IUser> {
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

    return newUser;
  }

  static async updateUser(id: string, input: UpdateUserInput): Promise<IUser> {
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
        targetRel.members.push({ user: user._id, role: user.role === ROLES.SUPER_OWNER || user.role === ROLES.CO_OWNER ? 'OWNER' : 'MEMBER', joinedAt: new Date() });
        await targetRel.save();
      }
    }

    return user;
  }

  static async setStatus(id: string, status: UserStatus): Promise<IUser> {
    const user = await User.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!user) {
      throw new AppError('User record not found.', HTTP_STATUS.NOT_FOUND);
    }
    user.status = status;
    await user.save();
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

    const queryFilter: any = { isDeleted: { $ne: true } };

    if (params.search && params.search.trim()) {
      const regex = new RegExp(params.search.trim(), 'i');
      queryFilter.$or = [{ name: regex }, { email: regex }, { username: regex }, { phone: regex }];
    }

    if (params.role) queryFilter.role = params.role;
    if (params.status) queryFilter.status = params.status;

    const [users, total] = await Promise.all([
      User.find(queryFilter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
      User.countDocuments(queryFilter),
    ]);

    // Resolve relationships via Relationship.find({ 'members.user': userId })
    const enrichedUsers = await Promise.all(
      users.map(async (usr) => {
        const rels = await Relationship.find({ 'members.user': usr._id, isDeleted: { $ne: true } });
        const primaryRel = rels[0];
        const relationshipName = primaryRel ? primaryRel.name : 'Independent Account';
        const relationshipType = primaryRel ? primaryRel.type : 'N/A';

        return {
          id: usr._id,
          name: usr.name,
          username: usr.username || '',
          email: usr.email,
          phone: usr.phone || '',
          role: usr.role,
          status: usr.status,
          avatar: usr.avatar || '',
          relationshipName,
          relationshipType,
          isOnline: false,
          lastLoginAt: usr.lastLoginAt || usr.createdAt,
          createdAt: usr.createdAt,
        };
      })
    );

    return {
      users: enrichedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async exportUsersCSV(): Promise<string> {
    const users = await User.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 }).select('-password');
    const headers = 'ID,Name,Email,Phone,Role,Status,Created At\n';
    const rows = users
      .map(
        (u) =>
          `"${u._id}","${u.name.replace(/"/g, '""')}","${u.email}","${u.phone || ''}","${u.role}","${u.status}","${u.createdAt.toISOString()}"`
      )
      .join('\n');
    return headers + rows;
  }
}
