import React from 'react';
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import {
  HeartIcon,
  UserCirclePlusIcon,
  BookmarkIcon,
} from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export type ActivityType = 'like' | 'follow' | 'save';

export interface Activity {
  id: string;
  type: ActivityType;
  created_at: string;

  actor: {
    username: string;
    avatar_url?: string;
  };

  target_user?: {
    username: string;
  };

  post?: {
    id: string;
    image_url?: string;
    profiles?: { username: string };
  };

  collection?: {
    id: string; // ← important: we need collection.id!
    name: string;
  };
}

interface ActivityItemProps {
  activity: Activity;
  feedType: 'you' | 'following' | 'all';
  currentUserId?: string;
}

const ActivityIcon = ({ type }: { type: ActivityType }) => {
  switch (type) {
    case 'like':
      return <HeartIcon size={22} weight="fill" color={colors.like.dark} />;
    case 'follow':
      return (
        <UserCirclePlusIcon
          size={22}
          weight="fill"
          color={colors.follow.dark}
        />
      );
    case 'save':
      return <BookmarkIcon size={22} weight="fill" color={colors.save.dark} />;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return `${Math.floor(seconds / 604800)}w`;
};

const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  feedType,
  currentUserId,
}) => {
  const router = useRouter();

  const actor = activity.actor.username;
  const collection = activity.collection;

  const getBaseText = () => {
    const isMyPost = currentUserId && activity.target_user.id === currentUserId;
    const isFollowingMe =
      currentUserId && activity.target_user.id === currentUserId;

    switch (activity.type) {
      case 'like':
        return isMyPost
          ? 'liked your post'
          : `liked @${activity.target_user.username}'s post`;

      case 'save':
        return isMyPost
          ? 'saved your post'
          : `saved @${activity.target_user.username}'s post`;

      case 'follow':
        return isFollowingMe
          ? 'started following you'
          : `followed @${activity.target_user.username}`;

      default:
        return '';
    }
  };

  return (
    <Container>
      <IconWrapper type={activity.type}>
        <ActivityIcon type={activity.type} />
      </IconWrapper>

      <Content>
        <MessageRow>
          {/* Actor Username — clickable */}
          <TouchableOpacity
            onPress={() => router.push(`/user/${activity.actor.username}`)}
          >
            <Username>@{actor}</Username>
          </TouchableOpacity>

          <Message> {getBaseText()}</Message>

          {/* Collection name — clickable if exists */}
          {activity.type === 'save' && collection && (
            <>
              <Message> to </Message>
              <TouchableOpacity
                onPress={() => router.push(`/collection/${collection.id}`)}
              >
                <CollectionName>"{collection.name}"</CollectionName>
              </TouchableOpacity>
            </>
          )}
        </MessageRow>

        <Time>{formatTimeAgo(activity.created_at)}</Time>
      </Content>

      {/* Thumbnail — clickable */}
      {activity.post?.image_url && (
        <TouchableOpacity
          onPress={() =>
            activity.post?.id && router.push(`/post/${activity.post.id}`)
          }
        >
          <Thumbnail
            source={{ uri: activity.post.image_url }}
            resizeMode="cover"
          />
        </TouchableOpacity>
      )}
    </Container>
  );
};

const Container = styled.View`
  flex-direction: row;
  padding: 10px 10px;
  background-color: #fff;
`;

const IconWrapper = styled.View<{ type: ActivityType }>`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${({ type }) =>
    type === 'like'
      ? colors.like.light
      : type === 'follow'
      ? colors.follow.light
      : colors.save.light};
  align-items: center;
  justify-content: center;
`;

const Content = styled.View`
  flex: 1;
  justify-content: center;
  padding-left: 10px;
`;

const MessageRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
`;

const Message = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
`;

const Username = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  font-weight: 600;
  color: ${colors.primary[900]};
`;

const CollectionName = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  font-weight: 600;
  color: ${colors.primary[900]};
`;

const Time = styled.Text`
  font-family: ${typography.caption.fontFamily};
  font-size: ${typography.caption.fontSize}px;
  color: ${colors.neutral[400]};
  margin-top: 4px;
`;

const Thumbnail = styled.Image`
  width: 48px;
  height: 48px;
  border-radius: 10px;
`;

export default ActivityItem;
