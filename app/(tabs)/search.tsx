import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import CustomTextInput from '@/components/CustomTextInput/CustomTextInput';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { SearchType } from '@/components/HeaderDropdown/HeaderDropdown';
import SectionTabs from '@/components/SectionTabs/SectionTabs';
import styled from 'styled-components/native';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import LookbooksDisplay from '@/components/LookbooksDisplay/LookbooksDisplay';
import { Collection } from '@/lib/types';

interface UserResult {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchType>('users');

  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [collectionResults, setCollectionResults] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);

  const hasSearched = query.trim().length > 0;

  useEffect(() => {
    if (!hasSearched) return;

    const timer = setTimeout(() => {
      if (tab === 'users') {
        searchUsers();
      } else {
        searchCollections();
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, tab]);

  const searchUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url')
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`);

    if (error) console.error('Error searching users:', error);

    setUserResults(data || []);
    setLoading(false);
  };

  const searchCollections = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('collections')
      .select('*, user:user_id (username)')
      .ilike('name', `%${query}%`);

    if (error) console.error('Error searching collections:', error);

    const collectionsWithImages: Collection[] = await Promise.all(
      (data || []).map(async (col) => {
        const { data: images, count } = await supabase
          .from('saves')
          .select('posts(image_url)', { count: 'exact' })
          .eq('collection_id', col.id)
          .order('created_at', { ascending: true })
          .limit(4);

        return {
          ...col,
          cover_images: images?.map((i) => i.posts.image_url) || [],
          post_count: count || 0,
        };
      }),
    );

    setCollectionResults(collectionsWithImages);
    setLoading(false);
  };

  const renderUserItem = (item: UserResult) => (
    <UserRow
      key={item.id}
      onPress={() => router.push(`/user/${item.username}`)}
    >
      <AvatarWrapper>
        {item.avatar_url ? (
          <AvatarImage source={{ uri: item.avatar_url }} />
        ) : (
          <AvatarPlaceholder>
            <AvatarText>{item.name?.charAt(0).toUpperCase()}</AvatarText>
          </AvatarPlaceholder>
        )}
      </AvatarWrapper>

      <UserContent>
        <Username>@{item.username}</Username>
        {item.name && <DisplayName>{item.name}</DisplayName>}
      </UserContent>
    </UserRow>
  );

  const activeResultsCount =
    tab === 'users' ? userResults.length : collectionResults.length;

  return (
    <Container>
      <SectionTabs
        options={[
          { label: 'Users', value: 'users' },
          { label: 'Collections', value: 'collections' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <SearchBarWrapper>
        <CustomTextInput icon="search" value={query} onChangeText={setQuery} />
      </SearchBarWrapper>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 94 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!hasSearched ? (
          <NoResultsText>Make a search to begin...</NoResultsText>
        ) : !loading && activeResultsCount === 0 ? (
          <NoResultsText>No results found</NoResultsText>
        ) : tab === 'users' ? (
          <UsersList>{userResults.map(renderUserItem)}</UsersList>
        ) : (
          <LookbooksDisplay
            collections={collectionResults}
            displayMode="grid"
          />
        )}
      </ScrollView>
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #fff;
  border-radius: 20px;
  margin: 5px;
`;

const SearchBarWrapper = styled.View`
  padding: 16px;
  padding-top: 12vh;
`;

const UsersList = styled.View`
  padding: 16px;
`;

const UserRow = styled.TouchableOpacity`
  flex-direction: row;
  padding: 10px;
  background-color: #fff;
`;

const AvatarWrapper = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  background-color: ${colors.neutral[200]};
`;

const AvatarImage = styled.Image`
  width: 40px;
  height: 40px;
  border-radius: 20px;
`;

const AvatarPlaceholder = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  background-color: #000;
  align-items: center;
  justify-content: center;
`;

const AvatarText = styled.Text`
  color: #fff;
  font-weight: 700;
  font-size: 16px;
`;

const UserContent = styled.View`
  flex: 1;
  justify-content: center;
  padding-left: 10px;
`;

const Username = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  font-weight: 600;
  color: ${colors.primary[900]};
`;

const DisplayName = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.neutral[400]};
`;

const NoResultsText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.neutral[400]};
  padding: 16px;
  font-style: italic;
`;
