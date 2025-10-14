import React from "react";
import { Text, View, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, Stack } from "expo-router"; // ✅ import Stack
import styles from "./styles/OnBoardingScreen.style";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <>
      {/* ✅ Hide the default header */}
      <Stack.Screen options={{ headerShown: false }} />

      <LinearGradient colors={["#1a411fff", "#75b85aff"]} style={styles.container}>
        {/* Logo */}
        <Image source={require("../assets/logo3.png")} style={styles.logo} />

        {/* Title */}
        <Text style={styles.title}>THE NEW ERA OF</Text>

        {/* Row with Logo + AGRICULTURE */}
        <View style={styles.row}>
          <Image source={require("../assets/logo4.png")} style={styles.logo2} />
          <Text style={styles.title}>AGRICULTURE</Text>
        </View>
        <Text style={styles.subtitle}>
          Sustainable farming solution for better tomorrow
        </Text>

        {/* Info Cards */}
        <View style={styles.infoWrapper}>
          <View style={[styles.infoCard, styles.leftCard, styles.tiltLeft]}>
            <Image source={require("../assets/growth.png")} style={styles.icon} />
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Growth:</Text> 12cm
            </Text>
          </View>

          <View style={[styles.infoCard, styles.rightCard, styles.tiltRight]}>
            <Image source={require("../assets/calcium.png")} style={styles.icon} />
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Calcium:</Text> 80%
            </Text>
          </View>

          <View style={[styles.infoCard, styles.leftCard]}>
            <Image source={require("../assets/phosphorus.png")} style={styles.icon} />
            <Text style={styles.infoText}>
              <Text style={styles.bold}>Phosphorus:</Text> 40%
            </Text>
          </View>
        </View>

        {/* Get Started Button */}
        <TouchableOpacity
          style={styles.getStartedButton}
          onPress={() => router.push("/dashboard")}
        >
          <Text style={styles.getStartedText}>Get Started</Text>
        </TouchableOpacity>
      </LinearGradient>
    </>
  );
}
