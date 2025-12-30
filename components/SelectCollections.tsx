// components/SelectCollections.tsx
import React, { useState, useEffect } from 'react';
import { Modal, FlatList, TouchableWithoutFeedback, View } from 'react-native';
import { CheckCircleIcon, CircleIcon, TShirtIcon } from 'phosphor-react-native';
import { supabase } from '@/lib/supabase';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Button } from './Button/Button';
import TextInput from './CustomTextInput/CustomTextInput';
import SmartImage from './SmartImage/SmartImage';

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
}

export default function SelectCollections({
  collections,
  setCollections,
  preSelected = [],
  onConfirm,
  confirmText = 'Done',
  userId,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(preSelected);
  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

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

      setCollections((prev) => [...prev, data]);
      setShowModal(false);
      setNewCollectionName('');
    } catch (err) {
      console.error('Failed to create collection:', err);
    }
  };

  return (
    <Container>
      <ScrollableContent>
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          //style={{ maxHeight: 300 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isLast = index === collections.length - 1;
            return (
              <CollectionRow
                onPress={() => toggleSelect(item.id)}
                isLast={isLast}
              >
                <ImageWrapper>
                  {item.cover_image ? (
                    <SmartImage uri={item.cover_image} resizeMode="cover" />
                  ) : (
                    <GreyBackground>
                      <TShirtIcon
                        size={24}
                        color={colors.neutral[400]}
                        weight="light"
                      />
                    </GreyBackground>
                  )}
                </ImageWrapper>
                <CollectionName>{item.name}</CollectionName>
                {selectedIds.includes(item.id) ? (
                  <CheckCircleIcon
                    size={28}
                    color={colors.secondary.medium}
                    weight="fill"
                  />
                ) : (
                  <CircleIcon size={28} color={colors.secondary.medium} />
                )}
              </CollectionRow>
            );
          }}
        />

        <NewButtonWrapper>
          <Button
            title="＋ Add new collection"
            variant="secondary"
            onPress={() => setShowModal(true)}
          />
        </NewButtonWrapper>
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
const ScrollableContent = styled.View`
  flex-shrink: 1;
  max-height: 70vh;
`;

const CollectionRow = styled.Pressable<{ isLast: boolean }>`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 10px;
  border-bottom-width: ${(props) => (props.isLast ? '0px' : '1px')};
  border-bottom-color: #eee;
`;

const ImageWrapper = styled.View`
  width: 40px;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 10px;
  margin-right: 16px;
`;

const GreyBackground = styled.View`
  height: 100%;
  width: 100%;
  background-color: ${colors.neutral[200]};
  justify-content: center;
  align-items: center;
`;

const CollectionName = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
  flex: 1;
`;

const NewButtonWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin: 16px;
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
