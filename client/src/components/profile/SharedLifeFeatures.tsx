import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  CheckSquare,
  Gift,
  Lock,
  Plus,
  Smile,
  StickyNote,
  Target,
} from 'lucide-react';
import React, { useState } from 'react';
import { axiosClient } from '../../api/axiosClient.js';
import { useUIStore } from '../../store/uiStore.js';
import {
  ApiResponse,
  BucketItem,
  DiaryItem,
  GoalItem,
  MemoryCapsuleItem,
  MoodEntryItem,
  WishlistItem,
} from '../../types/index.js';
import { Badge } from '../ui/Badge.js';
import { Button } from '../ui/Button.js';
import { Card } from '../ui/Card.js';

export const SharedLifeFeatures: React.FC = () => {
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<
    'diary' | 'bucket' | 'wishlist' | 'goals' | 'mood' | 'notes' | 'capsules'
  >('diary');

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Queries for Each Sub-Feature
  const { data: diaryEntries, refetch: refetchDiary } = useQuery<DiaryItem[]>({
    queryKey: ['diaryEntries'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<DiaryItem[]>>('/life-experience/diary');
      return res.data.data!;
    },
  });

  const { data: bucketItems, refetch: refetchBucket } = useQuery<BucketItem[]>({
    queryKey: ['bucketItems'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<BucketItem[]>>('/life-experience/bucket-list');
      return res.data.data!;
    },
  });

  const { data: wishlistItems, refetch: refetchWishlist } = useQuery<WishlistItem[]>({
    queryKey: ['wishlistItems'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<WishlistItem[]>>('/life-experience/wishlist');
      return res.data.data!;
    },
  });

  const { data: goals, refetch: refetchGoals } = useQuery<GoalItem[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<GoalItem[]>>('/life-experience/goals');
      return res.data.data!;
    },
  });

  const { data: moodEntries, refetch: refetchMoods } = useQuery<MoodEntryItem[]>({
    queryKey: ['moodEntries'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<MoodEntryItem[]>>('/life-experience/mood');
      return res.data.data!;
    },
  });

  const { refetch: refetchNotes } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse>('/life-experience/notes');
      return res.data.data!;
    },
  });

  const { data: capsules } = useQuery<MemoryCapsuleItem[]>({
    queryKey: ['capsules'],
    queryFn: async () => {
      const res = await axiosClient.get<ApiResponse<MemoryCapsuleItem[]>>('/life-experience/memory-capsules');
      return res.data.data!;
    },
  });

  // Suppress unused variable warnings by referencing them
  void refetchGoals;
  void refetchMoods;

  const handleCreateEntry = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      if (activeTab === 'diary') {
        await axiosClient.post('/life-experience/diary', { title: newTitle, content: newContent });
        refetchDiary();
        addToast('Diary Entry Saved', 'Added to couple shared journal.', 'success');
      } else if (activeTab === 'bucket') {
        await axiosClient.post('/life-experience/bucket-list', { title: newTitle, description: newContent });
        refetchBucket();
        addToast('Bucket Goal Added', 'Added to couple bucket list.', 'success');
      } else if (activeTab === 'wishlist') {
        await axiosClient.post('/life-experience/wishlist', { name: newTitle, description: newContent });
        refetchWishlist();
        addToast('Wish Added', 'Added to couple wishlist.', 'success');
      } else if (activeTab === 'notes') {
        await axiosClient.post('/life-experience/notes', { title: newTitle, content: newContent });
        refetchNotes();
        addToast('Note Saved', 'Added to shared notes.', 'success');
      }

      setNewTitle('');
      setNewContent('');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to save item', 'error');
    }
  };

  const handleLogMood = async (mood: 'HAPPY' | 'LOVED' | 'SAD' | 'EXCITED' | 'ANGRY' | 'TIRED') => {
    try {
      await axiosClient.post('/life-experience/mood', { mood });
      addToast('Mood Logged', `Recorded mood: ${mood}`, 'success');
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to log mood', 'error');
    }
  };

  return (
    <Card variant="glass" className="p-6 border-slate-200 dark:border-white/10 space-y-6 select-none">
      
      {/* Shared Life Feature Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-white/10">
        {[
          { id: 'diary', label: 'Shared Diary', icon: BookOpen },
          { id: 'bucket', label: 'Bucket List', icon: CheckSquare },
          { id: 'wishlist', label: 'Wishlist', icon: Gift },
          { id: 'goals', label: 'Goals', icon: Target },
          { id: 'mood', label: 'Mood Tracker', icon: Smile },
          { id: 'notes', label: 'Shared Notes', icon: StickyNote },
          { id: 'capsules', label: 'Capsules', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-afzal to-amrin text-white shadow-lg'
                  : 'glass-card text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Creation Quick Form */}
      {['diary', 'bucket', 'wishlist', 'notes'].includes(activeTab) && (
        <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <Plus className="w-4 h-4 text-amrin" />
            <span>Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Item</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title / Name..."
              className="bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-violet-500"
            />
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Details / Description..."
              className="bg-white dark:bg-obsidian-950 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="flex justify-end">
            <Button variant="violet" size="sm" onClick={handleCreateEntry}>
              Save {activeTab}
            </Button>
          </div>
        </div>
      )}

      {/* Tab 1: Shared Diary */}
      {activeTab === 'diary' && (
        <div className="space-y-3">
          {diaryEntries && diaryEntries.length > 0 ? (
            diaryEntries.map((d) => (
              <div key={d._id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amrin dark:text-amrin-glow font-bold">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </span>
                  <Badge variant="cyan" size="sm">{d.createdBy.name}</Badge>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{d.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{d.content}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">No diary entries logged yet.</div>
          )}
        </div>
      )}

      {/* Tab 2: Bucket List */}
      {activeTab === 'bucket' && (
        <div className="space-y-3">
          {bucketItems && bucketItems.length > 0 ? (
            bucketItems.map((b) => (
              <div key={b._id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{b.title}</h4>
                  {b.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.description}</p>}
                </div>
                <Badge variant={b.status === 'COMPLETED' ? 'green' : 'violet'} size="sm">
                  {b.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">No bucket items added yet.</div>
          )}
        </div>
      )}

      {/* Tab 3: Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {wishlistItems && wishlistItems.length > 0 ? (
            wishlistItems.map((w) => (
              <div key={w._id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{w.name}</h4>
                  {w.price && <span className="text-xs font-mono text-amrin dark:text-amrin-glow font-bold">${w.price}</span>}
                </div>
                {w.description && <p className="text-xs text-slate-500 dark:text-slate-400">{w.description}</p>}
              </div>
            ))
          ) : (
            <div className="text-center col-span-2 py-8 text-xs text-slate-500 dark:text-slate-400">No wishlist items added.</div>
          )}
        </div>
      )}

      {/* Tab 4: Goals */}
      {activeTab === 'goals' && (
        <div className="space-y-3">
          {goals && goals.length > 0 ? (
            goals.map((g) => (
              <div key={g._id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{g.title}</h4>
                  <Badge variant={g.status === 'ACHIEVED' ? 'green' : 'violet'} size="sm">{g.status}</Badge>
                </div>
                {g.description && <p className="text-xs text-slate-550 dark:text-slate-400">{g.description}</p>}
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-afzal to-amrin transition-all"
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-550 dark:text-slate-400 text-right font-mono">{g.progress}% complete</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">No relationship goals set yet.</div>
          )}
        </div>
      )}

      {/* Tab 5: Mood Tracker */}
      {activeTab === 'mood' && (
        <div className="space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3 text-center">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Log Today's Mood</h4>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {[
                { emoji: '😊', name: 'HAPPY' },
                { emoji: '❤️', name: 'LOVED' },
                { emoji: '🔥', name: 'EXCITED' },
                { emoji: '😢', name: 'SAD' },
                { emoji: '😡', name: 'ANGRY' },
                { emoji: '😴', name: 'TIRED' },
              ].map((m) => (
                <button
                  key={m.name}
                  onClick={() => handleLogMood(m.name as any)}
                  className="text-2xl p-2 rounded-xl glass-card bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/5 hover:scale-125 transition-transform"
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {moodEntries && moodEntries.length > 0 ? (
              moodEntries.map((m) => (
                <div key={m._id} className="glass-card p-3 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">{m.userId?.name}: {m.mood}</span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">{new Date(m.date).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-550 dark:text-slate-400">No mood entries yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Memory Capsules */}
      {activeTab === 'capsules' && (
        <div className="space-y-3">
          {capsules && capsules.length > 0 ? (
            capsules.map((c) => (
              <div key={c._id} className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" /> {c.title}
                  </h4>
                  <p className="text-xs text-slate-550 dark:text-slate-400">
                    Unlocks on: {new Date(c.unlockDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={c.status === 'UNLOCKED' ? 'green' : 'violet'} size="sm">
                  {c.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">No memory capsules stored yet.</div>
          )}
        </div>
      )}

    </Card>
  );
};
