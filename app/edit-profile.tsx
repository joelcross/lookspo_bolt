import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import styled from 'styled-components/native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

import PageHeader from '@/components/PageHeader/PageHeader';
import { Button } from '@/components/Button/Button';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { useAuth } from '@/contexts/AuthContext';
import CustomTextInput from '@/components/CustomTextInput/CustomTextInput';

type EditableProfile = {
  username: string;
  name: string;
  bio: string;
  avatarUrl: string | null;
};

export default function EditProfileScreen() {
  const [initialProfile, setInitialProfile] = useState<EditableProfile | null>(
    null,
  );
  const [draftProfile, setDraftProfile] = useState<EditableProfile | null>(
    null,
  );

  const [activeField, setActiveField] = useState<keyof EditableProfile | null>(
    null,
  );
  const [tempValue, setTempValue] = useState('');

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const { profile, setProfile } = useAuth();

  useEffect(() => {
    if (!profile) return;

    const loadProfile = () => {
      const profile_data: EditableProfile = {
        username: profile.username,
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatar_url,
      };

      setInitialProfile(profile_data);
      setDraftProfile(profile_data);
    };

    loadProfile();
  }, []);

  const hasChanges = useMemo(() => {
    return JSON.stringify(initialProfile) !== JSON.stringify(draftProfile);
  }, [initialProfile, draftProfile]);

  const handleBack = () => {
    if (hasChanges) {
      setShowLeaveModal(true);
    } else {
      router.back();
    }
  };

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

  const handleSave = async () => {
    try {
      let avatarUrl = initialProfile.avatarUrl;

      // works with web + ios
      const isLocalImage =
        draftProfile.avatarUrl && !draftProfile.avatarUrl.startsWith('http');

      if (isLocalImage) {
        const response = await fetch(draftProfile.avatarUrl);
        const arrayBuffer = await response.arrayBuffer();

        const filePath = `${profile.id}/avatar.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            upsert: true,
            contentType: 'image/jpeg',
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = data.publicUrl;
      }

      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          name: draftProfile.name,
          username: draftProfile.username,
          bio: draftProfile.bio,
          avatar_url: avatarUrl,
        })
        .eq('id', profile.id);

      if (updateProfileError) throw updateProfileError;

      setInitialProfile({ ...draftProfile, avatarUrl: avatarUrl });

      // Make sure updated profile is reflected in the context
      const updatedProfile = {
        ...profile,
        name: draftProfile.name,
        username: draftProfile.username,
        bio: draftProfile.bio,
        avatar_url: avatarUrl,
      };
      setProfile(updatedProfile);

      router.replace('/profile');
    } catch (err) {
      console.error(err);
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

        <View style={{ marginTop: 60 }}>
          <ListContent>
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
          </ListContent>

          <Button title="Save" onPress={handleSave} disabled={!hasChanges} />
        </View>

        {/* Edit field modal */}
        <Modal visible={!!activeField} transparent animationType="slide">
          <Overlay>
            <ModalCard>
              <ModalTitle>Edit {activeField}</ModalTitle>
              <TextInputWrapper>
                <CustomTextInput
                  value={tempValue}
                  onChangeText={setTempValue}
                  autoFocus
                  multiline={activeField === 'bio'}
                />
              </TextInputWrapper>

              <ModalActions>
                <ModalButtonWrapper>
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setActiveField(null)}
                  />
                </ModalButtonWrapper>
                <ModalButtonWrapper>
                  <Button title="Save" onPress={saveField} />
                </ModalButtonWrapper>
              </ModalActions>
            </ModalCard>
          </Overlay>
        </Modal>

        {/* Leave without saving */}
        <Modal visible={showLeaveModal} transparent animationType="fade">
          <Overlay>
            <ModalCard>
              <ModalTitle>Leave without saving changes?</ModalTitle>
              <ModalActions>
                <ModalButtonWrapper>
                  <Button
                    title="Cancel"
                    variant="secondary"
                    onPress={() => setShowLeaveModal(false)}
                  />
                </ModalButtonWrapper>
                <ModalButtonWrapper>
                  <Button
                    title="OK"
                    onPress={() => {
                      setShowLeaveModal(false);
                      router.back();
                    }}
                  />
                </ModalButtonWrapper>
              </ModalActions>
            </ModalCard>
          </Overlay>
        </Modal>
      </Container>
    </KeyboardAvoidingView>
  );
}

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
      <Value numberOfLines={1} value={value}>
        {value || '—'}
      </Value>
    </Row>
  );
}

const Container = styled.SafeAreaView`
  flex: 1;
  margin: 5px;
  gap: 5px;
`;

const ListContent = styled.View`
  background: #fff;
  border-radius: 20px;
  margin-bottom: 5px;
`;

const Row = styled.Pressable`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
`;

const Label = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
`;

const Value = styled.Text<{ value?: string }>`
  max-width: 60%;
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.tertiary.dark};
  text-align: right;

  color: ${({ value }) =>
    value === 'Change' ? colors.secondary.medium : colors.tertiary.dark};
`;

const TextInputWrapper = styled.View`
  margin-bottom: 24px;
`;

const ModalButtonWrapper = styled.View`
  flex: 1;
`;

const Overlay = styled.Pressable`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
`;

const ModalCard = styled.View`
  width: 85vw;
  background-color: #fff;
  border-radius: 20px;
  padding: 24px;
`;

const ModalTitle = styled.Text`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: ${typography.heading3.fontWeight};
  color: ${colors.primary[900]};
  text-align: center;
  margin-bottom: 12px;
`;

const ModalActions = styled.View`
  flex-direction: row;
  gap: 8px;
`;
