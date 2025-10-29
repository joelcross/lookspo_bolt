import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function SelectCollectionsScreen() {
  const { user } = useAuth();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();

  const [collections, setCollections] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch all collections for the user
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (collectionsError) throw collectionsError;

      setCollections(collectionsData || []);

      // 2. Fetch all saves of this post by this user
      const { data: savesData, error: savesError } = await supabase
        .from('saves')
        .select('collection_id')
        .eq('user_id', user.id)
        .eq('post_id', postId);
      if (savesError) throw savesError;

      // 3. Pre-select collections that already have this post
      const preSelected = new Set<string>(
        (savesData || []).map((s) => s.collection_id)
      );
      setSelected(preSelected);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!user || !postId) return;
    setSaving(true);

    try {
      // 1. Fetch post author
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .maybeSingle();
      if (postError) throw postError;

      const postAuthorId = postData?.user_id || null;

      // 2. Remove any existing saves for this post by this user
      await supabase
        .from('saves')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      // 3. Insert new saves for all selected collections
      if (selected.size > 0) {
        const inserts = Array.from(selected).map((collectionId) => ({
          user_id: user.id,
          post_id: postId,
          collection_id: collectionId,
        }));
        const { error: saveError } = await supabase
          .from('saves')
          .insert(inserts);
        if (saveError) throw saveError;

        // 4. Insert an activity for each collection save
        const activityInserts = Array.from(selected).map((collectionId) => ({
          actor_id: user.id,
          type: 'save',
          post_id: postId,
          target_user_id: postAuthorId, // author of the post
          collection_id: collectionId,
        }));
        const { error: activityError } = await supabase
          .from('activities')
          .insert(activityInserts);
        if (activityError) throw activityError;
      }

      // 5. Go back to the post page
      router.push(`/post/${postId}`);
    } catch (error) {
      console.error('Error saving post to collections:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderCollection = ({ item }: { item: any }) => {
    const isSelected = selected.has(item.id);
    return (
      <TouchableOpacity
        style={styles.collectionRow}
        onPress={() => toggleSelect(item.id)}
      >
        <Text style={styles.collectionName}>{item.name}</Text>
        <View style={[styles.circle, isSelected && styles.circleSelected]}>
          {isSelected && <Check size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Save to Collections</Text>
        <View style={{ width: 24 }} /> {/* spacer */}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={renderCollection}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      {/* Done Button */}
      <TouchableOpacity
        style={[styles.doneButton, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.doneText}>{saving ? 'Saving...' : 'Done'}</Text>
      </TouchableOpacity>
    </View>
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  collectionName: { fontSize: 16 },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleSelected: { backgroundColor: '#000', borderColor: '#000' },
  doneButton: {
    backgroundColor: '#000',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
