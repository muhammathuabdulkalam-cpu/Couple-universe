import mongoose, { Document, Model, Schema } from 'mongoose';

// ----------------------------------------------------
// 1. Bucket List Item Schema
// ----------------------------------------------------
export interface IBucketItem extends Document {
  _id: mongoose.Types.ObjectId;
  relationshipId: string;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  completedDate?: Date;
  mediaId?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bucketItemSchema = new Schema<IBucketItem>(
  {
    relationshipId: { type: String, default: 'AFZAL_AMRIN_AFRIN_VERSE', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, default: 'TRAVEL' },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    status: { type: String, enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED'], default: 'PLANNED', index: true },
    completedDate: { type: Date },
    mediaId: { type: Schema.Types.ObjectId, ref: 'Media' },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const BucketItem: Model<IBucketItem> = mongoose.model<IBucketItem>('BucketItem', bucketItemSchema);

// ----------------------------------------------------
// 2. Wishlist Item Schema
// ----------------------------------------------------
export interface IWishlistItem extends Document {
  _id: mongoose.Types.ObjectId;
  relationshipId: string;
  createdBy: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  imageMediaId?: mongoose.Types.ObjectId;
  price?: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'WISHED' | 'PURCHASED';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    relationshipId: { type: String, default: 'AFZAL_AMRIN_AFRIN_VERSE', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageMediaId: { type: Schema.Types.ObjectId, ref: 'Media' },
    price: { type: Number },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
    status: { type: String, enum: ['WISHED', 'PURCHASED'], default: 'WISHED', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const WishlistItem: Model<IWishlistItem> = mongoose.model<IWishlistItem>('WishlistItem', wishlistItemSchema);

// ----------------------------------------------------
// 3. Relationship Goal Schema
// ----------------------------------------------------
export interface IGoal extends Document {
  _id: mongoose.Types.ObjectId;
  relationshipId: string;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  progress: number; // 0 to 100
  targetDate?: Date;
  status: 'ACTIVE' | 'ACHIEVED' | 'PAUSED';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const goalSchema = new Schema<IGoal>(
  {
    relationshipId: { type: String, default: 'AFZAL_AMRIN_AFRIN_VERSE', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    targetDate: { type: Date },
    status: { type: String, enum: ['ACTIVE', 'ACHIEVED', 'PAUSED'], default: 'ACTIVE', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Goal: Model<IGoal> = mongoose.model<IGoal>('Goal', goalSchema);

// ----------------------------------------------------
// 4. Daily Mood Entry Schema
// ----------------------------------------------------
export interface IMoodEntry extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  relationshipId: string;
  mood: 'HAPPY' | 'LOVED' | 'SAD' | 'EXCITED' | 'ANGRY' | 'TIRED';
  note?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const moodEntrySchema = new Schema<IMoodEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    relationshipId: { type: String, default: 'AFZAL_AMRIN_AFRIN_VERSE', index: true },
    mood: { type: String, enum: ['HAPPY', 'LOVED', 'SAD', 'EXCITED', 'ANGRY', 'TIRED'], default: 'HAPPY' },
    note: { type: String, trim: true },
    date: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export const MoodEntry: Model<IMoodEntry> = mongoose.model<IMoodEntry>('MoodEntry', moodEntrySchema);

// ----------------------------------------------------
// 5. Shared Note Schema
// ----------------------------------------------------
export interface INote extends Document {
  _id: mongoose.Types.ObjectId;
  relationshipId: string;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  content: string;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    relationshipId: { type: String, default: 'AFZAL_AMRIN_AFRIN_VERSE', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    isPinned: { type: Boolean, default: false, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Note: Model<INote> = mongoose.model<INote>('Note', noteSchema);

// ----------------------------------------------------
// 6. Memory Capsule Schema
// ----------------------------------------------------
export interface IMemoryCapsule extends Document {
  _id: mongoose.Types.ObjectId;
  relationshipId: string;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  unlockDate: Date;
  mediaIds: mongoose.Types.ObjectId[];
  message?: string;
  status: 'LOCKED' | 'UNLOCKED';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const memoryCapsuleSchema = new Schema<IMemoryCapsule>(
  {
    relationshipId: { type: String, default: 'AFZAL_AMRIN_AFRIN_VERSE', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    unlockDate: { type: Date, required: true, index: true },
    mediaIds: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
    message: { type: String, trim: true },
    status: { type: String, enum: ['LOCKED', 'UNLOCKED'], default: 'LOCKED', index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const MemoryCapsule: Model<IMemoryCapsule> = mongoose.model<IMemoryCapsule>('MemoryCapsule', memoryCapsuleSchema);

// ----------------------------------------------------
// 7. Countdown Schema
// ----------------------------------------------------
export interface ICountdown extends Document {
  _id: mongoose.Types.ObjectId;
  relationshipId: string;
  createdBy: mongoose.Types.ObjectId;
  title: string;
  targetDate: Date;
  type: 'ANNIVERSARY' | 'BIRTHDAY' | 'TRIP' | 'GOAL' | 'CUSTOM';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const countdownSchema = new Schema<ICountdown>(
  {
    relationshipId: { type: String, default: 'AFZAL_AMRIN_AFRIN_VERSE', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    targetDate: { type: Date, required: true, index: true },
    type: { type: String, enum: ['ANNIVERSARY', 'BIRTHDAY', 'TRIP', 'GOAL', 'CUSTOM'], default: 'CUSTOM' },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const Countdown: Model<ICountdown> = mongoose.model<ICountdown>('Countdown', countdownSchema);
