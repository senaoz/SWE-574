import { Flex, Heading, Text } from "@radix-ui/themes";
import { InterestChip } from "@/components/ui/InterestChip";
import { CheckCircle } from "lucide-react";

interface CompleteStepProps {
  interests: string[];
}

export function CompleteStep({ interests }: CompleteStepProps) {
  return (
    <Flex direction="column" align="center" gap="5" className="py-4 m-auto">
      <Flex
        align="center"
        justify="center"
        className="h-16 w-16 rounded-full"
        style={{ backgroundColor: "var(--lime-3)" }}
      >
        <CheckCircle
          size={32}
          style={{ color: "var(--lime-11)" }}
          strokeWidth={2}
        />
      </Flex>

      <Flex direction="column" align="center" gap="2">
        <Heading size="6" weight="bold" align="center">
          You're all set!
        </Heading>
        <Text size="2" color="gray" align="center" className="max-w-sm">
          Your profile is ready. Start exploring services or offer your own
          skills to the community.
        </Text>
      </Flex>

      {interests.length > 0 && (
        <Flex direction="column" align="center" gap="2">
          <Text size="1" color="gray">
            Your interests
          </Text>
          <Flex wrap="wrap" gap="2" justify="center">
            {interests.map((interest) => (
              <InterestChip
                key={interest}
                name={interest}
                selected
                size="sm"
                showIcon
              />
            ))}
          </Flex>
        </Flex>
      )}

      <Text size="1" color="gray" align="center">
        You can always update your profile and add your location from the
        profile page.
      </Text>
    </Flex>
  );
}
