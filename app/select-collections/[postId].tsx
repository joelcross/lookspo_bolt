import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import SelectCollections, { Collection } from '@/components/SelectCollections';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';

export default function SelectCollectionsScreen() {
  const { user } = useAuth();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [preSelected, setPreSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !postId) return;

    const fetchData = async () => {
      try {
        // fetch collections
        const { data: collectionsData, error: collectionsError } =
          await supabase
            .from('collections')
            .select('id,name')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        if (collectionsError) throw collectionsError;
        setCollections(collectionsData || []);

        // fetch saves for this post
        const { data: savesData, error: savesError } = await supabase
          .from('saves')
          .select('collection_id')
          .eq('user_id', user.id)
          .eq('post_id', postId);
        if (savesError) throw savesError;

        setPreSelected((savesData || []).map((s) => s.collection_id));
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [user, postId]);

  const handleSave = async (selected: string[]) => {
    if (!user || !postId) return;

    try {
      // fetch post author
      const { data: postData } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .maybeSingle();
      const postAuthorId = postData?.user_id || null;

      // delete existing saves
      await supabase
        .from('saves')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      // insert new saves
      if (selected.length > 0) {
        const inserts = selected.map((collectionId) => ({
          user_id: user.id,
          post_id: postId,
          collection_id: collectionId,
        }));
        await supabase.from('saves').insert(inserts);

        // insert activity
        const activityInserts = selected.map((collectionId) => ({
          actor_id: user.id,
          type: 'save',
          post_id: postId,
          target_user_id: postAuthorId,
          collection_id: collectionId,
        }));
        await supabase.from('activities').insert(activityInserts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="#000" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Save to Lookbooks</Text>
        <View style={{ width: 28 }} />
      </View>
      <SelectCollections
        collections={collections}
        preSelected={preSelected}
        confirmText="Done"
        onConfirm={handleSave}
        userId={user.id}
      />
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
});
