import { useRouter } from 'next/router';
import { useEffect } from 'react';

const withAuth = (WrappedComponent) => {
  const AuthenticatedComponent = (props) => {
    const router = useRouter();

    // Check if the user is authenticated, e.g., by checking if an access token exists in local storage or a state management system
    const isAuthenticated = true;

    useEffect(() => {
      // Redirect to the login page if the user is not authenticated
      if (!isAuthenticated) {
        router.replace('/login');
      }
    }, [isAuthenticated, router]);

    // Render the wrapped component if the user is authenticated, otherwise show a loading state or a different component
    return isAuthenticated ? <WrappedComponent {...props} /> : null;
  };

  return AuthenticatedComponent;
};

export default withAuth;
