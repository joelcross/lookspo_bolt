import React, { useEffect, useState } from 'react';
import { Modal, View, TouchableOpacity, Text } from 'react-native';
import styled from 'styled-components/native';
import { X } from 'lucide-react-native';
import SelectCollections from '@/components/SelectCollections';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface SaveModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  currentCollectionIds: string[];
  onSaved: () => void;
}

export default function SaveModal({
  visible,
  onClose,
  postId,
  currentCollectionIds,
  onSaved,
}: SaveModalProps) {
  const { user } = useAuth();
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    if (visible && user) {
      supabase
        .from('collections')
        .select('id, name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => setCollections(data || []));
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
        const inserts = toAdd.map((collectionId) => ({
          post_id: postId,
          collection_id: collectionId,
          user_id: user!.id,
        }));
        await supabase.from('saves').insert(inserts);
      }

      onSaved();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Overlay onPress={onClose}>
        <ModalContainer onPress={(e) => e.stopPropagation()}>
          <HeaderRow>
            <TouchableOpacity onPress={onClose}>
              <X size={28} color="black" />
            </TouchableOpacity>
            <ModalTitle>Save to lookbooks</ModalTitle>
            <View style={{ width: 28 }} />
          </HeaderRow>

          <SelectCollections
            collections={collections}
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

// Styled Components
const Overlay = styled.Pressable`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: flex-end;
`;

const ModalContainer = styled.View`
  background-color: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  max-height: 90%;
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
  font-size: 18px;
  font-weight: 600;
`;
