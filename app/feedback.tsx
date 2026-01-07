// screens/FeedbackScreen.tsx or wherever you keep it
import React, { useState } from 'react';
import { Alert, Linking, Text } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import PageHeader from '@/components/PageHeader/PageHeader';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Button } from '@/components/Button/Button';

export default function FeedbackScreen() {
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Please enter your feedback before submitting.');
      return;
    }

    const subject = encodeURIComponent('Lookspo Feedback');
    const body = encodeURIComponent(message.trim());
    const email = 'joeldcross+support@gmail.com';
    const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        setSubmitted(true);
      } else {
        Alert.alert('Error', 'Unable to open email client.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return (
    <OuterContainer>
      <PageHeader text="Feedback" left="back" />

      <InnerContainer>
        <Content>
          <Heading>Have a question or a comment?</Heading>
          <BodyText>We'd love to hear from you!</BodyText>

          {!submitted ? (
            <MessageInput
              placeholder="Type your feedback here..."
              placeholderTextColor={colors.neutral[400]}
              multiline
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
          ) : (
            <TextWrapper>
              <BodyText>Thank you for your feedback.</BodyText>
            </TextWrapper>
          )}
        </Content>

        <ButtonWrapper>
          <Button
            title="Submit"
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={submitted}
          />
        </ButtonWrapper>
      </InnerContainer>
    </OuterContainer>
  );
}

const OuterContainer = styled.SafeAreaView`
  flex: 1;
  background-color: ${colors.primary[100]};
`;

const InnerContainer = styled.View`
  flex: 1;
`;

const Content = styled.View`
  background-color: #fff;
  border-radius: 20px;
  padding: 24px 24px 0 24px;
  margin-horizontal: 5px;
  margin-bottom: 24px;
`;

const Heading = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: 600;
  color: ${colors.secondary.medium};
  margin-bottom: 4px;
`;

const BodyText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
  margin-bottom: 24px;
`;

const MessageInput = styled.TextInput`
  height: 160px;
  border: 1px solid ${colors.neutral[400]};
  border-radius: 12px;
  padding: 12px;
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
  background-color: white;
  margin-bottom: 24px;

  outline-width: 0;
  outline-color: transparent;
  outline-style: none;
`;

const TextWrapper = styled.View`
  margin-top: 10px;
`;

const ButtonWrapper = styled.View`
  margin-vertical: 24px;
  margin-horizontal: 5px;
`;
