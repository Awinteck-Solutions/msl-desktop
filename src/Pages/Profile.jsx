import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Button,
  FormControl,
  FormLabel,
  Input,
  Switch,
  useToast,
} from "@chakra-ui/react";
import AppShell from "../Components/Layout/AppShell";
import { ProfileSkeleton } from "../Components/UI/Skeleton";
import { mediaUrl } from "../Services/apiConfig";
import {
  getProfile,
  updateNotificationSettings,
  updateProfile,
  uploadProfileImage,
} from "../Services/UserApi";
import { getMyGamification } from "../Services/GamificationApi";
import { getStoredUser, setStoredUser } from "../Services/session";
import { getBadgeMeta } from "../utils/badgeHelpers";
import { useNavigate } from "react-router-dom";

const NOTIFICATION_KEYS = [
  { key: "gamification", label: "Gamification updates" },
  { key: "streaks", label: "Streak reminders" },
  { key: "smartconnect", label: "Smart Connect" },
  { key: "course_alerts", label: "Course alerts" },
];

const Profile = () => {
  const navigator = useNavigate();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState("");
  const [badges, setBadges] = useState([]);
  const [notifications, setNotifications] = useState({
    gamification: true,
    streaks: true,
    smartconnect: true,
    course_alerts: true,
  });

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigator("/login");
      return;
    }
    Promise.all([getProfile(), getMyGamification()])
      .then(([profileRes, gamRes]) => {
        if (profileRes.status && profileRes.response) {
          const p = profileRes.response;
          setFirstname(p.firstname || "");
          setLastname(p.lastname || "");
          setEmail(p.email || "");
          setImage(p.image || "");
          const ns = p.notificationSettings || {};
          setNotifications({
            gamification: ns.gamification !== false,
            streaks: ns.streaks !== false,
            smartconnect: ns.smartconnect !== false,
            course_alerts: ns.course_alerts !== false,
          });
          setStoredUser({ ...getStoredUser(), ...p });
        }
        if (gamRes.status) setBadges(gamRes.response?.badges ?? []);
      })
      .finally(() => setLoading(false));
  }, [navigator]);

  const onSaveProfile = () => {
    setSaving(true);
    updateProfile({ firstname, lastname })
      .then((res) => {
        if (res.status) {
          toast({ title: "Profile updated", status: "success", duration: 3000 });
        } else {
          toast({ title: "Update failed", status: "error", duration: 3000 });
        }
      })
      .catch(() => toast({ title: "Update failed", status: "error" }))
      .finally(() => setSaving(false));
  };

  const onToggleNotification = (key, value) => {
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    updateNotificationSettings({ [key]: value })
      .then((res) => {
        if (res.status && res.response) {
          setNotifications(res.response);
        } else {
          setNotifications(notifications);
          toast({ title: "Could not update setting", status: "error" });
        }
      })
      .catch(() => {
        setNotifications(notifications);
        toast({ title: "Could not update setting", status: "error" });
      });
  };

  const onImageSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    uploadProfileImage(file)
      .then((res) => {
        if (res.status && res.response) {
          setImage(res.response);
          toast({ title: "Photo updated", status: "success" });
        } else {
          toast({ title: "Upload failed", status: "error" });
        }
      })
      .catch(() => toast({ title: "Upload failed", status: "error" }))
      .finally(() => {
        setUploading(false);
        e.target.value = "";
      });
  };

  return (
    <AppShell active={{ profile: true }} title="Profile & settings">
      {loading ? (
        <ProfileSkeleton />
      ) : (
        <div className="max-w-2xl space-y-8">
          <section className="glass-card p-6 border border-msl-border/50">
            <h2 className="font-display text-lg font-semibold text-msl-text mb-4">Your profile</h2>
            <div className="flex items-center gap-6 mb-6">
              <Avatar
                size="xl"
                name={`${firstname} ${lastname}`}
                src={image ? mediaUrl(image) : undefined}
              />
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onImageSelected}
                />
                <Button
                  size="sm"
                  colorScheme="brand"
                  isLoading={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change photo
                </Button>
                <p className="text-sm text-msl-muted mt-2">{email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormControl>
                <FormLabel>First name</FormLabel>
                <Input
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Last name</FormLabel>
                <Input
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                />
              </FormControl>
            </div>
            <Button
              mt={4}
              colorScheme="brand"
              isLoading={saving}
              onClick={onSaveProfile}
            >
              Save profile
            </Button>
          </section>

          <section className="glass-card p-6 border border-msl-border/50">
            <h2 className="font-display text-lg font-semibold text-msl-text mb-1">Badges</h2>
            <p className="text-sm text-msl-muted mb-5">
              Achievements earned from quizzes, streaks, and course progress.
            </p>
            {badges.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badges.map((badge, i) => {
                  const meta = getBadgeMeta(badge);
                  const Icon = meta.icon;
                  const earned = badge.earnedAt
                    ? new Date(badge.earnedAt).toLocaleDateString()
                    : null;
                  return (
                    <div
                      key={badge.id || i}
                      className="rounded-msl border border-msl-border bg-msl-surface-elevated/60 p-4 flex flex-col items-center text-center gap-2"
                    >
                      <div className={`w-11 h-11 rounded-msl bg-brand/10 flex items-center justify-center ${meta.color}`}>
                        <Icon className="w-5 h-5" strokeWidth={1.75} />
                      </div>
                      <p className="text-sm font-medium text-msl-text leading-snug">
                        {meta.label}
                      </p>
                      {earned ? (
                        <p className="text-[11px] text-msl-muted font-mono">{earned}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-msl-muted py-6 text-center">
                No badges yet — complete quizzes and challenges to earn them.
              </p>
            )}
          </section>

          <section className="glass-card p-6 border border-msl-border/50">
            <h2 className="font-display text-lg font-semibold mb-4 text-msl-text">
              Notification settings
            </h2>
            <div className="space-y-4">
              {NOTIFICATION_KEYS.map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2 border-b border-msl-border last:border-0"
                >
                  <span className="text-msl-text">{label}</span>
                  <Switch
                    colorScheme="brand"
                    isChecked={notifications[key]}
                    onChange={(e) =>
                      onToggleNotification(key, e.target.checked)
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
};

export default Profile;
