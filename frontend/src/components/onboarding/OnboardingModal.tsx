import { useState, useCallback, useEffect } from "react";
import { Dialog, Button, Flex } from "@radix-ui/themes";
import { useNavigate } from "react-router-dom";
import { usersApi } from "@/services/api";
import { useUser } from "@/contexts/UserContext";
import { WelcomeStep } from "./steps/WelcomeStep";
import { InterestsStep } from "./steps/InterestsStep";
import { ProfileStep } from "./steps/ProfileStep";
import { CompleteStep } from "./steps/CompleteStep";
import type { SocialLinks } from "@/types";

const TOTAL_STEPS = 4;
const ONBOARDING_DISMISSED_KEY = "onboarding_dismissed";

export function OnboardingModal() {
  const navigate = useNavigate();
  const { user, isLoading, refetchUser } = useUser();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Collected data across steps
  const [interests, setInterests] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  // Show modal when user is loaded and has no interests
  useEffect(() => {
    if (isLoading || !user) return;

    const hasInterests = user.interests && user.interests.length > 0;
    const dismissed =
      localStorage.getItem(ONBOARDING_DISMISSED_KEY) === user._id;

    if (!hasInterests && !dismissed) {
      setOpen(true);
    }
  }, [user, isLoading]);

  const finish = useCallback(() => {
    if (user) {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, user._id);
    }
    setOpen(false);
    navigate("/dashboard");
  }, [navigate, user]);

  const saveAndAdvance = useCallback(async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {};

      // Collect only filled data
      if (interests.length > 0) payload.interests = interests;
      if (bio.trim()) payload.bio = bio.trim();
      if (profilePicture) payload.profile_picture = profilePicture;

      const hasAnySocial = Object.values(socialLinks).some(
        (v) => v && v.trim(),
      );
      if (hasAnySocial) payload.social_links = socialLinks;

      if (Object.keys(payload).length > 0) {
        await usersApi.updateProfile(payload);
        refetchUser();
      }
    } catch (err) {
      console.error("[Onboarding] Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  }, [interests, bio, profilePicture, socialLinks, refetchUser]);

  const handleNext = useCallback(async () => {
    if (step === TOTAL_STEPS - 1) {
      finish();
      return;
    }

    // Save data when leaving step 1 (interests) or step 2 (profile)
    if (step === 1 || step === 2) {
      await saveAndAdvance();
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, [step, saveAndAdvance, finish]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleSkip = useCallback(() => {
    finish();
  }, [finish]);

  const handleProfileUpdate = useCallback(
    (data: {
      bio?: string;
      profile_picture?: string;
      social_links?: SocialLinks;
    }) => {
      if (data.bio !== undefined) setBio(data.bio);
      if (data.profile_picture !== undefined)
        setProfilePicture(data.profile_picture);
      if (data.social_links !== undefined) setSocialLinks(data.social_links);
    },
    [],
  );

  // Button labels per step
  const nextLabel =
    step === 0
      ? "Get started"
      : step === TOTAL_STEPS - 1
        ? "Explore Dashboard"
        : "Next";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Content
        className="max-w-lg rounded-2xl p-6 shadow-xl min-h-[540px] flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Step content */}
        <div className="flex-1 flex flex-col">
          {step === 0 && <WelcomeStep />}
          {step === 1 && (
            <InterestsStep selected={interests} onUpdate={setInterests} />
          )}
          {step === 2 && (
            <ProfileStep
              bio={bio}
              profilePicture={profilePicture}
              socialLinks={socialLinks}
              onUpdate={handleProfileUpdate}
            />
          )}
          {step === 3 && <CompleteStep interests={interests} />}
        </div>

        {/* Progress dots */}
        <Flex justify="center" gap="2" className="mt-4 mb-3">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full transition-all duration-200"
              style={{
                backgroundColor: i === step ? "var(--lime-9)" : "var(--gray-5)",
                transform: i === step ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </Flex>

        {/* Navigation */}
        <Flex justify="between" align="center">
          <div>
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <Button
                variant="ghost"
                color="gray"
                onClick={handleBack}
                disabled={saving}
              >
                Back
              </Button>
            )}
          </div>

          <Flex gap="3">
            {step < TOTAL_STEPS - 1 && (
              <Button
                variant="soft"
                color="gray"
                onClick={handleSkip}
                disabled={saving}
              >
                Skip
              </Button>
            )}
            <Button
              color="lime"
              onClick={handleNext}
              disabled={saving}
              className="rounded-full"
            >
              {saving ? "Saving..." : nextLabel}
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
