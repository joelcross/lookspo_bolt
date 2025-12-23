import React, { useEffect, useRef, useState } from 'react';
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
import { router } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 4;
const GRID_PADDING = 0;
const GRID_GAP = 12;

const CONTAINER_MARGIN = 10;

const CARD_WIDTH =
  (SCREEN_WIDTH - CONTAINER_MARGIN * 2 - GRID_GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

interface LookbookListProps {
  collections: Collection[];
  headerText: string;
  display: 'carousel' | 'grid';
  hideAuthor?: Boolean;
  selectable?: Boolean;
  onSelectionChange?: (id: string) => void;
}

const LookbookList: React.FC<LookbookListProps> = ({
  collections,
  headerText,
  display = 'carousel', // default behavior unchanged
  hideAuthor = false,
  selectable = false,
  onSelectionChange,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (collections.length > 0 && !selectedId) {
      setSelectedId(collections[0].id);
      if (onSelectionChange) {
        onSelectionChange(collections[0].id);
      }
    }
  }, [collections]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;

    const maxScroll = contentSize.width - layoutMeasurement.width;

    setShowLeftGradient(contentOffset.x > 0);
    setShowRightGradient(contentOffset.x < maxScroll - 1); // small buffer for float
  };

  const handleLookbookPress = (item: Collection) => {
    if (selectable) {
      setSelectedId(item.id);
      onSelectionChange?.(item.id);
    } else {
      router.push(`/collection/${item.id}`);
    }
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
          numColumns={NUM_COLUMNS}
          key="GRID"
          contentContainerStyle={{
            paddingHorizontal: GRID_PADDING,
            paddingTop: GRID_PADDING,
          }}
          columnWrapperStyle={{
            justifyContent: 'flex-start',
          }}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const isLastColumn = (index + 1) % NUM_COLUMNS === 0;

            return (
              <View
                style={{
                  marginRight: isLastColumn ? 0 : GRID_GAP,
                  marginBottom: GRID_GAP,
                }}
              >
                <LookbookItem
                  lookbook={item}
                  cardWidth={CARD_WIDTH}
                  isSelected={selectedId === item.id}
                  handleLookbookPress={() => handleLookbookPress(item)}
                  display={display}
                />
              </View>
            );
          }}
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
                isSelected={selectedId === item.id}
                handleLookbookPress={() => handleLookbookPress(item)}
                display={display}
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

const Container = styled.View`
  margin-horizontal: 10px;
  margin-vertical: 12px;
`;

const HeadingText = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: ${typography.heading3.fontWeight};
  color: ${colors.text.primary};
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

export default LookbookList;
