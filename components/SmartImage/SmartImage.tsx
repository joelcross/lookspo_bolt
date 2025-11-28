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
}

export default function SmartImage({
  uri,
  style,
  resizeMode = 'cover',
  borderRadius = 0,
  showLoader = true,
}: SmartImageProps) {
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uri) return;

    Image.getSize(
      uri,
      (width, height) => {
        setAspectRatio(width / height);
        setLoading(false);
      },
      () => {
        setAspectRatio(1); // fallback square
        setLoading(false);
      }
    );
  }, [uri]);

  if (!uri) {
    return <Placeholder style={style} borderRadius={borderRadius} />;
  }

  return (
    <Container style={style}>
      <ImageWrapper style={{ aspectRatio }}>
        <StyledImage
          source={{ uri }}
          resizeMode={resizeMode}
          style={StyleSheet.absoluteFillObject}
          onLoadEnd={() => setLoading(false)}
          borderRadius={borderRadius}
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

// ──────────────────────────────
// Styled Components — BULLETPROOF
// ──────────────────────────────

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
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: center;
  align-items: center;
`;
