import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import React from 'react';
import styled from 'styled-components/native';
import SmartImage from '../SmartImage/SmartImage';
import { useWindowDimensions } from 'react-native';

type BioCardProps = {
  image: string;
  name: string;
  bio: string;
  children?: React.ReactNode;
};

export function BioCard({ image, name, bio, children }: BioCardProps) {
  const { width } = useWindowDimensions();

  return (
    <Container>
      <RowContent>
        <SmartImage
          uri={image}
          shape="circle"
          style={{
            width: width * 0.25,
            height: width * 0.25,
          }}
          resizeMode="cover"
        />

        <TextContent>
          <Name numberOfLines={1}>{name}</Name>
          <Bio numberOfLines={7} ellipsizeMode="tail">
            {bio}
          </Bio>
        </TextContent>
      </RowContent>

      {children}
    </Container>
  );
}

const Container = styled.View`
  background-color: ${colors.primary[100]};
  border-radius: 20px;
  margin-horizontal: 5px;
  padding: 10px;
  overflow: hidden;
`;

const RowContent = styled.View`
  flex-direction: row;
  width: 100%;
  gap: 10px;
  align-items: flex-start;
`;

const TextContent = styled.View`
  flex: 1;
  flex-shrink: 1;
  padding-horizontal: 12px;
  gap: 8px;
`;

const Name = styled.Text`
  color: ${colors.secondary.medium};
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  font-weight: 600;
  flex-shrink: 1;
`;

const Bio = styled.Text`
  color: ${colors.primary[900]};
  font-family: ${typography.caption.fontFamily};
  font-size: ${typography.caption.fontSize}px;
  line-height: 19px;
  flex-shrink: 1;
`;
