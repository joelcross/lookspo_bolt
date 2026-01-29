import React, { useEffect, useState } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
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

interface PostCardProps {
  post: Post;
  onLikeToggle?: () => void;
  onSavePress?: () => void;
  showActions?: boolean;
  hideTopBar?: boolean;
  isSaved?: boolean;
  isLiked?: boolean;
}

export default function PostCard({
  post,
  onLikeToggle,
  onSavePress,
  showActions = true,
  hideTopBar = false,
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
      {!hideTopBar && (
        <TopBanner>
          <TouchableOpacity onPress={handleUsernamePress}>
            <Username>@{post.profiles?.username}</Username>
          </TouchableOpacity>
          <Timestamp>{getTimeAgo(post.created_at)}</Timestamp>
        </TopBanner>
      )}

      <TouchableOpacity
        onPress={handleCardPress}
        activeOpacity={0.9}
        disabled={showActions}
      >
        <SmartImage uri={post.image_url} resizeMode="contain" />

        {/* Only show like/save if showActions is true */}
        {showActions && (
          <View>
            <BottomContainer
              style={{
                borderRadius: 20,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
              }}
            >
              <LeftWrapper>
                <Avatar uri={post.profiles?.avatar_url} size={36} />
                <Caption>{post.caption}</Caption>
              </LeftWrapper>
              <RightWrapper>
                <LikeButton onPress={onLikeToggle}>
                  <HeartIcon
                    color={isLiked ? colors.like.dark : colors.primary[900]}
                    weight={isLiked ? 'fill' : 'regular'}
                    size={24}
                  />
                </LikeButton>

                <SaveButton onPress={onSavePress}>
                  {isSaved ? (
                    <CheckCircleIcon
                      color={colors.save.dark}
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
      </TouchableOpacity>
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

const TopBanner = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 6px;
`;

const Username = styled.Text`
  color: ${colors.tertiary.dark};

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
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  font-size: 16px;
  padding: 8px;
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
  padding-horizontal: 2px;
`;

const SaveButton = styled.TouchableOpacity`
  padding-horizontal: 2px;
`;
