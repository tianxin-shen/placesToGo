import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Explore from './pages/Explore';
import WantToGo from './pages/WantToGo';
import Trips from './pages/Trips';
import Login from './components/Login/Login';
import GroupsList from './pages/groups/GroupsList';
import CreateGroup from './pages/groups/CreateGroup';
import JoinGroup from './pages/groups/JoinGroup';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GroupProvider>
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
                  path="/groups" 
                  element={
                    <ProtectedRoute>
                      <GroupsList />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/groups/create" 
                  element={
                    <ProtectedRoute>
                      <CreateGroup />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/groups/join" 
                  element={
                    <ProtectedRoute>
                      <JoinGroup />
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
        </GroupProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 