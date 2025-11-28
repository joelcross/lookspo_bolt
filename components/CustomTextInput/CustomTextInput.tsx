import React from 'react';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { TextInput, TextInputProps, View } from 'react-native';
import styled, { css } from 'styled-components/native';
import {
  MagnifyingGlassIcon,
  XCircleIcon,
  CheckCircleIcon,
} from 'phosphor-react-native'; // or use your own icons

// Base container with dynamic border and background
const InputContainer = styled.View<{
  focused: boolean;
  error?: boolean;
  success?: boolean;
  disabled?: boolean;
}>`
  flex-direction: row;
  align-items: center;
  height: 36px;
  border-radius: 6px;
  padding-horizontal: 16px;
  background-color: #ffffff;
  border-width: 1px;
  border-color: ${(props) =>
    props.error
      ? colors.feedback.error
      : props.success
      ? colors.feedback.success
      : props.focused
      ? colors.secondary[400]
      : '#E0E0E0'};

  ${(props) =>
    props.disabled &&
    css`
      background-color: #f5f5f5;
      border-color: #e0e0e0;
    `}
`;

// Styled native TextInput
const StyledTextInput = styled(TextInput)<{
  hasValue: boolean;
  disabled?: boolean;
}>`
  flex: 1;
  color: ${(props) => (props.disabled ? '#9E9E9E' : '#212121')};
  padding-vertical: 16px;

  outline-width: 0;
  outline-color: transparent;
  outline-style: none;

  font-family: ${typography.body.fontFamily};
  font-weight: ${typography.body.fontWeight};
  font-size: ${typography.body.fontSize}px;
`;

// Helper message (error/success)
const HelperText = styled.Text<{ error?: boolean; success?: boolean }>`
  font-family: ${typography.caption.fontFamily};
  font-weight: ${typography.caption.fontWeight};
  font-size: ${typography.caption.fontSize}px;

  color: ${(props) =>
    props.error
      ? colors.feedback.error
      : props.success
      ? colors.feedback.success
      : '#757575'};
`;

// Icon wrapper
const IconWrapper = styled.View`
  margin-right: 12px;
`;

interface CustomTextInputProps extends TextInputProps {
  icon?: 'search' | 'none';
  state?: 'default' | 'error' | 'success' | 'disabled';
  helperText?: string;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  icon = 'none',
  state = 'default',
  helperText,
  placeholder = 'Search...',
  value,
  onFocus,
  onBlur,
  style,
  ...rest
}) => {
  const [focused, setFocused] = React.useState(false);
  const hasValue = !!value;

  const isError = state === 'error';
  const isSuccess = state === 'success';
  const isDisabled = state === 'disabled' || rest.disabled;

  const handleFocus = (e: any) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    onBlur?.(e);
  };

  const renderIcon = () => {
    if (icon === 'search') {
      return (
        <IconWrapper>
          <MagnifyingGlassIcon size={20} color="#9E9E9E" weight="regular" />
        </IconWrapper>
      );
    }
    if (isError) {
      return (
        <IconWrapper>
          <XCircleIcon size={20} color={colors.feedback.error} weight="fill" />
        </IconWrapper>
      );
    }
    if (isSuccess) {
      return (
        <IconWrapper>
          <CheckCircleIcon
            size={20}
            color={colors.feedback.success}
            weight="fill"
          />
        </IconWrapper>
      );
    }
    return null;
  };

  return (
    <View style={style}>
      <InputContainer
        focused={focused}
        error={isError}
        success={isSuccess}
        disabled={isDisabled}
      >
        {renderIcon()}
        <StyledTextInput
          {...rest}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#9E9E9E"
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!isDisabled}
          selectTextOnFocus={!isDisabled}
          hasValue={hasValue}
          disabled={isDisabled}
        />
      </InputContainer>
      {helperText && (
        <HelperText error={isError} success={isSuccess}>
          {helperText}
        </HelperText>
      )}
    </View>
  );
};

export default CustomTextInput;
