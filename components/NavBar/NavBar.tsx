import React from 'react';
import { Animated, Easing, TouchableWithoutFeedback } from 'react-native';
import styled from 'styled-components/native';
import {
  HouseIcon,
  MagnifyingGlassIcon,
  PlusSquareIcon,
  ChatTeardropIcon,
  UserIcon,
} from 'phosphor-react-native';
import { colors } from '@/theme/colors';

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
      {(Object.keys(ICONS) as TabKey[]).map((key) => {
        const Icon = ICONS[key];
        const isActive = key === activeKey;

        const scale = React.useRef(
          new Animated.Value(isActive ? 1.0 : 1)
        ).current;

        React.useEffect(() => {
          Animated.timing(scale, {
            toValue: isActive ? 1.0 : 1,
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
                  toValue: 0.9,
                  duration: 80,
                  useNativeDriver: true,
                }),
                Animated.timing(scale, {
                  toValue: 1.0,
                  duration: 150,
                  useNativeDriver: true,
                }),
              ]).start(() => onTabPress(key));
            }}
          >
            <Item
              style={[
                {
                  transform: [{ scale }],

                  borderRadius: 100,
                  overflow: 'hidden',
                  padding: 10,
                },
              ]}
            >
              {' '}
              <Icon
                color={colors.tertiary.medium}
                size={20}
                weight={isActive ? 'fill' : 'regular'}
              />
            </Item>
          </TouchableWithoutFeedback>
        );
      })}
    </Container>
  );
}

export default NavBar;

const Container = styled.View`
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
  height: 8vh;
  margin: 5px;
  margin-top: 0;
  padding-horizontal: 16px;

  background-color: ${colors.secondary.medium};
  border-radius: 20px;
`;

const Item = styled(Animated.View)`
  padding: 5px;
  align-items: center;
  justify-content: center;
`;
