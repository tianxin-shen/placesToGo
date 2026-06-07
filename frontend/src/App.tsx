import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Explore from './pages/Explore';
import WantToGo from './pages/WantToGo';
import Trips from './pages/Trips';
import NewTrip from './pages/NewTrip';
import Login from './components/Login/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="bg-gray-100 w-full min-h-screen">
            <Navbar />
            <main className="container mx-auto pt-16">
              <Routes>
                <Route path="/" element={<Explore />} />
                <Route path="/want-to-go" element={<WantToGo />} />
                <Route
                  path="/trips"
                  element={
                    <ProtectedRoute>
                      <Trips />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/trips/new"
                  element={
                    <ProtectedRoute>
                      <NewTrip />
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/login" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Login />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 