import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Spinner,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import AppShell from "../Components/Layout/AppShell";
import ChallengePanel from "../Components/Dashboard/ChallengePanel";
import StatCard from "../Components/Dashboard/StatCard";
import { getMyGamification, getLeaderboard } from "../Services/GamificationApi";
import { mediaUrl } from "../Services/apiConfig";
import { getStoredUser } from "../Services/session";
import { xpProgress } from "../utils/gamificationHelpers";
import IndigoProgress from "../Components/UI/IndigoProgress";

const Gamification = () => {
  const navigator = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [lbType, setLbType] = useState("xp");

  useEffect(() => {
    if (!getStoredUser()?.token) {
      navigator("/login");
      return;
    }
    getMyGamification()
      .then((res) => {
        if (res.status) setData(res.response);
      })
      .finally(() => setLoading(false));
  }, [navigator]);

  const loadLeaderboard = (type) => {
    setLbType(type);
    getLeaderboard(type).then((res) => {
      if (res.status) setLeaderboard(res.response);
    });
  };

  useEffect(() => {
    if (!loading) loadLeaderboard("xp");
  }, [loading]);

  if (loading) {
    return (
      <AppShell active={{ gamification: true }} title="Gamification">
        <div className="flex justify-center py-20">
          <Spinner size="xl" color="brand.500" />
        </div>
      </AppShell>
    );
  }

  const { remaining, pct } = xpProgress(data?.totalXp, data?.nextLevelXp);

  return (
    <AppShell
      active={{ gamification: true }}
      title="Gamification"
      subtitle="Track XP, streaks, and compete on leaderboards"
    >
      <div className="space-y-8 max-w-6xl">
        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Level"
            value={data?.level ?? 1}
            sub={`${data?.totalXp ?? 0} XP · ${remaining} to next`}
          />
          <div className="glass-card p-5">
            <p className="text-xs text-msl-muted uppercase tracking-widest">XP progress</p>
            <IndigoProgress value={pct} className="mt-3" />
          </div>
          <StatCard
            label="Streak"
            value={`${data?.currentStreak ?? 0} days`}
            sub={`Best: ${data?.longestStreak ?? 0} days`}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <ChallengePanel
            title="Daily challenge"
            periodId={data?.dailyChallenge?.periodId}
            challenge={data?.dailyChallenge}
            expected={data?.dailyChallengeExpectedCounts}
          />
          <ChallengePanel
            title="Weekly challenge"
            periodId={data?.weeklyChallenge?.periodId}
            challenge={data?.weeklyChallenge}
            expected={data?.weeklyChallengeExpectedCounts}
          />
        </section>

        {(data?.badges ?? []).length ? (
          <section className="msl-card p-5">
            <h2 className="font-semibold mb-3">Badges</h2>
            <div className="flex flex-wrap gap-2">
              {data.badges.map((b, i) => (
                <Badge key={i} colorScheme="purple" px={3} py={1} borderRadius="full">
                  {b.name ?? b.id ?? "Badge"}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        <Tabs onChange={(index) => loadLeaderboard(index === 0 ? "xp" : "streak")}>
          <TabList className="border-msl-border">
            <Tab _selected={{ color: "var(--msl-primary)", borderColor: "var(--msl-primary)" }}>
              XP leaderboard
            </Tab>
            <Tab _selected={{ color: "var(--msl-primary)", borderColor: "var(--msl-primary)" }}>
              Streak leaderboard
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0}>
              <LeaderboardTable
                items={leaderboard?.items}
                myRank={leaderboard?.myRank}
                type={lbType}
              />
            </TabPanel>
            <TabPanel px={0}>
              <LeaderboardTable
                items={leaderboard?.items}
                myRank={leaderboard?.myRank}
                type={lbType}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </AppShell>
  );
};

function LeaderboardTable({ items = [], myRank, type }) {
  if (!items.length) {
    return <p className="text-msl-muted">No leaderboard data.</p>;
  }
  return (
    <div className="msl-card overflow-hidden">
      {myRank != null ? (
        <p className="p-3 text-sm bg-msl-accent border-b border-msl-border">
          Your rank: #{myRank}
        </p>
      ) : null}
      <table className="w-full text-sm">
        <thead className="bg-msl-accent text-msl-muted">
          <tr>
            <th className="p-3 text-left font-medium">#</th>
            <th className="p-3 text-left font-medium">Student</th>
            <th className="p-3 text-right font-medium">
              {type === "streak" ? "Streak" : "XP"}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.rank} className="border-t border-msl-border">
              <td className="p-3">{row.rank}</td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  {row.image ? (
                    <img
                      src={mediaUrl(row.image)}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : null}
                  {row.firstname} {row.lastname}
                </div>
              </td>
              <td className="p-3 text-right tabular-nums">
                {type === "streak" ? row.currentStreak : row.totalXp}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Gamification;
