import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa';
import { initializeGoogleSignIn, renderGoogleSignInButton } from '../../utils/googleAuth';
import { useAuth } from '../../context/AuthContext';

// Sub-components
const LoginHeader = () => (
  <div className="text-center mb-8">
    <h2 className="text-2xl font-bold mb-2">Welcome to Travel Planner</h2>
    <p className="mt-2 text-gray-600">Sign in to continue your journey</p>
  </div>
);

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
  error?: string;
}

const LoginForm = ({ onSubmit, isLoading, error }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          required
        />
      </div>
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
};

const LoginDivider = () => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white text-gray-500">or</span>
    </div>
  </div>
);

const GoogleSignIn = () => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string>();
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize the callback functions to prevent re-initialization
  const handleSuccessfulLogin = useCallback(async (tokens: { accessToken: string; refreshToken: string }, user: any) => {
    console.log('Google login successful, updating state...');
    setIsGoogleLoading(true);
    setGoogleError(undefined);
    
    try {
      // Call the login function and wait for it to complete
      await login(tokens, user);
      
      console.log('Login state updated, redirecting...');
      
      // Redirect to the page they were trying to access, or home
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
      setGoogleError('Login failed. Please try again.');
      setIsGoogleLoading(false);
    }
  }, [login, navigate, location.state]);

  const handleLoginError = useCallback((error: Error) => {
    console.error('Google login error:', error);
    setIsGoogleLoading(false);
    setGoogleError(error.message);
  }, []);

  // Initialize Google Sign-In only once
  useEffect(() => {
    if (!isInitialized && typeof window.google !== 'undefined') {
      console.log('Initializing Google Sign-In...');
      initializeGoogleSignIn(handleSuccessfulLogin, handleLoginError);
      setIsInitialized(true);
    }
  }, [isInitialized, handleSuccessfulLogin, handleLoginError]);

  // Render Google Sign-In button
  useEffect(() => {
    if (buttonRef.current && window.google && isInitialized) {
      console.log('Rendering Google Sign-In button...');
      renderGoogleSignInButton(buttonRef.current);
    }
  }, [isInitialized]);

  return (
    <div className="space-y-2">
      <div 
        ref={buttonRef}
        className="w-full flex justify-center"
      />
      {isGoogleLoading && (
        <div className="text-center text-sm text-gray-600">
          Signing in with Google...
        </div>
      )}
      {googleError && (
        <div className="text-red-500 text-sm text-center">{googleError}</div>
      )}
    </div>
  );
};

const LoginFooter = () => (
  <div className="mt-6 text-center">
    <p className="text-sm text-gray-600">
      Don't have an account?{' '}
      <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
        Sign up
      </Link>
    </p>
  </div>
);

// Main Login Component
export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated - simplified dependency array
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('User is authenticated, redirecting...');
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location.state]);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(undefined);
    try {
      // TODO: Implement email/password login when backend supports it
      console.log('Login with:', email, password);
      setError('Email/password login not yet implemented. Please use Google Sign-In.');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <LoginHeader />
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm
            onSubmit={handleLogin}
            isLoading={isLoading}
            error={error}
          />
          <LoginDivider />
          <GoogleSignIn />
        </div>
        <LoginFooter />
      </div>
    </div>
  );
} 