import React, { useState } from 'react';
import {
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { CaretCircleDownIcon } from 'phosphor-react-native';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type FeedType = 'following' | 'explore';
export type SearchType = 'users' | 'collections';
export type ActivityType = 'you' | 'following' | 'all';

interface DropdownOption {
  label: string;
  value: FeedType | SearchType | ActivityType;
}

interface HeaderDropdownProps {
  options: readonly DropdownOption[]; // readonly prevents accidental mutation
  value?: FeedType | SearchType | ActivityType;
  onValueChange?: (value: FeedType | SearchType | ActivityType) => void;
}

const DropdownContainer = styled.View`
  position: relative;
  background-color: ${colors.primary[100]};
  overflow: hidden;
  elevation: 4;
`;

const HeaderButton = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 14px 20px;
  gap: 8px;
`;

const HeaderText = styled.Text`
  color: ${colors.secondary[500]};
  font-family: ${typography.heading2.fontFamily};
  font-size: ${typography.heading2.fontSize}px;
  text-transform: ${typography.heading2.textTransform};
  letter-spacing: ${typography.heading2.letterSpacing}px;
`;

const DropdownMenu = styled.View`
  background-color: ${colors.primary[100]};
  border-top-width: 1px;
  border-top-color: ${colors.neutral[200]};
`;

const DropdownItem = styled(TouchableOpacity)`
  padding: 16px 20px;
  align-items: center;
`;

const ItemText = styled.Text`
  color: ${colors.secondary[400]};
  font-family: ${typography.heading2.fontFamily};
  font-size: ${typography.caption.fontSize}px;
  text-transform: ${typography.heading2.textTransform};
  letter-spacing: ${typography.heading2.letterSpacing}px;
`;

const HeaderDropdown: React.FC<HeaderDropdownProps> = ({
  options,
  value: controlledValue,
  onValueChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Use controlled value if provided, otherwise fall back to first option
  const value = controlledValue ?? options[0].value;
  const selectedOption =
    options.find((opt) => opt.value === value) ?? options[0];

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (option: DropdownOption) => {
    onValueChange?.(option.value);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(false);
  };

  return (
    <DropdownContainer>
      <HeaderButton onPress={toggleDropdown}>
        <HeaderText>{selectedOption.label}</HeaderText>
        <CaretCircleDownIcon
          size={20}
          color={colors.secondary[500]}
          weight="bold"
          style={{
            transform: [{ rotate: isOpen ? '180deg' : '0deg' }],
          }}
        />
      </HeaderButton>

      {isOpen && (
        <DropdownMenu>
          {options
            .filter((opt) => opt.value !== value)
            .map((option) => (
              <DropdownItem
                key={option.value}
                onPress={() => handleSelect(option)}
                activeOpacity={0.7}
              >
                <ItemText>{option.label}</ItemText>
              </DropdownItem>
            ))}
        </DropdownMenu>
      )}
    </DropdownContainer>
  );
};

export default HeaderDropdown;
