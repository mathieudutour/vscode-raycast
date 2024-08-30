import path = require("path");
import * as vscode from "vscode";
import { ExtensionManager } from "../manager";
import { readManifestFile } from "../manifest";
import { AttachmentTreeItem } from "../tree";
import { fileExists } from "../utils";

async function findAttachmentFileInFolder(attachmentName: string, folder: string): Promise<string> {
  const exts = ["tsx", "ts", "jsx", "js"];
  for (const e of exts) {
    const fn = path.join(folder, `${attachmentName}.${e}`);
    if (await fileExists(fn)) {
      return fn;
    }
  }
  return path.join(folder, `${attachmentName}.tsx`); // return default
}

export async function openAttachmentCmd(manager: ExtensionManager, args: any[] | undefined) {
  manager.logger.debug("open attachment");
  let attachmentName: string | undefined;
  if (args && args.length > 0) {
    const a0 = args[0];
    if (a0 === undefined) {
      const manifest = await readManifestFile(manager.getActiveWorkspacePackageFilename());
      if (manifest) {
        const attachments: vscode.QuickPickItem[] | undefined = manifest.attachments?.map((c) => ({
          label: c.title || c.name || "?",
          description: c.name || "?",
        }));
        if (!attachments) {
          throw Error("No attachments in manifest");
        }
        const pick = await vscode.window.showQuickPick(attachments, {
          placeHolder: "Choose AI Attachment Providers",
          title: "Attachment",
        });
        if (pick === undefined) {
          return;
        }
        attachmentName = pick.description;
      } else {
        throw Error("Could not read manifest");
      }
    } else if (a0 instanceof AttachmentTreeItem) {
      const item = a0 as AttachmentTreeItem;
      if (!item.attachment?.name) {
        throw Error("No attachment name defined");
      }
      attachmentName = item.attachment?.name;
    } else {
      throw Error("Wrong argument type");
    }
  }
  if (attachmentName && attachmentName.length > 0) {
    const ws = manager.getActiveWorkspace();
    if (ws) {
      const src = path.join(ws.uri.fsPath, "src");
      const fn = await findAttachmentFileInFolder(attachmentName, src);
      manager.logger.debug(`open file ${fn}`);
      await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(fn));
    }
  }
}
