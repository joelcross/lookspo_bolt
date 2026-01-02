import React, { useEffect, useState } from 'react';
import {
  Modal,
  TouchableWithoutFeedback,
  View,
  Dimensions,
} from 'react-native';
import { PlusIcon } from 'phosphor-react-native';
import { supabase } from '@/lib/supabase';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Button } from '../Button/Button';
import TextInput from '../CustomTextInput/CustomTextInput';
import LookbookItem from '../LookbookItem/LookbookItem';
import { FlashList } from '@shopify/flash-list';

export interface Collection {
  id: string;
  name: string;
}

interface Props {
  collections: Collection[];
  setCollections: React.Dispatch<React.SetStateAction<Collection[]>>;
  preSelected?: string[];
  onConfirm: (selected: string[]) => Promise<void>;
  confirmText?: string;
  userId?: string;
  showDefaultLookbook?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const GRID_GAP = 36;

const CONTAINER_MARGIN = 10;

const CARD_WIDTH =
  (SCREEN_WIDTH - CONTAINER_MARGIN * 2 - GRID_GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

export default function LookbookGrid({
  collections,
  setCollections,
  preSelected = [],
  onConfirm,
  confirmText = 'Done',
  userId,
  showDefaultLookbook = true,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    if (!preSelected) return;

    setSelectedIds((prev) => {
      const newSelected = Array.isArray(preSelected)
        ? preSelected
        : [preSelected];

      // Only update if different
      if (JSON.stringify(prev) !== JSON.stringify(newSelected)) {
        return newSelected;
      }
      return prev; // no change → no re-render
    });
  }, [preSelected]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !userId) return;
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({ name: newCollectionName.trim(), user_id: userId })
        .select()
        .single();

      if (error) throw error;

      const collectionWithCoverImages = {
        ...data,
        cover_images: [],
        post_count: 0,
      };

      setCollections((prev) => [
        prev[0],
        collectionWithCoverImages,
        ...prev.slice(1),
      ]);
      setShowModal(false);
      setNewCollectionName('');
    } catch (err) {
      console.error('Failed to create collection:', err);
    }
  };

  return (
    <Container>
      <ScrollableContent>
        <FlashList
          ListHeaderComponent={<View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          data={[...collections]
            .filter((_, index) => !(index === 0 && !showDefaultLookbook))
            .concat({})} // filter out first item if needed
          numColumns={3}
          ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
          renderItem={({ item, index }) => {
            // Render custom item to let user make a new lookbook
            if (index === collections.length - (showDefaultLookbook ? 0 : 1)) {
              return (
                <ItemWrapper>
                  <NewLookbookCard onPress={() => setShowModal(true)}>
                    <PlusIcon size={24} color={colors.neutral[400]} />
                  </NewLookbookCard>
                </ItemWrapper>
              );
            }

            return (
              <ItemWrapper>
                <LookbookItem
                  lookbook={item}
                  cardWidth={CARD_WIDTH}
                  isDefault={showDefaultLookbook && index === 0}
                  isSelected={selectedIds.includes(item.id)}
                  handleLookbookPress={() => toggleSelect(item.id)}
                  hideAuthor
                />
              </ItemWrapper>
            );
          }}
        />
      </ScrollableContent>
      <PostButtonWrapper>
        <Button title={confirmText} onPress={() => onConfirm(selectedIds)} />
      </PostButtonWrapper>

      <Modal visible={showModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <Overlay>
            <TouchableWithoutFeedback>
              <ModalCard>
                <ModalTitle>New Collection</ModalTitle>

                <TextInput
                  placeholder="Enter collection name"
                  value={newCollectionName}
                  onChangeText={setNewCollectionName}
                  autoFocus
                />

                <NewCollectionButtonWrapper>
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setShowModal(false)}
                  />
                  <Button title="Create" onPress={handleCreateCollection} />
                </NewCollectionButtonWrapper>
              </ModalCard>
            </TouchableWithoutFeedback>
          </Overlay>
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  );
}

const Container = styled.View`
  justify-content: space-between;
  max-height: 80vh;
`;

const ItemWrapper = styled.View`
  align-items: center;
`;

const NewLookbookCard = styled.TouchableOpacity`
  width: ${CARD_WIDTH}px;
  aspect-ratio: 1;
  background-color: ${colors.neutral[200]};
  border-radius: 20px;
  justify-content: center;
  align-items: center;
`;
const ScrollableContent = styled.View`
  flex-shrink: 1;
  max-height: 70vh;
`;

const PostButtonWrapper = styled.View`
  margin: 16px;
`;

const NewCollectionButtonWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 16px;
`;

// Modal
const Overlay = styled.Pressable`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalCard = styled.View`
  width: 88%;
  background-color: #fff;
  border-radius: 20px;
  padding: 24px;
  shadow-color: #000;
  shadow-offset: 0px 10px;
  shadow-opacity: 0.15;
  shadow-radius: 20px;
  elevation: 15;
`;

const ModalTitle = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  text-align: center;
  margin-bottom: 20px;
  color: #000;
`;
