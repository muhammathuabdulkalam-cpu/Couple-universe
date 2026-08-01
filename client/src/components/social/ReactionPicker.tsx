import React from 'react';
import { ReactionEmoji } from '../../types/index.js';

interface Props {
  onSelect: (emoji: ReactionEmoji) => void;
  onClose?: () => void;
}

const EMOJIS: ReactionEmoji[] = ['❤️', '😂', '🔥', '😍', '👍', '😢'];

export const ReactionPicker: React.FC<Props> = ({ onSelect, onClose }) => {
  return (
    <div
      className="flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full border border-white/10 shadow-2xl animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => {
            onSelect(emoji);
            if (onClose) onClose();
          }}
          className="text-xl hover:scale-125 transition-transform p-1 rounded-full hover:bg-white/10"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
