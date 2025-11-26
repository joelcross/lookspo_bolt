import React from 'react';
import { StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import {
  PencilIcon,
  EnvelopeSimpleIcon,
  HandWavingIcon,
} from 'phosphor-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import Header from '@/components/Header/Header';
import styled from 'styled-components/native';
import { typography } from '@/theme/typography';

export default function SettingsScreen() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    console.log('Signing out...');
    await signOut();
    router.replace('/auth/login');
  };

  const handlePressFeedback = async () => {
    router.replace('/feedback');
  };

  const handlePressEditProfile = async () => {
    router.push({ pathname: '/profile', params: { edit: 'true' } });
  };

  return (
    <Container>
      <Header text="Settings" left="back" />

      <ItemContainer onPress={handlePressEditProfile}>
        <ItemWrapper>
          <PencilIcon color="#000000ff" size={20} />
          <ItemText>Edit Profile</ItemText>
        </ItemWrapper>
      </ItemContainer>
      <ItemContainer onPress={handlePressFeedback}>
        <ItemWrapper>
          <EnvelopeSimpleIcon color="#000000ff" size={20} />
          <ItemText>Feedback</ItemText>
        </ItemWrapper>
      </ItemContainer>
      <ItemContainer onPress={handleSignOut}>
        <ItemWrapper>
          <HandWavingIcon color="#ff3b30" size={20} />
          <ItemText>Sign Out</ItemText>
        </ItemWrapper>
      </ItemContainer>
    </Container>
  );
}

const Container = styled.SafeAreaView``;

const ItemContainer = styled.TouchableOpacity`
  padding: 16px;
`;

const ItemWrapper = styled.View`
  flex-direction: row;
  gap: 10px;
  align-items: center;
`;

const ItemText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
`;
