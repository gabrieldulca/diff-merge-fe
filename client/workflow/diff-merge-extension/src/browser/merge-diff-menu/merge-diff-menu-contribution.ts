import {CommandContribution, CommandRegistry, MAIN_MENU_BAR, MenuContribution, MenuModelRegistry} from '@theia/core';
import { injectable, interfaces } from 'inversify';
import {Command} from "@theia/core/src/common/command";

export function registerMergeDiffContextMenu(bind: interfaces.Bind): void {
    bind(MenuContribution).to(MergeDiffMenuContribution);
    bind(CommandContribution).to(MergeDiffMenuContribution);
}

@injectable()
export class MergeDiffMenuContribution implements MenuContribution,CommandContribution {
    static readonly MERGE_DIFF = [...MAIN_MENU_BAR, 'merge-diff'];
    registerMenus(menus: MenuModelRegistry): void {
        menus.registerSubmenu(MergeDiffMenuContribution.MERGE_DIFF, 'Resolve difference');
        menus.registerMenuAction(MergeDiffMenuContribution.MERGE_DIFF, {
            commandId: MERGE.id,
            order: '0'
        });
        menus.registerMenuAction(MergeDiffMenuContribution.MERGE_DIFF, {
            commandId: REVERT.id,
            order: '1'
        });
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(MERGE, {
            execute: async () => {
                console.log("pressed merge");
            }
        });
        registry.registerCommand(REVERT, {
            execute: async () => {
                console.log("pressed revert");
            }
        });
    }
}

export const MERGE: Command = {
    id: 'core.merge',
    label: 'Merge'
};

export const REVERT: Command = {
    id: 'core.revert',
    label: 'Revert'
};
