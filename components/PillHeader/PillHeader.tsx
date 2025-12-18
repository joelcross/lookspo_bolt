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
  children?: React.ReactNode;
}

const PillHeader = <T extends PillTabValue>({
  options,
  value,
  onChange,
  children,
}: PillHeaderProps<T>) => {
  return (
    <Container>
      <Buttons>
        {options.map((option) => {
          const isActive = value === option.value;

          return (
            <TabButton
              key={String(option.value)}
              isActive={isActive}
              onPress={() => onChange(option.value)}
              activeOpacity={0.7}
            >
              <TabText isActive={isActive}>{option.label}</TabText>
            </TabButton>
          );
        })}
      </Buttons>
      {children}
    </Container>
  );
};

const Container = styled.View`
  justify-content: center;
  margin: 5px;
  margin-bottom: 0;
  min-height: 10vh;

  background-color: #e1f0f6ff;
  border-radius: 20px;
  border-color: #c8e1eaff;
  border-width: 3px;
`;

const Buttons = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 32px;
  padding-vertical: 8px;
`;

const TabButton = styled(TouchableOpacity)<{ isActive: boolean }>`
  padding: 4px 16px;
  align-items: center;
  min-width: 60px;
  border-bottom-width: ${({ isActive }) => (isActive ? '2px' : '0px')};
  border-bottom-color: ${({ isActive }) =>
    isActive ? '#c8e1eaff' : 'transparent'};
`;

const TabText = styled.Text<{ isActive: boolean }>`
  font-family: ${typography.heading2.fontFamily};
  font-size: ${typography.heading2.fontSize}px;
  text-transform: ${typography.heading2.textTransform};
  letter-spacing: ${typography.heading2.letterSpacing}px;
  color: ${({ isActive }) => (isActive ? '#484848ff' : '#747474ff')};
  font-weight: 600;
`;

export default PillHeader;
