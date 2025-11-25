// components/PiecesCard.tsx
import React from 'react';
import { Linking, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

interface Article {
  name: string;
  brand: string;
  url?: string;
}

interface PiecesCardProps {
  pieces: Article[];
}

const Container = styled.View`
  background-color: white;
  border-radius: 12px;
  margin-horizontal: 10px;
  padding: 16px 16px 0px 16px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.05;
  shadow-radius: 10px;
  elevation: 4;
`;

const Header = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: 600;
  color: ${colors.secondary[500]};
  margin-bottom: 12px;
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 14px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.neutral[200]};
`;

const PieceName = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
  flex: 1;
  margin-right: 16px;
  padding-right: 20px; /* prevents text from going under brand */
`;

const BrandContainer = styled.View`
  /* This is the magic — fixed alignment point */
  min-width: 120px;
  align-items: flex-start;
`;

const BrandText = styled.Text<{ hasUrl: boolean }>`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  font-weight: ${({ hasUrl }) => (hasUrl ? 500 : 400)};
  color: ${({ hasUrl }) =>
    hasUrl ? colors.secondary[500] : colors.text.primary};
`;

const BrandLink = styled(TouchableOpacity)``;

const PiecesCard: React.FC<PiecesCardProps> = ({ pieces }) => {
  return (
    <Container>
      <Header>Tagged Pieces</Header>

      {pieces.map((piece, index) => {
        const hasUrl = !!piece.url;
        const isLast = index === pieces.length - 1;

        return (
          <Row
            key={index}
            style={isLast ? { borderBottomWidth: 0 } : undefined}
          >
            <PieceName numberOfLines={2}>{piece.name}</PieceName>

            <BrandContainer>
              {hasUrl ? (
                <BrandLink onPress={() => Linking.openURL(piece.url!)}>
                  <BrandText hasUrl>{piece.brand}</BrandText>
                </BrandLink>
              ) : (
                <BrandText hasUrl={false}>{piece.brand}</BrandText>
              )}
            </BrandContainer>
          </Row>
        );
      })}
    </Container>
  );
};

export default PiecesCard;
