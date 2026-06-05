import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Progress, useDisclosure } from "@chakra-ui/react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
} from "@chakra-ui/react";
import {
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Layers,
  LogOut,
  MessageSquareText,
  Trash2,
  UserCircle,
} from "lucide-react";
import { verify } from "../../Services/UserApi";
import { updateAvailableCall } from "../../Services/ExtraApi";
import { currentVersion } from "../../version";
import { clearSession } from "../../Services/session";
import { useSidebar } from "../../Context/SidebarContext";
import ThemeToggle from "../Layout/ThemeToggle";

function NavLink({ to, active, icon, label, collapsed }) {
  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={`${active ? "msl-nav-active msl-nav-item" : "msl-nav-item"} ${
        collapsed ? "justify-center px-2 mx-1" : ""
      }`}
    >
      <span className="w-5 h-5 flex-shrink-0">{icon}</span>
      {!collapsed ? <span>{label}</span> : null}
    </Link>
  );
}

const SideBar = ({
  dashboard,
  mycourse,
  course,
  practiceQuiz,
  practiceFlashcards,
  feedback,
  profile,
}) => {
  const navigator = useNavigate();
  const user = localStorage.getItem("user");
  const { collapsed, toggleCollapsed, viewportNarrow } = useSidebar();
  const [downloads, setDownloads] = useState({});
  const [clearDownloads, setClearDownloads] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const [updateAvailable, setUpdateAvailable] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    updateAvailableCall("windows")
      .then((res) => {
        const system = res.response?.response;
        if (!system) return;
        setUpdateAvailable(system);
        if (system.isAvailable !== false && system.version !== currentVersion) {
          onOpen();
        }
      })
      .catch(() => {});

    if (!user) navigator("/login");
    else verify().then((res) => { if (!res.status) navigator("/login"); }).catch(() => navigator("/login"));

    window.electronAPI.receiveData("download-progress", (data) => {
      setDownloads((prev) => ({ ...prev, [data.filename]: data.progress }));
    });
    window.electronAPI.receiveData("download-complete", () => {
      setClearDownloads(false);
    });
    window.electronAPI.receiveData("download-failed", (data) => {
      setDownloads((prev) => ({ ...prev, [data.filename]: -1 }));
    });
    window.electronAPI.receiveData("delete-complete", () => {
      setTimeout(() => setClearDownloads(false), 1000);
      setDownloadCount(0);
      setDownloads({});
    });
    window.electronAPI.sendData("count-encrypted-files", "count-encrypted-files");
    window.electronAPI.receiveData("total-files-count", (data) => {
      setDownloadCount(data);
    });
  }, []);

  const downloadEntries = Object.keys(downloads);

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-[260px]"
      } flex-shrink-0 h-screen flex flex-col border-r border-msl-border bg-msl-glass backdrop-blur-xl transition-[width] duration-200`}
    >
      <div className={`border-b border-msl-border ${collapsed ? "p-3" : "p-6"}`}>
        <img
          className={`object-contain mx-auto ${collapsed ? "w-10" : "w-24"}`}
          src="https://mslelearning.com/mslogo.png"
          alt="MSL"
        />
        {!collapsed ? (
          <p className="text-center text-xs text-msl-muted mt-2 tracking-widest uppercase">
            Business School
          </p>
        ) : null}
      </div>

      <div className={`px-2 py-2 border-b border-msl-border ${collapsed ? "flex justify-center" : ""}`}>
        <button
          type="button"
          onClick={toggleCollapsed}
          disabled={viewportNarrow}
          className="p-2 rounded-lg text-msl-muted hover:text-msl-text hover:bg-brand/10 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={
            viewportNarrow
              ? "Navigation auto-collapses on narrow windows"
              : collapsed
                ? "Expand menu"
                : "Collapse menu"
          }
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
          ) : (
            <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
          )}
        </button>
      </div>

      {downloadEntries.length > 0 && !collapsed ? (
        <div className="px-4 py-3 border-b border-msl-border space-y-2 max-h-32 overflow-y-auto">
          <p className="text-xs font-semibold text-msl-primary uppercase tracking-wide">
            Downloads
          </p>
          {downloadEntries.map((filename, index) => (
            <div key={filename} className="rounded-lg border border-msl-border p-2">
              <p className="text-[10px] text-msl-muted truncate">File {index + 1}</p>
              {downloads[filename] === -1 ? (
                <p className="text-xs text-red-500">Failed</p>
              ) : (
                <>
                  <Progress value={downloads[filename]} size="xs" colorScheme="brand" />
                  <p className="text-[10px] text-msl-muted">{downloads[filename]}%</p>
                </>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <nav className="flex-1 overflow-y-auto py-4 space-y-6">
        <div>
          {!collapsed ? (
            <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-msl-muted mb-2">
              Main
            </p>
          ) : null}
          <div className="space-y-0.5">
            <NavLink
              to="/"
              active={dashboard}
              collapsed={collapsed}
              label="Dashboard"
              icon={<LayoutDashboard className="w-5 h-5" strokeWidth={1.75} />}
            />
            <NavLink
              to="/personal/course"
              active={mycourse}
              collapsed={collapsed}
              label="My courses"
              icon={<BookMarked className="w-5 h-5" strokeWidth={1.75} />}
            />
            <NavLink
              to="/course"
              active={course}
              collapsed={collapsed}
              label="All courses"
              icon={<BookOpen className="w-5 h-5" strokeWidth={1.75} />}
            />
          </div>
        </div>

        <div>
          {!collapsed ? (
            <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-msl-muted mb-2">
              Practice
            </p>
          ) : null}
          <div className="space-y-0.5">
            <NavLink
              to="/practice/quiz"
              active={practiceQuiz}
              collapsed={collapsed}
              label="Quizzes"
              icon={<ClipboardList className="w-5 h-5" strokeWidth={1.75} />}
            />
            <NavLink
              to="/practice/flashcards"
              active={practiceFlashcards}
              collapsed={collapsed}
              label="Flashcards"
              icon={<Layers className="w-5 h-5" strokeWidth={1.75} />}
            />
          </div>
        </div>

        <div>
          {!collapsed ? (
            <p className="px-4 text-[10px] font-semibold uppercase tracking-widest text-msl-muted mb-2">
              Account
            </p>
          ) : null}
          <div className="space-y-0.5">
            <NavLink
              to="/profile"
              active={profile}
              collapsed={collapsed}
              label="Profile"
              icon={<UserCircle className="w-5 h-5" strokeWidth={1.75} />}
            />
            <NavLink
              to="/feedback"
              active={feedback}
              collapsed={collapsed}
              label="Feedback"
              icon={<MessageSquareText className="w-5 h-5" strokeWidth={1.75} />}
            />
            <Link
              to="/login"
              onClick={() => clearSession()}
              title={collapsed ? "Logout" : undefined}
              className={`msl-nav-item ${collapsed ? "justify-center px-2 mx-1" : ""}`}
            >
              <span className="w-5 h-5">
                <LogOut className="w-5 h-5" strokeWidth={1.75} />
              </span>
              {!collapsed ? <span>Logout</span> : null}
            </Link>
            {!collapsed ? (
              <button
                type="button"
                onClick={() => {
                  window.electronAPI.sendData("clear-downloads", "clear-downloads");
                  setDownloads({});
                  setClearDownloads(true);
                }}
                className="msl-nav-item w-[calc(100%-1rem)] text-left"
              >
                <span className="w-5 h-5">
                  <Trash2 className="w-5 h-5" strokeWidth={1.75} />
                </span>
                <span className={clearDownloads ? "text-msl-success" : ""}>
                  {clearDownloads ? "Clearing…" : `Clear downloads (${downloadCount})`}
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </nav>

      <div className={`border-t border-msl-border flex items-center gap-2 ${collapsed ? "p-2 justify-center" : "p-4 justify-between"}`}>
        {!collapsed ? <p className="text-xs text-msl-muted">v{currentVersion}</p> : null}
        <ThemeToggle />
      </div>

      <UpdateModal isOpen={isOpen} onClose={onClose} data={updateAvailable} />
    </aside>
  );
};

export default SideBar;

function UpdateModal({ isOpen, onClose, data }) {
  return (
    <Modal isOpen={isOpen} onClose={data.enforce ? () => {} : onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>New Update Available (v{data.version})</ModalHeader>
        {data.enforce ? "" : <ModalCloseButton />}
        <ModalBody>
          A new version of the app is available. Would you like to update now?
        </ModalBody>
        <ModalFooter>
          <Button
            colorScheme="brand"
            ml={3}
            onClick={() => {
              window.electronAPI.sendData("update-available", data.mainLink);
            }}
          >
            Update Now (nsis)
          </Button>
          <Button
            colorScheme="green"
            ml={3}
            onClick={() => {
              window.electronAPI.sendData("update-available", data.exeLink);
            }}
          >
            Update Now (exe)
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
