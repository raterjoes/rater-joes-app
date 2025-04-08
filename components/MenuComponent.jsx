import React, { useState } from "react";
import { Menu, IconButton } from "react-native-paper";

export default function MenuComponent({ navigation }) {
  const [visible, setVisible] = useState(false);

  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <IconButton
          icon="menu"
          size={24}
          onPress={() => setVisible(true)}
        />
      }
    >
      <Menu.Item
        onPress={() => {
          setVisible(false);
          navigation.navigate("Contact");
        }}
        title="Contact"
      />
    </Menu>
  );
}
