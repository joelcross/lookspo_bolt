// components/LookbookCarousel.tsx
import React from 'react';
import { FlatList, Text } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Collection } from '@/lib/types';
import LookbookSummary from '../LookbookSummary/LookbookSummary';

interface LookbookCarouselProps {
  collections: Collection[];
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

const renderCollection = ({ item }: { item: Collection }) => (
  <LookbookSummary lookbook={item} />
);

const LookbookCarousel: React.FC<LookbookCarouselProps> = ({ collections }) => {
  return (
    <Container>
      <Header>Featured In</Header>

      {collections.length ? (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={renderCollection}
          numColumns={3}
          scrollEnabled={true}
          // columnWrapperStyle={styles.columnWrapper}
        />
      ) : (
        <Text>This look is not saved to any lookbooks yet.</Text>
      )}
    </Container>
  );
};

export default LookbookCarousel;
