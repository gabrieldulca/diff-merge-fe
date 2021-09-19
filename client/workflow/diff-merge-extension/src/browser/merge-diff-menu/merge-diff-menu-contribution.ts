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
import {RequestModelAction} from 'sprotty';
import {ApplyDiffAction} from "@eclipse-glsp-examples/workflow-sprotty";
import {DiffTreeWidget} from "../diff-tree/diff-tree-widget";
import { ComparisonDto } from '@eclipse-glsp-examples/workflow-sprotty/lib/diffmerge';
import {DiffMergeExtensionCommandContribution} from "../diff-merge-extension-contribution";

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
    public static diffTreeWidget: DiffTreeWidget;

    public setFiles(diffTreeWidget: DiffTreeWidget, baseFilePath1: string, firstFilePath1: string, secondFilePath1: string): void {
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

                if(MergeDiffMenuContribution.secondFilePath === "") {
                    console.log("NO THREEWAY APPLYING OF CHANGES", MergeDiffMenuContribution.secondFilePath);
                    await this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, false)
                    .then(() => {
                            this.comparisonService.getComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath)
                                .then((result) => {
                                    MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                                });
                        });
                } else {
                    console.log("THREEWAY APPLYING OF CHANGES", MergeDiffMenuContribution.secondFilePath);
                    if(selectedElem.diffSource === "LEFT") {
                        this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, false)
                            .then(() => {
                                this.comparisonService.getThreeWayComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, MergeDiffMenuContribution.secondFilePath)
                                    .then((result) => {
                                        MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                                    });
                            });
                    } else if (selectedElem.diffSource === "RIGHT") {
                        this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.secondFilePath, selectedElem.modelElementId, false)
                            .then(() => {
                                this.comparisonService.getThreeWayComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, MergeDiffMenuContribution.secondFilePath)
                                    .then((result) => {
                                        MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                                    });
                            });
                    }
                }
            }
        });
        registry.registerCommand(REVERT, {
            execute: async () => {
                const selectedElem: DiffTreeNode = <DiffTreeNode>this.selectionService.selection;
                console.log("pressed revert", selectedElem.modelElementId);
                await this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, true);

                if(MergeDiffMenuContribution.secondFilePath === "") {
                    console.log("NO THREEWAY APPLYING OF CHANGES", MergeDiffMenuContribution.secondFilePath);
                    this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, true)
                        .then(() => {
                             this.comparisonService.getComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath)
                                .then((result) => {
                                    MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                                });
                        });
                } else {
                    console.log("THREEWAY APPLYING OF CHANGES", MergeDiffMenuContribution.secondFilePath);
                    if(selectedElem.diffSource === "LEFT") {
                        this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, true)
                            .then(() => {
                                this.comparisonService.getThreeWayComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, MergeDiffMenuContribution.secondFilePath)
                                .then((result) => {
                                    MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                                });
                            });
                    } else if (selectedElem.diffSource === "RIGHT") {
                        this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.secondFilePath, selectedElem.modelElementId, true)
                        .then(() => {
                                this.comparisonService.getThreeWayComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, MergeDiffMenuContribution.secondFilePath)
                                    .then((result) => {
                                        MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                                    });
                            });
                    }
                }
            }
        });
    }

    public static refreshComparison(comparison: ComparisonDto, splitPanelManager: SplitPanelManager) {
        let additions: DiffTreeNode[] = [];
        let deletions: DiffTreeNode[] = [];
        let changes: DiffTreeNode[] = [];
        const leftWidget: DiffMergeDiagWidget = splitPanelManager.getLeftWidget();
        const rightWidget: DiffMergeDiagWidget = splitPanelManager.getRightWidget();
        if (MergeDiffMenuContribution.secondFilePath === "") {
            leftWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                const diffAction = new ApplyDiffAction(comparison, leftWidget.id);

                leftWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                    deletions = diffAction.deletionsTree as DiffTreeNode[];
                }).then(() => {
                    rightWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                        const diffAction = new ApplyDiffAction(comparison, rightWidget.id);

                        rightWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                            changes = diffAction.changesTree as DiffTreeNode[];
                            additions = diffAction.additionsTree as DiffTreeNode[];
                        }).then(() => {
                            MergeDiffMenuContribution.diffTreeWidget.setChanges(additions, deletions, changes);
                        }).then(() => {
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
                        });
                    });
                });
            });
        } else {
            const leftWidget: DiffMergeDiagWidget = splitPanelManager.getLeftWidget();
            const rightWidget: DiffMergeDiagWidget = splitPanelManager.getRightWidget();
            const baseWidget: DiffMergeDiagWidget = splitPanelManager.getBaseWidget();
            leftWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                const diffAction = new ApplyDiffAction(comparison, leftWidget.id, undefined, "left");
                leftWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                    additions = additions.concat(diffAction.additionsTree as DiffTreeNode[]);
                    changes = changes.concat(diffAction.changesTree as DiffTreeNode[]);
                }).then(() => {
                    baseWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                        const diffAction = new ApplyDiffAction(comparison, baseWidget.id, undefined, "base");
                        baseWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                            changes = changes.concat(diffAction.changesTree as DiffTreeNode[]);
                            deletions = diffAction.deletionsTree as DiffTreeNode[];
                        }).then(() => {
                            rightWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                                const diffAction = new ApplyDiffAction(comparison, rightWidget.id, undefined, "right");
                                rightWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                                    additions = additions.concat(diffAction.additionsTree as DiffTreeNode[]);
                                    changes = changes.concat(diffAction.changesTree as DiffTreeNode[]);
                                }).then(function () {
                                    //TODO maybe migrate to backend
                                    changes = DiffMergeExtensionCommandContribution.handleConflicts(changes);
                                    MergeDiffMenuContribution.diffTreeWidget.setChanges(additions, deletions, changes);
                                }).then(() => {
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
                                        baseWidget.actionDispatcher.dispatch(new RequestModelAction({
                                            sourceUri: decodeURI(baseWidget.uri.path.toString()),
                                            needsClientLayout: 'true',
                                            needsServerLayout: 'true'
                                        }));
                                    }
                                });
                            });
                        });
                    });
                });
            });
        }
    }
}



export const MERGE: Command = {
    id: 'core.merge',
    label: 'Apply'
};

export const REVERT: Command = {
    id: 'core.revert',
    label: 'Discard'
};
