import { Box, Heading } from "@radix-ui/themes";
import { SettingsPanel } from "@/components/ui/SettingsPanel";

export function Settings() {
  return (
    <Box className="py-8 px-4">
      <Heading size="7" mb="6">
        Settings
      </Heading>
      <SettingsPanel />
    </Box>
  );
}