import { colors } from '@/theme/colors';
import { SmileyIcon } from 'phosphor-react-native';
import React from 'react';
import styled from 'styled-components/native';

interface AvatarProps {
  uri: string;
  size?: number; // default 48
  outlineColor?: string; // default grey
  outlineWidth?: number; // default 2
}

export function Avatar({
  uri,
  size = 48,
  outlineColor = '#ccc',
  outlineWidth = 0,
}: AvatarProps) {
  return (
    <OutlineWrapper
      size={size}
      outlineWidth={outlineWidth}
      outlineColor={outlineColor}
      uri={uri}
    >
      {uri ? (
        <AvatarImage size={size} source={{ uri }} />
      ) : (
        <SmileyIcon
          size={size * 0.75}
          color={colors.neutral[200]}
          weight="light"
        />
      )}
    </OutlineWrapper>
  );
}

const OutlineWrapper = styled.View<{
  size: number;
  outlineWidth: number;
  outlineColor: string;
  uri: string;
}>`
  width: ${({ size, outlineWidth }) => size + outlineWidth * 2}px;
  height: ${({ size, outlineWidth }) => size + outlineWidth * 2}px;
  border-radius: ${({ size, outlineWidth }) => (size + outlineWidth * 2) / 2}px;
  border-width: ${({ outlineWidth }) => outlineWidth}px;
  border-color: ${({ outlineColor }) => outlineColor};
  align-items: center;
  justify-content: center;
  background-color: ${({ uri }) => (uri ? '#fff' : colors.primary[200])};
`;

const AvatarImage = styled.Image<{ size: number }>`
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  border-radius: ${({ size }) => size / 2}px;
`;
