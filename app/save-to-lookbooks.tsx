import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import LookbooksSelect, {
  Collection,
} from '@/components/LookbooksSelect/LookbooksSelect';
import { Piece } from '@/lib/types';
import PageHeader from '@/components/PageHeader/PageHeader';
import styled from 'styled-components/native';

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
        // Fetch collections
        const { data: collectionsData, error } = await supabase
          .from('collections')
          .select('*, user:user_id (username)')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Enrich each collection with up to 4 image URLs
        const collectionsWithImages = await Promise.all(
          (collectionsData || []).map(async (col) => {
            const { data: images, count } = await supabase
              .from('saves')
              .select('posts(image_url)', { count: 'exact' })
              .eq('collection_id', col.id)
              .order('created_at', { ascending: true })
              .limit(4);

            return {
              ...col,
              cover_images: images?.map((i) => i.posts.image_url) || [],
              post_count: count || 0,
            };
          })
        );

        // 3. Save enriched list
        setCollections(collectionsWithImages);
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
    <Container>
      <PageHeader text="Save to lookbooks?" left="back" />
      <SelectListWrapper>
        <LookbooksSelect
          preSelected={[collections[0]?.id]}
          showDefaultLookbook={true}
          collections={collections}
          setCollections={setCollections}
          confirmText="Post"
          userId={user.id}
          onConfirm={handlePost}
        />
      </SelectListWrapper>
    </Container>
  );
}

const Container = styled.View`
  flex: 1;
  justify-content: flex-end;
`;

const SelectListWrapper = styled.View`
  flex: 1;
  background-color: #fff;
  margin-horizontal: 5px;
  border-radius: 20px;
`;
