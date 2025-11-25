// components/LookbookSummary.tsx
import React from 'react';
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Collection } from '@/lib/types';

interface LookbookSummaryProps {
  lookbook: Collection;
  hideAuthor?: boolean;
}

const ClickableWrapper = styled.TouchableOpacity``;

const Container = styled.View`
  flex-direction: column;
  background-color: blue;
  border-radius: 10px 10px 0 0;
`;

const Thumbnail = styled.Image`
  width: 48px;
  height: 48px;
`;

const LookbookTitle = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  font-weight: ${typography.body.fontWeight};
  color: ${colors.text.primary};
`;

const Author = styled.Text`
  font-family: ${typography.caption.fontFamily};
  font-size: ${typography.caption.fontSize}px;
  font-weight: ${typography.caption.fontWeight};
  color: ${colors.neutral[400]};
`;

const LookbookSummary: React.FC<LookbookSummaryProps> = ({
  lookbook,
  hideAuthor = false,
}) => {
  const router = useRouter();

  return (
    <ClickableWrapper onPress={() => router.push(`/collection/${lookbook.id}`)}>
      <Container>
        <Thumbnail source={{ uri: lookbook.cover_url }} resizeMode="cover" />
        <LookbookTitle>{lookbook.name}</LookbookTitle>
        {!hideAuthor && <Author>by {lookbook.user.username}</Author>}
      </Container>
    </ClickableWrapper>
  );
};

export default LookbookSummary;
