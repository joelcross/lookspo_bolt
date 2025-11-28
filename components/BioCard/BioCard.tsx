import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import React from 'react';
import styled from 'styled-components/native';
import SmartImage from '../SmartImage/SmartImage';

type BioCardProps = {
  image: string;
  name: string;
  bio: string;
};

export function BioCard({ image, name, bio }: BioCardProps) {
  return (
    <Container>
      <ImageWrapper>
        <SmartImage uri={image} resizeMode="cover" />
      </ImageWrapper>

      <TextContent>
        <Name numberOfLines={1}>{name}</Name>
        <BioWrapper>
          <Bio numberOfLines={7} ellipsizeMode="tail">
            {bio}
          </Bio>
        </BioWrapper>
      </TextContent>
    </Container>
  );
}

// ──────────────────────────────
// Styled Components — 3:4 RATIO LOCKED
// ──────────────────────────────

const Container = styled.View`
  flex-direction: row;
  background-color: ${colors.primary[100]};
  border-radius: 10px;
  overflow: hidden;
  align-self: flex-start;
  margin-horizontal: 10px;

  shadow-color: #000;
  shadow-opacity: 0.15;
  shadow-radius: 20px;
`;

const ImageWrapper = styled.View`
  width: 150px;
  aspect-ratio: 3 / 4;
`;

const TextContent = styled.View`
  flex: 1;
  padding: 14px;
  gap: 4px;
`;

const BioWrapper = styled.View`
  flex: 1;
  justify-content: center;
  gap: 4px;
`;

const Name = styled.Text`
  color: ${colors.secondary[500]};
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: 600;
`;

const Bio = styled.Text`
  color: ${colors.primary[900]};
  font-family: ${typography.caption.fontFamily};
  font-size: ${typography.caption.fontSize}px;
  line-height: 19px;
`;
