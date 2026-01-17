// screens/FeedbackScreen.tsx or wherever you keep it
import React, { useState } from 'react';
import { Alert, Linking, View } from 'react-native';
import styled from 'styled-components/native';
import PageHeader from '@/components/PageHeader/PageHeader';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Button } from '@/components/Button/Button';
import CustomTextInput from '@/components/CustomTextInput/CustomTextInput';

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
            <View style={{ marginBottom: 20 }}>
              <CustomTextInput
                placeholder="Type your feedback here..."
                multiline
                value={message}
                onChangeText={setMessage}
              />
            </View>
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
  margin: 5px;
  gap: 5px;
`;

const InnerContainer = styled.View`
  flex: 1;
`;

const Content = styled.View`
  background-color: #fff;
  border-radius: 20px;
  padding: 24px 24px 0 24px;
`;

const Heading = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: ${typography.heading3.fontWeight};
  color: ${colors.primary[900]};
`;

const BodyText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
  margin-bottom: 24px;
`;

const TextWrapper = styled.View`
  margin-top: 10px;
`;

const ButtonWrapper = styled.View`
  margin-top: 5px;
`;
