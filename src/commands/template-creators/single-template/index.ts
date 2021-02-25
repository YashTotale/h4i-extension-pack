// Externals
import { env, window, Uri, workspace } from "vscode";
import { join } from "path";
import { promises } from "fs";
import { writeFile as writeJSONFile } from "jsonfile";

// Internals
import { BaseCommand, getSingleFolder } from "../../helpers";

const { writeFile } = promises;

interface SingleTemplateParams {
  name: string;
  template: string | Record<string, any>;
  templateFileName: string;
  docsLink: string;
  isConfig: boolean;
}

export default class SingleTemplate extends BaseCommand {
  static readonly VIEW_TEMPLATE = "View Template";
  static readonly VIEW_DOCS = "View Docs";

  // Provided instance vars
  name: string;
  templateFileName: string;
  template: string | Record<string, any>;
  docsLink: string;
  isConfig: boolean;

  // Constructed instance vars
  onSuccess: string;

  constructor(params: SingleTemplateParams) {
    super();
    const { name, templateFileName, template, docsLink, isConfig } = params;

    this.name = name;
    this.templateFileName = templateFileName;
    this.template = template;
    this.docsLink = docsLink;
    this.isConfig = isConfig;

    this.title = `Create ${name}${isConfig ? " Configuration" : ""} Template`;
    this.cmdName = `template.create.${name}${isConfig ? "Config" : ""}`;
    this.onSuccess = `Created ${name}${
      isConfig ? " Configuration" : ""
    } Template!`;
  }

  async handler(...args: any[]): Promise<void> {
    await super.handler(...args);
    const folderResult = await getSingleFolder();

    if (folderResult) {
      const filePath = await this.writeTemplateFile(folderResult);

      await this.showSuccessMessage(filePath);
    }
  }

  async writeTemplateFile(folder: Uri): Promise<string> {
    const filePath = join(folder.fsPath, this.templateFileName);

    typeof this.template === "string"
      ? await writeFile(filePath, this.template, "utf-8")
      : await writeJSONFile(filePath, this.template, {
          EOL: "\n",
          spaces: 2,
        });

    return filePath;
  }

  async showSuccessMessage(filePath: string): Promise<void> {
    const selected = await window.showInformationMessage(
      this.onSuccess,
      SingleTemplate.VIEW_TEMPLATE,
      SingleTemplate.VIEW_DOCS
    );

    if (selected === SingleTemplate.VIEW_TEMPLATE) {
      const doc = await workspace.openTextDocument(filePath);
      await window.showTextDocument(doc);
    } else if (selected === SingleTemplate.VIEW_DOCS)
      await env.openExternal(Uri.parse(this.docsLink));
  }
}