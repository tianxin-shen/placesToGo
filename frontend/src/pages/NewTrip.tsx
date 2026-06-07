import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createTrip } from '../api/trips';
import { getWantToGoPlaces } from '../api/wantToGo';
import { getUserId } from '../utils/userUtils';
import type { CreateTripPayload, WantToGoPlace } from '../types/api';

type Pace = 'relaxed' | 'moderate' | 'packed';
type Focus = 'outdoor' | 'food' | 'culture' | 'mix';

interface Step1State {
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
}

interface Step3State {
  pace: Pace;
  focus: Focus[];
}

const STEPS = ['Destination', 'Places', 'Preferences', 'Confirm'];

export default function NewTrip() {
  const navigate = useNavigate();
  const userId = getUserId();

  const [step, setStep] = useState(0);
  const [step1, setStep1] = useState<Step1State>({
    destination: '',
    startDate: '',
    endDate: '',
    travelerCount: 1,
  });
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [step3, setStep3] = useState<Step3State>({ pace: 'moderate', focus: ['mix'] });

  const { data: wishlistResponse } = useQuery({
    queryKey: ['wantToGoPlaces', userId],
    queryFn: () => getWantToGoPlaces({ user_id: userId }),
  });

  const wishlist: WantToGoPlace[] = wishlistResponse?.data ?? [];

  const filteredWishlist = step1.destination.trim()
    ? wishlist.filter(
        (p) =>
          p.location_group
            ?.toLowerCase()
            .includes(step1.destination.toLowerCase()) ?? false
      )
    : wishlist;

  const mutation = useMutation({
    mutationFn: (payload: CreateTripPayload) => createTrip(payload),
    onSuccess: (trip) => navigate(`/trips/${trip._id}`),
  });

  const step1Valid =
    step1.destination.trim() !== '' &&
    step1.startDate !== '' &&
    step1.endDate !== '' &&
    step1.travelerCount >= 1 &&
    new Date(step1.endDate) >= new Date(step1.startDate);

  const step2Valid = selectedPlaceIds.length >= 1;
  const step3Valid = step3.focus.length >= 1;

  const togglePlace = (id: string) =>
    setSelectedPlaceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const toggleFocus = (f: Focus) =>
    setStep3((prev) => ({
      ...prev,
      focus: prev.focus.includes(f)
        ? prev.focus.filter((x) => x !== f)
        : [...prev.focus, f],
    }));

  const handleSubmit = () => {
    mutation.mutate({
      destination: step1.destination,
      startDate: step1.startDate,
      endDate: step1.endDate,
      travelerCount: step1.travelerCount,
      preferences: step3,
      keyPlaceIds: selectedPlaceIds,
    });
  };

  const progressBar = (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              i <= step ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i + 1}
          </div>
          <span className={`text-sm hidden sm:block ${i === step ? 'text-violet-700 font-medium' : 'text-gray-400'}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && <div className={`h-px w-6 ${i < step ? 'bg-violet-400' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  );

  if (step === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        {progressBar}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Where are you going?</h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g. Tokyo, Paris, Hawaii"
              value={step1.destination}
              onChange={(e) => setStep1((s) => ({ ...s, destination: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={step1.startDate}
                onChange={(e) => setStep1((s) => ({ ...s, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={step1.endDate}
                min={step1.startDate || undefined}
                onChange={(e) => setStep1((s) => ({ ...s, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Travelers</label>
            <input
              type="number"
              min={1}
              max={20}
              className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500"
              value={step1.travelerCount}
              onChange={(e) => setStep1((s) => ({ ...s, travelerCount: Math.max(1, Number(e.target.value)) }))}
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            disabled={!step1Valid}
            onClick={() => setStep(1)}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        {progressBar}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Which places do you want to visit?</h1>
        <p className="text-gray-500 text-sm mb-6">
          {filteredWishlist.length > 0
            ? `Showing wishlist places matching "${step1.destination}"`
            : 'No matching places found — showing all wishlist places'}
        </p>

        {(filteredWishlist.length > 0 ? filteredWishlist : wishlist).length === 0 ? (
          <p className="text-gray-500">Your wishlist is empty. Add places from the Explore page first.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(filteredWishlist.length > 0 ? filteredWishlist : wishlist).map((place) => {
              const selected = selectedPlaceIds.includes(place.place_id);
              return (
                <button
                  key={place.place_id}
                  type="button"
                  onClick={() => togglePlace(place.place_id)}
                  className={`text-left p-4 rounded-xl border-2 transition-colors ${
                    selected
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-gray-200 bg-white hover:border-violet-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{place.place_id}</p>
                      {place.location_group && (
                        <p className="text-xs text-gray-500 mt-0.5">📍 {place.location_group}</p>
                      )}
                      {place.notes && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">{place.notes}</p>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors ${
                        selected ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
                      }`}
                    >
                      {selected && (
                        <svg className="w-full h-full text-white p-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button onClick={() => setStep(0)} className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Back
          </button>
          <button
            disabled={!step2Valid}
            onClick={() => setStep(2)}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-40 transition-colors"
          >
            Next ({selectedPlaceIds.length} selected)
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    const paces: { value: Pace; label: string; description: string }[] = [
      { value: 'relaxed', label: 'Relaxed', description: 'A few things a day, plenty of downtime' },
      { value: 'moderate', label: 'Moderate', description: 'Balanced mix of activities and rest' },
      { value: 'packed', label: 'Packed', description: 'See as much as possible' },
    ];

    const focuses: { value: Focus; label: string; emoji: string }[] = [
      { value: 'outdoor', label: 'Outdoors', emoji: '🏔️' },
      { value: 'food', label: 'Food', emoji: '🍜' },
      { value: 'culture', label: 'Culture', emoji: '🏛️' },
      { value: 'mix', label: 'Mix', emoji: '✨' },
    ];

    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        {progressBar}
        <h1 className="text-2xl font-bold text-gray-900 mb-6">What's your travel style?</h1>

        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3">Pace</p>
          <div className="space-y-3">
            {paces.map(({ value, label, description }) => (
              <button
                key={value}
                type="button"
                onClick={() => setStep3((s) => ({ ...s, pace: value }))}
                className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                  step3.pace === value ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                }`}
              >
                <p className="font-medium text-gray-900">{label}</p>
                <p className="text-sm text-gray-500">{description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm font-medium text-gray-700 mb-3">Focus (pick all that apply)</p>
          <div className="grid grid-cols-2 gap-3">
            {focuses.map(({ value, label, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => toggleFocus(value)}
                className={`p-4 rounded-xl border-2 text-center transition-colors ${
                  step3.focus.includes(value) ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                }`}
              >
                <div className="text-2xl mb-1">{emoji}</div>
                <div className="text-sm font-medium text-gray-900">{label}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button onClick={() => setStep(1)} className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Back
          </button>
          <button
            disabled={!step3Valid}
            onClick={() => setStep(3)}
            className="px-6 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-40 transition-colors"
          >
            Review
          </button>
        </div>
      </div>
    );
  }

  // Step 3 — Confirmation
  const nights =
    step1.startDate && step1.endDate
      ? Math.max(0, Math.round((new Date(step1.endDate).getTime() - new Date(step1.startDate).getTime()) / 86400000))
      : 0;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      {progressBar}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ready to plan your trip?</h1>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-8">
        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Destination</span>
          <span className="font-medium text-gray-900">{step1.destination}</span>
        </div>
        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Dates</span>
          <span className="font-medium text-gray-900">
            {new Date(step1.startDate).toLocaleDateString()} – {new Date(step1.endDate).toLocaleDateString()} ({nights} nights)
          </span>
        </div>
        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Travelers</span>
          <span className="font-medium text-gray-900">{step1.travelerCount}</span>
        </div>
        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Places selected</span>
          <span className="font-medium text-gray-900">{selectedPlaceIds.length}</span>
        </div>
        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Pace</span>
          <span className="font-medium text-gray-900 capitalize">{step3.pace}</span>
        </div>
        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-gray-500">Focus</span>
          <span className="font-medium text-gray-900 capitalize">{step3.focus.join(', ')}</span>
        </div>
      </div>

      {mutation.isError && (
        <p className="text-sm text-red-600 mb-4">Something went wrong. Please try again.</p>
      )}

      <div className="flex justify-between">
        <button onClick={() => setStep(2)} className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="px-8 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? 'Creating…' : 'Generate Plan'}
        </button>
      </div>
    </div>
  );
}
