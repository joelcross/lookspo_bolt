// screens/FeedbackScreen.tsx or wherever you keep it
import React, { useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import Header from '@/components/Header/Header';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Button } from '@/components/Button/Button';

export default function FeedbackScreen() {
  const router = useRouter();
  const [message, setMessage] = useState('');

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Please enter your feedback before submitting.');
      return;
    }

    const subject = encodeURIComponent('App Feedback');
    const body = encodeURIComponent(message.trim());
    const email = 'joeldcross+support@gmail.com';
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert('Error', 'Unable to open email client.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return (
    <Container>
      <Header text="Feedback" left="back" />

      <Content>
        <Heading>Have a question or a comment?</Heading>
        <Subheading>We'd love to hear from you!</Subheading>

        <MessageInput
          placeholder="Type your feedback here..."
          placeholderTextColor={colors.neutral[400]}
          multiline
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
        />

        <Button
          title="Submit"
          onPress={handleSubmit}
          activeOpacity={0.8}
        ></Button>
      </Content>
    </Container>
  );
}

// Styled Components
const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${colors.primary[100]};
`;

const Content = styled.View`
  flex: 1;
  padding: 24px;
`;

const Heading = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: 600;
  color: ${colors.secondary[500]};
  margin-bottom: 4px;
`;

const Subheading = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: 16px;
  color: ${colors.text.primary};
  margin-bottom: 24px;
`;

const MessageInput = styled.TextInput`
  height: 160px;
  border: 1px solid ${colors.neutral[400]};
  border-radius: 12px;
  padding: 12px;
  font-family: ${typography.body.fontFamily};
  font-size: 16px;
  color: ${colors.text.primary};
  background-color: white;
  margin-bottom: 24px;
`;

const SubmitButton = styled.TouchableOpacity`
  background-color: ${colors.primary[900]};
  border-radius: 12px;
  padding-vertical: 14px;
  align-items: center;
  justify-content: center;
`;

const SubmitButtonText = styled.Text`
  color: white;
  font-family: ${typography.body.fontFamily};
  font-size: 16px;
  font-weight: 700;
`;
