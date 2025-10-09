import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

// Responsive multipliers
const wp = (percentage: number) => (width * percentage) / 100;
const hp = (percentage: number) => (height * percentage) / 100;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9C6A5",
    alignItems: "center",
    justifyContent: "flex-start",
    position: "relative",
  },

  arc: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: hp(70), 
    backgroundColor: "#EDE1CF",
    borderTopLeftRadius: wp(60), 
    borderTopRightRadius: wp(60),
    alignItems: "center",
    paddingTop: hp(4),
  },

  logo: {
    height: hp(10),
    width: hp(10),
    resizeMode: "contain",
    marginBottom: hp(2),
    marginTop: hp(2),
  },

  title: {
    fontWeight: "bold",
    fontSize: wp(4.5),
    color: "#4D2D18",
    marginBottom: hp(4),
    fontFamily: "Zalando",
    textAlign: "center",
  },

  inputGroup: {
    width: "90%",
    marginBottom: hp(2),
  },

  label: {
    color: "#4C4B2C",
    fontWeight: "bold",
    marginBottom: hp(0.6),
    fontSize: wp(3.8),
  },

  input: {
    paddingHorizontal: wp(4),
    borderRadius: wp(6),
    borderWidth: 1,
    borderColor: "#756C65",
    color: "black",
    backgroundColor: "#f2e8d5",
    fontSize: wp(4),
    paddingVertical: hp(1.5),
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2e8d5",
    borderRadius: wp(6),
    paddingHorizontal: wp(4),
    borderWidth: 1,
    borderColor: "#756C65",
    width: "100%",
  },

  passwordInput: {
    flex: 1,
    fontSize: wp(4),
    color: "#333",
    paddingVertical: hp(1.5),
  },

  eyeIcon: {
    padding: wp(2),
    justifyContent: "center",
    alignItems: "center",
    marginLeft: wp(1),
  },

  loginButton: {
    backgroundColor: "#4C6444",
    width: "90%",
    paddingVertical: hp(1.8),
    borderRadius: wp(6),
    alignItems: "center",
    marginTop: hp(2),
    marginBottom: hp(1.2),
  },

  disabledButton: {
    opacity: 0.5,
  },

  loginText: {
    color: "#fff",
    fontSize: wp(4),
    fontWeight: "600",
  },

  signupText: {
    color: "#6A7D4F",
    marginBottom: hp(2),
    textAlign: "center",
    fontSize: wp(3.6),
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(2.5),
    width: "85%",
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#756C65",
  },

  orText: {
    marginHorizontal: wp(2),
    color: "#756C65",
    fontWeight: "500",
    fontSize: wp(3.6),
  },

  errorText: {
    color: "red",
    marginBottom: hp(1.5),
    textAlign: "center",
    fontSize: wp(3.6),
  },

  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#5D3B2F",
    borderWidth: 1,
    borderRadius: wp(6),
    paddingVertical: hp(1.4),
    width: "90%",
    justifyContent: "center",
  },

  googleIcon: {
    width: wp(5),
    height: wp(5),
    marginRight: wp(2),
  },

  googleText: {
    color: "#5D3B2F",
    fontWeight: "500",
    fontSize: wp(3.8),
  },

  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(4),
    borderRadius: wp(6),
    alignSelf: "center",
    minWidth: wp(50),
    justifyContent: "center",
  },

  statusDot: {
    width: wp(2.5),
    height: wp(2.5),
    borderRadius: wp(1.2),
    marginRight: wp(2),
  },

  statusText: {
    color: "#fff",
    fontSize: wp(3.4),
    fontWeight: "600",
  },

  // Color Variants
  statusConnecting: {
    backgroundColor: "#FFA500",
  },
  statusConnected: {
    backgroundColor: "#4CAF50",
  },
  statusOffline: {
    backgroundColor: "#F44336",
  },
  dotConnecting: {
    backgroundColor: "#FFD700",
  },
  dotConnected: {
    backgroundColor: "#8BC34A",
  },
  dotOffline: {
    backgroundColor: "#EF5350",
  },
});

export default styles;
