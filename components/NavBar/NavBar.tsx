import React from 'react';
import { Animated, TouchableWithoutFeedback, Platform } from 'react-native';
import styled from 'styled-components/native';
import { BlurView } from 'expo-blur';
import {
  HouseIcon,
  MagnifyingGlassIcon,
  PlusSquareIcon,
  ChatTeardropIcon,
  UserIcon,
} from 'phosphor-react-native';

export type TabKey = 'home' | 'search' | 'new_post' | 'activity' | 'profile';

type NavBarProps = {
  activeKey: TabKey;
  onTabPress: (key: TabKey) => void;
};

const ICONS = {
  home: HouseIcon,
  search: MagnifyingGlassIcon,
  new_post: PlusSquareIcon,
  activity: ChatTeardropIcon,
  profile: UserIcon,
};

export function NavBar({ activeKey, onTabPress }: NavBarProps) {
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const widthAnim = React.useRef(new Animated.Value(0)).current;

  const [itemLayouts, setItemLayouts] = React.useState<
    { x: number; width: number }[]
  >([]);

  const keys = Object.keys(ICONS) as TabKey[];
  const activeIndex = keys.indexOf(activeKey);

  React.useEffect(() => {
    if (itemLayouts.length === keys.length && activeIndex >= 0) {
      const layout = itemLayouts[activeIndex];

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: layout.x,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.spring(widthAnim, {
          toValue: layout.width,
          useNativeDriver: false,
          tension: 80,
          friction: 10,
        }),
      ]).start();
    }
  }, [activeIndex, itemLayouts]);

  const handleItemLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;

    setItemLayouts((prev) => {
      const next = [...prev];
      next[index] = { x, width };
      return next;
    });
  };

  return (
    <Container>
      <BlurView
        intensity={80}
        tint="light"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 20,
          overflow: 'hidden',
        }}
      />

      <ContentWrapper>
        {itemLayouts.length === keys.length && (
          <SlidingPill
            style={{
              width: widthAnim,
              transform: [{ translateX: slideAnim }],
            }}
          />
        )}

        {keys.map((key, index) => {
          const Icon = ICONS[key];
          const isActive = key === activeKey;

          const scale = React.useRef(
            new Animated.Value(isActive ? 1.1 : 1),
          ).current;

          React.useEffect(() => {
            Animated.timing(scale, {
              toValue: isActive ? 1.1 : 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }, [isActive]);

          return (
            <TouchableWithoutFeedback key={key} onPress={() => onTabPress(key)}>
              <Item
                onLayout={handleItemLayout(index)}
                style={{ transform: [{ scale }] }}
              >
                <Icon
                  color={isActive ? '#1A1A1A' : '#6B6B6B'}
                  size={20}
                  weight={isActive ? 'fill' : 'regular'}
                />
              </Item>
            </TouchableWithoutFeedback>
          );
        })}
      </ContentWrapper>
    </Container>
  );
}

export default NavBar;

const Container = styled.View`
  position: absolute;
  width: 75vw;
  bottom: 12px;
  align-self: center;
  flex-direction: row;
  padding-vertical: 8px;
  border-radius: 20px;
  z-index: 999;

  /* Glassmorphism backdrop */
  background-color: rgba(255, 255, 255, 0.1);

  /* Subtle border for depth */
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.8);

  /* Shadow for floating effect */
  ${Platform.OS === 'ios'
    ? `
    shadow-color: #000;
    shadow-offset: 0px 8px;
    shadow-opacity: 0.12;
    shadow-radius: 20px;
  `
    : `
    elevation: 8;
  `}
`;

const SlidingPill = styled(Animated.View)`
  position: absolute;
  left: 0;
  top: 50%;
  margin-top: -20px;
  height: 40px;
  background-color: rgba(26, 26, 26, 0.08);
  border-radius: 20px;
  z-index: 0;
`;

const ContentWrapper = styled.View`
  flex: 1;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  padding-horizontal: 8px;
  z-index: 1;
`;

const Item = styled(Animated.View)`
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  z-index: 1;
`;
