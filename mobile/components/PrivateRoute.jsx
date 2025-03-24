import React from 'react';
import { Redirect, router } from 'expo-router';
import useUserstore from '../store';

const PrivateRoute = (WrappedComponent) => {
  return (props) => {
    const { currentUser } = useUserstore();

    // If there's no current user, redirect to the Sign In page
    if (!currentUser) {
      router.replace('/'); // Redirect to the Sign In page
      return null; // Return null to prevent rendering the wrapped component
    }

    // If the user is authenticated, render the wrapped component
    return <WrappedComponent {...props} />;
  };
};

export default PrivateRoute;