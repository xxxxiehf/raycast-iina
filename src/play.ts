import {
  Application,
  closeMainWindow,
  getPreferenceValues,
  open,
  showHUD,
} from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { execFile } from "child_process";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const DEFAULT_IINA_PATH = "/Applications/IINA.app";

interface Preferences {
  iinaPath?: Application;
  separateWindows: boolean;
  musicMode: boolean;
  extraArgs?: string;
}

interface Arguments {
  url?: string;
}

/**
 * Strips a single layer of matching wrapping quotes, which often come along
 * when a link is copied out of a terminal or a shell command.
 */
function stripWrappingQuotes(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

function expandHome(path: string): string {
  if (path === "~") return homedir();
  if (path.startsWith("~/")) return join(homedir(), path.slice(2));
  return path;
}

/** Accepts any scheme://... URL, or a local file path (absolute, ~-relative, or existing relative). */
function isPlayableTarget(target: string): boolean {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(target)) {
    return true;
  }
  const expanded = expandHome(target);
  return existsSync(expanded);
}

async function resolveTarget(argument?: string): Promise<string> {
  const trimmed = (argument ?? "").trim();
  if (trimmed.length > 0) {
    return stripWrappingQuotes(trimmed);
  }

  const { Clipboard } = await import("@raycast/api");
  const clipboardText = (await Clipboard.readText())?.trim() ?? "";
  return stripWrappingQuotes(clipboardText);
}

export default async function Command(props: { arguments: Arguments }) {
  const preferences = getPreferenceValues<Preferences>();

  const target = await resolveTarget(props.arguments.url);

  if (!target) {
    await showFailureToast(
      new Error("No URL or file path provided, and clipboard is empty"),
      {
        title: "Nothing to play",
      },
    );
    return;
  }

  if (!isPlayableTarget(target)) {
    await showFailureToast(
      new Error(`"${target}" is not a URL or an existing file path`),
      {
        title: "Could not play target",
      },
    );
    return;
  }

  const finalTarget = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(target)
    ? target
    : expandHome(target);

  const trimmedExtraArgs = (preferences.extraArgs ?? "").trim();
  const extraArgs =
    trimmedExtraArgs.length > 0 ? trimmedExtraArgs.split(/\s+/) : [];

  const iinaCliArgs = [
    "--no-stdin",
    ...(preferences.separateWindows ? ["-w"] : []),
    ...(preferences.musicMode ? ["--music-mode"] : []),
    ...extraArgs,
    finalTarget,
  ];

  const iinaAppPath = preferences.iinaPath?.path ?? DEFAULT_IINA_PATH;
  const iinaCliPath = join(iinaAppPath, "Contents/MacOS/iina-cli");

  try {
    try {
      await execFileAsync(iinaCliPath, iinaCliArgs);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT"
      ) {
        // iina-cli not found at the expected location; fall back to LaunchServices.
        await open(finalTarget, preferences.iinaPath ?? iinaAppPath);
      } else {
        throw error;
      }
    }

    await closeMainWindow();
    await showHUD("▶︎ Playing in IINA");
  } catch (error) {
    await showFailureToast(error, { title: "Could not launch IINA" });
  }
}
