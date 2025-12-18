import React, { useRef, useState } from 'react';
import {
  FlatList,
  View,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Collection } from '@/lib/types';
import LookbookItem from '../LookbookItem/LookbookItem';
import { LinearGradient } from 'expo-linear-gradient';
import { Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 10; // 10px between columns
const CARD_WIDTH = (SCREEN_WIDTH - 20 /* container margin */ - GRID_GAP) / 2;

interface LookbookListProps {
  collections: Collection[];
  headerText: string;
  display: 'carousel' | 'grid';
  hideAuthor?: Boolean;
}

const Container = styled.View`
  margin-horizontal: 10px;
  margin-vertical: 12px;
`;

const HeadingText = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  color: ${colors.secondary.medium};
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

const LookbookList: React.FC<LookbookListProps> = ({
  collections,
  headerText,
  display = 'carousel', // default behavior unchanged
  hideAuthor = false,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;

    const maxScroll = contentSize.width - layoutMeasurement.width;

    setShowLeftGradient(contentOffset.x > 0);
    setShowRightGradient(contentOffset.x < maxScroll - 1); // small buffer for float
  };

  if (collections.length === 0) {
    return (
      <Container>
        <HeadingText>{headerText}</HeadingText>
        <EmptyState>This look is not saved to any lookbooks yet.</EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <HeadingText>{headerText}</HeadingText>
      {/* GRID VIEW */}
      {display === 'grid' && (
        <FlatList
          data={collections}
          numColumns={2}
          key={'GRID'}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            marginBottom: GRID_GAP,
          }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LookbookItem lookbook={item} cardWidth={CARD_WIDTH} />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
      {/* CAROUSEL VIEW */}
      {display === 'carousel' && (
        <CarouselWrapper>
          {showLeftGradient && (
            <LinearGradient
              colors={['white', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 30,
                zIndex: 1,
              }}
              pointerEvents="none"
            />
          )}

          <FlatList
            ref={flatListRef}
            data={collections}
            horizontal
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16} // ensures frequent updates
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <LookbookItem
                lookbook={item}
                cardWidth={CARD_WIDTH}
                hideAuthor={hideAuthor}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ width: GRID_GAP }} />}
          />

          {showRightGradient && (
            <LinearGradient
              colors={['transparent', 'white']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 30,
                zIndex: 1,
              }}
              pointerEvents="none"
            />
          )}
        </CarouselWrapper>
      )}
    </Container>
  );
};

export default LookbookList;
