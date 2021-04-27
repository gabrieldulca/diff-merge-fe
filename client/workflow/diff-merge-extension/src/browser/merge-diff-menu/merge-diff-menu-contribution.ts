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
import {DiffTreeNode} from "../diff-tree/diff-tree-node";

import {DiffMergeDiagWidget} from "../diff-merge-diag-widget";
import { RequestModelAction } from 'sprotty';

export function registerMergeDiffContextMenu(bind: interfaces.Bind): void {
    bind(MenuContribution).to(MergeDiffMenuContribution);
    bind(CommandContribution).to(MergeDiffMenuContribution);
    bind(GLSPClientContribution).to(MergeDiffMenuContribution);
}

@injectable()
export class MergeDiffMenuContribution implements MenuContribution,CommandContribution {
    static get secondFilePath(): string {
        return this._secondFilePath;
    }

    static set secondFilePath(value: string) {
        this._secondFilePath = value;
    }
    static get firstFilePath(): string {
        return this._firstFilePath;
    }

    static set firstFilePath(value: string) {
        this._firstFilePath = value;
    }
    static get baseFilePath(): string {
        return this._baseFilePath;
    }

    static set baseFilePath(value: string) {
        this._baseFilePath = value;
    }

    @inject(SelectionService) protected readonly selectionService: SelectionService;
    @inject(ComparisonService) protected readonly comparisonService: ComparisonService;
    @inject(SplitPanelManager) protected readonly splitPanelManager: SplitPanelManager;
    @inject(DiffMergeDiagManager) protected readonly diffMergeDiagManager: DiffMergeDiagManager;

    public static _baseFilePath: string;
    public static _firstFilePath: string;
    public static _secondFilePath: string;

    public setFiles(baseFilePath1: string, firstFilePath1: string, secondFilePath1: string): void {
        MergeDiffMenuContribution.baseFilePath = baseFilePath1;
        MergeDiffMenuContribution.firstFilePath = firstFilePath1;
        MergeDiffMenuContribution.secondFilePath = secondFilePath1;
        console.log("files set to menu");
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
                const selectedElem:DiffTreeNode = <DiffTreeNode>this.selectionService.selection;
                console.log("pressed merge", selectedElem.id);
                await this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.id, false);

                const comparison = await this.comparisonService.getComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath);

                delay(300).then(() => {
                    console.log("current diffs", comparison);
                    console.log("SplitpanelManager", this.splitPanelManager);


                    const leftWidget: DiffMergeDiagWidget = this.splitPanelManager.getLeftWidget();
                    const rightWidget: DiffMergeDiagWidget = this.splitPanelManager.getRightWidget();
                    console.log("leftWidget", leftWidget.uri.path.toString());
                    console.log("rightWidget", rightWidget.uri.path.toString());
                    leftWidget.actionDispatcher.dispatch(new RequestModelAction({
                        sourceUri: decodeURI(leftWidget.uri.path.toString()),
                        needsClientLayout: 'true',
                        needsServerLayout: 'true'
                    }));
                    /*leftWidget.glspActionDispatcher.onceModelInitialized().then(function () {

                        const diffAction = new ApplyDiffAction(comparison, leftWidget.id);
                        leftWidget.glspActionDispatcher.dispatch(diffAction);
                        console.log(diffAction);

                        leftWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                        leftWidget.glspActionDispatcher.dispatch(new EnableFileNameAction(MergeDiffMenuContribution.baseFilePath));
                    });*/
                });
            }
        });
        registry.registerCommand(REVERT, {
            execute: async () => {
                const selectedElem:DiffTreeNode = <DiffTreeNode>this.selectionService.selection;
                console.log("pressed revert", selectedElem.id);
                await this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.id, true);

                const comparison = await this.comparisonService.getComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath);

                delay(300).then(() => {
                    console.log("current diffs", comparison);
                    console.log("SplitpanelManager", this.splitPanelManager);


                    const leftWidget: DiffMergeDiagWidget = this.splitPanelManager.getLeftWidget();
                    const rightWidget: DiffMergeDiagWidget = this.splitPanelManager.getRightWidget();
                    console.log("leftWidget", leftWidget.uri.path.toString());
                    console.log("rightWidget", rightWidget.uri.path.toString());
                    rightWidget.actionDispatcher.dispatch(new RequestModelAction({
                        sourceUri: decodeURI(rightWidget.uri.path.toString()),
                        needsClientLayout: 'true',
                        needsServerLayout: 'true'
                    }));
                });
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

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
