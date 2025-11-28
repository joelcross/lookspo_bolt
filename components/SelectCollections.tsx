// components/SelectCollections.tsx
import React, { useState, useEffect } from 'react';
import { Modal, FlatList } from 'react-native';
import { CheckCircleIcon, CircleIcon } from 'phosphor-react-native';
import { supabase } from '@/lib/supabase';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Button } from './Button/Button';
import TextInput from './CustomTextInput/CustomTextInput';

export interface Collection {
  id: string;
  name: string;
}

interface Props {
  collections: Collection[];
  preSelected?: string[];
  onConfirm: (selected: string[]) => Promise<void>;
  confirmText?: string;
  userId?: string;
}

export default function SelectCollections({
  collections: initialCollections,
  preSelected = [],
  onConfirm,
  confirmText = 'Done',
  userId,
}: Props) {
  const [collections, setCollections] =
    useState<Collection[]>(initialCollections);
  const [selectedIds, setSelectedIds] = useState<string[]>(preSelected);
  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => setCollections(initialCollections), [initialCollections]);
  useEffect(() => setSelectedIds(preSelected), [preSelected]);

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

  const data = [
    ...collections,
    { id: 'new', name: 'Add new collection' } as any,
  ];

  return (
    <Wrapper>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) =>
          item.id === 'new' ? (
            <Button
              title="＋ Add new collection"
              variant="secondary"
              onPress={() => setShowModal(true)}
            />
          ) : (
            <CollectionRow onPress={() => toggleSelect(item.id)}>
              <CollectionName>{item.name}</CollectionName>
              {selectedIds.includes(item.id) ? (
                <CheckCircleIcon
                  size={28}
                  color={colors.secondary[500]}
                  weight="fill"
                />
              ) : (
                <CircleIcon size={28} color={colors.secondary[500]} />
              )}
            </CollectionRow>
          )
        }
      />

      <Button title={confirmText} onPress={() => onConfirm(selectedIds)} />

      <Modal visible={showModal} transparent animationType="fade">
        <Overlay onPress={() => setShowModal(false)}>
          <ModalCard onPress={(e) => e.stopPropagation()}>
            <ModalTitle>New Collection</ModalTitle>

            <TextInput
              placeholder="Enter collection name"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              autoFocus
            />
            <ButtonWrapper>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowModal(false)}
              />
              <Button title="Create" onPress={handleCreateCollection} />
            </ButtonWrapper>
          </ModalCard>
        </Overlay>
      </Modal>
    </Wrapper>
  );
}

// ──────────────────────────────
// Styled Components (100% working)
// ──────────────────────────────

const Wrapper = styled.View`
  background-color: #fff;
`;

const CollectionRow = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 10px;
  border-bottom-width: 1px;
  border-bottom-color: #eee;
`;

const CollectionName = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
  flex: 1;
`;

const ButtonWrapper = styled.View`
  flex-direction: row;
  justify-content: space-evenly;
  gap: 24px;
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
