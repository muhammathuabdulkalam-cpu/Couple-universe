import mongoose from 'mongoose';
import { HTTP_STATUS } from '../constants';
import { Activity } from '../models/activity.model';
import { Album } from '../models/album.model';
import { Block } from '../models/block.model';
import { CalendarEvent } from '../models/calendarEvent.model';
import { Comment } from '../models/comment.model';
import { Conversation } from '../models/conversation.model';
import { DiaryEntry } from '../models/diary.model';
import { FavoriteSong } from '../models/favoriteSong.model';
import { Follow } from '../models/follow.model';
import { Invite } from '../models/invite.model';
import { BucketItem, Countdown, Goal, MemoryCapsule, MoodEntry, Note, WishlistItem } from '../models/lifeExperience.model';
import { ListeningSession } from '../models/listeningSession.model';
import { Media } from '../models/media.model';
import { Message } from '../models/message.model';
import { MusicActivity } from '../models/musicActivity.model';
import { Notification } from '../models/notification.model';
import { Playlist } from '../models/playlist.model';
import { PlaylistSong } from '../models/playlistSong.model';
import { Reaction } from '../models/reaction.model';
import { RecentlyPlayed } from '../models/recentlyPlayed.model';
import { Relationship, IRelationship } from '../models/relationship.model';
import { Report } from '../models/report.model';
import { Session } from '../models/session.model';
import { Song } from '../models/song.model';
import { SongDedication } from '../models/songDedication.model';
import { StealthConfig } from '../models/stealthConfig.model';
import { Story } from '../models/story.model';
import { TimelineEvent } from '../models/timelineEvent.model';
import { User } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { AuditLogService } from './auditLog.service';

export const purgeUserAndAllData = async (userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) return;
  const userObjId = new mongoose.Types.ObjectId(userId);

  // Protection: System Admin accounts can NEVER be purged
  const targetUser = await User.findById(userId);
  if (targetUser && (targetUser.role === 'ADMIN' || targetUser.email === 'admin@gmail.com')) {
    return;
  }

  // 1. Permanently delete user document from User collection
  await User.findByIdAndDelete(userId);

  // 2. Remove user from all Relationship members arrays
  await Relationship.updateMany(
    { 'members.user': userObjId },
    { $pull: { members: { user: userObjId } } }
  );

  // 3. Delete any relationships created by this user or that have no members left
  await Relationship.deleteMany({
    $or: [{ createdBy: userObjId }, { members: { $size: 0 } }],
  });

  // 4. Delete all Invites created by or used by this user
  await Invite.deleteMany({
    $or: [{ usedBy: userObjId }, { createdBy: userObjId }],
  });

  // 5. Delete all Sessions & Auth Tokens for this user
  await Session.deleteMany({ user: userObjId });

  // 6. Deep Cascade delete across ALL user content & social MongoDB collections:
  await Promise.all([
    Media.deleteMany({ uploadedBy: userObjId }),
    TimelineEvent.deleteMany({ createdBy: userObjId }),
    Album.deleteMany({ createdBy: userObjId }),
    Story.deleteMany({ user: userObjId }),
    Song.deleteMany({ uploadedBy: userObjId }),
    Activity.deleteMany({ $or: [{ userId: userObjId }, { actor: userObjId }] }),
    Block.deleteMany({ $or: [{ blocker: userObjId }, { blocked: userObjId }] }),
    CalendarEvent.deleteMany({ $or: [{ createdBy: userObjId }, { participants: userObjId }] }),
    Comment.deleteMany({ $or: [{ author: userObjId }, { user: userObjId }] }),
    Conversation.deleteMany({ participants: userObjId }),
    DiaryEntry.deleteMany({ $or: [{ createdBy: userObjId }, { relationshipId: userId }] }),
    FavoriteSong.deleteMany({ $or: [{ user: userObjId }, { userId: userObjId }] }),
    Follow.deleteMany({ $or: [{ follower: userObjId }, { following: userObjId }] }),
    BucketItem.deleteMany({ createdBy: userObjId }),
    WishlistItem.deleteMany({ createdBy: userObjId }),
    Goal.deleteMany({ createdBy: userObjId }),
    MoodEntry.deleteMany({ userId: userObjId }),
    Note.deleteMany({ createdBy: userObjId }),
    MemoryCapsule.deleteMany({ createdBy: userObjId }),
    Countdown.deleteMany({ createdBy: userObjId }),
    ListeningSession.deleteMany({ $or: [{ host: userObjId }, { participants: userObjId }] }),
    Message.deleteMany({ $or: [{ sender: userObjId }, { recipient: userObjId }] }),
    MusicActivity.deleteMany({ $or: [{ user: userObjId }, { userId: userObjId }] }),
    Notification.deleteMany({ $or: [{ recipient: userObjId }, { sender: userObjId }] }),
    Playlist.deleteMany({ $or: [{ createdBy: userObjId }, { user: userObjId }] }),
    PlaylistSong.deleteMany({ addedBy: userObjId }),
    Reaction.deleteMany({ $or: [{ user: userObjId }, { userId: userObjId }] }),
    RecentlyPlayed.deleteMany({ $or: [{ user: userObjId }, { userId: userObjId }] }),
    Report.deleteMany({ $or: [{ reporter: userObjId }, { reported: userObjId }] }),
    SongDedication.deleteMany({ $or: [{ sender: userObjId }, { recipient: userObjId }] }),
    StealthConfig.deleteMany({ user: userObjId }),
  ]);
};

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

  static async archiveRelationship(id: string, adminId?: string): Promise<IRelationship | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const rel = await Relationship.findById(id);
    if (!rel) {
      await Invite.deleteMany({ relationship: id });
      return null;
    }

    // 1. Delete relationship from database
    await Relationship.findByIdAndDelete(id);

    // 2. Delete all invitation tokens linked to this relationship
    await Invite.deleteMany({ relationship: rel._id });

    // 3. Purge all member users linked to this relationship (except Super Owner / Co Owner)
    if (rel.members && Array.isArray(rel.members)) {
      for (const m of rel.members) {
        const memberId = m.user?.toString();
        if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
          const u = await User.findById(memberId);
          if (u && !['SUPER_OWNER', 'CO_OWNER'].includes(u.role)) {
            await purgeUserAndAllData(memberId);
          }
        }
      }
    }

    if (adminId) {
      await AuditLogService.logAction({
        action: 'RELATIONSHIP_ARCHIVED',
        adminUser: adminId,
        targetRelationship: rel._id.toString(),
      });
    }

    return rel;
  }

  static async deleteRelationship(id: string, adminId?: string): Promise<IRelationship | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const rel = await Relationship.findById(id);
    if (!rel) {
      await Invite.deleteMany({ relationship: id });
      return null;
    }

    // 1. Delete relationship from database
    await Relationship.findByIdAndDelete(id);

    // 2. Delete all invitation tokens linked to this relationship
    await Invite.deleteMany({ relationship: rel._id });

    // 3. Purge all member users linked to this relationship (except Super Owner / Co Owner)
    if (rel.members && Array.isArray(rel.members)) {
      for (const m of rel.members) {
        const memberId = m.user?.toString();
        if (memberId && mongoose.Types.ObjectId.isValid(memberId)) {
          const u = await User.findById(memberId);
          if (u && !['SUPER_OWNER', 'CO_OWNER'].includes(u.role)) {
            await purgeUserAndAllData(memberId);
          }
        }
      }
    }

    if (adminId) {
      await AuditLogService.logAction({
        action: 'RELATIONSHIP_DELETED',
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
