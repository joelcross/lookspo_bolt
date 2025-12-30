import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import styled from 'styled-components/native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

import PageHeader from '@/components/PageHeader/PageHeader';
import { Button } from '@/components/Button/Button';
import TextInput from '@/components/CustomTextInput/CustomTextInput';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useAuth } from '@/contexts/AuthContext';
import CustomTextInput from '@/components/CustomTextInput/CustomTextInput';

/* ======================
   Types
====================== */

type EditableProfile = {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
};

/* ======================
   Screen
====================== */

export default function EditProfileScreen() {
  const [initialProfile, setInitialProfile] = useState<EditableProfile | null>(
    null
  );
  const [draftProfile, setDraftProfile] = useState<EditableProfile | null>(
    null
  );

  const [activeField, setActiveField] = useState<keyof EditableProfile | null>(
    null
  );
  const [tempValue, setTempValue] = useState('');

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;

    const loadProfile = () => {
      const profile_data: EditableProfile = {
        username: profile?.username,
        name: profile?.name,
        bio: profile?.bio,
        avatarUrl: profile?.avatar_url,
      };

      setInitialProfile(profile_data);
      setDraftProfile(profile_data);
    };

    loadProfile();
  }, []);

  /* ======================
     Derived state
  ====================== */

  const hasChanges = useMemo(() => {
    return JSON.stringify(initialProfile) !== JSON.stringify(draftProfile);
  }, [initialProfile, draftProfile]);

  /* ======================
     Navigation
  ====================== */

  const handleBack = () => {
    if (hasChanges) {
      setShowLeaveModal(true);
    } else {
      router.back();
    }
  };

  /* ======================
     Field editing
  ====================== */

  const openFieldEditor = (field: keyof EditableProfile) => {
    setTempValue(draftProfile?.[field] ?? '');
    setActiveField(field);
  };

  const saveField = () => {
    if (!activeField) return;

    setDraftProfile((prev) => ({
      ...prev!,
      [activeField]: tempValue,
    }));

    setActiveField(null);
  };

  /* ======================
     Image picker
  ====================== */

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setDraftProfile((prev) => ({
        ...prev!,
        avatarUrl: result.assets[0].uri,
      }));
    }
  };

  /* ======================
     Save
  ====================== */

  const handleSave = async () => {
    try {
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          name: draftProfile.name,
          username: draftProfile.username,
          bio: draftProfile.bio,
          avatar_url: draftProfile.avatar_url,
        })
        .eq('id', profile.id);
      if (updateProfileError) throw updateProfileError;

      setInitialProfile(draftProfile);
      router.replace('/profile');
    } catch (err) {
      Alert.alert('Error', 'Failed to save changes.');
    }
  };

  if (!draftProfile) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Container>
        <PageHeader
          text="Edit Profile"
          left="back"
          onCustomLeftPress={handleBack}
        />

        <Content>
          <ScrollView>
            <EditRow
              label="Username"
              value={draftProfile.username}
              onPress={() => openFieldEditor('username')}
            />

            <EditRow
              label="Name"
              value={draftProfile.name}
              onPress={() => openFieldEditor('name')}
            />

            <EditRow
              label="Bio"
              value={draftProfile.bio}
              onPress={() => openFieldEditor('bio')}
            />

            <EditRow
              label="Profile picture"
              value="Change"
              onPress={pickImage}
            />
          </ScrollView>

          <Footer>
            <Button title="Save" onPress={handleSave} disabled={!hasChanges} />
          </Footer>
        </Content>

        {/* ======================
            Edit field modal
        ====================== */}
        <Modal visible={!!activeField} transparent animationType="slide">
          <Overlay>
            <ModalCard>
              <ModalTitle>Edit {activeField}</ModalTitle>

              <CustomTextInput
                value={tempValue}
                onChangeText={setTempValue}
                autoFocus
                multiline={activeField === 'bio'}
              />

              <ModalActions>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setActiveField(null)}
                />
                <Button title="Save" onPress={saveField} />
              </ModalActions>
            </ModalCard>
          </Overlay>
        </Modal>

        {/* ======================
            Leave without saving
        ====================== */}
        <Modal visible={showLeaveModal} transparent animationType="fade">
          <Overlay>
            <ModalCard>
              <ModalTitle>Leave without saving changes?</ModalTitle>

              <ModalActions>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => setShowLeaveModal(false)}
                />
                <Button
                  title="OK"
                  onPress={() => {
                    setShowLeaveModal(false);
                    router.back();
                  }}
                />
              </ModalActions>
            </ModalCard>
          </Overlay>
        </Modal>
      </Container>
    </KeyboardAvoidingView>
  );
}

/* ======================
   Reusable row
====================== */

function EditRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress: () => void;
}) {
  return (
    <Row onPress={onPress}>
      <Label>{label}</Label>
      <Value numberOfLines={1}>{value || '—'}</Value>
    </Row>
  );
}

/* ======================
   Styles
====================== */

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: #fff;
`;

const Content = styled.View`
  flex: 1;
`;

const Row = styled.Pressable`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.neutral[200]};
`;

const Label = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
`;

const Value = styled.Text`
  max-width: 60%;
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.secondary};
  text-align: right;
`;

const Footer = styled.View`
  padding: 16px;
`;

const Overlay = styled.Pressable`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalCard = styled.View`
  width: 88%;
  background-color: #fff;
  border-radius: 20px;
  padding: 24px;
`;

const ModalTitle = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  text-align: center;
  margin-bottom: 20px;
`;

const ModalActions = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 16px;
`;
