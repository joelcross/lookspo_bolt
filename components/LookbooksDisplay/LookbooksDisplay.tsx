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
import { usePathname } from 'expo-router';
import { FlashList } from '@shopify/flash-list';

interface LookbooksDisplayProps {
  collections: Collection[];
  displayMode: 'grid' | 'carousel';
  hideAuthor?: Boolean;
  selectable?: Boolean;
  onSelectionChange?: (collection: Collection) => void;
}

const LookbooksDisplay: React.FC<LookbooksDisplayProps> = ({
  collections,
  displayMode,
  hideAuthor = false,
  selectable = false,
  onSelectionChange,
}) => {
  const pathname = usePathname();
  const flatListRef = useRef<FlatList>(null);
  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(true);
  const [selectedLookbook, setSelectedLookbook] = useState<Collection | null>(
    null
  );

  const isProfileScreen =
    pathname === '/profile' || pathname.startsWith('/user/');

  const SCREEN_WIDTH = Dimensions.get('window').width;
  const NUM_COLUMNS = displayMode === 'grid' ? 3 : 4;
  const GRID_GAP_HORIZONTAL = displayMode === 'grid' ? 36 : 12;
  const GRID_GAP_VERTICAL = 12;
  const CONTAINER_MARGIN = 10;
  const CARD_WIDTH =
    (SCREEN_WIDTH -
      CONTAINER_MARGIN * 2 -
      GRID_GAP_HORIZONTAL * (NUM_COLUMNS - 1)) /
    NUM_COLUMNS;

  useEffect(() => {
    if (isProfileScreen && collections.length > 0 && !selectedLookbook) {
      setSelectedLookbook(collections[0]);
      if (onSelectionChange) {
        onSelectionChange(collections[0]);
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
      setSelectedLookbook(item);
      onSelectionChange?.(item);
    } else {
      router.push(`/collection/${item.id}`);
    }
  };

  if (collections.length > 0) {
    return (
      <Container>
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

          <FlashList
            ref={flatListRef}
            data={collections}
            numColumns={displayMode === 'grid' ? NUM_COLUMNS : 1}
            horizontal={displayMode === 'carousel' ? true : false}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16} // ensures frequent updates
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ItemWrapper>
                <LookbookItem
                  lookbook={item}
                  cardWidth={CARD_WIDTH}
                  hideAuthor={hideAuthor}
                  isHighlighted={selectedLookbook?.id === item.id}
                  handleLookbookPress={() => handleLookbookPress(item)}
                />
              </ItemWrapper>
            )}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: GRID_GAP_VERTICAL,
                  width: GRID_GAP_HORIZONTAL,
                }}
              />
            )}
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
      </Container>
    );
  }
};

const Container = styled.View`
  margin-horizontal: 10px;
  margin-vertical: 12px;
`;

const CarouselWrapper = styled.View`
  position: relative;
`;

const ItemWrapper = styled.View`
  align-items: center;
`;

const EmptyState = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.neutral[400]};
  padding-vertical: 20px;
  text-align: center;
`;

export default LookbooksDisplay;
