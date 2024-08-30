import * as fs from "fs";
import * as vscode from "vscode";

export function getModTimeSync(filename: string): Date | undefined {
  return fs.statSync(filename)?.mtime;
}

export async function fileExists(filename: string): Promise<boolean> {
  return fs.promises
    .access(filename, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

export function fileExistsSync(p: string): boolean {
  try {
    fs.accessSync(p);
  } catch (err) {
    return false;
  }
  return true;
}

export function capitalizeFirstLetter(name: string | undefined): string | undefined {
  if (name === undefined) {
    return undefined;
  }
  if (name === "") {
    return name;
  }
  return name.replace(/^./, name[0].toUpperCase());
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

export async function showTextDocumentAtPosition(uri: vscode.Uri, position?: vscode.Position) {
  const openDoc = async (uri: vscode.Uri) => {
    await vscode.commands.executeCommand("vscode.open", uri); // use command to get default behavior of vscode
  };
  if (position) {
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(doc);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(editor.selection);
    } catch (error) {
      await openDoc(uri);
    }
  } else {
    await openDoc(uri);
  }
}

export function deduplicate(arr: string[] | undefined) {
  if (!arr) {
    return arr;
  }
  return arr.filter(function (elem, index, self) {
    return index === self.indexOf(elem);
  });
}

export function toCamelCase(s?: string) {
  if (!s) {
    return s;
  }
  s = s.trim();
  if (!s) {
    return s;
  }

  let result = "";
  let capNext = true;
  for (let i = 0; i < s.length; i++) {
    let v = s.charCodeAt(i);
    const vIsCap = v >= 65 && v <= 90; // 'A' to 'Z'
    const vIsLow = v >= 97 && v <= 122; // 'a' to 'z'

    if (capNext) {
      if (vIsLow) {
        v -= 32; // Convert to uppercase
      }
    } else if (i === 0) {
      if (vIsCap) {
        v += 32; // Convert to lowercase
      }
    }

    if (vIsCap || vIsLow) {
      result += String.fromCharCode(v);
      capNext = false;
    } else if (v >= 48 && v <= 57) {
      // '0' to '9'
      result += String.fromCharCode(v);
      capNext = true;
    } else {
      capNext = s[i] === "_" || s[i] === " " || s[i] === "-" || s[i] === ".";
    }
  }
  return result;
}
