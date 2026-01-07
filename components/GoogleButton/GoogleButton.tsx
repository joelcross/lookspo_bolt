import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { TouchableOpacity, Text, Image, StyleSheet, View } from 'react-native';
import styled from 'styled-components/native';

export function GoogleButton({ onPress }: { onPress: () => void }) {
  return (
    <ButtonWrapper onPress={onPress}>
      <Content>
        <Icon
          source={{
            uri: 'https://developers.google.com/identity/images/g-logo.png',
          }}
        />
        <CustomText>Continue with Google</CustomText>
      </Content>
    </ButtonWrapper>
  );
}

const CustomText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
`;

const ButtonWrapper = styled.TouchableOpacity`
  height: 36px;
  border-radius: 20px;
  border-width: 1px;
  border-color: ${colors.tertiary.medium};
  background-color: #fff;
  justify-content: center;
`;

const Content = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const Icon = styled.Image`
  width: 18px;
  height: 18px;
`;
