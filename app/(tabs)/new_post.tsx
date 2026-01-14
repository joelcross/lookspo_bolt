import React, { useState } from 'react';
import { Alert, Modal, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Upload } from 'lucide-react-native';
import styled from 'styled-components/native';
import PiecesCard, { Piece } from '@/components/PiecesCard/PiecesCard';
import { PieceModal } from '@/components/PiecesCard/PieceModal';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Button } from '@/components/Button/Button';
import PageHeader from '@/components/PageHeader/PageHeader';
import PostCardSimple from '@/components/PostCardSimple/PostCardSimple';

export default function NewPostScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Image Picker
  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setImage(url);
        }
      };
      input.click();
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImage(result.assets[0].uri);
    }
  };

  // Handle Add/Edit Piece
  const handleSavePiece = (newPiece: Piece) => {
    if (editingIndex !== null) {
      const updated = [...pieces];
      updated[editingIndex] = newPiece;
      setPieces(updated);
      setEditingIndex(null);
    } else {
      setPieces([...pieces, newPiece]);
    }
  };

  // Handle Remove Piece
  const handleRemovePiece = (index: number) => {
    setPieces(pieces.filter((_, i) => i !== index));
  };

  // Next Button
  const handleNext = () => {
    if (!image) return;

    const filledPieces = pieces.filter((p) => p.name.trim() && p.brand.trim());

    router.push({
      pathname: '/save-to-lookbooks',
      params: {
        imageUri: image,
        caption: caption.trim(),
        pieces: JSON.stringify(filledPieces),
      },
    });
  };

  // Discard Logic
  const hasContent = !!image || caption.trim() || pieces.length > 0;

  const handleBack = () => {
    if (hasContent) {
      setShowDiscardModal(true);
    } else {
      router.back();
    }
  };

  const confirmDiscard = () => {
    setImage(null);
    setCaption('');
    setPieces([]);
    setShowDiscardModal(false);
    router.replace('/home');
  };

  // Empty State
  if (!image) {
    return (
      <Container>
        <PageHeader text="New Look" />
        <EmptyUpload onPress={pickImage}>
          <Upload size={48} color={colors.neutral[400]} />
          <EmptyText>Tap to select a photo</EmptyText>
        </EmptyUpload>
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader text="New Look" left="back" />

      {/* Main Scrollable Content */}
      <ScrollableContent showsVerticalScrollIndicator={false}>
        <Content>
          <PostCardSimple
            image={image}
            caption={caption}
            setCaption={setCaption}
          />

          <PiecesCard
            pieces={pieces}
            onAdd={() => {
              setEditingIndex(null);
              setModalVisible(true);
            }}
            onRemove={handleRemovePiece}
            isMakingPost={true}
          />

          <Button
            title="Next"
            onPress={handleNext}
            style={{ marginHorizontal: 5 }}
          />
        </Content>
      </ScrollableContent>

      {/* Add/Edit Piece Modal */}
      <PieceModal
        visible={modalVisible}
        piece={editingIndex !== null ? pieces[editingIndex] : null}
        onClose={() => setModalVisible(false)}
        onSave={handleSavePiece}
      />

      {/* Discard Confirmation Modal */}
      <Modal visible={showDiscardModal} transparent animationType="fade">
        <ModalOverlay>
          <ModalContainer>
            <ModalTitle>Discard post?</ModalTitle>
            <ModalText>
              Are you sure you want to discard your post? Your progress will be
              lost.
            </ModalText>

            <ModalActions>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowDiscardModal(false)}
              />
              <Button title="Yes, discard" onPress={confirmDiscard} />
            </ModalActions>
          </ModalContainer>
        </ModalOverlay>
      </Modal>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  border-radius: 20px;
  overflow: hidden;
`;

const ScrollableContent = styled.ScrollView`
  flex: 1;
`;

const Content = styled.View`
  gap: 5px;
  margin-bottom: 5px;
`;

// Empty State
const EmptyUpload = styled.Pressable`
  flex: 1;
  border-radius: 20px;
  margin-horizontal: 5px;
  margin-bottom: 5px;
  justify-content: center;
  align-items: center;
  background-color: white;
`;

const EmptyText = styled.Text`
  margin-top: 16px;
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.neutral[400]};
`;

// Discard Modal
const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalContainer = styled.View`
  background-color: white;
  border-radius: 20px;
  padding: 24px;
  width: 85%;
  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 20px;
  elevation: 10;
`;

const ModalTitle = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  color: ${colors.secondary.medium};

  text-align: center;
  margin-bottom: 8px;
`;

const ModalText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};

  text-align: center;
  margin-bottom: 24px;
  line-height: 22px;
`;

const ModalActions = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: 16px;
`;
