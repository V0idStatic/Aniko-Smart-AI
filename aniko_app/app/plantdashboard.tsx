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

export default function Dashboard() {
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

            {/* Plant Card */}
            <View style={styles.plantCard}>
                <View style={styles.plantTextWrapper}>
                    <Text style={styles.plantName}>Cauliflower</Text>
                    <Text style={styles.plantTitle}>Plant</Text>
                    <Text style={styles.plantDetails}>Outdoor</Text>
                    <Text style={styles.plantTitle}>Height</Text>
                    <Text style={styles.plantDetails}>15-30 cm</Text>
                    <Text style={styles.plantTitle}>Temperature</Text>
                    <Text style={styles.plantDetails}>50°C</Text>

                    <TouchableOpacity style={styles.findPlantsButton}>
                        <Text style={styles.findPlantsText}>Find Plants</Text>
                    </TouchableOpacity>

                </View>

                <Image

                    source={require("../assets/cauliflower.png")}
                    style={styles.plantImage}
                />

            </View>




            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Plant Condition</Text>

                <View style={styles.conditionCard}>
                    {/* Left Side - Status + Humidity */}
                    <View style={styles.leftCondition}>
                        {/* Status Row */}
                        <View style={styles.conditionRow}>
                            <View style={[styles.outerCircle, { borderColor: "#FFD700" }]}>
                                <Text style={styles.circleText}>GOOD</Text>
                            </View>
                            <View style={styles.textGroup}>
                                <Text style={styles.conditionLabel}>Status</Text>
                                <Text style={styles.conditionSub}>Good</Text>
                                <Text style={styles.conditionLabel}>Soil</Text>
                                <Text style={styles.conditionSub}>Good</Text>
                            </View>
                        </View>

                        {/* Humidity Row */}
                        <View style={styles.conditionRow}>
                            <View style={[styles.outerCircle, { borderColor: "#4FC3F7" }]}>
                                <Text style={styles.circleText}>60%</Text>
                            </View>
                            <View style={styles.textGroup}>
                                <Text style={styles.conditionLabel}>Humidity</Text>
                                <Text style={styles.conditionSub}>60%</Text>
                                <Text style={styles.conditionLabel}>Temperature</Text>
                                <Text style={styles.conditionSub}>35°C</Text>
                            </View>
                        </View>
                    </View>


                    {/* Right Side - Growth + Nutrients */}
                    <View style={styles.rightCondition}>
                        <View style={styles.nutrientRow}>
                            <Image source={require("../assets/growth.png")} style={styles.nutrientIcon} />
                            <View style={styles.nutrientTextContainer}>
                                <Text style={styles.nutrientText}>Growth</Text>
                                <Text style={styles.nutrientValue}>12cm</Text>
                            </View>
                        </View>
                        <View style={styles.nutrientRow}>
                            <Image source={require("../assets/calcium.png")} style={styles.nutrientIcon} />
                            <View style={styles.nutrientTextContainer}>
                                <Text style={styles.nutrientText}>Calcium</Text>
                                <Text style={styles.nutrientValue}>60%</Text>
                            </View>
                        </View>
                        <View style={styles.nutrientRow}>
                            <Image source={require("../assets/calcium.png")} style={styles.nutrientIcon} />
                            <View style={styles.nutrientTextContainer}>
                                <Text style={styles.nutrientText}>Potassium</Text>
                                <Text style={styles.nutrientValue}>40%</Text>
                            </View>
                        </View>
                        <View style={styles.nutrientRow}>
                            <Image source={require("../assets/phosphorus.png")} style={styles.nutrientIcon} />
                            <View style={styles.nutrientTextContainer}>
                                <Text style={styles.nutrientText}>Phosphorus</Text>
                                <Text style={styles.nutrientValue}>40%</Text>
                            </View>
                        </View>

                    </View>
                </View>



                {/* Weather History Section */}
                <View style={styles.historyCard}>
                    <View style={styles.historyHeader}>
                        {/* Title and Legend in One Row */}
                        <View style={styles.historyHeaderRow}>
                            <Text style={styles.historyTitle}>Plant Condition History: Last Week</Text>
                            <View style={styles.legendRow}>
                                {["Very Good", "Good", "Warning", "Bad"].map((label, i) => (
                                    <View key={i} style={styles.legendItem}>
                                        <View
                                            style={[
                                                styles.legendColor,
                                                { backgroundColor: i === 0 ? "#4CAF50" : i === 1 ? "#8BC34A" : i === 2 ? "#FFC107" : "#F44336" },
                                            ]}
                                        />
                                        <Text style={styles.legendText}>{label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Days */}
                    <View style={styles.historyRow}>
                        {[
                            { day: "Mon", status: "Good", soil: "Good", humidity: "60%", temp: "32°C" },
                            { day: "Tue", status: "Cloudy", soil: "Good", temp: "31°C", humidity: "64%" },
                            { day: "Wed", status: "Sunny", soil: "Good", temp: "32°C", humidity: "55%" },
                            { day: "Thu", status: "Rainy", soil: "Good", temp: "29°C", humidity: "75%" },
                            { day: "Fri", status: "Sunny", soil: "Bad", temp: "33°C", humidity: "62%" },
                            { day: "Sat", status: "Cloudy", soil: "Bad", temp: "31°C", humidity: "58%" },
                            { day: "Sun", status: "Sunny", soil: "Good", temp: "32°C", humidity: "60%" },
                        ].map((item, i) => (
                            <View key={i} style={styles.historyDayWrapper}>

                                {/* DAY BOX */}
                                <View
                                    style={[
                                        styles.dayBox,
                                        i === 3 ? { backgroundColor: "#FFC107" } : { backgroundColor: "#4CAF50" },
                                    ]}
                                >
                                    <Text style={styles.historyDayText}>{item.day}</Text>
                                </View>

                                {/* DETAILS BELOW */}
                                <Text style={styles.historyDetails}>Status: {item.status}</Text>
                                <Text style={styles.historyDetails}>Soil: {item.soil}</Text>
                                <Text style={styles.historyDetails}>Humidity: {item.humidity}</Text>
                                <Text style={styles.historyDetails}>Temp: {item.temp}</Text>
                            </View>
                        ))}
                    </View>
                </View>



                {/* Soil Moisture section */}
                <View style={styles.waterCard}>
                    <ImageBackground
                        source={require("../assets/water.png")}
                        style={styles.waterBackground}
                        imageStyle={{ borderRadius: 20 }}
                    >
                        <Text style={styles.waterTitle}>Soil Moisture</Text>

                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={() => router.push("/waterdashboard")}
                        >
                            <Text style={styles.viewText}>View</Text>
                        </TouchableOpacity>
                    </ImageBackground>
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



    plantCard: {
        position: "absolute",
        top: 140,
        left: 20,
        right: 20,
        backgroundColor: "#1c4722",
        borderRadius: 20,
        flexDirection: "row",
        padding: 20,
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
        elevation: 8,
    },
    plantTextWrapper: { flex: 1 },
    plantName: { fontSize: 18, fontWeight: "bold", color: "white" },
    plantTitle: { fontSize: 12, color: "white", marginTop: 2, fontWeight: "bold" },
    plantDetails: { color: "white", fontSize: 10, marginTop: 2 },

    findPlantsButton: {
        marginTop: 10,
        backgroundColor: "white",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 10,
        alignSelf: "flex-start",
    },
    findPlantsText: { color: "#1c4722", fontWeight: "bold" },
    plantImage: { width: 170, height: 170, resizeMode: "contain" },


    scrollContent: {
        paddingHorizontal: 15,
        paddingTop: 180,
        paddingBottom: 100,
    },
    sectionTitle: {
        marginBottom: 8,
        fontSize: 18,
        fontWeight: "bold",
        color: "#ffffffff",
        marginLeft: 20,
        textShadowColor: "#000000ff",
    },
    conditionCard: {
        backgroundColor: "#1c4722",
        borderRadius: 25,
        padding: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,

    },

    leftCondition: {
        flex: 1,
        justifyContent: "space-between",
    },

    circleContainer: {
        alignItems: "center",
        marginBottom: 15,
    },

    conditionRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
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

    textGroup: {
        justifyContent: "center",
    },

    conditionLabel: {
        fontWeight: "bold",
        fontSize: 10,
        color: "white",
        marginRight: 4,
    },

    conditionSub: {
        fontSize: 10,
        color: "white",
    },

    rightCondition: {
        flex: 1,
        paddingLeft: 20,
        justifyContent: "space-around",
    },

    nutrientRow: {
        flexDirection: "row",
        alignItems: "center",

    },

    nutrientIcon: {
        width: 40,
        height: 40,
        marginRight: 6,
        resizeMode: "contain",
    },

    nutrientText: {
        fontSize: 8,
        color: "white",
        fontWeight: "bold",
        marginBottom: 6,
    },

    nutrientValue: {
        color: "white",
        fontWeight: "normal",
        fontSize: 8,
    },

    nutrientTextContainer: {
        flexDirection: "column",
    },




    historyCard: {
        backgroundColor: "#1c4722",
        borderRadius: 20,
        padding: 15,
    },
    historyHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    historyHeader: {
        marginBottom: 4,
    },

    legendRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginLeft: 8,

    },

    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 4,

    },

    historyTitle: {
        color: "white",
        fontWeight: "bold",
        fontSize: 8,

    },


    legendText: {
        color: "white",
        fontSize: 7,
    },
    historyRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
    },

    historyDayWrapper: {
        flexBasis: "13%",
        marginBottom: 8,
    },

    dayBox: {
        width: 45,
        height: 45,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 5,
    },

    historyDayText: {
        color: "white",
        fontWeight: "bold",
    },

    historyDetails: {
        fontSize: 5,
        color: "white",

    },



    waterCard: {
        marginTop: 10,
        backgroundColor: "#1c4722",
        borderRadius: 20,
        height: 150,
        padding: 10,
    },

    waterBackground: {
        flex: 1,
        overflow: "hidden",
        justifyContent: "space-between",
        padding: 12,
    },

    waterTitle: {
        color: "white",
        fontWeight: "bold",
        fontSize: 18,
    },

    viewButton: {
        backgroundColor: "rgba(255, 255, 255, 0.7)", 
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 10,
        alignSelf: "flex-start", 
    },

    viewText: {
        color: "#1c4722",
        fontWeight: "bold",
        fontSize: 16,
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
    },
});
