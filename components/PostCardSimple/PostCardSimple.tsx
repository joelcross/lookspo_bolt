import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Post } from '@/lib/types';
import { getTimeAgo } from '@/lib/utils';
import { router } from 'expo-router';
import styled from 'styled-components/native';
import { Avatar } from '../Avatar/Avatar';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import {
  HeartIcon,
  CheckCircleIcon,
  PlusCircleIcon,
} from 'phosphor-react-native';
import SmartImage from '../SmartImage/SmartImage';
import CustomTextInput from '../CustomTextInput/CustomTextInput';

const width = Dimensions.get('window').width - 20;

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
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <SmartImage
          uri={image}
          resizeMode="contain"
          style={{
            borderRadius: 10,
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
      </TouchableOpacity>
    </PostContainer>
  );
}

const PostContainer = styled.View`
  margin-horizontal: 10px;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 20px;
  overflow: hidden;
`;

const TopBanner = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
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

const BottomContainer = styled.View`
  background-color: white;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  font-size: 16px;
  padding: 8px;
  border-radius: 10px;
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
