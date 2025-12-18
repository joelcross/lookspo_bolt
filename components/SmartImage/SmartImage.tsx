// components/SmartImage.tsx
import React, { useState, useEffect } from 'react';
import {
  Image,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import styled from 'styled-components/native';

interface SmartImageProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  borderRadius?: number;
  showLoader?: boolean;
  shape?: 'default' | 'circle';
}

const flattenStyle = (style?: StyleProp<ViewStyle>) =>
  style ? StyleSheet.flatten(style) : {};

export default function SmartImage({
  uri,
  style,
  resizeMode = 'cover',
  borderRadius = 0,
  showLoader = true,
  shape = 'default',
}: SmartImageProps) {
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  const flatStyle = flattenStyle(style);
  const size =
    typeof flatStyle?.width === 'number'
      ? flatStyle.width
      : typeof flatStyle?.height === 'number'
      ? flatStyle.height
      : undefined;

  const isCircle = shape === 'circle' && typeof size === 'number';
  const radius = isCircle ? size / 2 : borderRadius;

  useEffect(() => {
    if (!uri || isCircle) return;

    Image.getSize(
      uri,
      (width, height) => {
        setAspectRatio(width / height);
        setLoading(false);
      },
      () => {
        setAspectRatio(1);
        setLoading(false);
      }
    );
  }, [uri, isCircle]);

  if (!uri) {
    return <Placeholder style={style} borderRadius={radius} />;
  }

  return (
    <Container style={style}>
      <ImageWrapper
        style={
          isCircle
            ? {
                width: size,
                height: size,
                borderRadius: radius,
                overflow: 'hidden',
              }
            : { aspectRatio }
        }
      >
        <StyledImage
          source={{ uri }}
          resizeMode={resizeMode}
          style={StyleSheet.absoluteFillObject}
          borderRadius={radius}
          onLoadEnd={() => setLoading(false)}
        />

        {loading && showLoader && (
          <LoaderOverlay>
            <ActivityIndicator size="large" color="#fff" />
          </LoaderOverlay>
        )}
      </ImageWrapper>
    </Container>
  );
}

const Container = styled.View`
  width: 100%;
  overflow: hidden;
`;

const ImageWrapper = styled.View`
  width: 100%;
`;

const StyledImage = styled.Image<{ borderRadius: number }>`
  border-radius: ${(props) => props.borderRadius}px;
`;

const Placeholder = styled.View<{ borderRadius: number }>`
  width: 100%;
  aspect-ratio: 1;
  background-color: #f0f0f0;
  border-radius: ${(props) => props.borderRadius}px;
`;

const LoaderOverlay = styled.View`
  ${StyleSheet.absoluteFillObject as any};
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: center;
  align-items: center;
`;
