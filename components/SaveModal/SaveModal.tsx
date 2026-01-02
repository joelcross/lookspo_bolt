import React, { useEffect, useState } from 'react';
import { Modal, View, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { XIcon } from 'phosphor-react-native';
import LookbookGrid from '@/components/LookbookGrid/LookbookGrid';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { Post } from '@/lib/types';

interface SaveModalProps {
  visible: boolean;
  onClose: () => void;
  post: Post;
  currentCollectionIds: string[];
  onSaved: () => void;
}

export default function SaveModal({
  visible,
  onClose,
  post,
  currentCollectionIds,
  onSaved,
}: SaveModalProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    if (visible && user) {
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
    }
  }, [visible, user]);

  const handleSave = async (selectedIds: string[]) => {
    try {
      // Remove from collections not selected anymore
      const toDelete = currentCollectionIds.filter(
        (id) => !selectedIds.includes(id)
      );
      if (toDelete.length > 0) {
        await supabase
          .from('saves')
          .delete()
          .eq('post_id', postId)
          .in('collection_id', toDelete);
      }

      // Add to newly selected collections
      const toAdd = selectedIds.filter(
        (id) => !currentCollectionIds.includes(id)
      );
      if (toAdd.length > 0) {
        const saveInserts = toAdd.map((collectionId) => ({
          post_id: post.id,
          collection_id: collectionId,
          user_id: user!.id,
        }));
        await supabase.from('saves').insert(saveInserts);

        const activityInserts = toAdd.map((collectionId) => ({
          actor_id: user!.id,
          target_user_id: post.user_id,
          type: 'save',
          post_id: post.id,
          collection_id: collectionId,
        }));
        await supabase.from('activities').insert(activityInserts);
      }

      onSaved();
    } catch (err) {
      console.error(err);
    }
  };

  if (!collections.length) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Overlay onPress={onClose}>
        <ModalContainer onPress={(e) => e.stopPropagation()}>
          <HeaderRow>
            <TouchableOpacity onPress={onClose}>
              <XIcon size={20} color={colors.neutral[400]} />
            </TouchableOpacity>
            <ModalTitle>Save to lookbooks</ModalTitle>
            <View style={{ width: 28 }} />
          </HeaderRow>
          <LookbookGrid
            collections={collections}
            showDefaultLookbook={false}
            setCollections={setCollections}
            preSelected={currentCollectionIds}
            confirmText="Done"
            userId={user?.id}
            onConfirm={handleSave}
          />
        </ModalContainer>
      </Overlay>
    </Modal>
  );
}

const Overlay = styled.Pressable`
  flex: 1;
  justify-content: flex-end;
  background-color: rgba(0, 0, 0, 0.2);
`;

const ModalContainer = styled.View`
  max-height: 90vh;
  background-color: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #eee;
`;

const ModalTitle = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  color: ${colors.secondary.medium};
`;
