import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { X, Upload, ChevronLeft } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Piece } from '@/lib/types';

export default function NewPostScreen() {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [pieces, setPieces] = useState<Piece[]>([
    { name: '', brand: '', url: '', isTemplate: true },
  ]);

  // Pick image
  const pickImage = async () => {
    if (Platform.OS === 'web') {
      // Trigger a hidden file input for web
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const url = URL.createObjectURL(file);
          setSelectedImage(url);
        }
      };
      input.click();
      return;
    }

    // Native platforms
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  // Handle piece change
  const handlePieceChange = (
    index: number,
    field: keyof Piece,
    value: string
  ) => {
    const updated = [...pieces];
    updated[index][field] = value;

    // If they edited the template row, append a new template row at the end
    if (
      updated[index].isTemplate &&
      (field === 'name' || field === 'brand' || field === 'url')
    ) {
      updated[index].isTemplate = false;
      updated.push({ name: '', brand: '', url: '', isTemplate: true });
    }

    setPieces(updated);
  };

  const removePiece = (index: number) => {
    const updated = [...pieces];
    updated.splice(index, 1);
    setPieces(
      updated.length > 0
        ? updated
        : [{ name: '', brand: '', url: '', isTemplate: true }]
    );
  };

  // Validate pieces before moving to next screen
  const handleNext = () => {
    const invalid = pieces
      .filter((p) => !p.isTemplate)
      .some((p) => !p.name.trim() || !p.brand.trim());

    if (invalid) {
      Alert.alert(
        'Validation Error',
        'Name and Brand are required for each piece'
      );
      return;
    }

    // Navigate to save-to-lookbooks screen
    router.push({
      pathname: '/save-to-lookbooks',
      params: {
        imageUri: selectedImage,
        caption,
        pieces: JSON.stringify(pieces.filter((p) => !p.isTemplate)),
      },
    });
  };

  if (!selectedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
          <Upload color="#999" size={48} />
          <Text style={styles.uploadText}>Tap to select a photo</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft color="#000" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={styles.content}>
        <Image source={{ uri: selectedImage }} style={styles.preview} />

        <View style={styles.form}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor="#999"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />

          {/* Pieces Table */}
          <Text style={styles.sectionTitle}>Pieces</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { flex: 2 }]}>Name</Text>
            <Text style={[styles.cell, { flex: 2 }]}>Brand</Text>
            <Text style={[styles.cell, { flex: 3 }]}>URL</Text>
            <Text style={[styles.cell, { flex: 0.5 }]} />
          </View>
          {pieces.map((piece, i) => (
            <View key={i} style={styles.tableRow}>
              <TextInput
                style={[
                  styles.cellInput,
                  { flex: 2 },
                  piece.isTemplate && styles.placeholderText,
                ]}
                placeholder="Name"
                placeholderTextColor="#999"
                value={piece.name}
                onChangeText={(text) => handlePieceChange(i, 'name', text)}
              />
              <TextInput
                style={[
                  styles.cellInput,
                  { flex: 2 },
                  piece.isTemplate && styles.placeholderText,
                ]}
                placeholder="Brand"
                placeholderTextColor="#999"
                value={piece.brand}
                onChangeText={(text) => handlePieceChange(i, 'brand', text)}
              />
              <TextInput
                style={[
                  styles.cellInput,
                  { flex: 3 },
                  piece.isTemplate && styles.placeholderText,
                ]}
                placeholder="URL"
                placeholderTextColor="#999"
                value={piece.url}
                onChangeText={(text) => handlePieceChange(i, 'url', text)}
              />
              {!piece.isTemplate && (
                <TouchableOpacity
                  onPress={() => removePiece(i)}
                  style={{ flex: 0.5 }}
                >
                  <X color="#000" size={20} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.postButton} onPress={handleNext}>
            <Text style={styles.postButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  uploadArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 120,
  },
  uploadText: { fontSize: 16, color: '#999', marginTop: 16 },
  content: { flex: 1 },
  preview: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#f5f5f5' },
  form: { padding: 16 },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  tableHeader: { flexDirection: 'row', marginBottom: 4 },
  tableRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'center' },
  cell: { fontWeight: '600', color: '#666' },
  cellInput: {
    width: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginRight: 4,
    fontSize: 14,
    color: '#000',
  },
  placeholderText: { color: '#999' },
  postButton: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  postButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
