import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import SelectCollections, { Collection } from '@/components/SelectCollections';
import { Piece } from '@/lib/types';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/Header/Header';

interface Params {
  imageUri: string;
  caption: string;
  pieces: string;
}

export default function SaveToLookbooksScreen() {
  const { user } = useAuth();
  const { imageUri, caption, pieces } = useLocalSearchParams<Params>();
  const parsedPieces: Piece[] = JSON.parse(pieces || '[]');

  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchCollections = async () => {
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('id,name')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setCollections(data || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCollections();
  }, [user]);

  const handlePost = async (selectedCollections: string[]) => {
    if (!user || !imageUri) return;

    // ← Declare these outside so finally can see them
    let postData: { id: string } | null = null;
    let uploadErrorOccurred = false;

    try {
      // ── Upload image ───────────────────────
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const fileExt = imageUri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, blob, { contentType: `image/${fileExt}` });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('images').getPublicUrl(filePath);

      // ── Create post ───────────────────────
      const { data, error: postError } = await supabase
        .from('posts')
        .insert({
          image_url: publicUrl,
          caption: caption || '',
          user_id: user.id,
          pieces: parsedPieces.filter((p) => !p.isTemplate),
        })
        .select()
        .single();

      if (postError) throw postError;

      postData = data; // ← this is now reachable from finally

      // ── Save to collections ───────────────
      if (selectedCollections.length > 0) {
        const inserts = selectedCollections.map((collectionId) => ({
          post_id: data.id,
          collection_id: collectionId,
          user_id: user.id,
        }));
        const { error: saveError } = await supabase
          .from('saves')
          .insert(inserts);
        if (saveError) throw saveError;
      }
    } catch (err) {
      console.error('Error creating post:', err);
      uploadErrorOccurred = true;
    } finally {
      // ← finally can now safely read postData
      if (postData?.id && !uploadErrorOccurred) {
        router.replace(`/post/${postData.id}`); // or router.push
      } else {
        router.replace('/home'); // fallback
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header text="Save to lookbooks?" left="back" />
      <SelectCollections
        collections={collections}
        setCollections={setCollections}
        confirmText="Post"
        userId={user.id} // important for creating new collection
        onConfirm={handlePost} // or handleSave
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
