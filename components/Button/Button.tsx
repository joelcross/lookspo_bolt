import { colors } from '@/theme/colors';
import React from 'react';
import { TouchableOpacityProps } from 'react-native';
import styled from 'styled-components/native';
import {
  ArrowLeftIcon,
  DotsThreeOutlineVerticalIcon,
  GearIcon,
  TrashIcon,
} from 'phosphor-react-native';
import { typography } from '@/theme/typography';

type ButtonVariant = 'default' | 'secondary' | 'text';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  disabled?: boolean;
}

// Styled TouchableOpacity with variant support
const ButtonWrapper = styled.TouchableOpacity<{
  variant: ButtonVariant;
  disabled?: boolean;
}>`
  padding: 10px;
  height: 36px;
  border-radius: 100px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  min-width: 20vw;

  ${({ variant, disabled }) => {
    switch (variant) {
      case 'secondary':
        return `
          background-color: ${colors.neutral[100]};
          border-width: 1px;
          border-color: ${
            disabled ? colors.neutral[200] : colors.tertiary.medium
          };
        `;
      case 'text':
        return `
          background-color: transparent;
        `;
      case 'default':
      default:
        return `
          background-color: ${
            disabled ? colors.neutral[200] : colors.secondary.medium
          };
        `;
    }
  }}
`;

// Styled Text with variant support
const ButtonText = styled.Text<{ variant: ButtonVariant; disabled?: boolean }>`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.body.fontSize}px;
  font-weight: 600;

  ${({ variant, disabled }) => {
    switch (variant) {
      case 'secondary':
        return `color: ${
          disabled ? colors.neutral[400] : colors.tertiary.dark
        };`;
      case 'text':
        return `color: ${
          disabled ? colors.neutral[400] : colors.secondary.medium
        };`;
      case 'default':
      default:
        return `color: ${
          disabled ? colors.neutral[400] : colors.primary[100]
        };`;
    }
  }}
`;

export function Button({
  title,
  variant = 'default',
  disabled = false,
  ...props
}: ButtonProps) {
  // Determine text/icon color based on variant & disabled
  const color =
    variant === 'default'
      ? disabled
        ? colors.neutral[400]
        : colors.primary[100]
      : disabled
      ? colors.neutral[400]
      : colors.primary[900];

  return (
    <ButtonWrapper
      variant={variant}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      {...props}
    >
      {(() => {
        switch (title.toLowerCase()) {
          case 'back':
            return (
              <ArrowLeftIcon
                size={18}
                weight="bold"
                color={color}
                style={{ marginRight: 6 }}
              />
            );

          case 'settings':
            return (
              <GearIcon
                size={18}
                weight="bold"
                color={color}
                style={{ marginRight: 6 }}
              />
            );

          case 'more':
            return (
              <DotsThreeOutlineVerticalIcon
                size={18}
                weight="fill"
                color={color}
                style={{ marginRight: 6 }}
              />
            );

          case 'trash':
            return (
              <TrashIcon
                size={18}
                weight="bold"
                color={color}
                style={{ marginRight: 6 }}
              />
            );

          default:
            return (
              <ButtonText variant={variant} disabled={disabled}>
                {title}
              </ButtonText>
            );
        }
      })()}
    </ButtonWrapper>
  );
}
