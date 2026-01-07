import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
WebBrowser.maybeCompleteAuthSession();

import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/Button/Button';
import { GoogleButton } from '@/components/GoogleButton/GoogleButton';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import CustomTextInput from '@/components/CustomTextInput/CustomTextInput';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectUri =
        Platform.OS === 'web'
          ? window.location.origin // localhost for web
          : AuthSession.makeRedirectUri({ scheme: 'lookspo' });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUri },
      });

      if (error) console.error('Google login error:', error.message);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Container behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollableContainer
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Content>
          <TitleWrapper>
            <Title>Lookspo</Title>
            <Subtitle>Discover | Create | Inspire</Subtitle>
          </TitleWrapper>

          {error && <ErrorText>{error}</ErrorText>}

          <InputContainer>
            <CustomTextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />

            <CustomTextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </InputContainer>

          <Button
            title="Sign In"
            onPress={handleEmailLogin}
            disabled={loading}
          />

          <View style={{ margin: 5, alignItems: 'center' }}>
            <BodyText>or</BodyText>
          </View>

          <GoogleButton onPress={handleGoogleLogin} />

          <Footer>
            <BodyText>Don't have an account? </BodyText>
            <TouchableOpacity onPress={() => router.replace('/auth/signup')}>
              <LinkText>Sign Up</LinkText>
            </TouchableOpacity>
          </Footer>
        </Content>
      </ScrollableContainer>
    </Container>
  );
}

const Container = styled.KeyboardAvoidingView`
  flex: 1;
`;

const ScrollableContainer = styled.ScrollView`
  flex-grow: 1;
`;

const Content = styled.View`
  flex: 1;
  padding: 24px;
  justify-content: center;
`;

const TitleWrapper = styled.View`
  align-items: center;
`;

const Title = styled.Text`
  font-family: ${typography.heading1.fontFamily};
  font-size: ${typography.heading1.fontSize}px;
  color: ${colors.primary[900]};
  margin-bottom: 10px;
`;

const Subtitle = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.secondary.light};
  margin-bottom: 48px;
`;

const InputContainer = styled.View`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const BodyText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
`;

const ErrorText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.feedback.error};
`;

const LinkText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.tertiary.dark};
  text-decoration-line: underline;
`;

const Footer = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-top: 48px;
`;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});
