import { servicesApi, forumApi } from "@/services/api";
import {
  Section,
  Button,
  Card,
  Text,
  Heading,
  Badge,
  Box,
  Flex,
  Grid,
  Container,
} from "@radix-ui/themes";
import {
  ClockIcon,
  GlobeIcon,
  CheckIcon,
  HeartIcon,
  HeartFilledIcon,
} from "@radix-ui/react-icons";
import { MessageCircleIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ServiceMap } from "@/components/map/ServiceMap";
import { useState, useEffect } from "react";
import { ForumEvent, Service } from "@/types";
import ReactMarkdown from "react-markdown";
import { useSavedServiceIds } from "@/hooks/useSavedServiceIds";

// @ts-ignore
import handshakeIcon from "../assets/handshakeIcon.png";

export function Home() {
  const navigate = useNavigate();
  const [recentOffers, setRecentOffers] = useState<Service[]>([]);
  const [recentNeeds, setRecentNeeds] = useState<Service[]>([]);
  const [recentEvents, setRecentEvents] = useState<ForumEvent[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    currentUserId,
    isSaved: isServiceSaved,
    saveService,
    unsaveService,
    isSavingService,
    isUnsavingService,
  } = useSavedServiceIds();

  const handleSavedBadgeClick =
    (serviceId: string) =>
    async (event: React.MouseEvent | React.KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (
        !currentUserId ||
        isSavingService(serviceId) ||
        isUnsavingService(serviceId)
      ) {
        return;
      }

      try {
        if (isServiceSaved(serviceId)) {
          await unsaveService(serviceId);
        } else {
          await saveService(serviceId);
        }
      } catch (error) {
        console.error("Error toggling saved service:", error);
      }
    };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const [offersResponse, needsResponse, eventsResponse] =
          await Promise.all([
            servicesApi.getServices({
              service_type: "offer",
              status: "active",
              limit: 4,
            }),
            servicesApi.getServices({
              service_type: "need",
              status: "active",
              limit: 4,
            }),
            forumApi.getEvents({
              limit: 4,
              has_location: true,
            }),
          ]);

        setRecentOffers(offersResponse.data.services || []);
        setRecentNeeds(needsResponse.data.services || []);
        setRecentEvents(eventsResponse.data.events.slice(0, 4) || []);
        setAllServices(
          (offersResponse.data.services || []).concat(
            needsResponse.data.services || [],
          ),
        );
      } catch (error) {
        console.error("Error fetching services:", error);
        setRecentOffers([]);
        setRecentNeeds([]);
        setAllServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="">
      {/* Hero Section */}
      <Section className="mx-auto max-w-4xl grid text-center">
        <Heading size="9" className="mb-6 ">
          A Neighborhood TimeBank for Sharing Skills
        </Heading>
        <Text size="5" className=" mb-8 max-w-2xl mx-auto">
          Offer help, ask for help, and get to know the people around you. In
          our TimeBank, one hour you give is one hour you can receive.
        </Text>
        <Button
          variant="solid"
          size="3"
          className="w-fit mx-auto"
          onClick={() => navigate("/dashboard")}
        >
          See What's Happening
        </Button>
      </Section>

      <HowRecommendationsSection />
      <HowSearchWorksSection />

      {/* Community Values Section */}
      <Section className="py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <Card className="p-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤝</span>
              </div>
              <Heading size="5" className="mb-4">
                Community-First
              </Heading>
              <Text size="4">
                Neighbors supporting neighbors—built on trust, care, and shared
                values, not profit.
              </Text>
            </Card>

            <Card className="p-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⚖️</span>
              </div>
              <Heading size="5" className="mb-4">
                Equal Value
              </Heading>
              <Text size="4">
                From tutoring to errands to listening—everyone's time counts the
                same here.
              </Text>
            </Card>
          </div>
        </div>
      </Section>

      <HighlightsSection />

      {/* What Can You Share Section */}
      <Section>
        <div className="text-center mb-12">
          <Heading size="6" className="mb-4">
            What Can You Offer?
          </Heading>
          <Text size="4" className="max-w-2xl mx-auto">
            Big or small, practical or personal—every offer helps someone.
          </Text>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">💻</div>
            <Text className="font-medium">Teach Programming</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🥘</div>
            <Text className="font-medium">Share Recipes</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🛒</div>
            <Text className="font-medium">Run Errands</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">📖</div>
            <Text className="font-medium">Read Stories</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🌟</div>
            <Text className="font-medium">Share Memories</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🌱</div>
            <Text className="font-medium">Garden Together</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🔧</div>
            <Text className="font-medium">Fix Things</Text>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-3">🐕</div>
            <Text className="font-medium">Pet Sitting</Text>
          </Card>
        </div>
      </Section>

      {/* Ready to Join Section */}
      <Section className="py-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <Heading size="6" className="mb-4">
            Ready to Meet Your Community?
          </Heading>
          <Text size="4">
            Start by browsing what neighbors need and offer, then post a service
            of your own when you're ready.
          </Text>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="solid"
              size="3"
              onClick={() => navigate("/dashboard")}
            >
              Join In
            </Button>
            <Button
              variant="outline"
              size="3"
              onClick={() => navigate("/dashboard")}
            >
              Browse Offers & Needs
            </Button>
          </div>
        </div>
      </Section>

      <ServiceMap
        services={allServices}
        events={recentEvents}
        height="400px"
        sticky={false}
      />

      {/* How It Works Section */}
      <Section>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircleIcon className="w-8 h-8" />
            </div>
            <Heading size="4" className="mb-3 ">
              Offer & Request
            </Heading>
            <Text className="">
              Post what you can offer or what you need. A clear ask or a small
              offer is often all it takes to spark connection.
            </Text>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClockIcon className="w-8 h-8" />
            </div>
            <Heading size="4" className="mb-3 ">
              Exchange Time
            </Heading>
            <Text className="">
              Pair up with another member and complete the exchange. One hour
              given becomes one TimeBank credit you can use later.
            </Text>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <GlobeIcon className="w-8 h-8" />
            </div>
            <Heading size="4" className="mb-3 ">
              Build Community
            </Heading>
            <Text className="">
              Spend credits when you need support, and keep the circle going in
              the forums. We grow stronger together.
            </Text>
          </Card>
        </div>
      </Section>

      {/* Live Service Map Preview */}
      <Section>
        <div className="flex items-center justify-between mb-8">
          <Heading size="6" className="">
            Community Activity
          </Heading>
          <Badge color="green" variant="soft">
            Fresh updates
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6">
            <Heading size="4" className="mb-4">
              Recent Offers
            </Heading>
            <div className="space-y-3">
              {loading || !recentOffers ? (
                <Text>Loading recent offers...</Text>
              ) : (
                recentOffers.map((service) => (
                  <div
                    onClick={() => navigate(`/service/${service._id}`)}
                    key={service._id}
                    className="flex items-center justify-between p-3 rounded-xl hover:cursor-pointer hover:border transition-all duration-200"
                  >
                    <div className="flex flex-col gap-2">
                      <Flex align="center" gap="2" wrap="wrap">
                        <Text className="font-medium">{service.title}</Text>
                        {currentUserId && (
                          <Badge
                            color={
                              isServiceSaved(service) ? "red" : "gray"
                            }
                            variant="soft"
                            className={`inline-flex items-center gap-1 ${
                              !isSavingService(service._id) &&
                              !isUnsavingService(service._id)
                                ? "cursor-pointer"
                                : ""
                            }`}
                            onClick={handleSavedBadgeClick(service._id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                void handleSavedBadgeClick(service._id)(event);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            title={
                              isServiceSaved(service)
                                ? "Remove from saved items"
                                : "Save this item"
                            }
                            aria-disabled={
                              isSavingService(service._id) ||
                              isUnsavingService(service._id)
                            }
                          >
                            {isServiceSaved(service) ? (
                              <HeartFilledIcon className="h-3 w-3" />
                            ) : (
                              <HeartIcon className="h-3 w-3" />
                            )}
                            {isSavingService(service._id)
                              ? "Saving..."
                              : isUnsavingService(service._id)
                                ? "Removing..."
                                : isServiceSaved(service)
                                  ? "Saved"
                                  : "Save"}
                          </Badge>
                        )}
                      </Flex>
                      <div className="prose-content card-description">
                        <ReactMarkdown
                          components={{
                            a: ({ node: _node, ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                            h1: ({ node: _node, ...props }) => (
                              <h1 className="text-base font-bold" {...props} />
                            ),
                            h2: ({ node: _node, ...props }) => (
                              <h2 className="text-sm font-bold" {...props} />
                            ),
                            h3: ({ node: _node, ...props }) => (
                              <h3 className="text-xs font-bold" {...props} />
                            ),
                          }}
                        >
                          {service.description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-6">
            <Heading size="4" className="mb-4">
              Recent Needs
            </Heading>
            <div className="space-y-3">
              {!loading && !recentNeeds ? (
                <Text>Loading recent needs...</Text>
              ) : (
                recentNeeds.map((service) => (
                  <div
                    onClick={() => navigate(`/service/${service._id}`)}
                    key={service._id}
                    className="flex items-center justify-between p-3 rounded-xl hover:cursor-pointer hover:border transition-all duration-200"
                  >
                    <div className="flex flex-col gap-2">
                      <Flex align="center" gap="2" wrap="wrap">
                        <Text className="font-medium">{service.title}</Text>
                        {currentUserId && (
                          <Badge
                            color={
                              isServiceSaved(service) ? "red" : "gray"
                            }
                            variant="soft"
                            className={`inline-flex items-center gap-1 ${
                              !isSavingService(service._id) &&
                              !isUnsavingService(service._id)
                                ? "cursor-pointer"
                                : ""
                            }`}
                            onClick={handleSavedBadgeClick(service._id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                void handleSavedBadgeClick(service._id)(event);
                              }
                            }}
                            role="button"
                            tabIndex={0}
                            title={
                              isServiceSaved(service)
                                ? "Remove from saved items"
                                : "Save this item"
                            }
                            aria-disabled={
                              isSavingService(service._id) ||
                              isUnsavingService(service._id)
                            }
                          >
                            {isServiceSaved(service) ? (
                              <HeartFilledIcon className="h-3 w-3" />
                            ) : (
                              <HeartIcon className="h-3 w-3" />
                            )}
                            {isSavingService(service._id)
                              ? "Saving..."
                              : isUnsavingService(service._id)
                                ? "Removing..."
                                : isServiceSaved(service)
                                  ? "Saved"
                                  : "Save"}
                          </Badge>
                        )}
                      </Flex>
                      <div className="prose-content card-description">
                        <ReactMarkdown
                          components={{
                            a: ({ node: _node, ...props }) => (
                              <a
                                {...props}
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                          }}
                        >
                          {service.description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </Section>

      {/* Community Forums Spotlight */}
      <Section className="mb-16">
        <div className="flex items-center mb-8">
          <MessageCircleIcon className="w-6 h-6 mr-3" />
          <Heading size="6" className="">
            Conversations & Connections
          </Heading>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-3">
              <Heading size="3" className="">
                New Member Welcome
              </Heading>
              <Badge color="blue" variant="soft">
                Active
              </Badge>
            </div>
            <Text className=" mb-4">
              "Just joined and already met someone nearby who offered to help.
              Excited to give back, too!"
            </Text>
            <div className="flex items-center text-sm">
              <Text>Sarah M. • 2 hours ago • 12 replies</Text>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-3">
              <Heading size="3" className="">
                Skill Sharing Success
              </Heading>
              <Badge color="green" variant="soft">
                Popular
              </Badge>
            </div>
            <Text className=" mb-4">
              "Just completed my first exchange! We swapped gardening help for a
              little coding practice—felt good on both sides."
            </Text>
            <div className="flex items-center text-sm">
              <Text>Alex K. • 5 hours ago • 8 replies</Text>
            </div>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="3" onClick={() => navigate("/forum")}>
            Join the Conversation
          </Button>
        </div>
      </Section>
    </div>
  );
}

const searchFeatures = [
  {
    icon: "🔤",
    title: "Tokenized Matching",
    description:
      "Your query is split into tokens and matched across service titles, descriptions, categories, WikiData tags, and location — all at once.",
  },
  {
    icon: "🏷️",
    title: "Tag-Aware Search",
    description:
      "Services are tagged with WikiData concepts. Search matches both tag labels and entity IDs, so related terms surface the right results.",
  },
  {
    icon: "🔬",
    title: "Faceted Filters",
    description:
      "Narrow results by service type, category, city, availability (today / this week / recurring), or remote vs. in-person — all combinable.",
  },
  {
    icon: "🗄️",
    title: "MongoDB-Backed",
    description:
      "All services are stored in MongoDB and queried in real time — new listings are immediately searchable the moment they're posted.",
  },
];

const HowSearchWorksSection = () => {
  return (
    <Box style={{ background: "var(--gray-a2)" }}>
      <Section size="3">
        <Container size="4">
          <Flex direction="column" align="center" gap="3" mb="8">
            <Badge color="indigo" variant="soft" radius="full">
              How Search Works
            </Badge>
            <Heading size="7" align="center">
              Precision Search, Engineered for Depth
            </Heading>
            <Text size="4" color="gray" align="center" style={{ maxWidth: 560 }}>
              Type anything and we search across every field — title, description,
              category, WikiData tags, and address — returning only active, relevant
              listings instantly.
            </Text>
          </Flex>

          <Grid columns={{ initial: "1", sm: "2", lg: "4" }} gap="4" mb="9">
            {searchFeatures.map((f) => (
              <Card key={f.title} variant="surface">
                <Flex direction="column" gap="2" p="2">
                  <Text size="6">{f.icon}</Text>
                  <Heading size="3">{f.title}</Heading>
                  <Text size="2" color="gray">
                    {f.description}
                  </Text>
                </Flex>
              </Card>
            ))}
          </Grid>

          <SearchPipelineDiagram />
        </Container>
      </Section>
    </Box>
  );
};

const SearchPipelineDiagram = () => {
  const steps = [
    { label: "Query", sub: "User types", color: "var(--indigo-9)" },
    { label: "Tokenize", sub: "Split tokens", color: "var(--violet-9)" },
    { label: "Match", sub: "6 fields", color: "var(--purple-9)" },
    { label: "Filter", sub: "Type/tags/city", color: "var(--plum-9)" },
    { label: "Results", sub: "Active listings", color: "var(--lime-9)" },
  ];

  return (
    <Box style={{ overflowX: "auto" }}>
      <Flex
        align="center"
        justify="center"
        py="6"
        style={{ minWidth: "max-content" }}
      >
        {steps.map((step, i) => (
          <Flex key={step.label} align="center">
            <Flex
              direction="column"
              align="center"
              style={{
                animation: "fadeSlideIn 0.5s ease both",
                animationDelay: `${i * 0.12}s`,
              }}
            >
              <Box
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: "var(--radius-full)",
                  background: step.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "var(--shadow-3)",
                }}
              >
                <Text size="2" weight="bold" style={{ color: "white" }}>
                  {step.label}
                </Text>
              </Box>
              <Text size="1" color="gray" mt="2" align="center">
                {step.sub}
              </Text>
            </Flex>

            {i < steps.length - 1 && (
              <Box
                style={{
                  animation: "fadeSlideIn 0.5s ease both",
                  animationDelay: `${i * 0.12 + 0.06}s`,
                  marginBottom: 22,
                }}
              >
                <Box
                  style={{
                    width: 60,
                    height: 2,
                    background: `linear-gradient(90deg, ${step.color}, ${steps[i + 1].color})`,
                    position: "relative",
                  }}
                >
                </Box>
              </Box>
            )}
          </Flex>
        ))}
      </Flex>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
};

const recommendationPrinciples = [
  {
    title: "Tag & Category Similarity",
    description:
      "Tags (45%) and category (20%) are the strongest signals. Services that share WikiData tags or the same category with what you care about rank highest.",
  },
  {
    title: "Keyword Overlap",
    description:
      "Titles, descriptions, and categories are tokenized and compared using Jaccard similarity — services with more shared vocabulary score higher.",
  },
  {
    title: "Proximity & Recency",
    description:
      "Geographic distance (15%) and how recently a service was posted (5%) are factored in, so local and fresh listings naturally surface.",
  },
  {
    title: "Your Activity Profile",
    description:
      "Your saved services and completed exchanges build an interest profile. When active, it shifts the final score by up to 15%, pulling results closer to your history.",
  },
];

const HowRecommendationsSection = () => {
  return (
    <Section size="3">
      <Container size="4">
        <Grid columns={{ initial: "1", lg: "2" }} gap="9" align="center">
          <Flex direction="column" gap="5">
            <Box>
              <Badge color="lime" variant="soft" radius="full" mb="3">
                How Recommendations Work
              </Badge>
              <Heading size="7" mb="3">
                Discovered Because It Was Made for You
              </Heading>
              <Text size="4" color="gray" as="p">
                Each recommendation is a weighted score built from tag overlap,
                category match, keyword similarity, proximity, and your own past
                activity — no black box, just transparent signals.
              </Text>
            </Box>

            <Flex direction="column" gap="4">
              {recommendationPrinciples.map((p, i) => (
                <Card key={p.title} variant="surface">
                  <Flex gap="4" p="2" align="start">
                    <Box
                      flexShrink="0"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "var(--radius-full)",
                        background: "var(--accent-indicator)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: 2,
                      }}
                    >
                      <Text size="2" weight="bold">
                        {i + 1}
                      </Text>
                    </Box>
                    <Flex direction="column" gap="1">
                      <Heading size="3">{p.title}</Heading>
                      <Text size="2" color="gray">
                        {p.description}
                      </Text>
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Flex>

          <Flex align="center" justify="center">
            <RecommendationGraph />
          </Flex>
        </Grid>
      </Container>
    </Section>
  );
};

const RecommendationGraph = () => {
  const centerX = 200;
  const centerY = 200;
  const radius = 120;
  const nodes = [
    { id: "you", label: "You", x: centerX, y: centerY, r: 28, primary: true },
    {
      id: "n1",
      label: "Similar\nUser",
      x: centerX + radius * Math.cos((-90 * Math.PI) / 180),
      y: centerY + radius * Math.sin((-90 * Math.PI) / 180),
      r: 20,
      primary: false,
    },
    {
      id: "n2",
      label: "Similar\nUser",
      x: centerX + radius * Math.cos((-30 * Math.PI) / 180),
      y: centerY + radius * Math.sin((-30 * Math.PI) / 180),
      r: 20,
      primary: false,
    },
    {
      id: "n3",
      label: "Service A",
      x: centerX + radius * Math.cos((30 * Math.PI) / 180),
      y: centerY + radius * Math.sin((30 * Math.PI) / 180),
      r: 18,
      primary: false,
      isService: true,
    },
    {
      id: "n4",
      label: "Service B",
      x: centerX + radius * Math.cos((90 * Math.PI) / 180),
      y: centerY + radius * Math.sin((90 * Math.PI) / 180),
      r: 18,
      primary: false,
      isService: true,
    },
    {
      id: "n5",
      label: "Tag:\nCoding",
      x: centerX + radius * Math.cos((150 * Math.PI) / 180),
      y: centerY + radius * Math.sin((150 * Math.PI) / 180),
      r: 16,
      primary: false,
      isTag: true,
    },
    {
      id: "n6",
      label: "Tag:\nDesign",
      x: centerX + radius * Math.cos((210 * Math.PI) / 180),
      y: centerY + radius * Math.sin((210 * Math.PI) / 180),
      r: 16,
      primary: false,
      isTag: true,
    },
  ];
  const edges = [
    ["you", "n1"],
    ["you", "n2"],
    ["you", "n3"],
    ["you", "n4"],
    ["you", "n5"],
    ["you", "n6"],
    ["n1", "n3"],
    ["n2", "n4"],
    ["n5", "n3"],
    ["n6", "n4"],
  ];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <>
      <svg
          viewBox="0 0 400 400"
          width={500}
          height={500}
          style={{ display: "block" }}
      >
        <defs>
          <radialGradient id="youGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--indigo-9)" />
            <stop offset="100%" stopColor="var(--violet-9)" />
          </radialGradient>
        </defs>

        {edges.map(([a, b], i) => {
          const na = byId[a];
          const nb = byId[b];
          return (
              <line
                  key={i}
                  x1={na.x}
                  y1={na.y}
                  x2={nb.x}
                  y2={nb.y}
                  stroke="var(--indigo-a6)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  style={{
                    animation: `dash 3s linear infinite`,
                    animationDelay: `${i * 0.25}s`,
                  }}
              />
          );
        })}

        {nodes.map((n) => (
            <g key={n.id}>
              <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r + 4}
                  fill={
                    n.primary
                        ? "var(--indigo-a3)"
                        : (n as { isService?: boolean }).isService
                            ? "var(--lime-a3)"
                            : (n as { isTag?: boolean }).isTag
                                ? "var(--violet-a3)"
                                : "var(--gray-a3)"
                  }
              />
              <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill={
                    n.primary
                        ? "url(#youGrad)"
                        : (n as { isService?: boolean }).isService
                            ? "var(--lime-9)"
                            : (n as { isTag?: boolean }).isTag
                                ? "var(--violet-9)"
                                : "var(--gray-8)"
                  }
              />
              {n.label.split("\n").map((line, li, arr) => (
                  <text
                      key={li}
                      x={n.x}
                      y={n.y + (li - (arr.length - 1) / 2) * 11}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={n.primary ? 11 : 8}
                      fontWeight={n.primary ? 700 : 500}
                  >
                    {line}
                  </text>
              ))}
            </g>
        ))}

        <text
            x={centerX}
            y={380}
            textAnchor="middle"
            fontSize={10}
            fill="var(--gray-9)"
        >
          Simplified recommendation graph
        </text>
      </svg>
      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -28; }
        }
      `}</style>
    </>
  );
};

const HighlightsSection = () => {
  return (
    <Section
      position="relative"
      overflow="hidden"
      size={{ initial: "2", sm: "4" }}
      mb={{ md: "9" }}
      height={"auto"}
    >
      <Container mx={{ initial: "5", xs: "6", sm: "7", md: "9" }}>
        <Box position="relative">
          <Box position="relative" mb="4" style={{ pointerEvents: "none" }}>
            <Box
              position="absolute"
              height="100%"
              top="50%"
              left="50%"
              style={{ transform: "translate(-50%, -50%)" }}
            >
              <Circle
                size={180}
                angle={-45}
                color1="var(--lime-a4)"
                color2="var(--indigo-a6)"
              />
              <Circle
                size={300}
                angle={20}
                color1="var(--lime-a3)"
                color2="var(--indigo-a5)"
              />
              <Circle
                size={420}
                angle={35}
                color1="var(--lime-a2)"
                color2="var(--indigo-a4)"
              />
              <Circle
                size={540}
                angle={-50}
                color1="var(--lime-a2)"
                color2="var(--indigo-a3)"
              />
              {[
                660, 780, 900, 1020, 1140, 1260, 1380, 1500, 1620, 1740, 1860,
                1980, 2100,
              ].map((size, i) => (
                <Circle
                  key={i}
                  size={size + i * i * 5}
                  angle={-45 + i * 15}
                  color1="var(--lime-a2)"
                  color2="var(--indigo-a3)"
                  opacity={Math.max(0, 1 - i * 0.05)}
                />
              ))}
            </Box>
            <Flex
              align="center"
              justify="center"
              position="relative"
              style={{
                height: "800px",
              }}
            >
              <img
                src={handshakeIcon}
                alt="Handshake"
                className="w-full h-20 object-contain"
              />
            </Flex>
          </Box>

          <Grid
            gap={{ initial: "5", sm: "7" }}
            flow={{ initial: "column", sm: "row" }}
            justify={{ initial: "start", sm: "center" }}
            columns={{ initial: "none", sm: "auto auto" }}
            style={{ gridAutoColumns: "max-content" }}
          >
            <Box
              className="flex flex-col justify-center items-center text-center"
              position={{ lg: "absolute" }}
              style={{
                width: "var(--component-highlights-item-width)",
                maxWidth: 300,
                top: "-1%",
                left: "27%",
              }}
            >
              <Flex gap="2" align="start" mb="1">
                <Checkmark />
                <Heading as="h3" size="3">
                  Fairness
                </Heading>
              </Flex>
              <Text as="p" color="gray" size="3">
                Everyone’s time matters here, no matter how big or small the
                help is.
              </Text>
            </Box>

            <Box
              className="flex flex-col justify-center items-center text-center"
              position={{ lg: "absolute" }}
              style={{
                width: "var(--component-highlights-item-width)",
                maxWidth: 300,
                top: "14%",
                left: "60%",
              }}
            >
              <Flex gap="2" align="start" mb="1">
                <Checkmark />
                <Heading as="h3" size="3">
                  Inclusivity
                </Heading>
              </Flex>
              <Text as="p" color="gray" size="3">
                There’s a place for everyone — we all have something valuable to
                share.
              </Text>
            </Box>

            <Box
              className="flex flex-col justify-center items-center text-center"
              position={{ lg: "absolute" }}
              style={{
                width: "var(--component-highlights-item-width)",
                maxWidth: 300,
                top: "40%",
                left: "74%",
              }}
            >
              <Flex gap="2" align="start" mb="1">
                <Checkmark />
                <Heading as="h3" size="3">
                  Everyday Skills
                </Heading>
              </Flex>
              <Text as="p" color="gray" size="3">
                Whether it’s fixing, teaching, or simply listening, it all
                counts.
              </Text>
            </Box>

            <Box
              className="flex flex-col justify-center items-center text-center"
              position={{ lg: "absolute" }}
              style={{
                width: "var(--component-highlights-item-width)",
                maxWidth: 320,
                top: "67%",
                left: "69%",
              }}
            >
              <Flex gap="2" align="start" mb="1">
                <Checkmark />
                <Heading as="h3" size="3">
                  Community-First
                </Heading>
              </Flex>
              <Text as="p" color="gray" size="3">
                Neighbors supporting neighbors—built on trust, care, and shared
                values.
              </Text>
            </Box>

            <Box
              className="flex flex-col justify-center items-center text-center"
              position={{ lg: "absolute" }}
              style={{
                width: "var(--component-highlights-item-width)",
                maxWidth: 300,
                top: "94%",
                left: "39%",
              }}
            >
              <Flex gap="2" align="start" mb="1" mr="-1">
                <Checkmark />
                <Heading as="h3" size="3">
                  Trust
                </Heading>
              </Flex>
              <Text as="p" color="gray" size="3">
                We show up for each other with honesty, care, and respect.
              </Text>
            </Box>

            <Box
              className="flex flex-col justify-center items-center text-center"
              position={{ lg: "absolute" }}
              style={{
                width: "var(--component-highlights-item-width)",
                maxWidth: 320,
                top: "76%",
                left: "8%",
              }}
            >
              <Flex gap="2" align="start" mb="1">
                <Checkmark />
                <Heading as="h3" size="3">
                  Equal Exchange
                </Heading>
              </Flex>
              <Text as="p" color="gray" size="3">
                Giving and receiving feels fair, simple, and balanced.
              </Text>
            </Box>

            <Box
              className="flex flex-col justify-center items-center text-center"
              position={{ lg: "absolute" }}
              style={{
                width: "var(--component-highlights-item-width)",
                maxWidth: 320,
                top: "49%",
                left: "-1%",
              }}
            >
              <Flex gap="2" align="start" mb="1">
                <Checkmark />
                <Heading as="h3" size="3">
                  Connections
                </Heading>
              </Flex>
              <Text as="p" color="gray" size="3">
                It’s not just about tasks — it’s about building real
                connections.
              </Text>
            </Box>

            <Box
              className="flex flex-col justify-center items-center text-center"
              position={{ lg: "absolute" }}
              style={{
                width: "var(--component-highlights-item-width)",
                maxWidth: 300,
                top: "19%",
                left: "4%",
              }}
            >
              <Flex gap="2" align="start" mb="1">
                <Checkmark />
                <Heading as="h3" size="3">
                  Open to All
                </Heading>
              </Flex>
              <Text as="p" color="gray" size="3">
                Anyone can join, contribute, and feel part of something
                meaningful.
              </Text>
            </Box>

            <Box pr="5" display={{ sm: "none" }} />
          </Grid>
        </Box>
      </Container>
    </Section>
  );
};

const Checkmark = () => (
  <CheckIcon
    style={{
      color: "var(--lime-11)",
      backgroundColor: "var(--lime-4)",
      padding: "var(--space-1)",
      width: "var(--space-5)",
      height: "var(--space-5)",
      marginTop: -1,
      marginBottom: -1,
      borderRadius: "100%",
      flexGrow: 0,
      flexShrink: 0,
    }}
  />
);

const Circle = ({
  size,
  color1,
  color2,
  angle = 90,
  opacity = 1,
}: {
  size: number;
  angle?: number;
  color1: string;
  color2: string;
  opacity?: number;
}) => {
  return (
    <Box
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        opacity: opacity,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%" }}
      >
        <circle
          cx="50"
          cy="50"
          r="49"
          stroke={`url(#circle-${size})`}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <defs>
          <linearGradient
            id={`circle-${size}`}
            gradientUnits="userSpaceOnUse"
            x1="50"
            y1="0"
            x2="50"
            y2="100"
          >
            <stop stopColor={color1} />
            <stop stopColor={color2} offset="1" />
          </linearGradient>
        </defs>
      </svg>
    </Box>
  );
};
