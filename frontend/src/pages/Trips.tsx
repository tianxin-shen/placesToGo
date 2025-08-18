import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaMapMarkedAlt } from 'react-icons/fa';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Trip {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  places: {
    id: string;
    name: string;
    imageUrl: string;
  }[];
}

const Trips = () => {
  const { isAuthenticated } = useAuth();
  const { data: trips, isLoading } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:3000/api/trips');
      return response.data;
    },
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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Trips</h1>
        <button className="flex items-center space-x-2 bg-indigo-500 px-4 py-2 rounded-md hover:bg-indigo-600">
          <FaPlus />
          <span>New Trip</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips?.map((trip) => (
          <div key={trip.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{trip.name}</h3>
              <p className="text-gray-600 mb-2">
                {new Date(trip.startDate).toLocaleDateString()} -{' '}
                {new Date(trip.endDate).toLocaleDateString()}
              </p>
              <p className="text-gray-700 mb-4">{trip.description}</p>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {trip.places.map((place) => (
                  <img
                    key={place.id}
                    src={place.imageUrl}
                    alt={place.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Trips; 