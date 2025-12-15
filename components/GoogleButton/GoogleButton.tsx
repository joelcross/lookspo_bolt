import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { TouchableOpacity, Text, Image, StyleSheet, View } from 'react-native';
import styled from 'styled-components/native';

export function GoogleButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.content}>
        <Image
          source={{
            uri: 'https://developers.google.com/identity/images/g-logo.png',
          }}
          style={styles.icon}
        />
        <CustomText>Continue with Google</CustomText>
      </View>
    </TouchableOpacity>
  );
}

const CustomText = styled.Text`
  font-family: ${typography.body.fontFamily};
  font-size: ${typography.body.fontSize}px;
  color: ${colors.text.primary};
`;
const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  icon: {
    width: 18,
    height: 18,
  },
});
