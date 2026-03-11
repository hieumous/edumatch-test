'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { isProfileComplete, clearProfileCompletionSkipped } from '@/lib/profile-utils';

/**
 * Hook to manage profile completion prompt
 * Automatically shows modal on dashboard/main pages if profile is incomplete
 */
export function useProfileCompletionCheck() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const lastUserProfileRef = useRef<string>('');

  useEffect(() => {
    // Don't check until auth is loaded
    if (isLoading) {
      return;
    }

    // Only check for authenticated users
    if (isAuthenticated && user) {
      // Create a string representation of user profile to detect changes
      const profileKey = JSON.stringify({
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        bio: user.profile?.bio,
        gpa: user.profile?.gpa,
      });

      // Only re-check if profile actually changed
      if (lastUserProfileRef.current !== profileKey) {
        lastUserProfileRef.current = profileKey;
        
        // Always re-check when user object changes (including after profile update)
        const profileComplete = isProfileComplete(user);
        // Only show modal if profile is incomplete
        setShouldShowModal(!profileComplete);
      }
    } else {
      // Hide modal if user is not authenticated
      setShouldShowModal(false);
      lastUserProfileRef.current = '';
    }
  }, [user, isAuthenticated, isLoading]);

  const hideModal = () => {
    setShouldShowModal(false);
  };

  const onProfileCompleted = () => {
    clearProfileCompletionSkipped();
    setShouldShowModal(false);
    // Reset ref to force re-check on next render
    lastUserProfileRef.current = '';
  };

  return {
    shouldShowModal,
    hideModal,
    onProfileCompleted,
  };
}
