import { typography } from '@/theme/typography';
import React, { useState, useRef } from 'react';
import {
  TouchableOpacity,
  Platform,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import styled from 'styled-components/native';
import { BlurView } from 'expo-blur';

// Generic tab value (string literal union)
export type TabValue = string;

interface SectionOption<T extends TabValue> {
  label: string;
  value: T;
}

interface SectionTabsProps<T extends TabValue> {
  options: readonly SectionOption<T>[];
  value: T;
  onChange: (value: T) => void;
  children?: React.ReactNode;
}

const SectionTabs = <T extends TabValue>({
  options,
  value,
  onChange,
  children,
}: SectionTabsProps<T>) => {
  const activeIndex = options.findIndex((opt) => opt.value === value);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(0)).current;

  const [buttonLayouts, setButtonLayouts] = useState<
    { x: number; width: number }[]
  >([]);

  React.useEffect(() => {
    if (buttonLayouts.length === options.length && activeIndex >= 0) {
      const activeLayout = buttonLayouts[activeIndex];

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: activeLayout.x,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }),
        Animated.spring(widthAnim, {
          toValue: activeLayout.width,
          useNativeDriver: false,
          tension: 80,
          friction: 10,
        }),
      ]).start();
    }
  }, [activeIndex, buttonLayouts]);

  const handleButtonLayout = (index: number) => (event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;

    setButtonLayouts((prev) => {
      const newLayouts = [...prev];
      newLayouts[index] = { x, width };
      return newLayouts;
    });
  };

  return (
    <Container>
      <BlurView
        intensity={80}
        tint="light"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 24,
          overflow: 'hidden',
        }}
      />
      <ContentWrapper>
        <Buttons>
          {buttonLayouts.length === options.length && (
            <SlidingPill
              style={{
                width: widthAnim,
                transform: [{ translateX: slideAnim }],
              }}
            />
          )}

          {options.map((option, index) => {
            const isActive = value === option.value;

            return (
              <TabButton
                key={String(option.value)}
                isActive={isActive}
                onPress={() => onChange(option.value)}
                activeOpacity={0.7}
                onLayout={handleButtonLayout(index)}
              >
                <TabText isActive={isActive} numberOfLines={1}>
                  {option.label}
                </TabText>
              </TabButton>
            );
          })}
        </Buttons>
        {children}
      </ContentWrapper>
    </Container>
  );
};

const Container = styled.View`
  position: absolute;
  top: 12px;
  align-self: center;
  z-index: 998;

  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  overflow: hidden;

  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.8);

  ${Platform.OS === 'ios'
    ? `
    shadow-color: #000;
    shadow-offset: 0px 4px;
    shadow-opacity: 0.08;
    shadow-radius: 16px;
  `
    : `
    elevation: 4;
  `}
`;

const ContentWrapper = styled.View`
  z-index: 1;
  overflow: hidden;
`;

const Buttons = styled.View`
  position: relative;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 8px 8px;
  overflow: hidden;
`;

const SlidingPill = styled(Animated.View)`
  position: absolute;
  left: 0;
  top: 50%;
  margin-top: -20px;
  height: 40px;
  background-color: rgba(26, 26, 26, 0.06);
  border-radius: 20px;
  z-index: 0;
`;

const TabButton = styled(TouchableOpacity)<{ isActive: boolean }>`
  padding-horizontal: 16px;
  height: 40px;
  align-items: center;
  justify-content: center;
  z-index: 1;
`;

const TabText = styled.Text<{ isActive: boolean }>`
  font-family: ${typography.heading3.fontFamily};
  font-size: ${typography.heading3.fontSize}px;
  color: ${({ isActive }) => (isActive ? '#1A1A1A' : '#6B6B6B')};
  font-weight: ${({ isActive }) => (isActive ? '600' : '400')};
  letter-spacing: 0.3px;
  line-height: 20px;
`;

export default SectionTabs;
