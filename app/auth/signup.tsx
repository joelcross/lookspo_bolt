import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import styled from 'styled-components/native';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import CustomTextInput from '@/components/CustomTextInput/CustomTextInput';
import { Button } from '@/components/Button/Button';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!email || !password || !username || !name) {
      setError('Please fill in all fields');
      return;
    }

    if (username.includes(' ')) {
      setError('Username cannot contain spaces');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { user, error: signUpError } = await signUp(
        email,
        password,
        username,
        name
      );
      if (signUpError) throw signUpError;
      setMessage('Check your email to confirm your account.');
    } catch (err: any) {
      console.error('Error in signUp:', err);
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Content>
          <Title>Lookspo</Title>
          <Subtitle>Create your account</Subtitle>

          {loading && <ActivityIndicator color="#000" />}
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <InputContainer>
            <CustomTextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
            />

            <CustomTextInput
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <CustomTextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <CustomTextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </InputContainer>

          <Button title="Sign Up" onPress={handleSignUp} disabled={loading} />

          <Footer style={styles.footer}>
            <BodyText>Already have an account?</BodyText>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <LinkText>Sign In</LinkText>
            </TouchableOpacity>
          </Footer>
        </Content>
      </ScrollView>
    </Container>
  );
}

const Container = styled.KeyboardAvoidingView`
  flex: 1;
`;

const Content = styled.View`
  flex: 1;
  padding: 24px;
  justify-content: center;
`;

const Title = styled.Text`
  font-family: ${typography.heading1.fontFamily};
  font-size: ${typography.heading1.fontSize}px;
  color: ${colors.primary[900]};
  margin-bottom: 10px;
  text-align: center;
`;

const Subtitle = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.secondary.light};
  margin-bottom: 48px;
  text-align: center;
`;

const InputContainer = styled.View`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const Footer = styled.View`
  flex-direction: row;
  justify-content: center;
  margin-top: 24px;
`;

const BodyText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
`;

const LinkText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.secondary.medium};
  margin-left: 4px;
  text-decoration-line: underline;
`;

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  error: {
    color: '#ff3b30',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    color: '#38a22aff',
    marginBottom: 16,
    textAlign: 'center',
  },
});
