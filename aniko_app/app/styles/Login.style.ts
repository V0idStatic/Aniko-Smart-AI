import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D9C6A5",
    alignItems: "center",
    justifyContent: "center",
  },
  arc: {
    marginTop: 100,
    width: "100%",
    height: 600,
    backgroundColor: "#EDE1CF",
    borderTopLeftRadius: 210,
    borderTopRightRadius: 210,
    alignItems: "center",
    paddingTop: 30,
  },
  logo: {
    height: 80,
    width: 80,
    resizeMode: "contain",
    marginBottom: 15,
    marginTop: 20,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#4D2D18",
    marginBottom: 30,
    fontFamily: "Zalando",
  },
  inputGroup: {
    width: "90%",
    marginBottom: 15,
  },
  label: {
    color: "#4C4B2C",
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    paddingHorizontal: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#756C65",
    color: "black",
    backgroundColor: "#f2e8d5",
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2e8d5",
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#756C65",
    width: "100%",
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 12,
    borderRadius: 25,
  },
  eyeIcon: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  loginButton: {
    backgroundColor: "#4C6444",
    width: "90%",
    padding: 13,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  signupText: {
    color: "#6A7D4F",
    marginBottom: 20,
    textAlign:"left"
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    width: "85%",
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#756C65",
  },
  orText: {
    marginHorizontal: 10,
    color: "#756C65",
    fontWeight: "500",
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    textAlign: "center",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#5D3B2F",
    borderWidth: 1,
    borderRadius: 25,
    padding: 10,
    width: "90%",
    justifyContent: "center",
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleText: {
    color: "#5D3B2F",
    fontWeight: "500",
  },
  statusBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "center",
    minWidth: 200,
    justifyContent: "center",
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 13,
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
