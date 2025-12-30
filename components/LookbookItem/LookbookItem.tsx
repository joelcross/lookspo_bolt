// components/LookbookItem.tsx
import React from 'react';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { TShirtIcon } from 'phosphor-react-native';
import { typography } from '@/theme/typography';
import { Collection } from '@/lib/types';

interface LookbookItemProps {
  lookbook: Collection;
  cardWidth: number;
  display: 'carousel' | 'grid';
  hideAuthor?: Boolean;
  handleLookbookPress?: () => void;
  isSelected?: boolean;
}

const LookbookItem: React.FC<LookbookItemProps> = ({
  lookbook,
  cardWidth,
  display,
  hideAuthor = false,
  handleLookbookPress,
  isSelected,
}) => {
  const slots = [...lookbook.cover_images];

  // Fill with null for placeholders
  while (slots.length < 4) {
    slots.push(null);
  }

  return (
    <Card cardWidth={cardWidth} onPress={handleLookbookPress}>
      <CollageContainer cardWidth={cardWidth}>
        {slots.map((img, index) =>
          img ? (
            <CollageImage key={index} index={index} source={{ uri: img }} />
          ) : (
            <Placeholder key={index} index={index}>
              <TShirtIcon
                size={18}
                color={colors.neutral[400]}
                weight="light"
              />
            </Placeholder>
          )
        )}

        <CountBadge
          style={{ transform: [{ translateX: -9 }, { translateY: -9 }] }}
        >
          <CountText>{lookbook.post_count}</CountText>
        </CountBadge>
      </CollageContainer>
      <TextContainer>
        <Title numberOfLines={2} isSelected={isSelected}>
          {lookbook.name}
        </Title>
        {!hideAuthor && <Author>@{lookbook.user.username}</Author>}
      </TextContainer>
      {/* Only show dot on profile pages (i.e. when hideAuthor == True) */}
      {isSelected && hideAuthor && <SelectedDot />}
    </Card>
  );
};

const Card = styled.Pressable<{ cardWidth: number }>`
  width: ${({ cardWidth }) => cardWidth}px;
  align-items: center;
`;

const TextContainer = styled.View`
  align-items: center;
`;

const Title = styled.Text<{ isSelected?: boolean }>`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  font-family: ${typography.body.fontFamily};
  font-size: 12px;
  color: ${colors.text.primary};

  ${({ isSelected }) => `font-weight: ${isSelected ? 500 : 400};`}
`;

const SelectedDot = styled.View`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  margin-top: 4px;
  background-color: ${colors.tertiary.medium};
`;

const Author = styled.Text`
  font-family: ${typography.caption.fontFamily};
  font-size: ${typography.caption.fontSize}px;
  color: ${colors.neutral[400]};
`;

const CollageContainer = styled.View<{ cardWidth: number }>`
  width: 100%;
  height: ${({ cardWidth }) => cardWidth}px;
  flex-direction: row;
  flex-wrap: wrap;
  overflow: hidden;
`;

const CollageImage = styled.Image<{ index: number }>`
  width: 50%;
  height: 50%;

  ${({ index }) =>
    index === 0 &&
    `
      border-top-left-radius: 20px;
    `}
  ${({ index }) =>
    index === 1 &&
    `
      border-top-right-radius: 20px;
    `}
  ${({ index }) =>
    index === 2 &&
    `
      border-bottom-left-radius: 20px;
    `}
  ${({ index }) =>
    index === 3 &&
    `
      border-bottom-right-radius: 20px;
    `}
`;

const Placeholder = styled.View<{ index: number }>`
  width: 50%;
  height: 50%;
  background-color: ${colors.neutral[200]};
  align-items: center;
  justify-content: center;

  ${({ index }) =>
    index === 0 &&
    `
      border-top-left-radius: 20px;
    `}
  ${({ index }) =>
    index === 1 &&
    `
      border-top-right-radius: 20px;
    `}
  ${({ index }) =>
    index === 2 &&
    `
      border-bottom-left-radius: 20px;
    `}
  ${({ index }) =>
    index === 3 &&
    `
      border-bottom-right-radius: 20px;
    `}
`;

const CountBadge = styled.View`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 18px;
  height: 18px;
  border-radius: 12px;
  background-color: #fff;
  align-items: center;
  justify-content: center;
`;

const CountText = styled.Text`
  color: ${colors.secondary.medium};
  font-size: 12px;
  font-weight: 600;
`;

export default LookbookItem;
