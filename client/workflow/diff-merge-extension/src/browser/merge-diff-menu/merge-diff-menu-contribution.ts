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
import {CenterAction, RequestModelAction} from 'sprotty';
import {ApplyDiffAction} from "@eclipse-glsp-examples/workflow-sprotty";
import {DiffTreeWidget} from "../diff-tree/diff-tree-widget";
import {ComparisonDto, MatchDto} from '@eclipse-glsp-examples/workflow-sprotty/lib/diffmerge';
import {DiffMergeExtensionCommandContribution} from "../diff-merge-extension-contribution";

export function registerMergeDiffContextMenu(bind: interfaces.Bind): void {
    bind(MenuContribution).to(MergeDiffMenuContribution);
    bind(CommandContribution).to(MergeDiffMenuContribution);
    bind(GLSPClientContribution).to(MergeDiffMenuContribution);
}

/*
 * Context menu for applying and reverting changes
 */
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
        menus.registerMenuAction(MergeDiffMenuContribution.MERGE_DIFF, {
            commandId: MERGE.id,
            order: '0'
        });
        menus.registerMenuAction(MergeDiffMenuContribution.MERGE_DIFF, {
            commandId: REVERT.id,
            order: '1'
        });
    }

    /*
     * Commands for applying and reverting changes
     */
    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(MERGE, {
            execute: async () => {
                const selectedElem: DiffTreeNode = <DiffTreeNode>this.selectionService.selection;

                if (MergeDiffMenuContribution.secondFilePath === "") {
                    this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, false)
                    .then(() => {
                        MergeDiffMenuContribution.refreshComparison(MergeDiffMenuContribution.diffTreeWidget.comparison, this.splitPanelManager);
                        /*this.comparisonService.getComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath)
                            .then((result) => {
                                MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                            });*/
                        });
                } else {
                    if (selectedElem.diffSource === "LEFT") {
                        this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, false)
                            .then(() => {
                                MergeDiffMenuContribution.refreshComparison(MergeDiffMenuContribution.diffTreeWidget.comparison, this.splitPanelManager);
                                /*this.comparisonService.getThreeWayComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, MergeDiffMenuContribution.secondFilePath)
                                    .then((result) => {

                                    });*/
                            });
                    } else if (selectedElem.diffSource === "RIGHT") {
                        this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.secondFilePath, selectedElem.modelElementId, false)
                            .then(() => {
                                MergeDiffMenuContribution.refreshComparison(MergeDiffMenuContribution.diffTreeWidget.comparison, this.splitPanelManager);
                                /*this.comparisonService.getThreeWayComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, MergeDiffMenuContribution.secondFilePath)
                                    .then((result) => {
                                        MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                                    });*/
                            });
                    }
                }
                MergeDiffMenuContribution.diffTreeWidget.comparison = MergeDiffMenuContribution.removeFromComparison(MergeDiffMenuContribution.diffTreeWidget.comparison, selectedElem.modelElementId);
            }
        });
        registry.registerCommand(REVERT, {
            execute: async () => {
                const selectedElem: DiffTreeNode = <DiffTreeNode>this.selectionService.selection;
                this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, true);

                if (MergeDiffMenuContribution.secondFilePath === "") {
                    this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, true)
                        .then(() => {
                            MergeDiffMenuContribution.refreshComparison(MergeDiffMenuContribution.diffTreeWidget.comparison, this.splitPanelManager);
                             /*this.comparisonService.getComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath)
                                .then((result) => {
                                    MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                                });*/
                        });
                } else {
                    if (selectedElem.diffSource === "LEFT") {
                        this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, selectedElem.modelElementId, true)
                            .then(() => {
                                MergeDiffMenuContribution.refreshComparison(MergeDiffMenuContribution.diffTreeWidget.comparison, this.splitPanelManager);
                                /*this.comparisonService.getThreeWayComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, MergeDiffMenuContribution.secondFilePath)
                                .then((result) => {
                                    MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                                });*/
                            });
                    } else if (selectedElem.diffSource === "RIGHT") {
                        this.comparisonService.getSingleMergeResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.secondFilePath, selectedElem.modelElementId, true)
                        .then(() => {
                            MergeDiffMenuContribution.refreshComparison(MergeDiffMenuContribution.diffTreeWidget.comparison, this.splitPanelManager);
                            /*this.comparisonService.getThreeWayComparisonResult(MergeDiffMenuContribution.baseFilePath, MergeDiffMenuContribution.firstFilePath, MergeDiffMenuContribution.secondFilePath)
                                    .then((result) => {
                                        MergeDiffMenuContribution.refreshComparison(result, this.splitPanelManager);
                                    });*/
                            });
                    }
                }
                MergeDiffMenuContribution.diffTreeWidget.comparison = MergeDiffMenuContribution.removeFromComparison(MergeDiffMenuContribution.diffTreeWidget.comparison, selectedElem.modelElementId);
            }
        });
    }

    public static removeFromComparison(comparison: ComparisonDto, elementId: String): ComparisonDto {
        console.log("REMOVING ", elementId);
        console.log("from comparison ", comparison);
        let i;
        for(i = 0; i < comparison.matches.length; i++) {
            let match = comparison.matches[i];
            if((match.left != null) && (match.left.id === elementId)) {
                console.log("Found submatch in ", comparison.matches);
                comparison.matches = comparison.matches.filter(obj => obj !== match);
                break;
            } else if((match.right != null) && (match.right.id === elementId)) {
                console.log("Found submatch in ", comparison.matches);
                comparison.matches = comparison.matches.filter(obj => obj !== match);
                break;
            } if((match.origin != null) && (match.origin.id === elementId)) {
                console.log("Found submatch in ", comparison.matches);
                comparison.matches = comparison.matches.filter(obj => obj !== match);
                break;
            }
            if(comparison.matches[i].subMatches != null) {
                comparison.matches[i] = MergeDiffMenuContribution.removeFromMatch(comparison.matches[i], elementId);
                if(match.subMatches.length !== comparison.matches[i].subMatches.length) {
                    console.log("Found submatch in ", match);
                    break;
                }
            }
        }
        return comparison;
    }

    public static removeFromMatch(matchDto: MatchDto, elementId: String): MatchDto {
        let i;
        for(i = 0; i < matchDto.subMatches.length; i++) {
            let subMatch = matchDto.subMatches[i];
            if((subMatch.left != null) && (subMatch.left.id === elementId)) {
                console.log("Found submatch in ", matchDto);
                matchDto.subMatches = matchDto.subMatches.filter(obj => obj !== subMatch);
                console.log("REMOVED submatch in ", matchDto.subMatches);
                break;
            } else if((subMatch.right != null) && (subMatch.right.id === elementId)) {
                console.log("Found submatch in ", matchDto);
                matchDto.subMatches = matchDto.subMatches.filter(obj => obj !== subMatch);
                console.log("REMOVED submatch in ", matchDto.subMatches);
                break;
            } if((subMatch.origin != null) && (subMatch.origin.id === elementId)) {
                console.log("Found submatch in ", matchDto);
                matchDto.subMatches = matchDto.subMatches.filter(obj => obj !== subMatch);
                console.log("REMOVED submatch in ", matchDto.subMatches);
                break;
            }
            if(matchDto.subMatches[i].subMatches != null) {
                matchDto.subMatches[i] = MergeDiffMenuContribution.removeFromMatch(matchDto.subMatches[i], elementId);
                if (subMatch.subMatches.length !== matchDto.subMatches[i].subMatches.length) {
                    console.log("Found submatch in ", subMatch);
                    break;
                }
            }
        }
        return matchDto;
    }

    /*
     * refreshing widgets and tree after applying/ reverting changes
     */
    public static refreshComparison(comparison: ComparisonDto, splitPanelManager: SplitPanelManager) {
        let additions: DiffTreeNode[] = [];
        let deletions: DiffTreeNode[] = [];
        let changes: DiffTreeNode[] = [];
        const leftWidget: DiffMergeDiagWidget = splitPanelManager.getLeftWidget();
        const rightWidget: DiffMergeDiagWidget = splitPanelManager.getRightWidget();
        if (MergeDiffMenuContribution.secondFilePath === "") {
            leftWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                const diffAction = new ApplyDiffAction(comparison, leftWidget.id, "", "left", leftWidget.widgetId, rightWidget.widgetId, leftWidget.ms, rightWidget.ms);

                leftWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                    deletions = diffAction.deletionsTree as DiffTreeNode[];
                }).then(() => {
                    rightWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                        const diffAction = new ApplyDiffAction(comparison, rightWidget.id, "", "right", leftWidget.widgetId, rightWidget.widgetId, leftWidget.ms, rightWidget.ms);

                        rightWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                            changes = diffAction.changesTree as DiffTreeNode[];
                            additions = diffAction.additionsTree as DiffTreeNode[];
                        }).then(() => {
                            MergeDiffMenuContribution.diffTreeWidget.setChanges(additions, deletions, changes);
                        }).then(() => {
                            leftWidget.actionDispatcher.dispatch(new RequestModelAction({
                                sourceUri: decodeURI(leftWidget.uri.path.toString()),
                                needsClientLayout: 'true',
                                needsServerLayout: 'false'
                            }));
                            rightWidget.actionDispatcher.dispatch(new RequestModelAction({
                                sourceUri: decodeURI(rightWidget.uri.path.toString()),
                                needsClientLayout: 'true',
                                needsServerLayout: 'false'
                            }));
                        });
                    });
                });
            });
        } else {
            const leftWidget: DiffMergeDiagWidget = splitPanelManager.getLeftWidget();
            const rightWidget: DiffMergeDiagWidget = splitPanelManager.getRightWidget();
            const baseWidget: DiffMergeDiagWidget = splitPanelManager.getBaseWidget();
            rightWidget.actionDispatcher.dispatch(new RequestModelAction({
                sourceUri: decodeURI(rightWidget.uri.path.toString()),
                needsClientLayout: 'false',
                needsServerLayout: 'false'
            })).then(async (resolve: any) => {
                rightWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                await new Promise(f => setTimeout(f, 500));
                baseWidget.actionDispatcher.dispatch(new RequestModelAction({
                    sourceUri: decodeURI(baseWidget.uri.path.toString()),
                    needsClientLayout: 'false',
                    needsServerLayout: 'false'
                })).then((resolve: any) => {
                    rightWidget.glspActionDispatcher.onceModelInitialized().then( function () {
                     leftWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                        leftWidget.actionDispatcher.dispatch(new RequestModelAction({
                        sourceUri: decodeURI(leftWidget.uri.path.toString()),
                        needsClientLayout: 'false',
                        needsServerLayout: 'false'
                    })).then(async (resolve: any) => {
                        baseWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                         baseWidget.glspActionDispatcher.onceModelInitialized().then( () => {
                            const diffAction = new ApplyDiffAction(comparison, baseWidget.id, undefined, "base", leftWidget.widgetId, rightWidget.widgetId, leftWidget.ms, rightWidget.ms, baseWidget.widgetId);
                             baseWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                                changes = changes.concat(diffAction.changesTree as DiffTreeNode[]);
                                deletions = deletions.concat(diffAction.deletionsTree as DiffTreeNode[]);

                                leftWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                                    let diffAction = new ApplyDiffAction(comparison, leftWidget.id, undefined, "left", leftWidget.widgetId, rightWidget.widgetId, leftWidget.ms, rightWidget.ms, baseWidget.widgetId);
                                    leftWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                                        additions = additions.concat(diffAction.additionsTree as DiffTreeNode[]);
                                        changes = changes.concat(diffAction.changesTree as DiffTreeNode[]);

                                            diffAction = new ApplyDiffAction(comparison, rightWidget.id, undefined, "right", leftWidget.widgetId, rightWidget.widgetId, leftWidget.ms, rightWidget.ms, baseWidget.widgetId);
                                            rightWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                                                console.log("RIGHT", comparison);
                                                additions = additions.concat(diffAction.additionsTree as DiffTreeNode[]);
                                                changes = changes.concat(diffAction.changesTree as DiffTreeNode[]);
                                                //deletions = deletions.concat(diffAction.deletionsTree as DiffTreeNode[]);
                                                //TODO maybe migrate to backend
                                                changes = DiffMergeExtensionCommandContribution.handleConflicts(changes);
                                                console.log("FINAL DELETIONS", deletions);
                                                MergeDiffMenuContribution.diffTreeWidget.setChanges(additions, deletions, changes);
                                                leftWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                                                baseWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                                                rightWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                                            });
                                        });
                                    });
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
