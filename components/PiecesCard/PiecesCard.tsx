import React from 'react';
import { Linking, View } from 'react-native';
import styled from 'styled-components/native';
import { Plus, X, ShoppingCart } from 'lucide-react-native';
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
  isMakingPost?: boolean;
}

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
        const RowComponent = i === pieces.length - 1 ? LastRow : Row;

        return (
          <RowComponent key={i}>
            {/* Column 1 - Item name */}
            <NameColumn numberOfLines={2}>{piece.name}</NameColumn>

            {/* Column 2 - Brand */}
            <BrandColumn numberOfLines={1}>{piece.brand}</BrandColumn>

            {/* Column 3 - Actions */}
            <RightColumn>
              <IconButton
                disabled={!piece.url}
                style={{ opacity: piece.url ? 1 : 0 }}
                onPress={() => piece.url && Linking.openURL(piece.url)}
              >
                <ShoppingCart size={18} color={colors.tertiary.medium} />
              </IconButton>

              {isMakingPost && (
                <IconButton onPress={() => onRemove?.(i)}>
                  <X size={18} color="#999" />
                </IconButton>
              )}
            </RightColumn>
          </RowComponent>
        );
      })}

      {isMakingPost && (
        <AddButton onPress={onAdd}>
          <Plus size={18} color={colors.neutral[400]} />
          <AddText>Add new...</AddText>
        </AddButton>
      )}
    </Container>
  );
};

const Container = styled.View`
  background-color: white;
  border-radius: 20px;
  padding: 20px;
  margin-horizontal: 5px;
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
  align-items: center;
  padding-vertical: 10px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.neutral[200]};
`;

const LastRow = styled(Row)`
  border-bottom-width: 0;
`;

const NameColumn = styled.Text`
  flex: 2;
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.primary[900]};
  margin-right: 12px;
`;

const BrandColumn = styled.Text`
  flex: 1;
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.primary[900]};
`;

const RightColumn = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  margin-left: 12px;
`;

const IconButton = styled.TouchableOpacity`
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

export default PiecesCard;
