// components/PiecesCard/PiecesCard.tsx
import React from 'react';
import { Linking, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { Plus, X } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export interface Piece {
  id?: string;
  name: string;
  brand: string;
  url?: string;
}

interface PiecesCardProps {
  pieces: Piece[];
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  onEdit?: (index: number, piece: Piece) => void;
  isMakingPost?: boolean;
}

const Container = styled.View`
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  margin-horizontal: 10px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.06;
  shadow-radius: 12px;
  elevation: 5;
`;

const Head = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  color: ${colors.secondary.medium};
  margin-bottom: 16px;
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 10px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.neutral[200]};
`;

const LastRow = styled(Row)`
  border-bottom-width: 0;
`;

const PieceName = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: 16px;
  font-weight: 500;
  color: ${colors.text.primary};
  flex: 1;
  margin-right: 12px;
`;

const BrandText = styled.Text<{ hasUrl: boolean }>`
  font-family: ${typography.body.fontFamily};
  font-size: 16px;
  font-weight: 500;
  color: ${({ hasUrl }) =>
    hasUrl ? colors.secondary.medium : colors.primary[900]};
  min-width: 100px;
  text-align: right;
`;

const RemoveButton = styled.TouchableOpacity`
  padding: 4px;
  margin-left: 8px;
`;

const AddButton = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  margin-top: 8px;
`;

const AddText = styled.Text`
  color: ${colors.neutral[400]};
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  margin-left: 4px;
`;

const PiecesCard: React.FC<PiecesCardProps> = ({
  pieces,
  onAdd,
  onRemove,
  isMakingPost = false,
}) => {
  return (
    <Container>
      <Head>Tagged Pieces</Head>

      {pieces.map((piece, i) => {
        const hasUrl = !!piece.url;
        const RowComponent = i === pieces.length - 1 ? LastRow : Row;

        return (
          <RowComponent key={i}>
            <PieceName numberOfLines={2}>{piece.name}</PieceName>

            {hasUrl ? (
              <TouchableOpacity onPress={() => Linking.openURL(piece.url!)}>
                <BrandText hasUrl>{piece.brand}</BrandText>
              </TouchableOpacity>
            ) : (
              <BrandText hasUrl={false}>{piece.brand}</BrandText>
            )}

            {isMakingPost && (
              <>
                <RemoveButton onPress={() => onRemove(i)}>
                  <X size={18} color="#999" />
                </RemoveButton>
              </>
            )}
          </RowComponent>
        );
      })}
      {isMakingPost && (
        <>
          <AddButton onPress={onAdd}>
            <Plus size={20} color={colors.neutral[400]} />
            <AddText>Add new...</AddText>
          </AddButton>
        </>
      )}
    </Container>
  );
};

export default PiecesCard;
