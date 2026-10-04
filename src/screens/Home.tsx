import { useEffect, useState } from "react";

import { ProductHeader } from "../components/ProductShell";
import { Button, IconButton, Tab, Tabs } from "../components/ui";
import { useTheme } from "../hooks/useTheme";
import { isEditableTarget } from "../lib/dom";
import type { CreateProjectInput } from "../lib/projects";
import { readJsonStorage, STORAGE_KEYS } from "../lib/storage";
import type { DashboardView, ExperienceLevel, Mode } from "../types";
import { DashboardTour } from "./home/DashboardTour";
import { ProfileMenu, SearchPalette } from "./home/DashboardOverlays";
import {
  Challenges,
  RecentProjects,
  TutorialSection,
} from "./home/DashboardSections";
import { getDashboardSearchItems } from "./home/homeData";
import { NewProjectModal } from "./home/ProjectModals";

interface LocalUser {
  name?: string;
  email?: string;
}

interface DailyChallenge {
  id: string;
  title: string;
  difficulty: string;
  estimatedMinutes: number;
}

function initialsFor(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "LU"
  );
}

export function Home({
  openNewProject,
  openProject,
  landing,
  level,
}: {
  openNewProject: (input: CreateProjectInput) => void;
  openProject: (projectId: string) => void;
  landing: () => void;
  level: ExperienceLevel;
}) {
  const [tip, setTip] = useState(0);
  const [dashboardView, setDashboardView] =
    useState<DashboardView>("recent");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dark, setDark] = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showAllTutorials, setShowAllTutorials] = useState(false);

  const localUser = readJsonStorage<LocalUser>(STORAGE_KEYS.user, {});
  const displayName = localUser.name?.trim() || "Local user";
  const initials = initialsFor(displayName);

  /*
   * CONTENT INTEGRATION:
   * Daily Challenge uses frontend mock content for now.
   * Replace this object with the current system-design challenge
   * returned by the learning content API once available.
   *
   * Backend content should provide the challenge identifier, title,
   * difficulty, and estimated completion time.
   */
  const dailyChallenge: DailyChallenge = {
    id: "daily-url-shortener",
    title: "Design a URL Shortener",
    difficulty: "Intermediate",
    estimatedMinutes: 12,
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "/" && !isEditableTarget(event.target)) {
        event.preventDefault();
        setSearchOpen(true);
      }

      if (
        event.key.toLowerCase() === "n" &&
        !isEditableTarget(event.target)
      ) {
        setNewProjectOpen(true);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setProfileOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const searchItems = getDashboardSearchItems(searchQuery);

  /*
   * PROJECT CREATION:
   * Dashboard actions only describe the project the user wants
   * to open. Project creation and persistence remain outside this
   * screen so backend storage can change without rewriting the UI.
   */
  const openModeAsProject = (mode: Mode, name?: string) =>
    openNewProject({
      name:
        name ??
        (mode === "challenge" ? "New challenge" : "Untitled project"),
      mode,
      source: mode === "challenge" ? "challenge" : "template",
    });

  /*
   * DAILY CHALLENGE:
   * For now the daily challenge opens the existing Challenge mode.
   * Once challenges have backend IDs, pass dailyChallenge.id into
   * the challenge-loading flow so the correct prompt is retrieved.
   */
  const openDailyChallenge = () => {
    openModeAsProject("challenge", dailyChallenge.title);
  };

  return (
    <main className={`home-page ${dark ? "dark" : ""}`}>
      <ProductHeader
        className="app-header architech-dashboard-header"
        onLogoClick={landing}
        trail={<span className="product-location">Projects</span>}
        actions={
          <>
            <IconButton
              icon="search"
              label="Search"
              onClick={() => setSearchOpen(true)}
            />

            <IconButton
              icon={dark ? "sun" : "moon"}
              label={
                dark
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              tooltip={dark ? "Light theme" : "Dark theme"}
              onClick={() => setDark(!dark)}
            />

            <button
              className="avatar avatar-button"
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              title="Profile"
              data-tooltip="Profile"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              {initials}
            </button>
          </>
        }
      />

      <section className="dashboard-page">
        <div className="dashboard-content">
          <div className="dashboard-intro">
            <span className="dashboard-eyebrow">Your studio</span>
          </div>

          {/* 
           * CONTENT INTEGRATION:
           * Daily Challenge is intentionally separate from Projects.
           * It is a small learning prompt that will eventually receive
           * its content from the backend learning/challenge service.
           */}
          <section
            className="daily-challenge-section"
            aria-labelledby="daily-challenge-heading"
          >
            <div className="daily-challenge-label">
              <span id="daily-challenge-heading">
                Daily challenge
              </span>

              <span>System design</span>
            </div>

            <button
              type="button"
              className="daily-challenge-strip"
              onClick={openDailyChallenge}
            >
              <span className="daily-challenge-title">
                {dailyChallenge.title}
              </span>

              <span className="daily-challenge-meta">
                {dailyChallenge.difficulty}
                <span aria-hidden="true">·</span>
                {dailyChallenge.estimatedMinutes} min
              </span>

              <span className="daily-challenge-action">
                Start
                <span aria-hidden="true">→</span>
              </span>
            </button>
          </section>

          <section
            className="dashboard-projects"
            aria-labelledby="projects-heading"
          >
            <header className="projects-heading">
              <div>
                <h1 id="projects-heading">Projects.</h1>

                <p>
                  Continue building or start with a guided canvas.
                </p>
              </div>

              <Button
                className="dashboard-new-project-button"
                onClick={() => setNewProjectOpen(true)}
                icon="plus"
              >
                New project
              </Button>
            </header>

            <div className="projects-navigation">
              <Tabs
                className="dashboard-tabs home-view-tabs"
                label="Project views"
              >
                {(["recent", "challenge"] as DashboardView[]).map(
                  (view) => (
                    <Tab
                      key={view}
                      selected={dashboardView === view}
                      onClick={() => setDashboardView(view)}
                    >
                      {view === "challenge"
                        ? "Challenge"
                        : "Recent"}
                    </Tab>
                  ),
                )}
              </Tabs>
            </div>

            {/*
             * PROJECT DATA:
             * Project cards remain responsible only for presentation.
             * Opening a saved project continues through openProject(),
             * keeping this dashboard independent from persistence logic.
             */}
            <div className="dashboard-project-grid">
              {dashboardView === "recent" && (
                <RecentProjects
                  openProject={openProject}
                  openTemplate={openModeAsProject}
                />
              )}

              {dashboardView === "challenge" && (
                <Challenges open={openModeAsProject} />
              )}
            </div>
          </section>

          {/*
           * CONTENT INTEGRATION:
           * Tutorials currently use frontend content from homeData.
           * A future learning-content API can replace that data without
           * changing this dashboard's overall layout.
           */}
          {dashboardView === "recent" && (
            <section className="dashboard-tutorials">
              <TutorialSection
                showAll={showAllTutorials}
                onToggleShowAll={() =>
                  setShowAllTutorials((value) => !value)
                }
                open={openModeAsProject}
              />
            </section>
          )}
        </div>
      </section>

      {tip >= 0 && (
        <DashboardTour
          step={tip}
          level={level}
          close={() => setTip(-1)}
          next={() => {
            if (tip === 7) {
              setTip(-1);
            } else {
              setTip(tip + 1);
            }
          }}
        />
      )}

      {newProjectOpen && (
        <NewProjectModal
          close={() => setNewProjectOpen(false)}
          open={openNewProject}
        />
      )}

      {searchOpen && (
        <SearchPalette
          query={searchQuery}
          items={searchItems}
          onQueryChange={setSearchQuery}
          onClose={() => setSearchOpen(false)}
          onOpen={(nextMode) => openModeAsProject(nextMode)}
        />
      )}

      {profileOpen && (
        <ProfileMenu
          name={displayName}
          initials={initials}
          level={level}
          dark={dark}
          onReplayTour={() => {
            setProfileOpen(false);
            setTip(0);
          }}
          onToggleTheme={() => setDark((value) => !value)}
          onSignOut={landing}
        />
      )}
    </main>
  );
}