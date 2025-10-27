import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Heart, Plus, Check } from 'lucide-react-native';
import { Post } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onLikeToggle?: () => void;
  onSavePress?: () => void;
}

export default function PostCard({ post, onLikeToggle, onSavePress }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [isLiking, setIsLiking] = useState(false);

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

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: post.image_url }} style={styles.image} />
        <View style={styles.overlay}>
          <TouchableOpacity onPress={handleUsernamePress}>
            <Text style={styles.username}>@{post.profiles?.username}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
          <Heart
            color={isLiked ? '#ff3b30' : '#000'}
            fill={isLiked ? '#ff3b30' : 'none'}
            size={24}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onSavePress} style={styles.actionButton}>
          {post.is_saved ? (
            <Check color="#000" size={24} />
          ) : (
            <Plus color="#000" size={24} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  imageContainer: {
    width: width,
    aspectRatio: 3 / 4,
    backgroundColor: '#f5f5f5',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
});
