import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, LogOut, Mail, Pencil } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    console.log('Signing out...');
    await signOut();
    router.replace('/auth/login');
  };

  const handlePressFeedback = async () => {
    router.replace('/feedback');
  };

  const handlePressEditProfile = async () => {
    router.push({ pathname: '/profile', params: { edit: 'true' } });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="#000" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity style={styles.item} onPress={handleSignOut}>
            <View style={styles.itemContent}>
              <LogOut color="#ff3b30" size={20} />
              <Text style={[styles.itemText, styles.dangerText]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.item} onPress={handlePressFeedback}>
            <View style={styles.itemContent}>
              <Mail color="#000000ff" size={20} />
              <Text style={[styles.itemText]}>Feedback</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.item}
            onPress={handlePressEditProfile}
          >
            <View style={styles.itemContent}>
              <Pencil color="#000000ff" size={20} />
              <Text style={[styles.itemText]}>Edit Profile</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#000',
  },
  dangerText: {
    color: '#ff3b30',
  },
});
