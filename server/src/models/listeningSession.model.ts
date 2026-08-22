import mongoose, { Document, Model, Schema } from 'mongoose';

export type SessionStatus = 'INVITED' | 'ACTIVE' | 'ENDED' | 'EXPIRED' | 'DECLINED';

export interface IListeningSession extends Document {
  _id: mongoose.Types.ObjectId;
  sessionId: string;
  host: mongoose.Types.ObjectId;
  participant: mongoose.Types.ObjectId;
  status: SessionStatus;
  currentSong?: any;
  currentTime: number;
  isPlaying: boolean;
  queue: any[];
  shuffle: boolean;
  repeat: string;
  lastHeartbeatHost?: Date;
  lastHeartbeatParticipant?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const listeningSessionSchema = new Schema<IListeningSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['INVITED', 'ACTIVE', 'ENDED', 'EXPIRED', 'DECLINED'],
      default: 'INVITED',
    },
    currentSong: { type: Schema.Types.Mixed, default: null },
    currentTime: { type: Number, default: 0 },
    isPlaying: { type: Boolean, default: false },
    queue: [Schema.Types.Mixed],
    shuffle: { type: Boolean, default: false },
    repeat: { type: String, default: 'none' },
    lastHeartbeatHost: { type: Date, default: Date.now },
    lastHeartbeatParticipant: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

listeningSessionSchema.index({ host: 1, participant: 1 });
listeningSessionSchema.index({ status: 1 });

export const ListeningSession: Model<IListeningSession> = mongoose.model<IListeningSession>(
  'ListeningSession',
  listeningSessionSchema
);
