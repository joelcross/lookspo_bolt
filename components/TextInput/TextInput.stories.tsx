import { StyleSheet, View } from 'react-native';
import TextInput from './TextInput';

export const AllVariants = () => (
  <View style={styles.container}>
    {/* Primary / Default */}
    <TextInput placeholder="Input placeholder" style={styles.mb} />

    {/* With Icon */}
    <TextInput
      placeholder="Input placeholder"
      icon="search"
      style={styles.mb}
    />

    {/* Focused (simulate with value + focus state) */}
    <TextInput
      placeholder="Input placeholder"
      value="Focused text"
      style={styles.mb}
      autoFocus
    />

    {/* Filled */}
    <TextInput
      placeholder="Input placeholder"
      value="Filled text"
      style={styles.mb}
    />

    {/* Error */}
    <TextInput
      placeholder="Input placeholder"
      state="error"
      helperText="Error message"
      style={styles.mb}
    />

    {/* Success */}
    <TextInput
      placeholder="Input placeholder"
      state="success"
      value="Valid input"
      helperText="Success message"
      style={styles.mb}
    />

    {/* Disabled */}
    <TextInput
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
