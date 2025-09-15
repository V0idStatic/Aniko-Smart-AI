import React from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

export default function OnboardingScreen() {
    const router = useRouter();

    return (
        <LinearGradient
            colors={["#1a411fff", "#75b85aff"]}
            style={styles.container}
        >
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 60,
    },
    logo: {
        height: 60,
        resizeMode: "contain",
        marginBottom: 30,
    },
    title: {
        fontSize: 40,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
        marginBottom: 10,
    },

    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center", 
        marginBottom: 10,
    },

    logo2: {
        height: 50,
        width: 50,
        resizeMode: "contain",
        marginRight: 8, 
        marginBottom: 15,
    },



    subtitle: {
        color: "#cce0cc",
        textAlign: "center",
        marginBottom: 40,
    },


    infoWrapper: {
        width: "90%",
        marginBottom: 50,
    },

    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#d8d8d8ff",
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 15,
        marginVertical: 8,
        width: "55%", 
        elevation: 3,
    },

    leftCard: {
        alignSelf: "flex-start",
        marginLeft: 20,
        marginBottom: 60,
    },

    rightCard: {
        alignSelf: "flex-end",
        marginRight: 20,
        marginBottom: 60,
    },

    tiltLeft: {
        transform: [{ rotate: "-5deg" }], 
    },

    tiltRight: {
        transform: [{ rotate: "5deg" }], 
    },

    icon: {
        width: 24,
        height: 24,
        marginRight: 10,
    },

    infoText: {
        fontSize: 16,
        color: "#333",
    },

    bold: {
        fontWeight: "700",
    },

    getStartedButton: {
        backgroundColor: "#d3d3d3",
        paddingVertical: 15,
        paddingHorizontal: 60,
        borderRadius: 25,
        marginTop: "auto",
        marginBottom: 70,
    },
    getStartedText: {
        color: "#333",
        fontWeight: "bold",
        fontSize: 16,
    },
});
