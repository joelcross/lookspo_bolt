import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import React from 'react';
import styled from 'styled-components/native';
import { router } from 'expo-router';
import { Button } from '../Button/Button';

type HeaderProps = {
  text: string;
  left?: 'back' | 'cancel';
  right?: 'settings' | 'more' | 'trash';
  onCustomPress?: () => void;
};

export function Header({ text, left, right, onCustomPress }: HeaderProps) {
  const handleLeftButtonPress = () => router.back();

  const handleSettingsButtonPress = () => router.push('/settings');

  const handleCustomPress = () => {
    if (onCustomPress) onCustomPress();
  };

  const renderLeftButton = () => {
    if (left === 'back') {
      return (
        <Button title={left} variant={'text'} onPress={handleLeftButtonPress} />
      );
    } else if (left === 'cancel') {
      return (
        <Button
          title={'Cancel'}
          variant={'text'}
          onPress={handleLeftButtonPress}
        />
      );
    }
  };

  const renderRightButton = () => {
    if (right === 'settings') {
      return (
        <Button
          title={right}
          variant={'text'}
          onPress={handleSettingsButtonPress}
        />
      );
    } else if (right === 'more' || right === 'trash') {
      return (
        <Button title={right} variant={'text'} onPress={handleCustomPress} />
      );
    }
  };

  return (
    <Container>
      {renderLeftButton() || <Placeholder />}
      <Title>{text}</Title>
      {renderRightButton() || <Placeholder />}
    </Container>
  );
}

const Container = styled.View`
  background-color: ${colors.primary[100]};
  height: 44px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0px;
`;

const Title = styled.Text`
  color: ${colors.primary[900]};
  font-family: ${typography.heading2.fontFamily};
  font-size: ${typography.heading2.fontSize}px;
  text-transform: ${typography.heading2.textTransform};
  letter-spacing: ${typography.heading2.letterSpacing}px;
`;

const Placeholder = styled.View`
  width: 40px;
`;

export default Header;
