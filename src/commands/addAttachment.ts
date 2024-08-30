import { ExtensionManager } from "../manager";
import * as vscode from "vscode";
import path = require("path");
import { capitalizeFirstLetter, fileExists, showTextDocumentAtPosition, toCamelCase } from "../utils";
import * as fs from "fs";
import { AIAttachmentProvider, Manifest } from "../manifest";
import editJsonFile = require("edit-json-file");
import { showCustomQuickPick } from "../picker";
import { getAssetsFromFolder } from "../assets";

async function askName(
  attachment: AIAttachmentProvider,
  existingCmds: string[],
  existingAttachments: string[],
): Promise<string | undefined> {
  const result = await vscode.window.showInputBox({
    title: "Name",
    placeHolder: "Enter AI Attachment Provider Name",
    validateInput: (text) => {
      if (text.length <= 0) {
        return "Name could not be empty";
      }
      if (text.length < 2) {
        return "Attachment Name needs to have at least 2 characters";
      }
      if (existingCmds.includes(text)) {
        return "Command with the same name already exists";
      }
      if (existingAttachments.includes(text)) {
        return "Attachment with the same name already exists";
      }
      const pattern = /^[a-zA-Z0-9-._~]*$/;
      if (!pattern.test(text)) {
        return "Only a-z, A-Z, 0-9, -, ., _, ~ are allowed";
      }
      return null;
    },
  });
  if (result !== undefined) {
    attachment.name = result;
    return result;
  }
  return undefined;
}

async function askTitle(attachment: AIAttachmentProvider): Promise<string | undefined> {
  const result = await vscode.window.showInputBox({
    value: capitalizeFirstLetter(attachment.name),
    placeHolder: "Enter Attachment Title or leave empty",
    title: "Title",
    validateInput: (text) => {
      if (text.length > 0 && text.length < 2) {
        return "Command Attachment needs to have at least 2 characters";
      }
      return null;
    },
  });
  if (result !== undefined) {
    if (result.length > 0) {
      attachment.title = result;
    }
    return result;
  } else {
    return undefined;
  }
}

async function askDescription(attachment: AIAttachmentProvider): Promise<string | undefined> {
  const result = await vscode.window.showInputBox({
    placeHolder: "Enter Description",
    title: "Description",
    validateInput: (text) => {
      if (text.length <= 0) {
        return "Description could not be empty";
      }
      if (text.length < 12) {
        return "Description needs to have at least 12 characters";
      }
      return null;
    },
  });
  if (result !== undefined) {
    if (result.length > 0) {
      attachment.description = result;
    }
    return result;
  } else {
    return undefined;
  }
}

async function askMode(attachment: AIAttachmentProvider): Promise<string | undefined> {
  const result = await vscode.window.showQuickPick(["direct", "submenu", "typeahead submenu"], {
    placeHolder: "Choose Attachment Mode",
    title: "Mode",
  });
  if (result !== undefined) {
    if (result.length > 0) {
      attachment.mode = result;
    }
    return result;
  } else {
    return undefined;
  }
}

async function askIcon(attachment: AIAttachmentProvider, rootFolder: string): Promise<string | undefined> {
  const assetsFolder = path.join(rootFolder, "assets");
  const files = (await getAssetsFromFolder(assetsFolder)).filter((f) => f.endsWith(".png") || f.endsWith(".svg"));
  const result = await showCustomQuickPick(["", ...files], {
    placeholder: "Enter or choose icon or leave empty",
    title: "Icon",
  });
  if (result !== undefined) {
    if (result.length > 0) {
      attachment.icon = result;
    }
    return result;
  } else {
    return undefined;
  }
}

export function makeAttachmentFilename(name: string | undefined) {
  if (!name) {
    return name;
  }
  let result = name ?? "";
  result = result.replaceAll(/[\s]/g, "");
  result = `${result[0].toLocaleLowerCase()}${result.slice(1)}`;
  return result;
}

export async function addAttachmentCmd(manager: ExtensionManager) {
  manager.logger.debug("add attachment to package.json");
  const ws = manager.getActiveWorkspace();
  if (ws) {
    const pkgJSON = path.join(ws.uri.fsPath, "package.json");
    if (await fileExists(pkgJSON)) {
      const bytes = await fs.promises.readFile(pkgJSON);
      const manifest = JSON.parse(bytes.toString()) as Manifest;
      const attachment: AIAttachmentProvider = {};
      const attachmentID = await askName(
        attachment,
        manifest.commands?.map((c) => c.name || "") || [],
        manifest.attachments?.map((c) => c.name || "") || [],
      );
      if (attachmentID) {
        if ((await askTitle(attachment)) === undefined) {
          return;
        }
        if ((await askDescription(attachment)) === undefined) {
          return;
        }
        if ((await askMode(attachment)) === undefined) {
          return;
        }
        if ((await askIcon(attachment, ws.uri.fsPath)) === undefined) {
          return undefined;
        }

        attachment.name = makeAttachmentFilename(attachment.name);

        const srcFolder = path.join(ws.uri.fsPath, "src");
        if (!(await fileExists(srcFolder))) {
          fs.promises.mkdir(srcFolder, { recursive: true });
        }
        const tsFilename = path.join(srcFolder, `${attachment.name}.ts`);
        if (!(await fileExists(tsFilename))) {
          let lines: string[] = [
            `const attachment: Attachments.${toCamelCase(attachment.name)} = async () => {`,
            '  return "Some content";',
            "};",
            "",
            "export default attachment;",
            "",
          ];
          switch (attachment.mode) {
            case "submenu":
              {
                lines = [
                  `const attachment: Attachments.${toCamelCase(attachment.name)} = async () => {`,
                  "  return [",
                  "    {",
                  '      id: "bulbasaur",',
                  '      title: "Bulbasaur",',
                  "      content: () => {",
                  '        return "Starter green pokemon";',
                  "      },",
                  "    },",
                  "    {",
                  '      id: "charmander",',
                  '      title: "Charmander",',
                  "      content: () => {",
                  '        return "Starter red pokemon";',
                  "      },",
                  "    },",
                  "    {",
                  '      id: "squirtle",',
                  '      title: "Squirtle",',
                  "      content: () => {",
                  '        return "Starter blue pokemon";',
                  "      },",
                  "    },",
                  "  ];",
                  "};",
                  "",
                  "export default attachment;",
                  "",
                ];
              }
              break;
            case "typeahead submenu":
              {
                lines = [
                  `const attachment: Attachments.${toCamelCase(attachment.name)} = async (input) => {`,
                  "  console.log(input);",
                  "  // return some results depending on the input",
                  "  return [",
                  "    {",
                  '      id: "bulbasaur",',
                  '      title: "Bulbasaur",',
                  "      content: () => {",
                  '        return "Starter green pokemon";',
                  "      },",
                  "    },",
                  "    {",
                  '      id: "charmander",',
                  '      title: "Charmander",',
                  "      content: () => {",
                  '        return "Starter red pokemon";',
                  "      },",
                  "    },",
                  "    {",
                  '      id: "squirtle",',
                  '      title: "Squirtle",',
                  "      content: () => {",
                  '        return "Starter blue pokemon";',
                  "      },",
                  "    },",
                  "  ];",
                  "};",
                  "",
                  "export default attachment;",
                  "",
                ];
              }
              break;
          }
          fs.promises.writeFile(tsFilename, lines.join("\n"));
          manager.logger.debug(`Created file ${tsFilename}`);
        }
        const j = editJsonFile(pkgJSON);
        j.append("attachments", attachment);
        j.save();

        showTextDocumentAtPosition(vscode.Uri.file(tsFilename)).catch(() => {
          vscode.window.showErrorMessage(`Failed to open file ${tsFilename}`);
        });
        await manager.updateState();
      }
    } else {
      throw Error("Workspace does not contain a package.json file");
    }
  } else {
    throw Error("No active Workspace");
  }
}
