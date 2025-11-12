import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Heart, PlusCircle, Check } from 'lucide-react-native';
import { Post } from '@/lib/types';
import { getTimeAgo } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import styled from 'styled-components/native';
import { Avatar } from '../Avatar/Avatar';
import { typography } from '@/theme/typography';

const width = Dimensions.get('window').width - 20;

interface PostCardProps {
  post: Post;
  onLikeToggle?: () => void;
  onSavePress?: () => void;
  showActions?: boolean; // new prop
}

export default function PostCard({
  post,
  onLikeToggle,
  onSavePress,
  showActions = true,
}: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [isLiking, setIsLiking] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    Image.getSize(post.image_url, (width, height) => {
      setImageSize({ width, height });
    });
  }, []);

  if (!imageSize.width) return null;

  const handleLike = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);

    try {
      if (newLikedState) {
        const { error: likeError } = await supabase.from('likes').insert({
          user_id: user.id,
          post_id: post.id,
        });

        if (likeError) throw likeError;

        await supabase.from('activities').insert({
          actor_id: user.id,
          target_user_id: post.user_id,
          type: 'like',
          post_id: post.id,
        });
      } else {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);
      }

      if (onLikeToggle) onLikeToggle();
    } catch (error) {
      console.error('Error toggling like:', error);
      setIsLiked(!newLikedState);
    } finally {
      setIsLiking(false);
    }
  };

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
        <Timestamp>{getTimeAgo(post.created_at)}</Timestamp>
      </TopBanner>

      <TouchableOpacity
        onPress={handleCardPress}
        activeOpacity={0.9}
        disabled={showActions}
      >
        <ShadowWrapper>
          <Image
            source={{ uri: post.image_url }}
            style={{
              width: width, // full device width
              height: (width * imageSize.height) / imageSize.width,
              borderRadius: 10,
              borderBottomLeftRadius: showActions ? 0 : 10,
              borderBottomRightRadius: showActions ? 0 : 10,
            }}
            resizeMode="contain"
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
                  <LikeButton onPress={handleLike}>
                    <Heart
                      color={isLiked ? '#ff3b30' : '#000'}
                      fill={isLiked ? '#ff3b30' : 'none'}
                      size={24}
                    />
                  </LikeButton>

                  <SaveButton onPress={onSavePress}>
                    {post.is_saved ? (
                      <Check color="#000" size={24} />
                    ) : (
                      <PlusCircle color="#000" size={24} />
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
  margin: 0px 10px 0px 10px;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  margin-bottom: 20px;
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
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  font-size: 16px;
  padding: 8px;
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
