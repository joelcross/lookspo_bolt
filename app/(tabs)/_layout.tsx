import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import NavBar from '@/components/NavBar';

export default function TabLayout() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'search' | 'new_post' | 'activity' | 'profile'
  >('home');
  const router = useRouter();

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

      <NavBar activeKey={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333333ff',
  },
  content: {
    flex: 1,
  },
});
