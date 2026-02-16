import { Select, Text, Flex } from "@radix-ui/themes";
import { getCityOptions } from "@/constants/turkishCities";

interface CityFilterProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  className?: string;
}

export function CityFilter({
  selectedCity,
  onCityChange,
  className = "",
}: CityFilterProps) {
  const cityOptions = getCityOptions();

  return (
    <div className={className}>
      <Select.Root value={selectedCity} onValueChange={onCityChange}>
        <Select.Trigger placeholder="All Cities" className="w-full" />
        <Select.Content>
          <Select.Item value="all">
            <Flex align="center" gap="2">
              <Text>🌍</Text>
              <Text>All Cities</Text>
            </Flex>
          </Select.Item>
          {cityOptions.map((city) => (
            <Select.Item key={city.value} value={city.value}>
              {city.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </div>
  );
}
