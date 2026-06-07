import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateWantToGoPlace } from '../api/wantToGo';
import { getUserId } from '../utils/userUtils';

interface EditWantToGoModalProps {
  placeId: string;
  placeName: string;
  initialNotes?: string;
  initialPriority?: number;
  onClose: () => void;
}

export default function EditWantToGoModal({
  placeId,
  placeName,
  initialNotes,
  initialPriority,
  onClose,
}: EditWantToGoModalProps) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [priority, setPriority] = useState<number>(initialPriority ?? 0);
  const queryClient = useQueryClient();
  const userId = getUserId();

  const mutation = useMutation({
    mutationFn: () =>
      updateWantToGoPlace(placeId, userId, {
        notes: notes || undefined,
        priority: priority || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wantToGoGroups'] });
      onClose();
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 truncate">{placeName}</h2>

        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 mb-4"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note…"
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <div className="flex gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setPriority(priority === star ? 0 : star)}
              className={`text-2xl transition-colors ${
                star <= priority ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-400`}
              aria-label={`Priority ${star}`}
            >
              ★
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>

        {mutation.isError && (
          <p className="mt-3 text-xs text-red-600">Failed to save. Please try again.</p>
        )}
      </div>
    </div>
  );
}
