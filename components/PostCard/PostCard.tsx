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

const width = Dimensions.get('window').width - 20;

interface PostCardProps {
  post: Post;
  onLikeToggle?: () => void;
  onSavePress?: () => void;
  showActions?: boolean;
  showTimeAgo?: boolean;
  isSaved?: boolean;
  isLiked?: boolean;
}

export default function PostCard({
  post,
  onLikeToggle,
  onSavePress,
  showActions = true,
  showTimeAgo = true,
  isSaved,
  isLiked,
}: PostCardProps) {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    Image.getSize(post.image_url, (width, height) => {
      setImageSize({ width, height });
    });
  }, []);

  if (!imageSize.width) return null;

  const handleUsernamePress = () => {
    if (post.profiles) {
      router.push(`/user/${post.profiles.username}`);
    }
  };

  const handleCardPress = () => {
    router.push(`/post/${post.id}`);
  };

  return (
    <PostContainer>
      <TopBanner>
        <TouchableOpacity onPress={handleUsernamePress}>
          <Username>@{post.profiles?.username}</Username>
        </TouchableOpacity>
        {showTimeAgo && <Timestamp>{getTimeAgo(post.created_at)}</Timestamp>}
      </TopBanner>

      <TouchableOpacity
        onPress={handleCardPress}
        activeOpacity={0.9}
        disabled={showActions}
      >
        <ShadowWrapper>
          <SmartImage
            uri={post.image_url}
            resizeMode="contain"
            style={{
              borderRadius: 10,
              borderBottomLeftRadius: showActions ? 0 : 10,
              borderBottomRightRadius: showActions ? 0 : 10,
            }}
          />

          {/* Only show like/save if showActions is true */}
          {showActions && (
            <View>
              <BottomContainer>
                <LeftWrapper>
                  <Avatar uri={post.profiles?.avatar_url} />
                  <Caption>{post.caption}</Caption>
                </LeftWrapper>
                <RightWrapper>
                  <LikeButton onPress={onLikeToggle}>
                    <HeartIcon
                      color={
                        isLiked ? colors.feedback.error : colors.primary[900]
                      }
                      weight={isLiked ? 'fill' : 'regular'}
                      size={24}
                    />
                  </LikeButton>

                  <SaveButton onPress={onSavePress}>
                    {isSaved ? (
                      <CheckCircleIcon
                        color={colors.feedback.success}
                        size={24}
                        weight="fill"
                      />
                    ) : (
                      <PlusCircleIcon color={colors.primary[900]} size={24} />
                    )}
                  </SaveButton>
                </RightWrapper>
              </BottomContainer>
            </View>
          )}
        </ShadowWrapper>
      </TouchableOpacity>
    </PostContainer>
  );
}

const PostContainer = styled.View`
  display: flex;
  flex-direction: column;
`;

const TopBanner = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
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

const ShadowWrapper = styled.View`
  border-radius: 10px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.1;
  shadow-radius: 10px;
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

const RightWrapper = styled.View`
  flex-direction: row;
`;

const LikeButton = styled.TouchableOpacity`
  padding: 4px;
`;

const SaveButton = styled.TouchableOpacity`
  padding: 4px;
`;
