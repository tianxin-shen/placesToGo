import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Place from '../models/Place';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/travel-planner';

const samplePlaces = [
  {
    place_id: "ChIJNwbEWzMu5kcRMNqxXzlDEr8",
    name: "Eiffel Tower",
    formatted_address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
    description: "Iconic iron lattice tower on the Champ de Mars in Paris, named after engineer Gustave Eiffel.",
    location: {
      city: "Paris",
      state: "Île-de-France",
      country: "France",
      coordinates: {
        lat: 48.8584,
        lng: 2.2945
      }
    },
    maps: {
      google: "https://maps.google.com/?cid=1234567890",
      apple: "https://maps.apple.com/?cid=1234567890"
    },
    photos: [
      {
        name: "places/ChIJNwbEWzMu5kcRMNqxXzlDEr8/photos/ATtYBwJ7iYOQnqRyy3ML9cFxF1kj3zESkAcnhGBDx6Qn",
        widthPx: 6000,
        heightPx: 4000,
        authorAttributions: [{
          displayName: "TravelPlanner",
          uri: "https://maps.google.com/maps/contrib/1234567890",
          photoUri: "https://lh3.googleusercontent.com/a-/AD_cFT-b=s100-p-k-no-mo"
        }]
      },
      {
        name: "places/ChIJNwbEWzMu5kcRMNqxXzlDEr8/photos/ATtYBwJXxB3qZQJR8jK9yI2_PGK9W4OxvOPJR8zeJv4F",
        widthPx: 5472,
        heightPx: 3648,
        authorAttributions: [{
          displayName: "TravelPlanner",
          uri: "https://maps.google.com/maps/contrib/1234567890",
          photoUri: "https://lh3.googleusercontent.com/a-/AD_cFT-b=s100-p-k-no-mo"
        }]
      }
    ],
    address_components: [
      {
        long_name: "Champ de Mars",
        short_name: "Champ de Mars",
        types: ["point_of_interest", "establishment"]
      },
      {
        long_name: "Paris",
        short_name: "Paris",
        types: ["locality", "political"]
      },
      {
        long_name: "France",
        short_name: "FR",
        types: ["country", "political"]
      }
    ],
    formatted_phone_number: "+33 892 70 12 39",
    international_phone_number: "+33 892 70 12 39",
    rating: 4.7,
    user_ratings_total: 215645,
    price_level: 2,
    types: ["tourist_attraction", "point_of_interest", "establishment"],
    tags: ["Must Visit", "Iconic", "Architecture"],
    website: "https://www.toureiffel.paris/en",
    opening_hours: {
      periods: [
        {
          open: { day: 0, time: "0900" },
          close: { day: 0, time: "2345" }
        }
      ],
      weekday_text: [
        "Monday: 9:00 AM – 11:45 PM",
        "Tuesday: 9:00 AM – 11:45 PM",
        "Wednesday: 9:00 AM – 11:45 PM",
        "Thursday: 9:00 AM – 11:45 PM",
        "Friday: 9:00 AM – 11:45 PM",
        "Saturday: 9:00 AM – 11:45 PM",
        "Sunday: 9:00 AM – 11:45 PM"
      ]
    },
    utc_offset: 120,
    vicinity: "Champ de Mars, 5 Avenue Anatole France",
    reviews: [
      {
        author_name: "John Doe",
        rating: 5,
        text: "Absolutely stunning, especially at night when it sparkles!",
        time: 1678234567,
        profile_photo_url: "https://example.com/photos/profile1.jpg"
      }
    ]
  },
  {
    place_id: "ChIJjRRPiK1hlkgRDqBKYIaEHDg",
    name: "Colosseum",
    formatted_address: "Piazza del Colosseo, 1, 00184 Roma RM, Italy",
    description: "Ancient amphitheater in the center of Rome, symbol of the Roman Empire.",
    location: {
      city: "Rome",
      state: "Lazio",
      country: "Italy",
      coordinates: {
        lat: 41.8902,
        lng: 12.4922
      }
    },
    maps: {
      google: "https://maps.google.com/?cid=0987654321",
      apple: "https://maps.apple.com/?cid=0987654321"
    },
    photos: [
      {
        name: "places/ChIJjRRPiK1hlkgRDqBKYIaEHDg/photos/ATtYBwJqK9jYOp4Lk3ML9cFxF1kj3zESkAcnhGBDx6Qn",
        widthPx: 6000,
        heightPx: 4000,
        authorAttributions: [{
          displayName: "TravelPlanner",
          uri: "https://maps.google.com/maps/contrib/0987654321",
          photoUri: "https://lh3.googleusercontent.com/a-/AD_cFT-b=s100-p-k-no-mo"
        }]
      },
      {
        name: "places/ChIJjRRPiK1hlkgRDqBKYIaEHDg/photos/ATtYBwJhG7iKpL9R8jK9yI2_PGK9W4OxvOPJR8zeJv4F",
        widthPx: 5472,
        heightPx: 3648,
        authorAttributions: [{
          displayName: "TravelPlanner",
          uri: "https://maps.google.com/maps/contrib/0987654321",
          photoUri: "https://lh3.googleusercontent.com/a-/AD_cFT-b=s100-p-k-no-mo"
        }]
      }
    ],
    address_components: [
      {
        long_name: "Colosseum",
        short_name: "Colosseum",
        types: ["point_of_interest", "establishment"]
      },
      {
        long_name: "Rome",
        short_name: "Rome",
        types: ["locality", "political"]
      },
      {
        long_name: "Italy",
        short_name: "IT",
        types: ["country", "political"]
      }
    ],
    formatted_phone_number: "+39 06 3996 7700",
    international_phone_number: "+39 06 3996 7700",
    rating: 4.8,
    user_ratings_total: 325876,
    price_level: 2,
    types: ["tourist_attraction", "point_of_interest", "establishment"],
    tags: ["Must Visit", "Historical", "Architecture"],
    website: "https://www.parcoarcheologicodelcolosseo.it/",
    opening_hours: {
      periods: [
        {
          open: { day: 0, time: "0830" },
          close: { day: 0, time: "1900" }
        }
      ],
      weekday_text: [
        "Monday: 8:30 AM – 7:00 PM",
        "Tuesday: 8:30 AM – 7:00 PM",
        "Wednesday: 8:30 AM – 7:00 PM",
        "Thursday: 8:30 AM – 7:00 PM",
        "Friday: 8:30 AM – 7:00 PM",
        "Saturday: 8:30 AM – 7:00 PM",
        "Sunday: 8:30 AM – 7:00 PM"
      ]
    },
    utc_offset: 120,
    vicinity: "Piazza del Colosseo",
    reviews: [
      {
        author_name: "Jane Smith",
        rating: 5,
        text: "Breathtaking piece of history. A must-visit in Rome!",
        time: 1678345678,
        profile_photo_url: "https://example.com/photos/profile2.jpg"
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing places
    await Place.deleteMany({});
    console.log('Cleared existing places');

    // Insert new places
    const places = await Place.insertMany(samplePlaces);
    console.log(`Successfully seeded ${places.length} places`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDatabase(); 