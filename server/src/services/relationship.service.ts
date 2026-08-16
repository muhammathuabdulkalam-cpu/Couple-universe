import mongoose from 'mongoose';
import { HTTP_STATUS } from '../constants';
import { Album } from '../models/album.model';
import { Media } from '../models/media.model';
import { Relationship, IRelationship } from '../models/relationship.model';
import { Song } from '../models/song.model';
import { Story } from '../models/story.model';
import { TimelineEvent } from '../models/timelineEvent.model';
import { User } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { AuditLogService } from './auditLog.service';

export interface CreateRelationshipInput {
  name: string;
  type?: string;
  coverImage?: string;
  startDate?: string;
  description?: string;
  members?: Array<{ userId: string; role?: string }>;
  status?: 'ACTIVE' | 'ARCHIVED';
  createdBy?: string;
}

export interface UpdateRelationshipInput {
  name?: string;
  type?: string;
  coverImage?: string;
  startDate?: string;
  description?: string;
  status?: 'ACTIVE' | 'ARCHIVED';
}

export class RelationshipService {
  static async createRelationship(input: CreateRelationshipInput): Promise<IRelationship> {
    if (!input.name || !input.name.trim()) {
      throw new AppError('Relationship name is required.', HTTP_STATUS.BAD_REQUEST);
    }

    const membersPayload: Array<{ user: mongoose.Types.ObjectId; role: string; joinedAt: Date }> = [];
    if (input.members && Array.isArray(input.members)) {
      for (const m of input.members) {
        if (mongoose.Types.ObjectId.isValid(m.userId)) {
          membersPayload.push({
            user: new mongoose.Types.ObjectId(m.userId),
            role: m.role || 'MEMBER',
            joinedAt: new Date(),
          });
        }
      }
    }

    const newRel = await Relationship.create({
      name: input.name.trim(),
      type: input.type || 'Couple',
      coverImage: input.coverImage || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800',
      startDate: input.startDate ? new Date(input.startDate) : new Date(),
      description: input.description || '',
      members: membersPayload,
      status: input.status || 'ACTIVE',
      createdBy: input.createdBy && mongoose.Types.ObjectId.isValid(input.createdBy) ? new mongoose.Types.ObjectId(input.createdBy) : undefined,
    });

    if (input.createdBy && mongoose.Types.ObjectId.isValid(input.createdBy)) {
      await AuditLogService.logAction({
        action: 'RELATIONSHIP_CREATED',
        adminUser: input.createdBy,
        targetRelationship: newRel._id.toString(),
        metadata: { name: newRel.name, type: newRel.type },
      });
    }

    return newRel;
  }

  static async updateRelationship(id: string, input: UpdateRelationshipInput, adminId?: string): Promise<IRelationship> {
    const rel = await Relationship.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!rel) {
      throw new AppError('Relationship record not found.', HTTP_STATUS.NOT_FOUND);
    }

    if (input.name !== undefined) rel.name = input.name.trim();
    if (input.type !== undefined) rel.type = input.type as any;
    if (input.coverImage !== undefined) rel.coverImage = input.coverImage;
    if (input.startDate) rel.startDate = new Date(input.startDate);
    if (input.description !== undefined) rel.description = input.description;
    if (input.status !== undefined) rel.status = input.status;

    await rel.save();

    if (adminId) {
      await AuditLogService.logAction({
        action: 'RELATIONSHIP_UPDATED',
        adminUser: adminId,
        targetRelationship: rel._id.toString(),
        metadata: input,
      });
    }

    return rel;
  }

  static async addMember(relationshipId: string, userId: string, role: string = 'MEMBER', session?: mongoose.ClientSession): Promise<IRelationship> {
    const relQuery = Relationship.findOne({ _id: relationshipId, isDeleted: { $ne: true } });
    if (session) relQuery.session(session);
    const rel = await relQuery.exec();

    if (!rel) {
      throw new AppError('Relationship record not found.', HTTP_STATUS.NOT_FOUND);
    }
    const userExistsQuery = User.exists({ _id: userId, isDeleted: { $ne: true } });
    if (session) userExistsQuery.session(session);
    const userExists = await userExistsQuery.exec();

    if (!userExists) {
      throw new AppError('Target user does not exist.', HTTP_STATUS.NOT_FOUND);
    }

    const isAlreadyMember = rel.members.some((m) => m.user.toString() === userId);
    if (!isAlreadyMember) {
      rel.members.push({
        user: new mongoose.Types.ObjectId(userId),
        role,
        joinedAt: new Date(),
      });
      await rel.save({ session });
    }
    return rel;
  }

  static async removeMember(relationshipId: string, userId: string): Promise<IRelationship> {
    const rel = await Relationship.findOne({ _id: relationshipId, isDeleted: { $ne: true } });
    if (!rel) {
      throw new AppError('Relationship record not found.', HTTP_STATUS.NOT_FOUND);
    }
    rel.members = rel.members.filter((m) => m.user.toString() !== userId);
    await rel.save();
    return rel;
  }

  static async replaceMember(relationshipId: string, oldUserId: string, newUserId: string): Promise<IRelationship> {
    await this.removeMember(relationshipId, oldUserId);
    return this.addMember(relationshipId, newUserId);
  }

  static async archiveRelationship(id: string, adminId?: string): Promise<IRelationship> {
    const rel = await Relationship.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!rel) {
      throw new AppError('Relationship record not found.', HTTP_STATUS.NOT_FOUND);
    }
    rel.status = 'ARCHIVED';
    await rel.save();

    if (adminId) {
      await AuditLogService.logAction({
        action: 'RELATIONSHIP_ARCHIVED',
        adminUser: adminId,
        targetRelationship: rel._id.toString(),
      });
    }

    return rel;
  }

  static async restoreRelationship(id: string, adminId?: string): Promise<IRelationship> {
    const rel = await Relationship.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!rel) {
      throw new AppError('Relationship record not found.', HTTP_STATUS.NOT_FOUND);
    }
    rel.status = 'ACTIVE';
    await rel.save();

    if (adminId) {
      await AuditLogService.logAction({
        action: 'RELATIONSHIP_RESTORED',
        adminUser: adminId,
        targetRelationship: rel._id.toString(),
      });
    }

    return rel;
  }

  static async getRelationships(search?: string, type?: string, status?: string) {
    const queryFilter: any = { isDeleted: { $ne: true } };

    if (search && search.trim()) {
      queryFilter.name = new RegExp(search.trim(), 'i');
    }
    if (type) queryFilter.type = type;
    if (status) queryFilter.status = status;

    const relationships = await Relationship.find(queryFilter)
      .sort({ createdAt: -1 })
      .populate('members.user', 'name email avatar role');

    // Aggregate DB Counts
    const [totalMemories, totalAlbums, totalStories, totalSharedSongs, photosCount, videosCount] = await Promise.all([
      TimelineEvent.countDocuments(),
      Album.countDocuments(),
      Story.countDocuments(),
      Song.countDocuments(),
      Media.countDocuments({ mimeType: /^image\//i, isDeleted: { $ne: true } }),
      Media.countDocuments({ mimeType: /^video\//i, isDeleted: { $ne: true } }),
    ]);

    return relationships.map((rel) => {
      const start = rel.startDate ? new Date(rel.startDate) : new Date();
      const diffMs = Date.now() - start.getTime();
      const daysTogether = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      return {
        id: rel._id,
        name: rel.name,
        type: rel.type,
        coverImage: rel.coverImage,
        startDate: start.toISOString().split('T')[0],
        description: rel.description || '',
        daysTogether,
        status: rel.status,
        members: rel.members.map((m: any) => ({
          id: m.user?._id || m.user,
          name: m.user?.name || 'Member User',
          email: m.user?.email || '',
          role: m.role || 'MEMBER',
          avatar: m.user?.avatar || '',
        })),
        stats: {
          members: rel.members.length,
          totalMemories,
          totalAlbums,
          totalStories,
          totalSharedSongs,
          photos: photosCount,
          videos: videosCount,
          storageUsed: 'Unavailable',
        },
        createdDate: rel.createdAt.toISOString().split('T')[0],
      };
    });
  }
}
