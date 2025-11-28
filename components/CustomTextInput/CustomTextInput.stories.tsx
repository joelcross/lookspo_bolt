import { StyleSheet, View } from 'react-native';
import CustomTextInput from './CustomTextInput';

export const AllVariants = () => (
  <View style={styles.container}>
    {/* Primary / Default */}
    <CustomTextInput placeholder="Input placeholder" style={styles.mb} />

    {/* With Icon */}
    <CustomTextInput
      placeholder="Input placeholder"
      icon="search"
      style={styles.mb}
    />

    {/* Focused (simulate with value + focus state) */}
    <CustomTextInput
      placeholder="Input placeholder"
      value="Focused text"
      style={styles.mb}
      autoFocus
    />

    {/* Filled */}
    <CustomTextInput
      placeholder="Input placeholder"
      value="Filled text"
      style={styles.mb}
    />

    {/* Error */}
    <CustomTextInput
      placeholder="Input placeholder"
      state="error"
      helperText="Error message"
      style={styles.mb}
    />

    {/* Success */}
    <CustomTextInput
      placeholder="Input placeholder"
      state="success"
      value="Valid input"
      helperText="Success message"
      style={styles.mb}
    />

    {/* Disabled */}
    <CustomTextInput
      placeholder="Input placeholder"
      state="disabled"
      style={styles.mb}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#FAFAFA', flex: 1 },
  mb: { marginBottom: 24 },
});
