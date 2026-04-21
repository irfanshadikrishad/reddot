// app/index.tsx
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0D0D0D",
      }}
    >
      <ActivityIndicator color="#C0392B" size="large" />
    </View>
  );
}
