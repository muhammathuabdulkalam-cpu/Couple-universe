import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger.config';

export interface YouTubeParticipant {
  userId: string;
  name: string;
  avatar?: string;
  socketId: string;
  isHost: boolean;
}

export interface YouTubeRoomState {
  roomId: string;
  videoId: string;
  videoTitle: string;
  thumbnail: string;
  channelTitle: string;
  isPlaying: boolean;
  currentTime: number;
  playbackUpdatedAt: number; // Date.now()
  controlMode: 'HOST' | 'COLLABORATIVE';
  hostId: string;
  participants: YouTubeParticipant[];
}

// Global In-Memory Map of Authoritative YouTube Listen Together Rooms
const youtubeRooms = new Map<string, YouTubeRoomState>();

/**
 * Helper to sanitize room state for client emission
 */
const getSanitizedRoomState = (state: YouTubeRoomState) => {
  return {
    roomId: state.roomId,
    videoId: state.videoId,
    videoTitle: state.videoTitle,
    thumbnail: state.thumbnail,
    channelTitle: state.channelTitle,
    isPlaying: state.isPlaying,
    currentTime: state.currentTime,
    playbackUpdatedAt: state.playbackUpdatedAt,
    controlMode: state.controlMode,
    hostId: state.hostId,
    participants: state.participants,
  };
};

export const registerYouTubeListenTogetherHandlers = (io: Server, socket: Socket) => {
  const user = (socket as any).user;
  if (!user) return;

  const currentUserId = user._id.toString();
  const userName = user.name || 'User';
  const userAvatar = user.avatar || '';

  // 1. Join YouTube Room
  socket.on('listen-together:join', (data: { roomId?: string; controlMode?: 'HOST' | 'COLLABORATIVE' }) => {
    try {
      const defaultRoomId = user.relationshipId
        ? `couple_${user.relationshipId.toString()}`
        : 'general_lounge';

      const roomId = data?.roomId || defaultRoomId;
      const roomSocketChannel = `yt_room_${roomId}`;

      socket.join(roomSocketChannel);

      let room = youtubeRooms.get(roomId);

      if (!room) {
        // Initialize new YouTube Listening Room with default track (Lofi Girl or romantic melody)
        room = {
          roomId,
          videoId: 'kJQP7kiw5Fk', // 100% embeddable official music video (Despacito)
          videoTitle: 'Luis Fonsi - Despacito ft. Daddy Yankee',
          thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
          channelTitle: 'Luis Fonsi',
          isPlaying: false,
          currentTime: 0,
          playbackUpdatedAt: Date.now(),
          controlMode: data?.controlMode || 'HOST',
          hostId: currentUserId,
          participants: [],
        };
        youtubeRooms.set(roomId, room);
      }

      // Add or update participant
      const existingPartIndex = room.participants.findIndex((p) => p.userId === currentUserId);
      const isHost = room.hostId === currentUserId || room.participants.length === 0;

      if (isHost && room.hostId !== currentUserId) {
        room.hostId = currentUserId;
      }

      const participantObj: YouTubeParticipant = {
        userId: currentUserId,
        name: userName,
        avatar: userAvatar,
        socketId: socket.id,
        isHost,
      };

      if (existingPartIndex >= 0) {
        room.participants[existingPartIndex] = participantObj;
      } else {
        room.participants.push(participantObj);
      }

      logger.info(`🎵 User ${userName} (${currentUserId}) joined YouTube room: ${roomId}`);

      // Broadcast authoritative state to room & emit directly back to joiner
      const statePayload = getSanitizedRoomState(room);
      io.to(roomSocketChannel).emit('listen-together:state', statePayload);
      socket.emit('listen-together:state', statePayload);
    } catch (err: any) {
      logger.error('Error handling listen-together:join:', err);
    }
  });

  // 2. Leave YouTube Room
  socket.on('listen-together:leave', (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      if (!roomId) return;

      const roomSocketChannel = `yt_room_${roomId}`;
      socket.leave(roomSocketChannel);

      const room = youtubeRooms.get(roomId);
      if (room) {
        room.participants = room.participants.filter((p) => p.userId !== currentUserId);

        if (room.participants.length === 0) {
          // Clean up empty room
          youtubeRooms.delete(roomId);
          logger.info(`🧹 Closed empty YouTube room: ${roomId}`);
        } else {
          // Transfer host role if host left
          if (room.hostId === currentUserId) {
            room.hostId = room.participants[0].userId;
            room.participants[0].isHost = true;
          }
          io.to(roomSocketChannel).emit('listen-together:state', getSanitizedRoomState(room));
        }
      }
    } catch (err: any) {
      logger.error('Error handling listen-together:leave:', err);
    }
  });

  // Helper authorization validator
  const canControl = (room: YouTubeRoomState): boolean => {
    if (room.controlMode === 'COLLABORATIVE') return true;
    return room.hostId === currentUserId;
  };

  // 3. Video Change Event Sync
  socket.on('listen-together:video-change', (data: {
    roomId: string;
    videoId: string;
    videoTitle?: string;
    thumbnail?: string;
    channelTitle?: string;
  }) => {
    try {
      const { roomId, videoId, videoTitle, thumbnail, channelTitle } = data;
      const room = youtubeRooms.get(roomId);
      if (!room) return;

      if (!canControl(room)) {
        socket.emit('listen-together:error', { message: 'Only the room host can change videos in Host Control mode.' });
        return;
      }

      room.videoId = videoId;
      room.videoTitle = videoTitle || 'YouTube Video';
      room.thumbnail = thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      room.channelTitle = channelTitle || '';
      room.currentTime = 0;
      room.isPlaying = true;
      room.playbackUpdatedAt = Date.now();

      const roomSocketChannel = `yt_room_${roomId}`;
      const payload = {
        senderId: currentUserId,
        ...getSanitizedRoomState(room),
      };

      logger.info(`🎬 Video changed in room ${roomId} to [${videoId}] by ${userName}`);
      io.to(roomSocketChannel).emit('listen-together:video-change', payload);
      io.to(roomSocketChannel).emit('listen-together:state', getSanitizedRoomState(room));
    } catch (err: any) {
      logger.error('Error handling listen-together:video-change:', err);
    }
  });

  // 4. Play Sync Event
  socket.on('listen-together:play', (data: { roomId: string; currentTime?: number }) => {
    try {
      const { roomId, currentTime } = data;
      const room = youtubeRooms.get(roomId);
      if (!room) return;

      if (!canControl(room)) {
        socket.emit('listen-together:error', { message: 'Only the room host can play/pause in Host Control mode.' });
        return;
      }

      room.isPlaying = true;
      if (typeof currentTime === 'number') {
        room.currentTime = currentTime;
      }
      room.playbackUpdatedAt = Date.now();

      const roomSocketChannel = `yt_room_${roomId}`;
      const payload = {
        senderId: currentUserId,
        ...getSanitizedRoomState(room),
      };

      logger.info(`▶️ Play in YouTube room ${roomId} at ${room.currentTime}s by ${userName}`);
      socket.to(roomSocketChannel).emit('listen-together:play', payload);
      io.to(roomSocketChannel).emit('listen-together:state', getSanitizedRoomState(room));
    } catch (err: any) {
      logger.error('Error handling listen-together:play:', err);
    }
  });

  // 5. Pause Sync Event
  socket.on('listen-together:pause', (data: { roomId: string; currentTime?: number }) => {
    try {
      const { roomId, currentTime } = data;
      const room = youtubeRooms.get(roomId);
      if (!room) return;

      if (!canControl(room)) {
        socket.emit('listen-together:error', { message: 'Only the room host can play/pause in Host Control mode.' });
        return;
      }

      room.isPlaying = false;
      if (typeof currentTime === 'number') {
        room.currentTime = currentTime;
      }
      room.playbackUpdatedAt = Date.now();

      const roomSocketChannel = `yt_room_${roomId}`;
      const payload = {
        senderId: currentUserId,
        ...getSanitizedRoomState(room),
      };

      logger.info(`⏸ Pause in YouTube room ${roomId} at ${room.currentTime}s by ${userName}`);
      socket.to(roomSocketChannel).emit('listen-together:pause', payload);
      io.to(roomSocketChannel).emit('listen-together:state', getSanitizedRoomState(room));
    } catch (err: any) {
      logger.error('Error handling listen-together:pause:', err);
    }
  });

  // 6. Seek Sync Event
  socket.on('listen-together:seek', (data: { roomId: string; currentTime: number }) => {
    try {
      const { roomId, currentTime } = data;
      const room = youtubeRooms.get(roomId);
      if (!room) return;

      if (!canControl(room)) {
        socket.emit('listen-together:error', { message: 'Only the room host can seek in Host Control mode.' });
        return;
      }

      room.currentTime = currentTime;
      room.playbackUpdatedAt = Date.now();

      const roomSocketChannel = `yt_room_${roomId}`;
      const payload = {
        senderId: currentUserId,
        ...getSanitizedRoomState(room),
      };

      logger.info(`⏩ Seek in YouTube room ${roomId} to ${currentTime}s by ${userName}`);
      socket.to(roomSocketChannel).emit('listen-together:seek', payload);
      io.to(roomSocketChannel).emit('listen-together:state', getSanitizedRoomState(room));
    } catch (err: any) {
      logger.error('Error handling listen-together:seek:', err);
    }
  });

  // 7. Request State Sync
  socket.on('listen-together:sync', (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      const room = youtubeRooms.get(roomId);
      if (room) {
        socket.emit('listen-together:state', getSanitizedRoomState(room));
      }
    } catch (err: any) {
      logger.error('Error handling listen-together:sync:', err);
    }
  });

  // 8. Control Mode Switch (Host vs Collaborative)
  socket.on('listen-together:mode-change', (data: { roomId: string; controlMode: 'HOST' | 'COLLABORATIVE' }) => {
    try {
      const { roomId, controlMode } = data;
      const room = youtubeRooms.get(roomId);
      if (!room) return;

      if (room.hostId !== currentUserId) {
        socket.emit('listen-together:error', { message: 'Only the room host can change control mode.' });
        return;
      }

      room.controlMode = controlMode;
      const roomSocketChannel = `yt_room_${roomId}`;
      logger.info(`🔄 Control mode updated in room ${roomId} to [${controlMode}] by host ${userName}`);
      io.to(roomSocketChannel).emit('listen-together:state', getSanitizedRoomState(room));
    } catch (err: any) {
      logger.error('Error handling listen-together:mode-change:', err);
    }
  });

  // 9. Socket Disconnect Auto Cleanup
  socket.on('disconnect', () => {
    try {
      for (const [roomId, room] of youtubeRooms.entries()) {
        const pIndex = room.participants.findIndex((p) => p.socketId === socket.id);
        if (pIndex >= 0) {
          room.participants.splice(pIndex, 1);
          const roomSocketChannel = `yt_room_${roomId}`;

          if (room.participants.length === 0) {
            youtubeRooms.delete(roomId);
            logger.info(`🧹 Cleaned up empty YouTube room after disconnect: ${roomId}`);
          } else {
            if (room.hostId === currentUserId) {
              room.hostId = room.participants[0].userId;
              room.participants[0].isHost = true;
            }
            io.to(roomSocketChannel).emit('listen-together:state', getSanitizedRoomState(room));
          }
        }
      }
    } catch (err: any) {
      logger.error('Error handling YouTube disconnect cleanup:', err);
    }
  });
};
