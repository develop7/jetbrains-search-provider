import Glib from "gi://GLib";
import Gio from "gi://Gio";
import Shell from "gi://Shell";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import { AppSearchProvider } from "resource:///org/gnome/shell/ui/appDisplay.js";
import { fileExists, readFile, uniqueId } from "./util.js";

interface ToolboxState {
  version: number;
  appVersion: string;
  tools: Array<{
    channelId: string;
    toolId: string;
    productCode: string;
    tag: string;
    displayName: string;
    displayVersion: string;
    buildNumber: string;
    installLocation: string;
    launchCommand: string;
  }>;
}

interface ToolboxTool {
  displayName: string;
  launchCommand: string;
  productCode: string;
  configDir: string;
}

interface JetBrainsProject {
  name: string;
  path: string;
  ide: string;
  ideName: string;
  launchCommand: string;
  lastOpened: number;
}

export default class JetBrainsSearchProvider<
  T extends Extension & {
    _settings: Gio.Settings | null;
  },
> implements AppSearchProvider
{
  projects: Record<string, JetBrainsProject> = {};
  extension: T;
  app: Shell.App | undefined;
  appInfo?: ReturnType<Shell.App["get_app_info"]> | undefined;
  toolboxApps: Map<string, ToolboxTool> = new Map();
  ideIconCache = new Map<string, Shell.App | null>();
  // Set by the SearchProvider interface
  display: unknown;

  constructor(extension: T) {
    this.extension = extension;
    this._setApp();
    this.appInfo = this.app?.get_app_info();

    this._loadToolboxState();
    this._setProjects();
  }

  _setApp() {
    this.app = ["jetbrains-toolbox"]
      .map((id) => Shell.AppSystem.get_default().lookup_app(id + ".desktop"))
      .find((app) => Boolean(app));

    if (!this.app) {
      console.error("Failed to find jetbrains-toolbox application");
    }
  }

  _loadToolboxState() {
    const toolboxStatePath = `${Glib.get_home_dir()}/.local/share/JetBrains/Toolbox/state.json`;

    if (!fileExists(toolboxStatePath)) {
      console.error(
        "JetBrains Toolbox state.json not found at:",
        toolboxStatePath,
      );
      return;
    }

    const content = readFile(toolboxStatePath);
    if (!content) {
      console.error("Failed to read Toolbox state.json");
      return;
    }

    try {
      const state: ToolboxState = JSON.parse(content);

      for (const tool of state.tools) {
        this.toolboxApps.set(tool.toolId, {
          displayName: tool.displayName,
          launchCommand: tool.launchCommand,
          productCode: tool.productCode,
          configDir: `${tool.displayName}${tool.buildNumber.split(".")[0]}`,
        });
      }

      console.log(`Found ${this.toolboxApps.size} JetBrains tools in Toolbox`);
    } catch (e) {
      console.error("Error parsing Toolbox state.json:", e);
    }
  }

  _setProjects() {
    this.projects = {};
    const configDir = Glib.get_user_config_dir();
    const jetbrainsConfigDir = `${configDir}/JetBrains`;

    if (!fileExists(jetbrainsConfigDir)) {
      console.log("JetBrains config directory not found");
      return;
    }

    const maxProjects =
      this.extension?._settings?.get_int("max-projects") || 20;

    for (const [, tool] of this.toolboxApps) {
      this._loadProjectsFromIDE(jetbrainsConfigDir, tool, maxProjects);
    }

    console.log(`Loaded ${Object.keys(this.projects).length} projects total`);
  }

  _loadProjectsFromIDE(
    jetbrainsConfigDir: string,
    tool: ToolboxTool,
    maxProjects: number,
  ) {
    // Buscar el directorio de configuración del IDE
    const dir = Gio.File.new_for_path(jetbrainsConfigDir);

    try {
      const enumerator = dir.enumerate_children(
        "standard::name,standard::type",
        Gio.FileQueryInfoFlags.NONE,
        null,
      );

      let fileInfo;
      while ((fileInfo = enumerator.next_file(null)) !== null) {
        if (fileInfo.get_file_type() === Gio.FileType.DIRECTORY) {
          const dirName = fileInfo.get_name();

          // Verificar si este directorio corresponde a este IDE
          // Por ejemplo: PhpStorm2025.3, WebStorm2024.1, etc.
          if (dirName.startsWith(tool.displayName)) {
            const recentProjectsPath = `${jetbrainsConfigDir}/${dirName}/options/recentProjects.xml`;

            if (fileExists(recentProjectsPath)) {
              this._parseRecentProjects(recentProjectsPath, tool, maxProjects);
              break; // Solo necesitamos el directorio más reciente
            }
          }
        }
      }
    } catch (e) {
      console.error(
        `Error reading config directory for ${tool.displayName}:`,
        e,
      );
    }
  }

  _parseRecentProjects(
    xmlPath: string,
    tool: ToolboxTool,
    maxProjects: number,
  ) {
    const content = readFile(xmlPath);
    if (!content) return;

    const showIdeName =
      this.extension?._settings?.get_boolean("show-ide-name") ?? true;

    // Parsear XML para encontrar proyectos
    // Buscar entradas del tipo: <entry key="$USER_HOME$/path/to/project">
    const entryRegex = /<entry key="([^"]+)">/g;
    const projects: Array<{ path: string; timestamp: number }> = [];

    let match;
    while ((match = entryRegex.exec(content)) !== null) {
      let projectPath = match[1];

      // Expandir variables de entorno
      projectPath = projectPath
        .replace("$USER_HOME$", Glib.get_home_dir())
        .replace(
          "$APPLICATION_CONFIG_DIR$",
          `${Glib.get_user_config_dir()}/JetBrains`,
        );

      // Ignorar proyectos especiales como light-edit
      if (projectPath.includes("light-edit")) {
        continue;
      }

      // Filtrar paths inválidos
      if (projectPath.includes("$") || projectPath.length < 2) {
        continue;
      }

      // Verificar si el path existe
      if (!fileExists(projectPath)) {
        continue;
      }

      // Buscar el timestamp de activación para este proyecto
      const projectBlockStart = match.index;
      const projectBlockEnd = content.indexOf("</entry>", projectBlockStart);
      const projectBlock = content.substring(
        projectBlockStart,
        projectBlockEnd,
      );

      let timestamp = 0;
      const timestampMatch = projectBlock.match(
        /activationTimestamp" value="(\d+)"/,
      );
      if (timestampMatch) {
        timestamp = parseInt(timestampMatch[1]);
      }

      projects.push({ path: projectPath, timestamp });
    }

    // Ordenar por timestamp (más reciente primero) y limitar
    projects
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxProjects)
      .forEach(({ path, timestamp }) => {
        const projectName = path.split("/").filter(Boolean).pop() || path;

        // Formato estilo VSCode: "IDE: proyecto-nombre"
        const displayName = showIdeName
          ? `${tool.displayName}: ${projectName}`
          : projectName;

        this.projects[uniqueId()] = {
          name: displayName,
          path: path,
          ide: tool.displayName,
          ideName: tool.displayName,
          launchCommand: tool.launchCommand,
          lastOpened: timestamp,
        };
      });
  }

  _findJetBrainsApp(ideName: string): Shell.App | null {
    if (this.ideIconCache.has(ideName)) {
      return this.ideIconCache.get(ideName)!;
    }

    const appSystem = Shell.AppSystem.get_default();
    const ide = ideName.toLowerCase();

    const apps = Gio.AppInfo.get_all();

    for (const info of apps) {
      const id = info.get_id();
      if (!id) continue;

      if (id.startsWith("jetbrains-") && id.includes(ide)) {
        const app = appSystem.lookup_app(id);
        if (app) {
          this.ideIconCache.set(ideName, app);
          return app;
        }
      }
    }

    this.ideIconCache.set(ideName, null);
    return null;
  }

  activateResult(result: string): void {
    const project = this.projects[result];
    if (!project) return;

    try {
      // Usar el comando de lanzamiento directo de Toolbox
      const command = `${project.launchCommand} "${project.path}"`;
      console.log(`Launching: ${command}`);
      Glib.spawn_command_line_async(command);
    } catch (e) {
      console.error("Error launching project:", e);
    }
  }

  filterResults(results: string[], maxResults: number) {
    return results.slice(0, maxResults);
  }

  async getInitialResultSet(terms: string[]) {
    this._loadToolboxState();
    this._setProjects();

    const searchTerm = terms.join(" ").toLowerCase();
    return Object.keys(this.projects).filter((id) => {
      const project = this.projects[id];
      return (
        project.name.toLowerCase().includes(searchTerm) ||
        project.path.toLowerCase().includes(searchTerm)
      );
    });
  }

  async getSubsearchResultSet(previousResults: string[], terms: string[]) {
    const searchTerm = terms.join(" ").toLowerCase();
    return previousResults.filter((id) => {
      const project = this.projects[id];
      return (
        project.name.toLowerCase().includes(searchTerm) ||
        project.path.toLowerCase().includes(searchTerm)
      );
    });
  }

  async getResultMetas(ids: string[]) {
    return ids.map((id) => {
      const project = this.projects[id];

      return {
        id,
        name: project.name,
        description: project.path,
        createIcon: (size: number) => {
          const ideApp = this._findJetBrainsApp(project.ide);
          if (ideApp) {
            return ideApp.create_icon_texture(size);
          }

          if (this.app) {
            return this.app.create_icon_texture(size);
          }

          return new Gio.ThemedIcon({
            name: "application-x-executable-symbolic",
          });
        },
      };
    });
  }
}
