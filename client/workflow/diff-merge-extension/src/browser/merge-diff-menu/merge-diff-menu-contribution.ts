import {
    CommandContribution,
    CommandRegistry,
    MAIN_MENU_BAR,
    MenuContribution,
    MenuModelRegistry,
    SelectionService
} from "@theia/core";
import { Command } from "@theia/core/src/common/command";
import { inject, injectable, interfaces } from "inversify";
import { RequestModelAction } from "sprotty";

import { ComparisonService } from "../../common";
import { DiffMergeDiagManager } from "../diff-merge-diag-manager";
import { DiffMergeDiagWidget } from "../diff-merge-diag-widget";
import { DiffTreeNode } from "../diff-tree/diff-tree-node";
import { DiffViewWidget } from "../diff-tree/diff-tree-widget";
import { SplitPanelManager } from "../split-panel-manager";

export function registerMergeDiffContextMenu(bind: interfaces.Bind): void {
    bind(MenuContribution).to(MergeDiffMenuContribution);
    bind(CommandContribution).to(MergeDiffMenuContribution);
    bind(GLSPClientContribution).to(MergeDiffMenuContribution);
}

@injectable()
export class MergeDiffMenuContribution implements MenuContribution, CommandContribution {
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
    public static diffTreeWidget: DiffViewWidget;

    public setFiles(diffTreeWidget: DiffViewWidget, baseFilePath1: string, firstFilePath1: string, secondFilePath1: string): void {
        MergeDiffMenuContribution.diffTreeWidget = diffTreeWidget;
        MergeDiffMenuContribution.baseFilePath = baseFilePath1;
        MergeDiffMenuContribution.firstFilePath = firstFilePath1;
        MergeDiffMenuContribution.secondFilePath = secondFilePath1;
        console.log("files set to menu", MergeDiffMenuContribution.diffTreeWidget);
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
                const selectedElem: DiffTreeNode = <DiffTreeNode>this.selectionService.selection;
                console.log("pressed merge", selectedElem);
                console.log("diffTreeWidget", MergeDiffMenuContribution.diffTreeWidget);
                console.log("MergeDiffMenuContribution.secondFilePath", MergeDiffMenuContribution.secondFilePath);
                console.log("MergeDiffMenuContribution.baseFilePath", MergeDiffMenuContribution.baseFilePath);
                console.log("MergeDiffMenuContribution.firstFilePath", MergeDiffMenuContribution.firstFilePath);

                let comparison:ComparisonDto;
                if(MergeDiffMenuContribution.secondFilePath === "") {
                    console.log("NO THREEWAY APPLYING OF CHANGES", MergeDiffMenuContribution.secondFilePath);
                    await this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, false);
                    comparison = await this.comparisonService.getComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath);
                } else {
                    console.log("THREEWAY APPLYING OF CHANGES", MergeDiffMenuContribution.secondFilePath);
                    if(selectedElem.diffSource === "left") {
                        await this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, false);
                    } else if (selectedElem.diffSource === "right") {
                        await this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.secondFilePath, selectedElem.modelElementId, false);
                    }
                    comparison = await this.comparisonService.getThreeWayComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, MergeDiffMenuContribution.secondFilePath);
                }

                delay(300).then(() => {
                    let additions: DiffTreeNode[] = [];
                    let deletions: DiffTreeNode[] = [];
                    let changes: DiffTreeNode[] = [];
                    const leftWidget: DiffMergeDiagWidget = this.splitPanelManager.getLeftWidget();
                    const rightWidget: DiffMergeDiagWidget = this.splitPanelManager.getRightWidget();
                    console.log("this.splitPanelManager.getLeftWidget()", this.splitPanelManager.getLeftWidget());
                    console.log("this.splitPanelManager.getRightWidget()", this.splitPanelManager.getRightWidget());
                    if (MergeDiffMenuContribution.secondFilePath === "") {
                        leftWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison, leftWidget.id);

                            leftWidget.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                changes = diffAction.changesTree as DiffTreeNode[];
                            });
                            console.log("deltions for tree", diffAction.deletionsTree);

                            deletions = diffAction.deletionsTree as DiffTreeNode[];

                        });

                        rightWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison, rightWidget.id);

                            rightWidget.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                changes = diffAction.changesTree as DiffTreeNode[];
                            });
                            console.log("additions for tree", diffAction.additionsTree);

                            additions = diffAction.additionsTree as DiffTreeNode[];

                        });
                    } else {
                        const leftWidget: DiffMergeDiagWidget = this.splitPanelManager.getLeftWidget();
                        const rightWidget: DiffMergeDiagWidget = this.splitPanelManager.getRightWidget();
                        const baseWidget: DiffMergeDiagWidget = this.splitPanelManager.getBaseWidget();
                        leftWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison, leftWidget.id, undefined, "left");
                            leftWidget.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                console.log("additions for tree", diffAction.additionsTree);
                                additions = additions.concat(diffAction.additionsTree as DiffTreeNode[]);
                            });
                        });
                        baseWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison, baseWidget.id, undefined, "base");
                            baseWidget.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                changes = diffAction.changesTree as DiffTreeNode[];
                            });
                            console.log("deltions for tree", diffAction.deletionsTree);
                            deletions = diffAction.deletionsTree as DiffTreeNode[];
                        });
                        rightWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison, rightWidget.id, undefined, "right");
                            rightWidget.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                console.log("additions for tree", diffAction.additionsTree);
                                additions = additions.concat(diffAction.additionsTree as DiffTreeNode[]);
                            });
                        });
                    }

                    delay(900).then(() => {
                        MergeDiffMenuContribution.diffTreeWidget.setChanges(additions, deletions, changes);
                    });

                });
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
                    rightWidget.actionDispatcher.dispatch(new RequestModelAction({
                        sourceUri: decodeURI(rightWidget.uri.path.toString()),
                        needsClientLayout: 'true',
                        needsServerLayout: 'true'
                    }));
                    if (MergeDiffMenuContribution.secondFilePath !== "") {
                        const baseWidget: DiffMergeDiagWidget = this.splitPanelManager.getBaseWidget();
                        console.log("baseWidget", baseWidget.uri.path.toString());
                        baseWidget.actionDispatcher.dispatch(new RequestModelAction({
                            sourceUri: decodeURI(baseWidget.uri.path.toString()),
                            needsClientLayout: 'true',
                            needsServerLayout: 'true'
                        }));
                    }

                });
            }
        });
        registry.registerCommand(REVERT, {
            execute: async () => {
                const selectedElem: DiffTreeNode = <DiffTreeNode>this.selectionService.selection;
                console.log("pressed revert", selectedElem.modelElementId);
                await this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, true);

                let comparison:ComparisonDto;
                if(MergeDiffMenuContribution.secondFilePath === "") {
                    console.log("NO THREEWAY APPLYING OF CHANGES", MergeDiffMenuContribution.secondFilePath);
                    await this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, true);
                    comparison = await this.comparisonService.getComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath);
                } else {
                    console.log("THREEWAY APPLYING OF CHANGES", MergeDiffMenuContribution.secondFilePath);
                    if(selectedElem.diffSource === "left") {
                        await this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, true);
                    } else if (selectedElem.diffSource === "right") {
                        await this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.secondFilePath, selectedElem.modelElementId, true);
                    }
                    comparison = await this.comparisonService.getThreeWayComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, MergeDiffMenuContribution.secondFilePath);
                }

                delay(300).then(() => {
                    let additions: DiffTreeNode[] = [];
                    let deletions: DiffTreeNode[] = [];
                    let changes: DiffTreeNode[] = [];
                    const leftWidget: DiffMergeDiagWidget = this.splitPanelManager.getLeftWidget();
                    const rightWidget: DiffMergeDiagWidget = this.splitPanelManager.getRightWidget();
                    console.log("this.splitPanelManager.getLeftWidget()", this.splitPanelManager.getLeftWidget());
                    console.log("this.splitPanelManager.getRightWidget()", this.splitPanelManager.getRightWidget());
                    if (MergeDiffMenuContribution.secondFilePath === "") {
                        leftWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison, leftWidget.id);

                            leftWidget.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                changes = diffAction.changesTree as DiffTreeNode[];
                            });
                            console.log("deltions for tree", diffAction.deletionsTree);

                            deletions = diffAction.deletionsTree as DiffTreeNode[];

                        });

                        rightWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison, rightWidget.id);

                            rightWidget.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                changes = diffAction.changesTree as DiffTreeNode[];
                            });
                            console.log("additions for tree", diffAction.additionsTree);

                            additions = diffAction.additionsTree as DiffTreeNode[];

                        });
                    } else {
                        const leftWidget: DiffMergeDiagWidget = this.splitPanelManager.getLeftWidget();
                        const rightWidget: DiffMergeDiagWidget = this.splitPanelManager.getRightWidget();
                        const baseWidget: DiffMergeDiagWidget = this.splitPanelManager.getBaseWidget();
                        leftWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison, leftWidget.id, undefined, "left");
                            leftWidget.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                console.log("additions for tree", diffAction.additionsTree);
                                additions = additions.concat(diffAction.additionsTree as DiffTreeNode[]);
                            });
                        });
                        baseWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison, baseWidget.id, undefined, "base");
                            baseWidget.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                changes = diffAction.changesTree as DiffTreeNode[];
                            });
                            console.log("deltions for tree", diffAction.deletionsTree);
                            deletions = diffAction.deletionsTree as DiffTreeNode[];
                        });
                        rightWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison, rightWidget.id, undefined, "right");
                            rightWidget.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                console.log("additions for tree", diffAction.additionsTree);
                                additions = additions.concat(diffAction.additionsTree as DiffTreeNode[]);
                            });
                        });
                    }

                    delay(900).then(() => {
                        MergeDiffMenuContribution.diffTreeWidget.setChanges(additions, deletions, changes);
                    });

                });
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
                    rightWidget.actionDispatcher.dispatch(new RequestModelAction({
                        sourceUri: decodeURI(rightWidget.uri.path.toString()),
                        needsClientLayout: 'true',
                        needsServerLayout: 'true'
                    }));
                    if (MergeDiffMenuContribution.secondFilePath !== "") {
                        const baseWidget: DiffMergeDiagWidget = this.splitPanelManager.getBaseWidget();
                        console.log("baseWidget", baseWidget.uri.path.toString());
                        baseWidget.actionDispatcher.dispatch(new RequestModelAction({
                            sourceUri: decodeURI(baseWidget.uri.path.toString()),
                            needsClientLayout: 'true',
                            needsServerLayout: 'true'
                        }));
                    }

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
