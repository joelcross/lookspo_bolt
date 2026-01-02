import ProfileBase from '@/components/ProfileBase/ProfileBase';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const { profile } = useAuth();

  if (!profile) return null;

  const isOwnProfile = username === profile.username;

  // If user clicks on their own profile, redirect to profile tab
  if (isOwnProfile) {
    return <Redirect href="/(tabs)/profile" />;
  }

  return <ProfileBase isOwnProfile={false} />;
}
