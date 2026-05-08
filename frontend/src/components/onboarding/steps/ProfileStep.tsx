import { useState } from "react";
import {
  Flex,
  Heading,
  Text,
  TextArea,
  TextField,
  Avatar,
  Grid,
} from "@radix-ui/themes";
import {
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import {
  Linkedin,
  Github,
  Twitter,
  Instagram,
  Globe,
  Briefcase,
} from "lucide-react";
import { PROFILE_PICTURE_PRESETS } from "@/constants/profilePicturePresets";
import { uploadApi } from "@/services/api";
import type { SocialLinks } from "@/types";

interface ProfileStepProps {
  bio: string;
  profilePicture: string;
  socialLinks: SocialLinks;
  onUpdate: (data: {
    bio?: string;
    profile_picture?: string;
    social_links?: SocialLinks;
  }) => void;
}

const SOCIAL_FIELDS: {
  key: keyof SocialLinks;
  label: string;
  icon: typeof Linkedin;
  placeholder: string;
}[] = [
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
    placeholder: "https://linkedin.com/in/...",
  },
  {
    key: "github",
    label: "GitHub",
    icon: Github,
    placeholder: "https://github.com/...",
  },
  {
    key: "twitter",
    label: "Twitter / X",
    icon: Twitter,
    placeholder: "https://twitter.com/...",
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
    placeholder: "https://instagram.com/...",
  },
  {
    key: "website",
    label: "Website",
    icon: Globe,
    placeholder: "https://...",
  },
  {
    key: "portfolio",
    label: "Portfolio",
    icon: Briefcase,
    placeholder: "https://...",
  },
];

export function ProfileStep({
  bio,
  profilePicture,
  socialLinks,
  onUpdate,
}: ProfileStepProps) {
  const [showSocial, setShowSocial] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadProfilePicture(file);
      onUpdate({ profile_picture: res.data.url });
    } catch {
      // silently fail — user can retry or skip
    } finally {
      setUploading(false);
    }
  };

  return (
    <Flex direction="column" gap="4" className="py-2">
      <Flex direction="column" gap="1" align="center">
        <Heading size="5" weight="bold" align="center">
          Make it yours
        </Heading>
        <Text size="2" color="gray" align="center">
          Add a photo and a short bio so others can get to know you.
        </Text>
      </Flex>

      {/* Avatar picker */}
      <div className="space-y-2">
        <Text size="2" weight="bold" className="block">
          Choose an avatar
        </Text>
        <Grid columns="6" gap="2" className="max-w-md mx-auto">
          {PROFILE_PICTURE_PRESETS.slice(0, 12).map((preset) => {
            const isSelected = profilePicture === preset.url;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onUpdate({ profile_picture: preset.url })}
                className={`rounded-full p-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-9 ${
                  isSelected
                    ? "ring-2 ring-cyan-9 ring-offset-2 ring-offset-gray-1"
                    : "hover:opacity-90"
                }`}
                title={preset.name}
              >
                <Avatar
                  src={preset.url}
                  fallback={preset.name[0]}
                  size="3"
                  radius="full"
                  className="w-full aspect-square"
                />
              </button>
            );
          })}
        </Grid>

        <Flex align="center" gap="2" className="mt-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={handleFileUpload}
            />
            <Text
              size="1"
              color="blue"
              className="underline cursor-pointer"
            >
              {uploading ? "Uploading..." : "Or upload your own photo"}
            </Text>
          </label>
        </Flex>
      </div>

      {/* Bio */}
      <div className="space-y-1">
        <Text size="2" weight="bold" className="block">
          Bio
        </Text>
        <TextArea
          placeholder="Tell the community about yourself..."
          value={bio}
          onChange={(e) => onUpdate({ bio: e.target.value })}
          rows={3}
          className="rounded-xl"
        />
      </div>

      {/* Social links (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setShowSocial(!showSocial)}
          className="flex items-center gap-1 text-sm font-medium"
          style={{ color: "var(--gray-11)" }}
        >
          Social links (optional)
          {showSocial ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>

        {showSocial && (
          <Flex direction="column" gap="2" className="mt-2">
            {SOCIAL_FIELDS.map((field) => {
              const Icon = field.icon;
              return (
                <Flex key={field.key} align="center" gap="2">
                  <Icon size={16} className="shrink-0 text-gray-10" />
                  <TextField.Root
                    placeholder={field.placeholder}
                    value={socialLinks[field.key] || ""}
                    onChange={(e) =>
                      onUpdate({
                        social_links: {
                          ...socialLinks,
                          [field.key]: e.target.value,
                        },
                      })
                    }
                    size="2"
                    className="flex-1"
                  />
                </Flex>
              );
            })}
          </Flex>
        )}
      </div>
    </Flex>
  );
}
