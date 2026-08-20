import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger.config';
import { ListeningSession } from '../models/listeningSession.model';
import { User } from '../models/user.model';

export const registerListenTogetherHandlers = (io: Server, socket: Socket) => {
  const user = (socket as any).user;
  if (!user) return;

  // Only SUPER_OWNER and CO_OWNER can participate in Listen Together
  if (user.role !== 'SUPER_OWNER' && user.role !== 'CO_OWNER') {
    return;
  }

  const getPartnerUser = async () => {
    // Only SUPER_OWNER and CO_OWNER can use Listen Together
    const partner = await User.findOne({
      _id: { $ne: user._id },
      role: { $in: ['SUPER_OWNER', 'CO_OWNER'] },
    }).select('_id name email role avatar');
    return partner;
  };

  // 1. Scope Listen Room per Relationship & Couple Room
  const roomName = `listen_room_${user.relationshipId ? user.relationshipId.toString() : 'couple_default'}`;
  socket.join(roomName);
  socket.join('listen_together_couple_room');

  const broadcastListenEvent = (event: string, payload: any) => {
    io.to(roomName).emit(event, payload);
    io.to('listen_together_couple_room').emit(event, payload);
  };

  // 2. Heartbeat Ping Handler (Every 10s from client)
  socket.on('listen:heartbeat', async () => {
    try {
      const activeSession = await ListeningSession.findOne({
        $or: [{ host: user._id }, { participant: user._id }],
        status: 'ACTIVE',
      });

      if (!activeSession) return;

      const isHost = activeSession.host.toString() === user._id.toString();
      const now = new Date();

      if (isHost) {
        activeSession.lastHeartbeatHost = now;
      } else {
        activeSession.lastHeartbeatParticipant = now;
      }
      await activeSession.save();

      // Check for inactivity timeout (100 seconds)
      const hostDiff = (now.getTime() - new Date(activeSession.lastHeartbeatHost!).getTime()) / 1000;
      const partDiff = (now.getTime() - new Date(activeSession.lastHeartbeatParticipant!).getTime()) / 1000;

      if (hostDiff > 100 || partDiff > 100) {
        activeSession.status = 'ENDED';
        await activeSession.save();

        broadcastListenEvent('listen:end', {
          reason: 'Listening session ended because your partner became inactive.',
          sessionId: activeSession.sessionId,
        });
      }
    } catch (err: any) {
      logger.error('Error handling listen:heartbeat:', err);
    }
  });

  // 3. Play Event Sync
  socket.on('listen:play', (data: { sessionId: string; currentTime?: number; track?: any }) => {
    try {
      logger.info(`[Socket Server] Received listen:play from ${user.name} (${user._id}), time=${data.currentTime}, track=${data.track?.title || 'unknown'}`);
      broadcastListenEvent('listen:play', {
        senderId: user._id.toString(),
        currentTime: data.currentTime || 0,
        track: data.track,
      });

      ListeningSession.findOneAndUpdate(
        { sessionId: data.sessionId },
        { isPlaying: true, currentTime: data.currentTime || 0 }
      ).catch((err) => logger.error('Error updating listen session play state:', err));
    } catch (err) {
      logger.error('Error handling listen:play:', err);
    }
  });

  // 4. Pause Event Sync
  socket.on('listen:pause', (data: { sessionId: string; currentTime?: number }) => {
    try {
      logger.info(`[Socket Server] Received listen:pause from ${user.name} (${user._id}), time=${data.currentTime}`);
      broadcastListenEvent('listen:pause', {
        senderId: user._id.toString(),
        currentTime: data.currentTime || 0,
      });

      ListeningSession.findOneAndUpdate(
        { sessionId: data.sessionId },
        { isPlaying: false, currentTime: data.currentTime || 0 }
      ).catch((err) => logger.error('Error updating listen session pause state:', err));
    } catch (err) {
      logger.error('Error handling listen:pause:', err);
    }
  });

  // 5. Seek Event Sync
  socket.on('listen:seek', (data: { sessionId: string; currentTime: number }) => {
    try {
      logger.info(`[Socket Server] Received listen:seek from ${user.name} (${user._id}), time=${data.currentTime}`);
      broadcastListenEvent('listen:seek', {
        senderId: user._id.toString(),
        currentTime: data.currentTime,
      });

      ListeningSession.findOneAndUpdate(
        { sessionId: data.sessionId },
        { currentTime: data.currentTime }
      ).catch((err) => logger.error('Error updating listen session seek state:', err));
    } catch (err) {
      logger.error('Error handling listen:seek:', err);
    }
  });

  // 6. Next & Previous Track Sync
  socket.on('listen:next', (data: { sessionId: string; track: any }) => {
    broadcastListenEvent('listen:next', {
      senderId: user._id.toString(),
      track: data.track,
    });
  });

  socket.on('listen:previous', (data: { sessionId: string; track: any }) => {
    broadcastListenEvent('listen:previous', {
      senderId: user._id.toString(),
      track: data.track,
    });
  });

  // 7. Queue Update Sync
  socket.on('listen:queue:update', (data: { sessionId: string; queue: any[] }) => {
    broadcastListenEvent('listen:queue:update', {
      senderId: user._id.toString(),
      queue: data.queue,
    });
  });

  // 8. Shuffle & Repeat Sync
  socket.on('listen:shuffle', (data: { sessionId: string; shuffle: boolean }) => {
    broadcastListenEvent('listen:shuffle', {
      senderId: user._id.toString(),
      shuffle: data.shuffle,
    });
  });

  socket.on('listen:repeat', (data: { sessionId: string; repeat: string }) => {
    broadcastListenEvent('listen:repeat', {
      senderId: user._id.toString(),
      repeat: data.repeat,
    });
  });

  // 9. End Session Event
  socket.on('listen:end', async (data: { sessionId: string }) => {
    try {
      if (!data?.sessionId) return;
      await ListeningSession.findOneAndUpdate(
        { sessionId: data.sessionId },
        { status: 'ENDED' }
      );

      broadcastListenEvent('listen:end', {
        reason: 'Session ended by host',
        sessionId: data.sessionId,
      });
    } catch (err) {
      logger.error('Error handling listen:end:', err);
    }
  });

  // 10. Disconnect Handler
  socket.on('disconnect', async () => {
    try {
      const activeSession = await ListeningSession.findOne({
        $or: [{ host: user._id }, { participant: user._id }],
        status: { $in: ['INVITED', 'ACTIVE'] },
      });

      if (activeSession) {
        activeSession.status = 'ENDED';
        await activeSession.save();

        broadcastListenEvent('listen:inactive', {
          userId: user._id.toString(),
          message: 'Partner disconnected or closed browser',
        });

        broadcastListenEvent('listen:end', {
          reason: 'Partner disconnected',
          sessionId: activeSession.sessionId,
        });
      }
    } catch (err) {
      logger.error('Error handling listen disconnect:', err);
    }
  });
};
