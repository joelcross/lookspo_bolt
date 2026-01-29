import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import React from 'react';
import styled from 'styled-components/native';
import { useWindowDimensions } from 'react-native';
import { Avatar } from '../Avatar/Avatar';

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
        <Avatar uri={image} size={width * 0.25} />

        <TextContent>
          <Name numberOfLines={1}>{name}</Name>
          <BioWrapper>
            <Bio numberOfLines={7} ellipsizeMode="tail">
              {bio}
            </Bio>
          </BioWrapper>
        </TextContent>
      </RowContent>

      {children && <ChildrenWrapper>{children}</ChildrenWrapper>}
    </Container>
  );
}

const Container = styled.View`
  background-color: #fff;
  border-radius: 20px;
  padding: 10px;
  overflow: hidden;
`;

const RowContent = styled.View`
  flex-direction: row;
  width: 100%;
  gap: 10px;
  align-items: stretch;
`;

const TextContent = styled.View`
  flex: 1;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
`;

const BioWrapper = styled.View`
  /* exists in case i want a bg color on the bio text */
  border-radius: 20px;
  /* background-color: ${colors.tertiary.light}; */
  flex-grow: 1;
  justify-content: flex-start;
`;

const Name = styled.Text`
  color: ${colors.secondary.medium};
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

const ChildrenWrapper = styled.View`
  width: 100%;
`;
