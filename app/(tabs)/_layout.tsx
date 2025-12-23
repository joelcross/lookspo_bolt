import React, { useState } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import NavBar from '@/components/NavBar';
import { colors } from '@/theme/colors';

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
    // <ImageBackground
    //   source={require('../../assets/images/gradient_1.png')}
    //   style={styles.background}
    //   resizeMode="cover"
    // >
    <View style={styles.container}>
      {/* Content area for whatever screen is active */}
      <View style={styles.content}>
        <Slot />
      </View>

      <NavBar activeKey={activeTab} onTabPress={handleTabPress} />
    </View>
    // </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.tertiary.light,
  },
  content: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
