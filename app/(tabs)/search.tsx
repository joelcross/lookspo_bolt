import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import CustomTextInput from '@/components/CustomTextInput/CustomTextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import HeaderDropdown, {
  SearchType,
} from '@/components/HeaderDropdown/HeaderDropdown';
import PillHeader from '@/components/PillHeader/PillHeader';
import styled from 'styled-components/native';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchType>('users');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const hasSearched = query.trim().length > 0;

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      if (tab === 'users') searchUsers();
      else searchCollections();
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [query, tab]);

  const searchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url')
      .or(`username.ilike.%${query}%,name.ilike.%${query}%`);

    if (error) console.error('Error searching users:', error);
    setResults(data || []);
    setLoading(false);
  };

  const searchCollections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, cover_url')
      .ilike('name', `%${query}%`);

    if (error) console.error('Error searching collections:', error);
    setResults(data || []);
    setLoading(false);
  };

  const renderUserItem = ({ item }: any) => (
    <UserItem onPress={() => router.push(`/user/${item.username}`)}>
      {item.avatar_url ? (
        <AvatarImage source={{ uri: item.avatar_url }} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ marginLeft: 12 }}>
        <NameText>{item.name}</NameText>
        <UsernameText>@{item.username}</UsernameText>
      </View>
    </UserItem>
  );

  const renderCollectionItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.collectionItem}
      onPress={() => router.push(`/collection/${item.id}`)}
    >
      {item.cover_url ? (
        <Image
          source={{ uri: item.cover_url }}
          style={styles.collectionImage}
        />
      ) : (
        <View style={[styles.collectionImage, styles.collectionPlaceholder]} />
      )}
      <Text style={styles.collectionName} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Container>
      <PillHeader
        options={[
          { label: 'Users', value: 'users' },
          { label: 'Collections', value: 'collections' },
        ]}
        value={tab}
        onChange={setTab}
      >
        <SearchBarWrapper>
          <CustomTextInput
            icon="search"
            value={query}
            onChangeText={setQuery}
          />
        </SearchBarWrapper>
      </PillHeader>

      {hasSearched &&
        (loading ? (
          <ActivityIndicator style={{ marginTop: 20 }} color="#000" />
        ) : results.length === 0 ? (
          <Results>
            <NoResultsText>No results found</NoResultsText>
          </Results>
        ) : tab === 'users' ? (
          <Results>
            <FlatList
              key="users"
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              contentContainerStyle={{ padding: 16 }}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          </Results>
        ) : (
          <Results>
            <FlatList
              key="collections"
              data={results}
              keyExtractor={(item) => item.id}
              numColumns={3}
              renderItem={renderCollectionItem}
              contentContainerStyle={styles.gridContainer}
            />
          </Results>
        ))}
    </Container>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
`;

const SearchBarWrapper = styled.View`
  padding: 16px;
`;

const Results = styled.View`
  background-color: #fff;
  display: flex;
  flex: 1;
  border-radius: 20px;
  margin: 5px;
`;

const UserItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
`;

const AvatarImage = styled.Image`
  width: 48px;
  height: 48px;
  border-radius: 24px;
`;

const NameText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.primary[900]};
`;

const UsernameText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.neutral[400]};
`;

const NoResultsText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.neutral[400]};
  padding: 16px;
`;

const styles = StyleSheet.create({
  container: { flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  userName: { fontSize: 16, color: '#000', fontWeight: '600' },
  userUsername: { fontSize: 14, color: '#666' },
  gridContainer: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  collectionItem: {
    flex: 1 / 3,
    margin: 4,
    alignItems: 'center',
  },
  collectionImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  collectionPlaceholder: { backgroundColor: '#ddd' },
  collectionName: {
    marginTop: 6,
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    fontWeight: '500',
  },
  noResults: {
    textAlign: 'center',
    marginTop: 30,
    color: '#666',
    fontSize: 16,
  },
});
