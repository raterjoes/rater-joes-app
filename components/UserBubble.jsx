import React from "react";
import { View, Text } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function UserBubble() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#e0e7ff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
      }}
    >
      <Text style={{ color: "#1e3a8a", fontWeight: "bold" }}>
        {user.email[0].toUpperCase()}
      </Text>
    </View>
  );
}
