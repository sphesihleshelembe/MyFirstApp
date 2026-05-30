import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withFadeIn,
  withFadeOut,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  SlideInUp,
  SlideInDown,
  ZoomIn,
  ZoomOut,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { colors, radius } from '@/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Fade in animation wrapper
export function FadeInView({ children, delay = 0, duration = 400 }: { children: React.ReactNode; delay?: number; duration?: number }) {
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(duration).easing(Easing.out(Easing.quad))}>
      {children}
    </Animated.View>
  );
}

// Slide in from right
export function SlideInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={SlideInRight.delay(delay).springify().damping(20).stiffness(100)}>
      {children}
    </Animated.View>
  );
}

// Slide in from bottom
export function SlideUpView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={SlideInUp.delay(delay).springify().damping(20).stiffness(100)}>
      {children}
    </Animated.View>
  );
}

// Zoom in animation
export function ZoomInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View entering={ZoomIn.delay(delay).springify().damping(15)}>
      {children}
    </Animated.View>
  );
}

// Staggered list animation
export function StaggerView({ children, index }: { children: React.ReactNode; index: number }) {
  const delay = index * 80;
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(350).easing(Easing.out(Easing.quad))}>
      {children}
    </Animated.View>
  );
}

// Animated button with press effect
export function AnimatedButton({
  children,
  onPress,
  style,
  disabled,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      {children}
    </AnimatedPressable>
  );
}

// Scale animation on mount
export function ScaleInView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <Animated.View
      entering={ZoomIn.delay(delay)
        .duration(400)
        .easing(Easing.out(Easing.back(1.2)))}
    >
      {children}
    </Animated.View>
  );
}

// Card with hover/press animation
export function AnimatedCard({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!onPress) {
    return <View style={style}>{children}</View>;
  }

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        opacity.value = withTiming(0.9, { duration: 100 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        opacity.value = withTiming(1, { duration: 100 });
      }}
    >
      {children}
    </AnimatedPressable>
  );
}

// Fade transition between content
export function FadeTransition({ show, children }: { show: boolean; children: React.ReactNode }) {
  const opacity = useSharedValue(show ? 1 : 0);
  const translateY = useSharedValue(show ? 0 : 10);

  useEffect(() => {
    opacity.value = withTiming(show ? 1 : 0, { duration: 300 });
    translateY.value = withTiming(show ? 0 : 10, { duration: 300 });
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

// Shimmer loading effect
export function ShimmerView({ width: viewWidth = 200, height = 20, style }: { width?: number; height?: number; style?: any }) {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withTiming(0, { duration: 1000 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerValue.value,
      [0, 1],
      [-viewWidth, viewWidth]
    );
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View style={[{ width: viewWidth, height, backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' }, style]}>
      <Animated.View
        style={[
          {
            width: viewWidth / 2,
            height: '100%',
            backgroundColor: colors.surfaceElevated,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

// Progress bar animation
export function AnimatedProgress({ value, color = colors.primary }: { value: number; color?: string }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withSpring(value, { damping: 15, stiffness: 100 });
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', backgroundColor: color, borderRadius: 2 }, animatedStyle]} />
    </View>
  );
}

// Bounce animation for icons
export function BounceIcon({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.15, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 300 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

// Tab indicator animation
export function TabIndicator({ index, count, width }: { index: number; count: number; width: number }) {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring((width / count) * index, { damping: 15, stiffness: 100 });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          height: 3,
          width: width / count,
          backgroundColor: colors.primary,
          borderRadius: 2,
        },
        animatedStyle,
      ]}
    />
  );
}

// Floating animation
export function FloatingView({ children }: { children: React.ReactNode }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSequence(
      withTiming(-6, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })
    );
    // Loop would require useAnimatedReaction, simplified here
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

// Pulse animation for notifications
export function PulseView({ children, active = true }: { children: React.ReactNode; active?: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withTiming(1.05, { duration: 600 }),
        withTiming(1, { duration: 600 })
      );
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export const AnimatedLayout = {
  FadeIn: FadeIn,
  FadeOut: FadeOut,
  SlideInRight: SlideInRight,
  SlideOutLeft: SlideOutLeft,
  SlideInUp: SlideInUp,
  ZoomIn: ZoomIn,
};
