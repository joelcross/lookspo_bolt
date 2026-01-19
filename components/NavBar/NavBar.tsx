import React from 'react';
import {
  Animated,
  Easing,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
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
          borderRadius: 24,
          overflow: 'hidden',
        }}
      />
      <ContentWrapper>
        {(Object.keys(ICONS) as TabKey[]).map((key) => {
          const Icon = ICONS[key];
          const isActive = key === activeKey;

          const scale = React.useRef(
            new Animated.Value(isActive ? 1.1 : 1),
          ).current;

          React.useEffect(() => {
            Animated.timing(scale, {
              toValue: isActive ? 1.1 : 1,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }).start();
          }, [isActive]);

          return (
            <TouchableWithoutFeedback
              key={key}
              onPress={() => {
                Animated.sequence([
                  Animated.timing(scale, {
                    toValue: 0.85,
                    duration: 80,
                    useNativeDriver: true,
                  }),
                  Animated.timing(scale, {
                    toValue: isActive ? 1.1 : 1,
                    duration: 150,
                    easing: Easing.elastic(1.2),
                    useNativeDriver: true,
                  }),
                ]).start(() => onTabPress(key));
              }}
            >
              <Item
                style={{
                  transform: [{ scale }],
                }}
              >
                <IconWrapper isActive={isActive}>
                  <Icon
                    color={isActive ? '#1A1A1A' : '#6B6B6B'}
                    size={20}
                    weight={isActive ? 'fill' : 'regular'}
                  />
                </IconWrapper>
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
  padding-vertical: 12px;
  border-radius: 24px;
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
    shadow-radius: 24px;
  `
    : `
    elevation: 8;
  `}
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
`;

const IconWrapper = styled.View<{ isActive: boolean }>`
  padding: 10px;
  border-radius: 16px;
  background-color: ${({ isActive }) =>
    isActive ? 'rgba(26, 26, 26, 0.08)' : 'transparent'};
`;
