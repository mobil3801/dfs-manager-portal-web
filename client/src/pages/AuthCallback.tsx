import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
          // Redirect to login with error
          setTimeout(() => setLocation('/login?error=' + encodeURIComponent(error.message)), 2000);
          return;
        }

        if (data.session) {
          console.log('Successfully authenticated:', data.session.user.email);
          // Redirect to dashboard
          setLocation('/');
        } else {
          console.log('No session found');
          // Redirect to login
          setLocation('/login');
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
        setTimeout(() => setLocation('/login'), 2000);
      }
    };

    handleCallback();
  }, [setLocation]);

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h2>Authentication Error</h2>
        <p>{error}</p>
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <h2>Authenticating...</h2>
      <p>Please wait while we complete your sign-in.</p>
    </div>
  );
}

