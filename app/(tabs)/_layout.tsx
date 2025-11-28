import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import BottomNavBar from '@/components/NavBar';

export default function TabLayout() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'search' | 'new_post' | 'activity' | 'profile'
  >('home');
  const router = useRouter();

  // Map tab names to route paths if you want to navigate later
  const handleTabPress = (key: typeof activeTab) => {
    setActiveTab(key);
    router.push(`/${key}`);
  };

  return (
    <View style={styles.container}>
      {/* Content area for whatever screen is active */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Your custom Phosphor-icon navbar */}
      <BottomNavBar activeKey={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
  },
});
