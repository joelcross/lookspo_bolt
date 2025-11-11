import React from 'react';
import { View, TouchableWithoutFeedback, Animated, Easing } from 'react-native';
import {
  HouseIcon,
  MagnifyingGlassIcon,
  PlusSquareIcon,
  ChatTeardropIcon,
  UserIcon,
} from 'phosphor-react-native';
import { styles } from './NavBar.styles';

type TabKey = 'home' | 'search' | 'new-post' | 'activity' | 'profile';

type NavBarProps = {
  activeKey: TabKey;
  onTabPress: (key: TabKey) => void;
};

const ICONS = {
  home: HouseIcon,
  search: MagnifyingGlassIcon,
  'new-post': PlusSquareIcon,
  activity: ChatTeardropIcon,
  profile: UserIcon,
};

const NavBar: React.FC<NavBarProps> = ({ activeKey, onTabPress }) => {
  return (
    <View style={styles.container}>
      {(Object.keys(ICONS) as TabKey[]).map((key) => {
        const Icon = ICONS[key];
        const isActive = key === activeKey;

        const scale = React.useRef(
          new Animated.Value(isActive ? 1.2 : 1)
        ).current;

        React.useEffect(() => {
          Animated.timing(scale, {
            toValue: isActive ? 1.2 : 1,
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
                  toValue: 1.2,
                  duration: 150,
                  useNativeDriver: true,
                }),
              ]).start(() => onTabPress(key));
            }}
          >
            <Animated.View style={[styles.item, { transform: [{ scale }] }]}>
              <Icon
                color={isActive ? '#000' : '#999'}
                size={28}
                weight={isActive ? 'fill' : 'regular'}
              />
            </Animated.View>
          </TouchableWithoutFeedback>
        );
      })}
    </View>
  );
};

export default NavBar;
