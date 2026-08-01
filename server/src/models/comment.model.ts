import mongoose, { Document, Model, Schema } from 'mongoose';

export type CommentTargetType = 'MEMORY' | 'STORY' | 'ACTIVITY';

export interface IComment extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  targetType: CommentTargetType;
  targetId: mongoose.Types.ObjectId;
  content: string;
  parentCommentId?: mongoose.Types.ObjectId;
  likedBy: mongoose.Types.ObjectId[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: {
      type: String,
      enum: ['MEMORY', 'STORY', 'ACTIVITY'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    likedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

commentSchema.index({ targetId: 1, targetType: 1, createdAt: -1 });
commentSchema.index({ parentCommentId: 1 });

export const Comment: Model<IComment> = mongoose.model<IComment>('Comment', commentSchema);
