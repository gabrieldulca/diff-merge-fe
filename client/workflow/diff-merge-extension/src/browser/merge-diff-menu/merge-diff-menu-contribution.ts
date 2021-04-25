import {
    CommandContribution,
    CommandRegistry,
    MAIN_MENU_BAR,
    MenuContribution,
    MenuModelRegistry,
    SelectionService
} from '@theia/core';
import {inject, injectable, interfaces} from 'inversify';
import {Command} from "@theia/core/src/common/command";
import {ComparisonService} from "../../common";
import {SplitPanelManager} from "../split-panel-manager";
import {DiffMergeDiagManager} from "../diff-merge-diag-manager";
import { GLSPClientContribution } from '@eclipse-glsp/theia-integration/lib/browser';

export function registerMergeDiffContextMenu(bind: interfaces.Bind): void {
    bind(MenuContribution).to(MergeDiffMenuContribution);
    bind(CommandContribution).to(MergeDiffMenuContribution);
    bind(GLSPClientContribution).to(MergeDiffMenuContribution);
}

@injectable()
export class MergeDiffMenuContribution implements MenuContribution,CommandContribution {

    @inject(SelectionService) protected readonly selectionService: SelectionService;
    @inject(ComparisonService) protected readonly comparisonService: ComparisonService;
    @inject(SplitPanelManager) protected readonly splitPanelManager: SplitPanelManager;
    @inject(DiffMergeDiagManager) protected readonly diffMergeDiagManager: DiffMergeDiagManager;

    private baseFilePath: string;
    private firstFilePath: string;
    private secondFilePath: string;

    public setFiles(baseFilePath: string, firstFilePath: string, secondFilePath: string): void {
        this.baseFilePath = baseFilePath;
        this.firstFilePath = firstFilePath;
        this.secondFilePath = secondFilePath;
    }

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
                //const comparison = await this.comparisonService.getSingleMergeResult(this.baseComparisonFile.path.toString(), firstComparisonFile!.path.toString(),this.selectionService.selection, false);
                console.log("pressed merge",this.selectionService.selection);
                console.log("pressed merge",this.baseFilePath);
                console.log("pressed merge",this.firstFilePath);
                console.log("pressed merge",this.secondFilePath);
            }
        });
        registry.registerCommand(REVERT, {
            execute: async () => {
                console.log("pressed revert",this.selectionService.selection);
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
