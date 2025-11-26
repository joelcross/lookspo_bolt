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
import TextInput from '@/components/TextInput/TextInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import HeaderDropdown, {
  SearchType,
} from '@/components/HeaderDropdown/HeaderDropdown';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchType>('users');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => router.push(`/user/${item.username}`)}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userUsername}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TextInput icon="search" value={query} onChangeText={setQuery} />
      </View>

      <HeaderDropdown
        options={[
          { label: 'Users', value: 'users' },
          { label: 'Collections', value: 'collections' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} color="#000" />
      ) : results.length === 0 && query.length > 0 ? (
        <Text style={styles.noResults}>No results found</Text>
      ) : tab === 'users' ? (
        <FlatList
          key="users" // ✅ force new render when switching
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={{ padding: 16 }}
        />
      ) : (
        <FlatList
          key="collections" // ✅ force new render when switching
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={3}
          renderItem={renderCollectionItem}
          contentContainerStyle={styles.gridContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
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
