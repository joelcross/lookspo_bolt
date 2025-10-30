import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Trash2,
  Upload,
  Settings,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';

export default function ProfileScreen() {
  const { profile, refreshProfile } = useAuth();
  const { edit } = useLocalSearchParams();
  const [isEditing, setIsEditing] = useState(edit === 'true');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      setCollections(data || []);
      setLoading(false);
    };
    fetchCollections();
  }, [profile]);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      const file = result.assets[0];
      const ext = file.uri.split('.').pop();
      const filePath = `${profile.id}/avatar.${ext}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(
          filePath,
          { uri: file.uri, type: file.type || 'image/jpeg', name: filePath },
          { upsert: true }
        );
      if (error) {
        Alert.alert('Error uploading avatar', error.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        setForm({ ...form, avatar_url: urlData.publicUrl });
      }
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const updates = {
        id: profile.id,
        name: form.name,
        username: form.username,
        bio: form.bio,
        avatar_url: form.avatar_url,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id);
      if (error) throw error;

      await refreshProfile?.(); // reload context
      router.push('/profile');
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const deleteCollection = async (id: string) => {
    Alert.alert('Delete Collection', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('saves').delete().eq('collection_id', id);
          await supabase.from('collections').delete().eq('id', id);
          setCollections((prev) => prev.filter((c) => c.id !== id));
        },
      },
    ]);
  };

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft color="#000" size={24} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Profile' : 'Profile'}
        </Text>

        {isEditing ? (
          <TouchableOpacity onPress={saveProfile} disabled={saving}>
            <Check color="#000" size={24} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Settings color="#000" size={24} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <TouchableOpacity onPress={isEditing ? pickAvatar : undefined}>
          {form.avatar_url ? (
            <Image source={{ uri: form.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {form.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(t) => setForm({ ...form, name: t })}
              placeholder="Name"
            />
            <TextInput
              style={styles.input}
              value={form.username}
              onChangeText={(t) => setForm({ ...form, username: t })}
              placeholder="Username"
            />
            <TextInput
              style={[styles.input, { height: 100 }]}
              multiline
              value={form.bio}
              onChangeText={(t) => setForm({ ...form, bio: t })}
              placeholder="Bio"
            />
          </>
        ) : (
          <>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
            <Text style={styles.bio}>{profile.bio || 'No bio yet'}</Text>
          </>
        )}

        <View style={{ marginTop: 32 }}>
          <Text style={styles.sectionTitle}>Collections</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <View style={styles.grid}>
              {collections.map((collection) => (
                <View key={collection.id} style={styles.collectionTile}>
                  <TouchableOpacity
                    disabled={isEditing}
                    onPress={() => router.push(`/collection/${collection.id}`)}
                  >
                    <Text style={styles.collectionTileName}>
                      {collection.name}
                    </Text>
                  </TouchableOpacity>
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteCollection(collection.id)}
                    >
                      <Trash2 color="red" size={18} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  avatarText: { fontSize: 48, color: '#fff', fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  name: { fontSize: 28, fontWeight: '700', textAlign: 'center' },
  username: { textAlign: 'center', color: '#666', marginBottom: 12 },
  bio: { textAlign: 'center', color: '#333', lineHeight: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  collectionTile: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 12,
    flexBasis: '30%',
    position: 'relative',
    alignItems: 'center',
  },
  collectionTileName: { fontWeight: '600' },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});
