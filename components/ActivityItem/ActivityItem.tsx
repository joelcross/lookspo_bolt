// components/ActivityItem.tsx
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
}

const Container = styled.View`
  flex-direction: row;
  padding: 10px 10px;
  background-color: white;
`;

const IconWrapper = styled.View<{ type: ActivityType }>`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: ${({ type }) =>
    type === 'like' ? '#fef2f2' : type === 'follow' ? '#f0f9ff' : '#f0fdf4'};
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

const ActivityIcon = ({ type }: { type: ActivityType }) => {
  switch (type) {
    case 'like':
      return <HeartIcon size={22} weight="fill" color="#ef4444" />;
    case 'follow':
      return <UserCirclePlusIcon size={22} weight="fill" color="#0ea5e9" />;
    case 'save':
      return <BookmarkIcon size={22} weight="fill" color="#10b981" />;
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

const ActivityItem: React.FC<ActivityItemProps> = ({ activity, feedType }) => {
  const router = useRouter();

  const actor = activity.actor.username;
  const collection = activity.collection;
  const postOwner = activity.post?.profiles?.username;
  const targetUser = activity.target_user?.username;

  const getBaseText = () => {
    switch (activity.type) {
      case 'like':
        return feedType === 'you'
          ? 'liked your post'
          : `liked @${postOwner || 'someone'}'s post`;
      case 'save':
        return feedType === 'you'
          ? 'saved your post'
          : `saved @${postOwner || 'someone'}'s post`;
      case 'follow':
        return feedType === 'you'
          ? 'started following you'
          : `followed ${targetUser ? `@${targetUser}` : 'someone'}`;
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

export default ActivityItem;
