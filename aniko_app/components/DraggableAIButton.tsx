"use client"

import { useRef } from "react"
import { View, Animated, PanResponder, StyleSheet, Dimensions, Image } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { colors } from "../app/styles/dashboard.style"

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window")
const BUTTON_SIZE = 64
const EDGE_PADDING = 20

interface DraggableAIButtonProps {
  onPress: () => void
}

export default function DraggableAIButton({ onPress }: DraggableAIButtonProps) {
  // Initialize position at bottom right corner
  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING,
      y: SCREEN_HEIGHT - BUTTON_SIZE - 200, // Account for footer navigation
    }),
  ).current

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        })
        pan.setValue({ x: 0, y: 0 })
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset()

        // Get current position
        const currentX = (pan.x as any)._value
        const currentY = (pan.y as any)._value

        // Calculate boundaries
        const maxX = SCREEN_WIDTH - BUTTON_SIZE - EDGE_PADDING
        const maxY = SCREEN_HEIGHT - BUTTON_SIZE - 200
        const minX = EDGE_PADDING
        const minY = EDGE_PADDING

        // Constrain to screen boundaries
        let finalX = Math.max(minX, Math.min(maxX, currentX))
        const finalY = Math.max(minY, Math.min(maxY, currentY))

        // Snap to nearest edge (left or right) if dragged
        if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) {
          const centerX = SCREEN_WIDTH / 2
          finalX = currentX < centerX ? minX : maxX
        }

        // Animate to final position
        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
          friction: 7,
          tension: 40,
        }).start()

        if (Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
          console.log("[v0] Draggable button tapped - navigating to chatbot")
          onPress()
        }
      },
    }),
  ).current

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.button}>
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.gradient}>
          <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        </LinearGradient>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    zIndex: 1000,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 36,
    height: 36,
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
})
