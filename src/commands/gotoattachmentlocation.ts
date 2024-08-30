import { ExtensionManager } from "../manager";
import { AttachmentTreeItem, CommandTreeItem } from "../tree";
import * as vscode from "vscode";
import { showTextDocumentAtPosition } from "../utils";
import path = require("path");
import { readManifestAST, readManifestFile } from "../manifest";

async function getAttachmentPositionInFile(
  filename: string,
  attachmentName: string,
): Promise<vscode.Position | undefined> {
  try {
    const mani = await readManifestAST(filename);
    return mani.getPosition(`attachments.[name=${attachmentName}]`);
  } catch (error) {}
  return undefined;
}

export async function gotoAttachmentManifestLocationCmd(manager: ExtensionManager, args: any[] | undefined) {
  manager.logger.debug("goto attachment manifest location command");
  let attachmentName: string | undefined;
  if (args && args.length > 0) {
    const a0 = args[0];
    if (a0 === undefined) {
      const manifest = await readManifestFile(manager.getActiveWorkspacePackageFilename());
      if (manifest) {
        const items: vscode.QuickPickItem[] | undefined = manifest.attachments?.map((c) => ({
          label: c.title || c.name || "?",
          description: c.name || "?",
        }));
        if (items) {
          const pick = await vscode.window.showQuickPick(items);
          if (pick) {
            attachmentName = pick.description;
          }
        } else {
          throw Error("No commands defined");
        }
      }
    } else if (a0 instanceof AttachmentTreeItem) {
      const item = a0 as AttachmentTreeItem;
      if (!item.attachment.name) {
        throw Error("No attachment name defined");
      }
      attachmentName = item.attachment.name;
    } else {
      throw Error("Wrong argument type");
    }
  }

  if (attachmentName) {
    const ws = manager.getActiveWorkspace();
    if (!ws) {
      throw Error("No active workspace");
    }
    const filename = path.join(ws.uri.fsPath, "package.json");
    const pos = await getAttachmentPositionInFile(filename, attachmentName);
    const uri = vscode.Uri.file(filename);
    await showTextDocumentAtPosition(uri, pos);
  }
}
