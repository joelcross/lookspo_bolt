import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

interface Collection {
  id: string;
  name: string;
}

interface Params {
  imageUri: string;
  caption: string;
  pieces: string; // JSON string of pieces
}

export default function SaveToLookbooksScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<Params>();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const parsedPieces = JSON.parse(params.pieces as string);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.id);
    if (error) console.error(error);
    else setCollections(data || []);
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePost = async () => {
    if (!params.imageUri || !user) return;

    setLoading(true);
    try {
      // Upload image
      const response = await fetch(params.imageUri);
      const blob = await response.blob();
      const fileExt = params.imageUri.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `posts/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('images').getPublicUrl(filePath);

      // Create post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert({
          image_url: publicUrl,
          caption: params.caption || '',
          user_id: user.id,
          pieces: parsedPieces.filter((p) => !p.isTemplate), // remove the blank row
        })
        .select()
        .single();
      if (postError) throw postError;

      // Save to selected collections
      for (const collectionId of selectedIds) {
        await supabase.from('saves').insert({
          post_id: postData.id,
          collection_id: collectionId,
          user_id: user.id,
        });
      }

      Alert.alert('Success', 'Your post has been published!');
      router.push('/(tabs)');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Save to lookbooks?</Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#000"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.collectionItem,
                selectedIds.includes(item.id) && styles.collectionSelected,
              ]}
              onPress={() => toggleSelect(item.id)}
            >
              <Text style={styles.collectionName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity style={styles.postButton} onPress={handlePost}>
        <Text style={styles.postButtonText}>Post</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 16,
  },
  title: { fontSize: 20, fontWeight: '700', marginLeft: 16 },
  collectionItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 12,
  },
  collectionSelected: { backgroundColor: '#000' },
  collectionName: { fontSize: 16, fontWeight: '600', color: '#000' },
  postButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  postButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
