import React from 'react';
import { Dimensions, Pressable } from 'react-native';
import styled from 'styled-components/native';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import SmartImage from '../SmartImage/SmartImage';

interface PostCardSimpleProps {
  image: string;
  caption: string;
  setCaption?: (text: string) => void;
  onPress?: () => void;
}

export default function PostCardSimple({
  image,
  caption,
  setCaption,
  onPress,
}: PostCardSimpleProps) {
  return (
    <PostContainer>
      <Pressable onPress={onPress}>
        <SmartImage
          uri={image}
          resizeMode="contain"
          style={{
            borderRadius: 20,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        />

        <CaptionInput
          placeholder="Add a caption..."
          placeholderTextColor={colors.neutral[400]}
          value={caption}
          onChangeText={setCaption}
          multiline
          textAlignVertical="top"
        />
      </Pressable>
    </PostContainer>
  );
}

const PostContainer = styled.View`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 20px;
  overflow: hidden;
`;

const Username = styled.Text`
  color: #4b4b4b;

  font-family: ${typography.caption.fontFamily};
  font-weight: ${typography.caption.fontWeight};
  font-size: ${typography.caption.fontSize}px;
`;

const Timestamp = styled.Text`
  color: #9f9f9fff;

  font-family: ${typography.caption.fontFamily};
  font-weight: ${typography.caption.fontWeight};
  font-size: ${typography.caption.fontSize}px;
`;

const LeftWrapper = styled.View`
  display: flex;
  flex-direction: row;
  font-size: 16px;
`;

const Caption = styled.Text`
  margin-left: 8px;

  font-family: ${typography.body.fontFamily};
  font-weight: ${typography.body.fontWeight};
  font-size: ${typography.body.fontSize}px;
`;

const CaptionInput = styled.TextInput`
  padding: 16px;

  outline-width: 0;
  outline-color: transparent;
  outline-style: none;

  font-family: ${typography.body.fontFamily};
  font-weight: ${typography.body.fontWeight};
  font-size: ${typography.body.fontSize}px;
`;
