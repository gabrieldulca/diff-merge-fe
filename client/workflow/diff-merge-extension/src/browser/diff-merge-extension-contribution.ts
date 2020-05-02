import { injectable, inject } from "inversify";
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MessageService } from "@theia/core/lib/common";
import { CommonMenus } from "@theia/core/lib/browser";
import { MyService } from "../common";

export const DiffMergeExtensionCommand = {
    id: 'DiffMergeExtension.command',
    label: "Shows a message"
};

@injectable()
export class DiffMergeExtensionCommandContribution implements CommandContribution {

    constructor(
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(MyService) protected readonly myService: MyService
    ) { }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(DiffMergeExtensionCommand, {
            execute: async () => {
                //const env = await this.myService.getEnvVariables();
                //this.messageService.info('Environment variables from the server: ' + JSON.stringify(env));
                console.log("getSetting - contribution");
                const setting = await this.myService.getSettingValue();
                console.log("obtained setting",setting);

                console.log(setting);
                this.messageService.info(JSON.stringify(setting));
            }
        });
    }
}

@injectable()
export class DiffMergeExtensionMenuContribution implements MenuContribution {

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(CommonMenus.EDIT_FIND, {
            commandId: DiffMergeExtensionCommand.id,
            label: 'Say Hello'
        });
    }
}
