import { Text, View } from "react-native";

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  size?: number;
}

export function Avatar({ firstName, lastName, size = 88 }: AvatarProps) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";

  return (
    <View
      className="bg-xporadia-navy items-center justify-center border-4 border-white"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        shadowColor: "#FB5406",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 18,
        elevation: 10,
      }}
    >
      <Text style={{ fontSize: size * 0.36 }} className="text-white font-bold">
        {initials}
      </Text>
    </View>
  );
}
