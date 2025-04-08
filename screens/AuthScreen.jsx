import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";

export default function AuthScreen({ navigation }) {
  const { user, login, signup, logout } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");

  const handleSubmit = async () => {
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await signup(email, password);
        const currentUser = auth.currentUser;

        await setDoc(doc(db, "users", currentUser.uid), {
          email,
          nickname: nickname || null,
          createdAt: serverTimestamp(),
        });
      }

      setEmail("");
      setPassword("");
      setNickname("");
      Alert.alert("Success", `${mode === "login" ? "Logged in" : "Account created"}`);
      navigation.reset({
        index: 0,
        routes: [{ name: "ProductList" }],
      });
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={styles.container}>
      {user ? (
        <View>
          <Text style={styles.text}>Welcome, {user.email}</Text>
          <Button title="Log Out" onPress={logout} />
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.title}>
            {mode === "login" ? "Log In" : "Sign Up"}
          </Text>

          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
          {mode === "signup" && (
            <TextInput
              placeholder="Nickname"
              style={styles.input}
              value={nickname}
              onChangeText={setNickname}
            />
          )}

          <Button
            title={mode === "login" ? "Log In" : "Create Account"}
            onPress={handleSubmit}
          />

          <TouchableOpacity
            onPress={() =>
              setMode((prev) => (prev === "login" ? "signup" : "login"))
            }
          >
            <Text style={styles.switchText}>
              {mode === "login"
                ? "New here? Create an account"
                : "Already have an account? Log in"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  form: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  switchText: {
    color: "#1e40af",
    marginTop: 10,
    textAlign: "center",
  },
  text: {
    fontSize: 18,
    marginBottom: 10,
  },
});
