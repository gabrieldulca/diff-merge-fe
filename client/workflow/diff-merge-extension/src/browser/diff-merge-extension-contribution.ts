/********************************************************************************
 * Copyright (c) 2020 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { ApplyDiffAction, EnableFileNameAction } from "@eclipse-glsp-examples/workflow-sprotty";
import { WorkflowDiagramManager } from "@eclipse-glsp-examples/workflow-theia/lib/browser/diagram/workflow-diagram-manager";
import { WorkflowLanguage } from "@eclipse-glsp-examples/workflow-theia/lib/common/workflow-language";
import { SelectionService, UriSelection } from "@theia/core";
import { AbstractViewContribution, ApplicationShell, DiffUris, WidgetOpenerOptions } from "@theia/core/lib/browser";
import {
    CommandContribution,
    CommandRegistry,
    MenuContribution,
    MenuModelRegistry,
    MessageService
} from "@theia/core/lib/common";
import URI from "@theia/core/lib/common/uri";
import { EditorManager } from "@theia/editor/lib/browser";
import { NavigatorContextMenu } from "@theia/navigator/lib/browser/navigator-contribution";
import { NavigatorDiff } from "@theia/navigator/lib/browser/navigator-diff";
import { DiffService } from "@theia/workspace/lib/browser/diff-service";
import { inject, injectable, multiInject } from "inversify";
import { CenterAction } from "sprotty";
import { DiagramManagerProvider, DiagramWidgetOptions } from "sprotty-theia";

import { ComparisonService } from "../common";
import { DiffMergeDiagManager } from "./diff-merge-diag-manager";
import { DiffSplitPanel } from "./diff-split-panel";
import { DiffTreeNode } from "./diff-tree/diff-tree-node";
import { DiffTreeService } from "./diff-tree/diff-tree-service";
import { SplitPanelManager } from "./split-panel-manager";


import WidgetOptions = ApplicationShell.WidgetOptions;
// import {ResourceTreeEditorWidget} from "theia-tree-editor";
export const ComparisonExtensionCommand = {
    id: 'Comparison.command',
    label: "Compares two diagrams"
};
export const ComparisonSelectExtensionCommand = {
    id: 'ComparisonSelect.command',
    label: "Selects first diagram for comparison"
};
export const ComparisonSelectBaseExtensionCommand = {
    id: 'ComparisonSelectBase.command',
    label: "Selects base diagram for comparison"
};
export const ComparisonMergeExtensionCommand = {
    id: 'ComparisonMerge.command',
    label: "Merges two diagrams"
};

@injectable()
export class DiffMergeExtensionCommandContribution extends AbstractViewContribution<DiffSplitPanel> implements CommandContribution {

    protected _baseComparisonFile: URI | undefined = undefined;
    protected get baseComparisonFile(): URI | undefined {
        return this._baseComparisonFile;
    }
    protected set baseComparisonFile(uri: URI | undefined) {
        this._baseComparisonFile = uri;
    }
    protected _firstComparisonFile: URI | undefined = undefined;
    protected get firstComparisonFile(): URI | undefined {
        return this._firstComparisonFile;
    }
    protected set firstComparisonFile(uri: URI | undefined) {
        this._firstComparisonFile = uri;
    }

    constructor(
        @inject(SplitPanelManager) protected readonly splitPanelManager: SplitPanelManager,
        @inject(WorkflowDiagramManager) protected readonly workflowDiagramManager: WorkflowDiagramManager,
        @inject(DiffMergeDiagManager) protected readonly diffMergeDiagManager: DiffMergeDiagManager,
        @inject(EditorManager) protected readonly editorManager: EditorManager,
        @inject(DiffService) protected readonly diffService: DiffService,
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(DiffTreeService) private readonly diffTreeService: DiffTreeService,
        @inject(ComparisonService) protected readonly comparisonService: ComparisonService,
        @inject(NavigatorDiff) protected readonly navigatorDiff: NavigatorDiff,
        @inject(SelectionService) protected readonly selectionService: SelectionService,
        @multiInject(DiagramManagerProvider) protected diagramManagerProviders: DiagramManagerProvider[]
    ) {
        super({
            widgetId: 'diff-merge-fe:widget',
            widgetName: 'DiffMergeFe Widget',
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: ComparisonExtensionCommand.id
        });
    }


    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ComparisonExtensionCommand, {
            execute: async () => {
                if (this.baseComparisonFile && !this.firstComparisonFile) {
                    const firstComparisonFile = UriSelection.getUri(this.selectionService.selection);
                    const comparison = await this.comparisonService.getComparisonResult(this.baseComparisonFile.path.toString(), firstComparisonFile!.path.toString());
                    console.log("comparison result", comparison);

                    const _this = this;
                    const leftWidgetOptions: DiagramWidgetOptions = { uri: this.baseComparisonFile.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    const leftWidget = await this.diffMergeDiagManager.createWidgetNoToolPalette(leftWidgetOptions);
                    const rightWidgetOptions: DiagramWidgetOptions = { uri: firstComparisonFile!.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    const widgetOptions: WidgetOptions = { mode: 'split-right' };
                    const wop: WidgetOpenerOptions = { widgetOptions: widgetOptions };

                    const rightWidget = await this.diffMergeDiagManager.createWidgetNoToolPalette(rightWidgetOptions);

                    // Naming diagram widgets
                    leftWidget.title.caption = "asd";
                    leftWidget.title.iconClass = 'fa navigator-tab-icon';
                    console.log("Left widget ", leftWidget);
                    console.log("Right widget ", rightWidget);
                    const diffUri: URI = DiffUris.encode(this.baseComparisonFile, firstComparisonFile!);
                    const title = "diff:[" + this.baseComparisonFile!.path.base + "," + firstComparisonFile!.path.base + "]";
                    const diffTreeWidget = await this.diffTreeService.createWidget();
                    diffTreeWidget.setDiagWidgets(comparison, leftWidget, rightWidget);
                    console.log("Tree widget", diffTreeWidget);
                    await this.splitPanelManager.createWidgetSplitPanel(rightWidgetOptions).then(function (widgetSplitPanel: DiffSplitPanel) {
                        widgetSplitPanel.initWidgetSplitPanel(leftWidget, rightWidget, diffUri);
                        console.log("Initialized split panel", widgetSplitPanel);
                        _this.splitPanelManager.doCustomOpen(leftWidget, widgetSplitPanel, diffUri, wop, diffTreeWidget, title).then(() => {
                            let additions: DiffTreeNode[] = [];
                            let deletions: DiffTreeNode[] = [];
                            let changes: DiffTreeNode[] = [];
                            console.log("Opened split panel");
                            leftWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                                let diffAction = new ApplyDiffAction(comparison, leftWidget.widgetId, "", "left", leftWidget.widgetId, rightWidget.widgetId, leftWidget.ms, rightWidget.ms);
                                console.log("Created diffAction for left side", rightWidget.widgetId);

                                leftWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                                    console.log("Applying diffAction on left side");
                                    deletions = diffAction.deletionsTree as DiffTreeNode[];
                                }).then(() => {
                                    rightWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                                        diffAction = new ApplyDiffAction(comparison, rightWidget.widgetId, "", "right", leftWidget.widgetId, rightWidget.widgetId, leftWidget.ms, rightWidget.ms);
                                        console.log("Created diffAction for right side");
                                        rightWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                                            console.log("Applying diffAction on right side");
                                            changes = diffAction.changesTree as DiffTreeNode[];
                                            additions = diffAction.additionsTree as DiffTreeNode[];
                                        }).then(() => {
                                            console.log("Setting tree changes");
                                            diffTreeWidget.setChanges(additions, deletions, changes);
                                            rightWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                                            rightWidget.glspActionDispatcher.dispatch(new EnableFileNameAction(firstComparisonFile!.path.base));
                                        });
                                    });
                                });
                                console.log("deletions", deletions);
                                leftWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                                leftWidget.glspActionDispatcher.dispatch(new EnableFileNameAction(_this.baseComparisonFile!.path.base, true));

                            });
                        });

                    });
                    console.log("Finished comparison");
                } else if (this.baseComparisonFile && this.firstComparisonFile) {
                    console.log("base file", this.baseComparisonFile.path.toString());
                    console.log("first file", this.firstComparisonFile.path.toString());
                    const secondComparisonFile = UriSelection.getUri(this.selectionService.selection);
                    console.log("second file", secondComparisonFile!.path.toString());
                    // tslint:disable-next-line: max-line-length
                    const comparison = await this.comparisonService.getThreeWayComparisonResult(this.baseComparisonFile.path.toString(), this.firstComparisonFile.path.toString(), secondComparisonFile!.path.toString());
                    console.log("3 way comparison result", comparison);
                    // this.messageService.info(JSON.stringify(comparison));

                    const widgetOptions: WidgetOptions = { mode: 'split-right' };
                    const wop: WidgetOpenerOptions = { widgetOptions: widgetOptions };

                    // open first file
                    const options: DiagramWidgetOptions = { uri: this.firstComparisonFile.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    const firstWidget = await this.diffMergeDiagManager.createWidgetNoToolPalette(options);
                    // open base
                    const optionsBase: DiagramWidgetOptions = { uri: this.baseComparisonFile.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    const baseWidget = await this.diffMergeDiagManager.createWidgetNoToolPalette(optionsBase);

                    // open second file
                    const options2: DiagramWidgetOptions = { uri: secondComparisonFile!.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    const secondWidget = await this.diffMergeDiagManager.createWidgetNoToolPalette(options2);

                    const _this = this;
                    const diffUri: URI = DiffUris.encode(DiffUris.encode(this.firstComparisonFile, this.baseComparisonFile), secondComparisonFile!);
                    const title = "diff:[" + this.firstComparisonFile!.path.base + "," + this.baseComparisonFile.path.base + "," + secondComparisonFile!.path.base + "]";
                    const diffTreeWidget = await this.diffTreeService.createWidget();
                    diffTreeWidget.setDiagWidgets(comparison, baseWidget, firstWidget, secondWidget);//TODO

                    await this.splitPanelManager.createWidgetSplitPanel(options2).then(function (widgetSplitPanel: DiffSplitPanel) {
                        widgetSplitPanel.initThreewayDiffPanel(firstWidget, baseWidget, secondWidget, diffUri);
                        _this.splitPanelManager.doCustomOpen(firstWidget, widgetSplitPanel, diffUri, wop, diffTreeWidget, title).then(() => {
                            let additions: DiffTreeNode[] = [];
                            let deletions: DiffTreeNode[] = [];
                            let changes: DiffTreeNode[] = [];
                            baseWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                                const diffAction = new ApplyDiffAction(comparison, baseWidget.id, undefined, "base", firstWidget.widgetId, secondWidget.widgetId, firstWidget.ms, secondWidget.ms, baseWidget.id);
                                baseWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                                    changes = changes.concat(diffAction.changesTree as DiffTreeNode[]);
                                    deletions = diffAction.deletionsTree as DiffTreeNode[];
                                }).then(() => {
                                    firstWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                                        const diffAction = new ApplyDiffAction(comparison, firstWidget.id, undefined, "left", firstWidget.widgetId, secondWidget.widgetId, firstWidget.ms, secondWidget.ms, baseWidget.id);
                                        firstWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                                            additions = additions.concat(diffAction.additionsTree as DiffTreeNode[]);
                                            changes = changes.concat(diffAction.changesTree as DiffTreeNode[]);
                                        }).then(() => {
                                            secondWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                                                const diffAction = new ApplyDiffAction(comparison, secondWidget.id, undefined, "right", firstWidget.widgetId, secondWidget.widgetId, firstWidget.ms, secondWidget.ms, baseWidget.id);
                                                secondWidget.glspActionDispatcher.dispatch(diffAction).then(() => {
                                                    additions = additions.concat(diffAction.additionsTree as DiffTreeNode[]);
                                                    changes = changes.concat(diffAction.changesTree as DiffTreeNode[]);
                                                }).then(function () {
                                                    console.log("CHANGESTree!!!", changes);
                                                    //TODO maybe migrate to backend
                                                    changes = DiffMergeExtensionCommandContribution.handleConflicts(changes);
                                                    console.log("CHANGESTree 2 !!!", changes);
                                                    diffTreeWidget.setChanges(additions, deletions, changes);
                                                });
                                                secondWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                                                secondWidget.glspActionDispatcher.dispatch(new EnableFileNameAction(secondComparisonFile!.path.base));
                                            });
                                        });
                                        baseWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                                        baseWidget.glspActionDispatcher.dispatch(new EnableFileNameAction(_this.baseComparisonFile!.path.base, true));
                                    });
                                });
                                firstWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                                firstWidget.glspActionDispatcher.dispatch(new EnableFileNameAction(_this.firstComparisonFile!.path.base));

                            });
                        });
                    });

                } else {
                    this.messageService.info("Please select the base file for comparison");
                }
            }
        });

        registry.registerCommand(ComparisonSelectExtensionCommand, {
            execute: async () => {
                this.firstComparisonFile = UriSelection.getUri(this.selectionService.selection);
                console.log("file1", this.firstComparisonFile);
                this.messageService.info("Selected first file");

            }
        });

        registry.registerCommand(ComparisonSelectBaseExtensionCommand, {
            execute: async () => {
                this.baseComparisonFile = UriSelection.getUri(this.selectionService.selection);
                this.firstComparisonFile = undefined;
                console.log("base", this.baseComparisonFile);
                this.messageService.info("Selected base file");

            }
        });
        registry.registerCommand(ComparisonMergeExtensionCommand, {
            execute: async () => {
                if (this.baseComparisonFile && !this.firstComparisonFile) {
                    console.log("first merge file", this.baseComparisonFile.path.toString());
                    const firstComparisonFile = UriSelection.getUri(this.selectionService.selection);
                    console.log("second merge file", firstComparisonFile!.path.toString());
                    const merge = await this.comparisonService.getMergeResult(this.baseComparisonFile.path.toString(), firstComparisonFile!.path.toString());
                    console.log("merge result", merge);
                } else if (this.baseComparisonFile && this.firstComparisonFile) {
                    console.log("base merge file", this.baseComparisonFile.path.toString());
                    console.log("first merge file", this.firstComparisonFile.path.toString());
                    const secondComparisonFile = UriSelection.getUri(this.selectionService.selection);
                    console.log("second merge file", secondComparisonFile!.path.toString());
                    const merge = await this.comparisonService.getThreeWayMergeResult(this.baseComparisonFile.path.toString(), this.firstComparisonFile!.path.toString(), secondComparisonFile!.path.toString());
                    console.log("merge result", merge);
                }

            }
        });
    }

    public static handleConflicts(changes: DiffTreeNode[]) {
        changes.sort((n1, n2) => {
            if (n1.id > n2.id) { return 1; }
            if (n1.id < n2.id) { return -1; }
            return 0;
        });
        const updatedChanges: DiffTreeNode[] = [];
        changes.forEach(change => {
            const elemsWithId: DiffTreeNode[] = changes.filter(x => (x.id.split("_")[0] === change.id.split("_")[0]) && (!x.id.toUpperCase().endsWith("BASE")));
            if (elemsWithId.length > 1) {
                if (change.id.toUpperCase().endsWith("BASE")) {
                    //let i = 1;
                    //elemsWithId.forEach(e => {e.id = e.id + "chld"+i; i++;});
                    console.log("CHANGE", change);
                    const node: DiffTreeNode = {
                        id: change.id,
                        modelElementId: change.modelElementId,
                        diffSource: change.diffSource,
                        name: change.name,
                        visible: change.visible,
                        selected: change.selected,
                        changeType: change.changeType,
                        elementType: "Conflict",
                        source: change.source,
                        target: change.target,
                        children: elemsWithId,
                        parent: change.parent,
                        expanded: true
                    };
                    updatedChanges.push(node);
                }
            } else {
                if (!change.id.toUpperCase().endsWith("BASE")) {
                    updatedChanges.push(change);
                }
            }
        });
        return updatedChanges;
    }
}

@injectable()
export class DiffMergeExtensionMenuContribution implements MenuContribution {

    registerMenus(menus: MenuModelRegistry): void {
        menus.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: ComparisonExtensionCommand.id,
            label: 'EMF Compare with selected'
        });
        menus.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: ComparisonSelectExtensionCommand.id,
            label: 'EMF Select for comparison/merge'
        });
        menus.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: ComparisonSelectBaseExtensionCommand.id,
            label: 'EMF Select Base for comparison/merge'
        });
        menus.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: ComparisonMergeExtensionCommand.id,
            label: 'EMF Merge with selected'
        });
    }

}
