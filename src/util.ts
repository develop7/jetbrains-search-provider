import Glib from "gi://GLib";

export const uniqueId = () =>
  [...Array(8)].map(() => Math.floor(Math.random() * 16).toString(16)).join("");

export const readFile = (path: string): string | undefined => {
  try {
    const [ok, data] = Glib.file_get_contents(path);
    if (!ok) {
      return;
    }
    return new TextDecoder().decode(data);
  } catch (e) {
    console.error(`Error reading file ${path}:`, e);
    return;
  }
};

export const fileExists = (path: string): boolean => {
  try {
    return Glib.file_test(path, Glib.FileTest.EXISTS);
  } catch (e) {
    return false;
  }
};
