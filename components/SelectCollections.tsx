import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Check } from 'lucide-react-native';

export interface Collection {
  id: string;
  name: string;
}

interface Props {
  collections: Collection[];
  preSelected?: string[];
  onConfirm: (selected: string[]) => Promise<void>;
  confirmText?: string;
}

export default function SelectCollections({
  collections,
  preSelected = [],
  onConfirm,
  confirmText = 'Done',
}: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>(preSelected);

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

  return (
    <View style={styles.container}>
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <TouchableOpacity
              style={styles.collectionRow}
              onPress={() => toggleSelect(item.id)}
            >
              <Text style={styles.collectionName}>{item.name}</Text>
              <View
                style={[styles.circle, isSelected && styles.circleSelected]}
              >
                {isSelected && <Check size={16} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ padding: 16 }}
      />

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={() => onConfirm(selectedIds)}
      >
        <Text style={styles.confirmText}>{confirmText}</Text>
      </TouchableOpacity>
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
});
