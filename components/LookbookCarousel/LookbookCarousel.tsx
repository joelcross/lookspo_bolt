// components/LookbookCarousel.tsx
import React from 'react';
import { FlatList, View, Text, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Collection } from '@/lib/types';
import LookbookSummary from '../LookbookSummary/LookbookSummary';

const ITEM_WIDTH = 140;
const ITEM_SPACING = 12;

interface LookbookCarouselProps {
  collections: Collection[];
}

const Container = styled.View`
  margin-horizontal: 16px;
  margin-vertical: 12px;
`;

const Header = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: 600;
  color: ${colors.secondary[500]};
  margin-bottom: 12px;
`;

const CarouselWrapper = styled.View`
  position: relative;
`;

const EmptyState = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.neutral[400]};
  padding-vertical: 20px;
  text-align: center;
`;

const LookbookCarousel: React.FC<LookbookCarouselProps> = ({ collections }) => {
  if (collections.length === 0) {
    return (
      <Container>
        <Header>Featured In</Header>
        <EmptyState>This look is not saved to any lookbooks yet.</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>Featured In</Header>

      <CarouselWrapper>
        <FlatList
          data={collections}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <LookbookSummary lookbook={item} />}
          ItemSeparatorComponent={() => (
            <View style={{ width: ITEM_SPACING }} />
          )}
          contentContainerStyle={{ paddingHorizontal: 4 }}
          snapToInterval={ITEM_WIDTH + ITEM_SPACING}
          snapToAlignment="start"
          decelerationRate="fast"
          bounces={true}
        />
      </CarouselWrapper>
    </Container>
  );
};

export default LookbookCarousel;
