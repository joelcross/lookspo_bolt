import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import React from 'react';
import styled from 'styled-components/native';
import { router } from 'expo-router';
import { Platform, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Button } from '../Button/Button';

type HeaderProps = {
  text: string;
  left?: 'back' | 'cancel';
  right?: 'settings' | 'more' | 'trash';
  onCustomLeftPress?: () => void;
  onCustomPress?: () => void;
  scrollY?: Animated.Value;
};

export function Header({
  text,
  left,
  right,
  onCustomLeftPress,
  onCustomPress,
  scrollY,
}: HeaderProps) {
  const handleLeftButtonPress = () => {
    onCustomLeftPress ? onCustomLeftPress() : router.back();
  };

  const handleSettingsButtonPress = () => router.push('/settings');

  const handleCustomPress = () => {
    if (onCustomPress) onCustomPress();
  };

  const renderLeftButton = () => {
    if (left === 'back') {
      return (
        <Button title="Back" variant="text" onPress={handleLeftButtonPress} />
      );
    }

    if (left === 'cancel') {
      return (
        <Button title="Cancel" variant="text" onPress={handleLeftButtonPress} />
      );
    }

    return null;
  };

  const renderRightButton = () => {
    if (right === 'settings') {
      return (
        <Button
          title="Settings"
          variant="text"
          onPress={handleSettingsButtonPress}
        />
      );
    }

    if (right === 'more' || right === 'trash') {
      return (
        <Button title={right} variant="text" onPress={handleCustomPress} />
      );
    }

    return null;
  };

  const solidOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      })
    : new Animated.Value(1);

  return (
    <Container>
      {/* Always render blur effect */}
      <BlurView
        intensity={80}
        tint="light"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      />

      {/* Semi-transparent background layer */}
      <BackgroundTint />

      {/* Solid background overlay - fades out when scrolling */}
      <SolidBackground style={{ opacity: solidOpacity }} />

      <Content>
        <LeftWrapper>{renderLeftButton()}</LeftWrapper>
        <Title numberOfLines={1}>{text}</Title>
        <RightWrapper>{renderRightButton()}</RightWrapper>
      </Content>
    </Container>
  );
}

export default Header;

const Container = styled.View`
  position: absolute;
  top: 12px;
  align-self: center;
  z-index: 999;

  min-width: 70vw;
  height: 40px;

  border-radius: 20px;
  overflow: hidden;

  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.8);

  ${Platform.OS === 'ios'
    ? `
      shadow-color: #000;
      shadow-offset: 0px 4px;
      shadow-opacity: 0.08;
      shadow-radius: 16px;
    `
    : `
      elevation: 4;
    `}
`;

const BackgroundTint = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(119, 119, 119, 0.1);
`;

const SolidBackground = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
`;

const Content = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  z-index: 1;
`;

const LeftWrapper = styled.View`
  position: absolute;
  left: 8px;
`;

const RightWrapper = styled.View`
  position: absolute;
  right: 8px;
`;

const Title = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: 600;
  color: ${colors.primary[900]};
  letter-spacing: 0.3px;
`;
