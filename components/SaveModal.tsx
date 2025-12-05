import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Collection } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SaveModalProps {
  visible: boolean;
  postId: string;
  postUserId: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function SaveModal({
  visible,
  postId,
  postUserId,
  onClose,
  onSaved,
}: SaveModalProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedCollectionIds, setSavedCollectionIds] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible && user) {
      fetchCollections();
    }
  }, [visible, user]);

  const fetchCollections = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 1. Fetch collections
      const { data: collectionsData } = await supabase
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // 2. Fetch saves for THIS post (which collections it belongs to)
      const { data: savesData } = await supabase
        .from('saves')
        .select('collection_id')
        .eq('post_id', postId)
        .eq('user_id', user.id);

      // 3. Fetch FIRST image for each collection
      const enriched = await Promise.all(
        (collectionsData || []).map(async (col) => {
          const { data: imageData } = await supabase
            .from('saves')
            .select('posts(image_url)')
            .eq('collection_id', col.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .single(); // because we only get one row

          return {
            ...col,
            cover_image: imageData?.posts?.image_url || null,
          };
        })
      );

      // 4. Update state
      setCollections(enriched);

      if (savesData) {
        setSavedCollectionIds(new Set(savesData.map((s) => s.collection_id)));
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async () => {
    if (!user || !newCollectionName.trim() || creating) return;

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({
          name: newCollectionName.trim(),
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setCollections([data, ...collections]);
        setNewCollectionName('');
        await toggleSave(data.id, true);
      }
    } catch (error) {
      console.error('Error creating collection:', error);
    } finally {
      setCreating(false);
    }
  };

  const toggleSave = async (collectionId: string, isSaving: boolean) => {
    if (!user) return;

    try {
      if (isSaving) {
        const { error: saveError } = await supabase.from('saves').insert({
          user_id: user.id,
          post_id: postId,
          collection_id: collectionId,
        });

        if (saveError) throw saveError;

        await supabase.from('activities').insert({
          actor_id: user.id,
          target_user_id: postUserId,
          type: 'save',
          post_id: postId,
          collection_id: collectionId,
        });

        setSavedCollectionIds(new Set(savedCollectionIds).add(collectionId));
      } else {
        await supabase
          .from('saves')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .eq('collection_id', collectionId);

        const newSet = new Set(savedCollectionIds);
        newSet.delete(collectionId);
        setSavedCollectionIds(newSet);
      }

      if (onSaved) onSaved();
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const renderCollection = ({ item }: { item: Collection }) => {
    const isSaved = savedCollectionIds.has(item.id);

    return (
      <TouchableOpacity
        style={styles.collectionItem}
        onPress={() => toggleSave(item.id, !isSaved)}
      >
        <Text style={styles.collectionName}>{item.name}</Text>
        {isSaved && <Check color="#000" size={20} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Save to Collection</Text>
            <TouchableOpacity onPress={onClose}>
              <X color="#000" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.createSection}>
            <TextInput
              style={styles.input}
              placeholder="New collection name"
              placeholderTextColor="#999"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
            />
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateCollection}
              disabled={!newCollectionName.trim() || creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator
              size="large"
              color="#000"
              style={{ marginTop: 24 }}
            />
          ) : (
            <FlatList
              data={collections}
              keyExtractor={(item) => item.id}
              renderItem={renderCollection}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  createSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000',
  },
  createButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  collectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  collectionName: {
    fontSize: 16,
    color: '#000',
  },
});
