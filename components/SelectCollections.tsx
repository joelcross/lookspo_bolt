import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export interface Collection {
  id: string;
  name: string;
}

interface Props {
  collections: Collection[];
  preSelected?: string[];
  onConfirm: (selected: string[]) => Promise<void>;
  confirmText?: string;
  userId?: string; // needed for adding new collection
}

export default function SelectCollections({
  collections: initialCollections,
  preSelected = [],
  onConfirm,
  confirmText = 'Done',
  userId,
}: Props) {
  const [collections, setCollections] =
    useState<Collection[]>(initialCollections); // all collections belonging to user
  const [selectedIds, setSelectedIds] = useState<string[]>(preSelected); // checked-off collections
  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    setCollections(initialCollections);
  }, [initialCollections]);

  useEffect(() => {
    if (preSelected && preSelected.length > 0) {
      setSelectedIds(preSelected);
    }
  }, [preSelected]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim() || !userId) return;
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert({ name: newCollectionName.trim(), user_id: userId })
        .select()
        .single();
      if (error) throw error;
      setCollections([...collections, data]);
      setShowModal(false);
      setNewCollectionName('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={[...collections, { id: 'new', name: 'Add new collection' }]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          item.id === 'new' ? (
            <TouchableOpacity
              style={[styles.collectionRow, styles.addNewRow]}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.collectionName}>＋ Add new collection</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.collectionRow}
              onPress={() => toggleSelect(item.id)}
            >
              <Text style={styles.collectionName}>{item.name}</Text>
              <View
                style={[
                  styles.circle,
                  selectedIds.includes(item.id) && styles.circleSelected,
                ]}
              >
                {selectedIds.includes(item.id) && (
                  <Check size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          )
        }
        contentContainerStyle={{ padding: 16 }}
      />

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => onConfirm(selectedIds)}
      >
        <Text style={styles.confirmText}>{confirmText}</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>New Collection</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter collection name"
              value={newCollectionName}
              onChangeText={setNewCollectionName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateCollection}
              >
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  collectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addNewRow: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  collectionName: { fontSize: 16 },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleSelected: { backgroundColor: '#000', borderColor: '#000' },
  confirmButton: {
    backgroundColor: '#000',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: '#f5f5f5' },
  createButton: { backgroundColor: '#000' },
  modalButtonText: { fontSize: 16, fontWeight: '600', color: '#000' },
});
