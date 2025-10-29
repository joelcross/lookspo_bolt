import React, { useState, useEffect } from 'react';
import {
  View,
  Alert,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings } from 'lucide-react-native';
import { Collection } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { profile } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchCollections = async () => {
      if (!profile) {
        setCollections([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data: collectionsData, error } = await supabase
          .from('collections')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const collectionsWithCount = await Promise.all(
          (collectionsData || []).map(async (collection) => {
            const { count } = await supabase
              .from('saves')
              .select('*', { count: 'exact', head: true })
              .eq('collection_id', collection.id);

            return { ...collection, post_count: count || 0 };
          })
        );

        setCollections(collectionsWithCount);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, [profile]);

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Settings color="#000" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.username}>@{profile.username}</Text>

          <View style={styles.avatarContainer}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {profile.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.bioPlaceholder}>No bio yet</Text>
          )}
        </View>

        <View style={styles.collectionsSection}>
          <Text style={styles.sectionTitle}>Collections</Text>

          {loading ? (
            <ActivityIndicator
              size="small"
              color="#000"
              style={{ marginTop: 20 }}
            />
          ) : (
            <View style={styles.grid}>
              {collections.map((collection) => (
                <TouchableOpacity
                  key={collection.id}
                  style={styles.collectionTile}
                  onPress={() => router.push(`/collection/${collection.id}`)}
                >
                  <Text style={styles.collectionTileName}>
                    {collection.name}
                  </Text>
                  <Text style={styles.collectionTileCount}>
                    {collection.post_count} post
                    {collection.post_count !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* ➕ New Collection Square */}
              <TouchableOpacity
                style={[styles.collectionTile, styles.newCollectionTile]}
                onPress={() => setShowModal(true)}
              >
                <Text style={styles.newCollectionPlus}>＋</Text>
                <Text style={styles.collectionName}>Add new collection</Text>
              </TouchableOpacity>
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
                  if (!newCollectionName.trim()) {
                    Alert.alert('Please enter a name');
                    return;
                  }

                  setCreating(true);
                  const { error } = await supabase
                    .from('collections')
                    .insert([
                      { name: newCollectionName.trim(), user_id: profile.id },
                    ]);

                  setCreating(false);
                  if (error) {
                    console.error('Error creating collection:', error);
                    Alert.alert('Error creating collection');
                  } else {
                    setNewCollectionName('');
                    setShowModal(false);
                    // Refresh collections
                    const { data: collectionsData } = await supabase
                      .from('collections')
                      .select('*')
                      .eq('user_id', profile.id)
                      .order('created_at', { ascending: false });

                    setCollections(collectionsData || []);
                  }
                }}
                disabled={creating}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  {creating ? 'Creating...' : 'Create'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#000' },
  profileSection: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  name: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 4 },
  username: { fontSize: 16, color: '#666', marginBottom: 24 },
  avatarContainer: { marginBottom: 16 },
  avatar: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#f5f5f5',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  avatarText: { fontSize: 72, fontWeight: '700', color: '#fff' },
  bio: { fontSize: 16, color: '#000', textAlign: 'center', lineHeight: 24 },
  bioPlaceholder: { fontSize: 16, color: '#999', fontStyle: 'italic' },
  collectionsSection: { padding: 24 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  collectionsList: { gap: 12 },
  collectionItem: { padding: 16, backgroundColor: '#f5f5f5', borderRadius: 12 },
  collectionName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  collectionCount: { fontSize: 14, color: '#666' },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  newCollectionItem: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ccc',
  },
  newCollectionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  collectionTile: {
    width: '31%', // fits 3 per row with small gaps
    aspectRatio: 1, // perfect square
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  collectionTileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },

  collectionTileCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },

  newCollectionTile: {
    backgroundColor: '#eaeaea',
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },

  newCollectionPlus: {
    fontSize: 40,
    fontWeight: '300',
    color: '#555',
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
