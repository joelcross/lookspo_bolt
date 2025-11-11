import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { styles } from './Sample.styles';

type SampleProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const Sample: React.FC<SampleProps> = ({ children, style, textStyle }) => {
  return (
    <View style={[styles.container, style]}>
      {typeof children === 'string' ? (
        <Text style={[styles.text, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};

export default Sample;
