import React from 'react';
import { colors } from '@/theme/colors';
import {
  PencilIcon,
  EnvelopeSimpleIcon,
  HandWavingIcon,
} from 'phosphor-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import PageHeader from '@/components/PageHeader/PageHeader';
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
    router.push('/feedback');
  };

  const handlePressEditProfile = async () => {
    router.push('/edit-profile');
  };

  return (
    <Container>
      <PageHeader text="Settings" left="back" />

      <ListContent>
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
            <HandWavingIcon color={colors.like.dark} size={20} />
            <SignOutText>Sign Out</SignOutText>
          </ItemWrapper>
        </ItemContainer>
      </ListContent>
    </Container>
  );
}

const Container = styled.View`
  margin: 5px;
  gap: 5px;
  padding-top: 60px;
`;

const ItemContainer = styled.TouchableOpacity`
  padding: 16px;
`;

const ListContent = styled.ScrollView`
  background: #fff;
  border-radius: 20px;
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

const SignOutText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.like.dark};
`;
