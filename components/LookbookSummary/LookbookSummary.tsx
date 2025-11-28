// components/LookbookSummary.tsx
import React from 'react';
import styled from 'styled-components/native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Collection } from '@/lib/types';

const CARD_WIDTH = 140;

interface LookbookSummaryProps {
  lookbook: Collection;
}

const Card = styled.TouchableOpacity`
  width: ${CARD_WIDTH}px;
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.08;
  shadow-radius: 12px;
  elevation: 6;
`;

const Thumbnail = styled.ImageBackground`
  width: 100%;
  height: 180px;
`;

const Overlay = styled.View`
  background-color: rgba(0, 0, 0, 0.15);
  justify-content: flex-end;
  padding: 12px;
`;

const Title = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: 16px;
  font-weight: 600;
  color: white;
  text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.5);
`;

const Author = styled.Text`
  font-family: ${typography.caption.fontFamily};
  font-size: 13px;
  color: white;
  opacity: 0.9;
  margin-top: 2px;
`;

const LookbookSummary: React.FC<LookbookSummaryProps> = ({ lookbook }) => {
  const router = useRouter();
  console.log('lookbook in LookbookSummary:', lookbook);

  return (
    <Card onPress={() => router.push(`/collection/${lookbook.id}`)}>
      <Thumbnail
        source={{
          uri: lookbook.cover_url || 'https://via.placeholder.com/140',
        }}
      >
        <Overlay>
          <Title numberOfLines={2}>{lookbook.name}</Title>
          <Author>by @{lookbook.user.username}</Author>
        </Overlay>
      </Thumbnail>
    </Card>
  );
};

export default LookbookSummary;
