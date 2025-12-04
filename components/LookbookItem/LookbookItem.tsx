// components/LookbookItem.tsx
import React from 'react';
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { TShirtIcon } from 'phosphor-react-native';
import { typography } from '@/theme/typography';
import { Collection } from '@/lib/types';
import { color } from 'storybook/theming';

interface LookbookItemProps {
  lookbook: Collection;
}

const Card = styled.TouchableOpacity<{ cardWidth: number }>`
  width: ${({ cardWidth }) => cardWidth}px;
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  elevation: 6;
  border-width: 1px;
  border-color: ${colors.neutral[200]};
`;

const TextContainer = styled.View`
  justify-content: flex-end;
  padding: 12px;
`;

const Title = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  color: ${colors.text.primary};
`;

const Author = styled.Text`
  font-family: ${typography.caption.fontFamily};
  font-size: ${typography.caption.fontSize}px;
  color: ${colors.neutral[400]};
  opacity: 0.9;
  margin-top: 2px;
`;

const CollageContainer = styled.View<{ cardWidth: number }>`
  width: 100%;
  height: ${({ cardWidth }) => cardWidth}px;
  flex-direction: row;
  flex-wrap: wrap;
  overflow: hidden;
`;

const CollageImage = styled.Image`
  width: 50%;
  height: 50%;
`;

const Placeholder = styled.View`
  width: 50%;
  height: 50%;
  background-color: ${colors.neutral[100]};
  align-items: center;
  justify-content: center;
`;

const CountBadge = styled.View`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background-color: ${colors.primary[200]};
  align-items: center;
  justify-content: center;
`;

const CountText = styled.Text`
  color: ${colors.secondary[500]};
  font-size: 12px;
  font-weight: 600;
`;

const LookbookItem: React.FC<LookbookItemProps> = ({ lookbook, cardWidth }) => {
  const router = useRouter();
  const slots = [...lookbook.cover_images];

  // Fill with null for placeholders
  while (slots.length < 4) {
    slots.push(null);
  }

  return (
    <Card
      cardWidth={cardWidth}
      onPress={() => router.push(`/collection/${lookbook.id}`)}
    >
      <TextContainer>
        <Title numberOfLines={2}>{lookbook.name}</Title>
        <Author>by @{lookbook.user.username}</Author>
      </TextContainer>
      <CollageContainer cardWidth={cardWidth}>
        {slots.map((img, index) =>
          img ? (
            <CollageImage key={index} source={{ uri: img }} />
          ) : (
            <Placeholder key={index}>
              <TShirtIcon
                size={36}
                color={colors.neutral[200]}
                weight="light"
              />
            </Placeholder>
          )
        )}

        <CountBadge
          style={{ transform: [{ translateX: -12 }, { translateY: -12 }] }}
        >
          <CountText>{lookbook.post_count}</CountText>
        </CountBadge>
      </CollageContainer>
    </Card>
  );
};

export default LookbookItem;
