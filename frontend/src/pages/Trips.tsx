import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FaPlus, FaMapMarkedAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { getTrips } from '../api/trips';
import type { Trip } from '../types/api';

export default function Trips() {
  const { isAuthenticated } = useAuth();

  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: getTrips,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <FaMapMarkedAlt className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to view your trips</h2>
        <p className="text-gray-600 mb-4">
          Create and manage your travel plans by signing in to your account.
        </p>
        <Link
          to="/login"
          className="bg-white text-black px-6 py-2 border border-transparent rounded-md shadow-sm hover:bg-violet-100"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading trips...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
        <Link
          to="/trips/new"
          className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors font-medium"
        >
          <FaPlus className="w-4 h-4" />
          New Trip
        </Link>
      </div>

      {(!trips || trips.length === 0) ? (
        <div className="text-center py-16">
          <FaMapMarkedAlt className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No trips yet</h2>
          <p className="text-gray-500 mb-6">Plan your first adventure.</p>
          <Link
            to="/trips/new"
            className="inline-flex items-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-lg hover:bg-violet-700 transition-colors font-medium"
          >
            <FaPlus className="w-4 h-4" />
            Create a trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <Link key={trip._id} to={`/trips/${trip._id}`} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{trip.destination}</h3>
              <p className="text-sm text-gray-500 mb-3">
                {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{trip.travelerCount} traveler{trip.travelerCount !== 1 ? 's' : ''}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  trip.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {trip.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
