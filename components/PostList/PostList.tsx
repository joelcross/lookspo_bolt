import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { Post } from '@/lib/types';
import { FlashList } from '@shopify/flash-list';
import PostCard from '../PostCard';

interface PostListProps {
  posts: Post[];
  handleLoadMore: () => void;
  handleRefresh: () => void;
  refreshing: boolean;
  loading: boolean;
  emptyText: string;
  numColumns?: number;
}

const PostList: React.FC<PostListProps> = ({
  posts,
  handleLoadMore,
  handleRefresh,
  refreshing,
  loading,
  emptyText,
  numColumns = 2,
}) => {
  const renderPost = ({ item }: { item: Post }) => (
    <View style={{ margin: 5 }}>
      <PostCard
        post={item}
        showActions={false} // hide Like/Save buttons
        showTimeAgo={false}
      />
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <FooterWrapper>
        <ActivityIndicator size="small" color="#000" />
      </FooterWrapper>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <EmptyContainer>
        <EmptyText>{emptyText}</EmptyText>
      </EmptyContainer>
    );
  };

  //   Todo: Set query conditionally

  // if page == "following":
  //   query = ...
  // elif page == "all":
  //   query = ...
  // elif page == "ownProfile":
  //     query = ...
  // elif page == "otherProfile":
  //     query = ...

  return (
    <ScrollableContainer showsVerticalScrollIndicator={false}>
      <FlashList
        masonry
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        numColumns={numColumns}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
      />
    </ScrollableContainer>
  );
};

const ScrollableContainer = styled.ScrollView`
  margin: 5px;
  margin-bottom: 0px;
`;

const FooterWrapper = styled.View`
  padding-vertical: 20px;
`;

const EmptyContainer = styled.View`
  padding-top: 60px;
`;

const EmptyText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.primary[900]};
`;

export default PostList;
