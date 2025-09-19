import supabase from "./CONFIG/supaBase";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert, Image, ImageBackground, } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

interface User {
    id: string;
    username: string;
    email?: string;
    last_login?: string;
    created_at?: string;
}

interface AuthUser {
    id: string;
    email?: string;
    username?: string;
}

export default function WaterDashboard() {
    const [user, setUser] = useState<User | AuthUser | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);


    const [cropsStatus] = useState("Good");
    const router = useRouter();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const authUserFound = await getCurrentUser();
                if (!authUserFound) await getLastLoggedInUser();
            } catch (error) {
                console.error("Error in fetchUserData:", error);
                await getLastLoggedInUser();
            }
        };

        fetchUserData();
    }, []);

    const getLastLoggedInUser = async () => {
        try {
            const { data, error } = await supabase
                .from("users")
                .select("*")
                .order("last_login", { ascending: false })
                .limit(1);

            if (!error && data?.length > 0) {
                setCurrentUser(data[0]);
            }
        } catch (error) {
            console.error("Error getting last logged user:", error);
        }
    };

    const getCurrentUser = async () => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) return false;

            if (user) {
                const { data, error } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (!error) setUser(data);
                else setUser(user);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error getting current user:", error);
            return false;
        }
    };

    const handleLogout = async () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                onPress: async () => {
                    try {
                        const { error } = await supabase.auth.signOut();
                        if (!error) router.replace("/");
                    } catch (error) {
                        console.error("Logout error:", error);
                    }
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            {/* Header Background */}
            <LinearGradient colors={["#1c4722", "#4d7f39"]} style={styles.headerBackground}>
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>Good Morning,</Text>
                        <Text style={styles.greeting}>
                            {currentUser?.username ||
                                (user && "username" in user
                                    ? user.username
                                    : user?.email?.split("@")[0]) ||
                                "User"}
                        </Text>
                    </View>

                    <View style={styles.headerIcons}>
                        <Ionicons name="notifications-outline" size={22} color="white" />
                        <TouchableOpacity onPress={handleLogout} style={{ marginLeft: 12 }}>
                            <Ionicons name="log-out-outline" size={22} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            
            </LinearGradient>


            {/* Top Wave Card */}
            <View style={styles.waveCard}>
                {/* Top Left Group */}
                <View style={styles.waveTopLeft}>
                    <Text style={styles.waveTitle}>Water level</Text>
                    <Text style={styles.waveLevel}>50 centimeter</Text>
                </View>

                {/* Menu icon stays at top right */}
                <Ionicons name="menu" size={22} color="white" style={styles.waveMenu} />

                <ImageBackground
                    source={require("../assets/wave.png")}
                    style={styles.waveImage}
                    imageStyle={{ borderRadius: 20 }}
                >

                    {/* Button stays at bottom */}
                    <TouchableOpacity style={styles.setGoalButton}>
                        <Text style={styles.setGoalText}>Set Goal</Text>
                    </TouchableOpacity>
                </ImageBackground>
            </View>



            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Water Status</Text>

                {/* Water Status Card */}
                <View style={styles.statusCard}>
                    <View style={[styles.outerCircle, { borderColor: "#4FC3F7" }]}>
                        <Text style={styles.circleText}>60%</Text>
                    </View>
                    <View style={styles.statusDetails}>
                        <Text style={styles.statusLabel}>Water level</Text>
                        <Text style={styles.statusValue}>Normal</Text>
                        <Text style={styles.statusLabel}>Water temperature</Text>
                        <Text style={styles.statusValue}>20 degree</Text>
                    </View>
                </View>

                {/* Toggle Buttons */}
                <View style={styles.toggleWrapper}>
                    {["Weekly", "Monthly", "Yearly"].map((label, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.toggleButton, i === 0 && styles.toggleActive]}
                        >
                            <Text style={[styles.toggleText, i === 0 && styles.toggleTextActive]}>
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* History Card */}
                <View style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                        <View>
                            <Text style={styles.historyTitle}>Water level history</Text>
                            <Text style={styles.historySubtitle}>Weekly</Text>
                        </View>
                        <Ionicons name="menu" size={20} color="white" />
                    </View>

                    <View style={styles.historyRow}>
                        {[
                            { day: "Mon", status: "Good", temp: "Good" },
                            { day: "Tue", status: "Good", temp: "Good" },
                            { day: "Wed", status: "Good", temp: "Good" },
                        ].map((item, i) => (
                            <View key={i} style={styles.historyDayCard}>
                                {/* Left Day Box */}
                                <View style={styles.historyDayBubble}>
                                    <Text style={styles.historyDay}>{item.day}</Text>
                                </View>

                                {/* Right Side Details */}
                                <View style={styles.historyRightDetails}>
                                    <Text style={styles.historyDetail}>
                                        <Text style={styles.boldText}>Status</Text> {"\n"}{item.status}
                                    </Text>
                                    <Text style={styles.historyDetail}>
                                        <Text style={styles.boldText}>Temperature</Text> {"\n"}{item.temp}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>


            </ScrollView>





            {/* Footer Navigation */}
            <View style={styles.footer}>
                <TouchableOpacity>
                    <Ionicons name="home" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/plantdashboard")}>
                    <Ionicons name="leaf" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="camera" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/dashboard")}>
                    <Ionicons name="cloud" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Ionicons name="menu" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push("/sensor")}>
                    <Ionicons name="analytics-outline" size={28} color="white" />
                </TouchableOpacity>
            </View>













        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#e7dbc8" },

    headerBackground: {
        paddingTop: 50,
        paddingBottom: 80,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    greeting: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white"
    },
    headerIcons: {
        flexDirection: "row",
        alignItems: "center"
    },

    searchContainer: {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 12,
        marginTop: 30,
        paddingHorizontal: 10,
        alignItems: "center",
        height: 40,
    },
    searchInput: { marginLeft: 8, flex: 1, color: "black" },


    waveCard: {
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        position: "absolute",
        top: 190,
        left: 20,
        right: 20,
        borderRadius: 20,
        flexDirection: "row",
        paddingTop: 80,
        justifyContent: "space-between",
        alignItems: "center",
    },


    waveImage: {
        width: "100%",
        height: 130,
        borderRadius: 20,

    },

    waveTopLeft: {
        position: "absolute",
        top: 15,
        left: 15,
    },

    waveTitle: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },

    waveLevel: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 4,
    },

    waveMenu: {
        position: "absolute",
        top: 15,
        right: 15,
    },

    setGoalButton: {
        position: "absolute",
        bottom: 10,
        left: 15,
        backgroundColor: "rgba(255, 255, 255, 0.6)",
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 15,
    },

    waveHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    setGoalText: { color: "white", fontWeight: "bold" },


    scrollContent: {
        paddingHorizontal: 15,
        paddingTop: 240,
        paddingBottom: 100,
    },
    sectionTitle: {
        marginBottom: 8,
        fontSize: 18,
        fontWeight: "bold",
        color: "#ffffffff",
        marginLeft: 18,
        textShadowColor: "#000000ff",
    },

    statusCard: {
        backgroundColor: "#0080A0",
        borderRadius: 20,
        flexDirection: "row",
        padding: 15,
        alignItems: "center",
        marginBottom: 1,
    },
    outerCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 8,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    circleText: {
        fontSize: 12,
        fontWeight: "bold",
        color: "white",
    },

    statusPercent: { fontWeight: "bold", color: "#0080A0" },
    statusDetails: { flex: 1 },
    statusLabel: { color: "white", fontSize: 12 },
    statusValue: { color: "white", fontWeight: "bold" },

    toggleContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 15,
    },
    toggleWrapper: {
        flexDirection: "row",
        justifyContent: "center",
        backgroundColor: "#0075A3",
        borderRadius: 30,
        padding: 4,
        marginHorizontal: 40,
        marginVertical: 11,
    },

    toggleButton: {
        paddingVertical: 6,
        paddingHorizontal: 20,
        borderRadius: 25,
    },

    toggleActive: {
        backgroundColor: "#B3E5FC",
    },

    toggleText: {
        color: "white",
        fontWeight: "500",
    },

    toggleTextActive: {
        color: "#004D60",
        fontWeight: "bold",
    },

    historyCard: {
        backgroundColor: "#0075A3",
        borderRadius: 25,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },

    historyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },

    historyTitle: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },

    historySubtitle: {
        color: "white",
        fontSize: 13,
        opacity: 0.8,
    },

    historyRow: {
        flexDirection: "row",
    },

    historyDayCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 20,

        paddingVertical: 10,
        flex: 1,

    },

    historyDayBubble: {
        backgroundColor: "#B3E5FC",
        borderRadius: 12,
        paddingHorizontal: 10,
        padding: 15,
        marginRight: 10,
    },

    historyDay: {
        fontWeight: "bold",
        color: "#ffffffff",
        fontSize: 15,
    },

    historyRightDetails: {
        flexDirection: "column",
        justifyContent: "center",
    },

    historyDetail: {
        color: "white",
        fontSize: 6,
        lineHeight: 12,
    },

    boldText: {
        fontWeight: "bold",
    },



    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#1c4722",
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 15,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    }



});
