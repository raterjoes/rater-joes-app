import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function UserMenuScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [nickname, setNickname] = useState(null);

  useEffect(() => {
    const fetchNickname = async () => {
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setNickname(docSnap.data().nickname);
        }
      }
    };
    fetchNickname();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.initial}>
        {user?.email?.charAt(0).toUpperCase() || "?"}
      </Text>

      <Text style={styles.greeting}>
        {nickname ? `Hi, ${nickname}!` : "Hi there!"}
      </Text>

      <Text style={styles.email}>{user?.email}</Text>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.cancel}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 80,
    alignItems: "center",
    flex: 1,
    backgroundColor: "#fff",
  },
  initial: {
    backgroundColor: "#fbbf24",
    width: 64,
    height: 64,
    borderRadius: 32,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 28,
    textAlign: "center",
    lineHeight: 64,
    marginBottom: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    marginBottom: 32,
    color: "#4b5563",
  },
  logoutButton: {
    backgroundColor: "#b91c1c",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
    marginBottom: 16,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancel: {
    color: "#1e40af",
    textDecorationLine: "underline",
  },
});
