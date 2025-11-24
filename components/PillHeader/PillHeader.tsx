// components/PillHeader.tsx
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';

// Generic tab value (string literal union)
export type PillTabValue = string;

interface PillOption<T extends PillTabValue> {
  label: string;
  value: T;
}

interface PillHeaderProps<T extends PillTabValue> {
  options: readonly PillOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

// Reusable styled components
const Container = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 8px 20px;
  gap: 32px;
`;

const PillButton = styled(TouchableOpacity)<{ isActive: boolean }>`
  padding: 4px 16px;
  border-radius: 99px;
  background-color: ${({ isActive }) =>
    isActive ? colors.secondary[500] : 'transparent'};
  align-items: center;
  min-width: 60px;
`;

const PillText = styled.Text<{ isActive: boolean }>`
  font-family: ${typography.heading2.fontFamily};
  font-size: ${typography.heading2.fontSize}px;
  text-transform: ${typography.heading2.textTransform};
  letter-spacing: ${typography.heading2.letterSpacing}px;
  color: ${({ isActive }) => (isActive ? '#fff' : colors.secondary[400])};
  font-weight: 600;
`;

const PillHeader = <T extends PillTabValue>({
  options,
  value,
  onChange,
}: PillHeaderProps<T>) => {
  return (
    <Container>
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <PillButton
            key={String(option.value)}
            isActive={isActive}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <PillText isActive={isActive}>{option.label}</PillText>
          </PillButton>
        );
      })}
    </Container>
  );
};

export default PillHeader;
