import React, { useState, useEffect } from 'react';
import { Modal, TouchableOpacity, Alert } from 'react-native';
import styled from 'styled-components/native';
import { XIcon } from 'phosphor-react-native';
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
    <Modal visible={visible} transparent animationType="slide">
      <Overlay>
        <ModalContainer>
          <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={onClose}>
            <XIcon size={20} color={colors.neutral[400]} />
          </TouchableOpacity>

          <Title>{piece ? 'Edit Piece' : 'Add New Piece'}</Title>

          <InputContainer>
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
          </InputContainer>
          <ButtonRow>
            <ButtonWrapper>
              <Button title="Cancel" variant="secondary" onPress={onClose} />
            </ButtonWrapper>
            <ButtonWrapper>
              <Button title="Save" onPress={handleSave} />
            </ButtonWrapper>
          </ButtonRow>
        </ModalContainer>
      </Overlay>
    </Modal>
  );
};

const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.2);
  justify-content: flex-end;
`;

const ModalContainer = styled.View`
  background-color: white;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 24px;
  padding-top: 16px;
`;

const Title = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: ${typography.heading3.fontWeight};
  color: ${colors.text.primary};
  text-align: center;
  margin-bottom: 12px;
`;

const InputContainer = styled.View`
  gap: 5px;
  padding-bottom: 20px;
`;

const ButtonWrapper = styled.View`
  flex: 1;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  margin-top: 24px;
  gap: 8px;
`;
