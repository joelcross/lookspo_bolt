import React from 'react';
import { View } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import NavBar from '@/components/NavBar';
import { useTab } from '@/contexts/TabContext';

export default function TabLayout() {
  const { activeTab, setActiveTab } = useTab();
  const router = useRouter();

  const handleTabPress = (key: typeof activeTab) => {
    setActiveTab(key);
    router.push(`/${key}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Slot />
      </View>
      <NavBar activeKey={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}
