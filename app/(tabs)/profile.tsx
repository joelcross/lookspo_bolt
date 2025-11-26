import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StyleSheet,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trash2, Settings, Check, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { showConfirmDialog } from '@/lib/showConfirmDialog';
import { Collection } from '@/lib/types';
import Header from '@/components/Header/Header';

export default function ProfileScreen() {
  const { profile, refreshProfile } = useAuth();
  const { edit } = useLocalSearchParams();
  const [isEditing, setIsEditing] = useState(edit === 'true');
  const [collections, setCollections] = useState([]);
  const [removedCollectionIds, setRemovedCollectionIds] = useState<string[]>(
    []
  );
  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [originalCollections, setOriginalCollections] = useState<Collection[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    bio: '',
    avatar_url: '',
  });

  // Initialize form state
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

  // Fetch collections
  useEffect(() => {
    const fetchCollections = async () => {
      if (!profile) return;
      setLoading(true);
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      setCollections(data || []);
      setOriginalCollections(data || []); // snapshot for cancel
      setLoading(false);
    };
    fetchCollections();
  }, [profile]);

  // Pick new avatar
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
        alert('Error uploading avatar: ' + error.message);
      } else {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        setForm({ ...form, avatar_url: urlData.publicUrl });
      }
    }
  };

  // Remove collection locally (staged)
  const removeCollection = async (id: string) => {
    const confirmed = await showConfirmDialog({
      title: 'Remove Collection',
      message:
        'Are you sure you want to remove this collection from your profile?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!confirmed) return;
    setRemovedCollectionIds((prev) => [...prev, id]);
    setCollections((prev) => prev.filter((c) => c.id !== id));
  };

  // Cancel editing
  const handleCancel = () => {
    setCollections(originalCollections); // restore original
    setRemovedCollectionIds([]); // clear any staged deletions
    setIsEditing(false);
    router.push('/profile');
  };

  // Save all changes
  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      // Update profile
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          name: form.name,
          username: form.username,
          bio: form.bio,
          avatar_url: form.avatar_url,
        })
        .eq('id', profile.id);
      if (updateProfileError) throw updateProfileError;

      // Delete removed collections
      for (const id of removedCollectionIds) {
        await supabase.from('saves').delete().eq('collection_id', id);
        await supabase.from('collections').delete().eq('id', id);
      }

      // Add any new collections
      for (const c of collections.filter((c) => c.isTemp)) {
        await supabase
          .from('collections')
          .insert({ name: c.name, user_id: profile.id });
      }

      await refreshProfile?.();
      setIsEditing(false);
      router.push('/profile');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
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
      <Header text={isEditing ? 'Edit Profile' : 'Profile'} />

      <View style={styles.header}>
        {/* cancel/back */}
        {isEditing ? (
          <TouchableOpacity onPress={handleCancel}>
            <X color="#000" size={24} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color="#000" size={24} />
          </TouchableOpacity>
        )}

        {/* save/settings */}
        {isEditing ? (
          <TouchableOpacity onPress={handleSave} disabled={saving}>
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
              {[...collections, { id: 'new', isNew: true }].map((collection) =>
                collection.isNew ? (
                  <TouchableOpacity
                    key="new"
                    style={[styles.collectionTile, styles.newCollectionTile]}
                    onPress={() => setShowModal(true)}
                  >
                    <Text style={styles.newCollectionPlus}>＋</Text>
                    <Text style={styles.collectionTileName}>
                      Add new collection
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View key={collection.id} style={styles.collectionTile}>
                    <TouchableOpacity
                      disabled={isEditing}
                      onPress={() =>
                        router.push(`/collection/${collection.id}`)
                      }
                    >
                      <Text style={styles.collectionTileName}>
                        {collection.name}
                      </Text>
                    </TouchableOpacity>
                    {isEditing && (
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => removeCollection(collection.id)}
                      >
                        <Trash2 color="red" size={18} />
                      </TouchableOpacity>
                    )}
                  </View>
                )
              )}
            </View>
          )}
        </View>
      </ScrollView>
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Collection</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter collection name"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={async () => {
                  if (!newCollectionName.trim()) return;

                  const tempCollection = {
                    id: `temp-${Date.now()}`,
                    name: newCollectionName.trim(),
                    isTemp: true,
                  };

                  if (isEditing) {
                    // Stage it locally; won't save to DB until user clicks Save
                    setCollections([...collections, tempCollection]);
                  } else {
                    // Immediately insert into DB
                    const { data, error } = await supabase
                      .from('collections')
                      .insert({
                        name: newCollectionName.trim(),
                        user_id: profile.id,
                      })
                      .select()
                      .single();

                    if (error) {
                      alert('Error creating collection: ' + error.message);
                      return;
                    }

                    setCollections([...collections, data]);
                  }

                  setNewCollectionName('');
                  setShowModal(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  createButton: {
    backgroundColor: '#000',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
