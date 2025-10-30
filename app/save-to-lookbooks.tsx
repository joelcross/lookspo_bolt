import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import SelectCollections, { Collection } from '@/components/SelectCollections';
import { Piece } from '@/lib/types';

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

    try {
      // upload image
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

      // create post
      const { data: postData, error: postError } = await supabase
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

      // save to collections
      if (selectedCollections.length > 0) {
        const inserts = selectedCollections.map((collectionId) => ({
          post_id: postData.id,
          collection_id: collectionId,
          user_id: user.id,
        }));
        await supabase.from('saves').insert(inserts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      router.push('/(tabs)');
    }
  };

  return (
    <SelectCollections
      collections={collections}
      confirmText="Post" // or "Done"
      userId={user.id} // important for creating new collection
      onConfirm={handlePost} // or handleSave
    />
  );
}
