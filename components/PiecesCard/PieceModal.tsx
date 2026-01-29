import React, { useState, useEffect } from 'react';
import { Modal, Alert } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Piece } from './PiecesCard';
import { Button } from '../Button/Button';
import CustomTextInput from '../CustomTextInput/CustomTextInput';

interface PieceModalProps {
  visible: boolean;
  piece?: Piece | null;
  onClose: () => void;
  onSave: (piece: Piece) => void;
}

export const PieceModal: React.FC<PieceModalProps> = ({
  visible,
  piece,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(piece?.name || '');
  const [brand, setBrand] = useState(piece?.brand || '');
  const [url, setUrl] = useState(piece?.url || '');

  useEffect(() => {
    if (visible && piece) {
      setName(piece.name);
      setBrand(piece.brand);
      setUrl(piece.url || '');
    } else if (visible && !piece) {
      setName('');
      setBrand('');
      setUrl('');
    }
  }, [visible, piece]);

  const handleSave = () => {
    if (!name.trim() || !brand.trim()) {
      Alert.alert('Error', 'Name and Brand are required');
      return;
    }
    onSave({
      name: name.trim(),
      brand: brand.trim(),
      url: url.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Overlay onPress={onClose}>
        <ModalCard onPress={(e) => e.stopPropagation()}>
          <ModalText>{piece ? 'Edit Piece' : 'Add New Piece'}</ModalText>

          <ModalTextInputWrapper>
            <CustomTextInput
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            <CustomTextInput
              placeholder="Brand"
              value={brand}
              onChangeText={setBrand}
            />
            <CustomTextInput
              placeholder="URL (optional)"
              value={url}
              onChangeText={setUrl}
            />
          </ModalTextInputWrapper>
          <ButtonRow>
            <ModalButtonWrapper>
              <Button title="Cancel" variant="secondary" onPress={onClose} />
            </ModalButtonWrapper>
            <ModalButtonWrapper>
              <Button title="Save" onPress={handleSave} />
            </ModalButtonWrapper>
          </ButtonRow>
        </ModalCard>
      </Overlay>
    </Modal>
  );
};

const Overlay = styled.Pressable`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalCard = styled.Pressable`
  width: 85vw;
  background-color: #fff;
  border-radius: 20px;
  padding: 16px;
`;

const ModalText = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: ${typography.heading3.fontWeight};
  color: ${colors.text.primary};
  text-align: center;
  margin-bottom: 12px;
`;

const ModalTextInputWrapper = styled.View`
  margin-bottom: 24px;
  gap: 5px;
`;

const ModalButtonWrapper = styled.View`
  flex: 1;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 5px;
`;
