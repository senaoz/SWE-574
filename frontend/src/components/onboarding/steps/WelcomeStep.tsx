import { Flex, Heading, Text } from "@radix-ui/themes";
import { HeartHandshake, Search, Clock } from "lucide-react";

const features = [
  {
    icon: HeartHandshake,
    title: "Offer your skills",
    description: "Share what you're good at with your community.",
    color: "lime",
  },
  {
    icon: Search,
    title: "Request help",
    description: "Find people nearby who can lend a hand.",
    color: "blue",
  },
  {
    icon: Clock,
    title: "Earn time credits",
    description: "Every hour you give earns you an hour back.",
    color: "amber",
  },
];

export function WelcomeStep() {
  return (
    <Flex direction="column" align="center" gap="5" className="py-2">
      <Flex direction="column" align="center" gap="2">
        <Text size="6" className="leading-none">
          🐝
        </Text>
        <Heading size="6" weight="bold" align="center">
          Welcome to The Hive!
        </Heading>
        <Text size="2" color="gray" align="center" className="max-w-sm">
          A community where people exchange skills and time. No money needed —
          just your time and talents.
        </Text>
      </Flex>

      <Flex direction="column" gap="3" className="w-full">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <Flex
              key={f.title}
              align="center"
              gap="3"
              className="rounded-xl border border-gray-4 bg-gray-2 p-3"
            >
              <Flex
                align="center"
                justify="center"
                className="h-10 w-10 shrink-0 rounded-lg"
                style={{ backgroundColor: `var(--${f.color}-3)` }}
              >
                <Icon
                  size={20}
                  style={{ color: `var(--${f.color}-11)` }}
                  strokeWidth={2}
                />
              </Flex>
              <Flex direction="column" gap="0">
                <Text size="2" weight="bold">
                  {f.title}
                </Text>
                <Text size="1" color="gray">
                  {f.description}
                </Text>
              </Flex>
            </Flex>
          );
        })}
      </Flex>

      <Text size="1" color="gray" align="center">
        Let's set up your profile so the community can get to know you.
      </Text>
    </Flex>
  );
}
