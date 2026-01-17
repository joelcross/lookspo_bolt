import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface BridgeProps {
  width?: number;
  height?: number;
  color?: string;
  curveDepth?: number; // how far the edges curve inward
}

const Bridge: React.FC<BridgeProps> = ({
  width = 25,
  height = 10,
  color = '#fff',
  curveDepth = 8,
}) => {
  const path = `
    M 0,0
    Q ${curveDepth},${height / 2} 0,${height}
    L ${width},${height}
    Q ${width - curveDepth},${height / 2} ${width},0
    Z
  `;

  return (
    <View
      style={{
        alignItems: 'center',
      }}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Path d={path} fill={color} />
      </Svg>
    </View>
  );
};

export default Bridge;
