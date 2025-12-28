import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";
import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

type Window = Adw.PreferencesWindow & {
  _settings: Gio.Settings | null;
};

export default class JetBrainsPreferences extends ExtensionPreferences {
  _settings: Gio.Settings | null = null;

  fillPreferencesWindow(window: Window) {
    // Crear objeto de configuración
    window._settings = this.getSettings();

    // Crear página de preferencias
    const page = new Adw.PreferencesPage({
      title: _("General"),
      icon_name: "dialog-information-symbolic",
    });
    window.add(page);

    // Grupo de apariencia
    const appearanceGroup = new Adw.PreferencesGroup({
      title: _("Appearance"),
      description: _("Configure how projects appear in search results"),
    });
    page.add(appearanceGroup);

    const overrideResultsOrder = new Adw.SwitchRow({
      title: _("Override Results Order"),
      subtitle: _(
        "Place JetBrains projects directly underneath applications in search results. Requires disabling and re-enabling the extension.",
      ),
    });
    appearanceGroup.add(overrideResultsOrder);
    window._settings.bind(
      "override-results-order",
      overrideResultsOrder,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    const showIdeName = new Adw.SwitchRow({
      title: _("Show IDE Name"),
      subtitle: _(
        "Display the IDE name next to each project (e.g., 'my-project • PhpStorm')",
      ),
    });
    appearanceGroup.add(showIdeName);
    window._settings.bind(
      "show-ide-name",
      showIdeName,
      "active",
      Gio.SettingsBindFlags.DEFAULT,
    );

    // Grupo de filtros
    const filtersGroup = new Adw.PreferencesGroup({
      title: _("Filters"),
      description: _("Control which projects are shown"),
    });
    page.add(filtersGroup);

    const maxProjects = new Adw.SpinRow({
      title: _("Maximum Projects per IDE"),
      subtitle: _("Limit the number of recent projects shown for each IDE"),
      adjustment: new Gtk.Adjustment({
        lower: 5,
        upper: 50,
        step_increment: 5,
        page_increment: 10,
      }),
    });
    filtersGroup.add(maxProjects);
    window._settings.bind(
      "max-projects",
      maxProjects,
      "value",
      Gio.SettingsBindFlags.DEFAULT,
    );
  }
}
