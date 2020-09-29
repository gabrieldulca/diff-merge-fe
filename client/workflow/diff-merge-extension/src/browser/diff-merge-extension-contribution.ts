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
import { ApplyDiffAction } from "@eclipse-glsp-examples/workflow-sprotty";
import { WorkflowDiagramManager } from "@eclipse-glsp-examples/workflow-theia/lib/browser/diagram/workflow-diagram-manager";
import { WorkflowLanguage } from "@eclipse-glsp-examples/workflow-theia/lib/common/workflow-language";
import { SelectionService, UriSelection } from "@theia/core";
import {
    AbstractViewContribution,
    ApplicationShell,
    CompositeTreeNode,
    DiffUris,
    WidgetOpenerOptions
} from "@theia/core/lib/browser";
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
import { DiffViewService } from "./diff-tree/diff-view-service";
import { SplitPanelManager } from "./split-panel-manager";
import { UnusedWidget } from "./unused-widget";


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
        // @inject(FileNavigatorWidget) protected readonly fileNavigatorWidget: FileNavigatorWidget,
        // @inject(ResourceTreeEditorWidget) protected readonly resourceTreeEditorWidget: ResourceTreeEditorWidget,
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(DiffViewService) private readonly diffViewService: DiffViewService,
        @inject(ComparisonService) protected readonly comparisonService: ComparisonService,
        @inject(NavigatorDiff) protected readonly navigatorDiff: NavigatorDiff,
        @inject(SelectionService) protected readonly selectionService: SelectionService,
        @multiInject(DiagramManagerProvider) protected diagramManagerProviders: DiagramManagerProvider[]
    ) {
        super({
            widgetId: UnusedWidget.ID,
            widgetName: UnusedWidget.LABEL,
            defaultWidgetOptions: { area: 'left' },
            toggleCommandId: ComparisonExtensionCommand.id
        });
    }


    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(ComparisonExtensionCommand, {
            execute: async () => {
                if (this.baseComparisonFile && !this.firstComparisonFile) {
                    console.log("first file", this.baseComparisonFile.path.toString());
                    const firstComparisonFile = UriSelection.getUri(this.selectionService.selection);
                    console.log("second file", firstComparisonFile!.path.toString());
                    const comparison = await this.comparisonService.getComparisonResult(this.baseComparisonFile.path.toString(), firstComparisonFile!.path.toString());
                    console.log("comparison result", comparison);
                    this.messageService.info(JSON.stringify(comparison));

                    const _this = this;
                    const options: DiagramWidgetOptions = { uri: this.baseComparisonFile.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    const widget1 = await this.diffMergeDiagManager.createWidget(options);
                    const options2: DiagramWidgetOptions = { uri: firstComparisonFile!.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    const widgetOptions: WidgetOptions = { mode: 'split-right' };
                    const wop: WidgetOpenerOptions = { widgetOptions: widgetOptions };

                    const widget2 = await this.diffMergeDiagManager.createWidget(options2);
                    // widget2.actionDispatcher.dispatch(new ApplyDiffAction("comparison result"));

                    const diffUri: URI = DiffUris.encode(this.baseComparisonFile, firstComparisonFile!);
                    const title = "diff:[" + this.baseComparisonFile!.path.base + "," + firstComparisonFile!.path.base + "]";
                    const diffViewWidget = await this.diffViewService.createWidget();

                    await this.splitPanelManager.createSplitPanel(options2).then(function (splitPanel: DiffSplitPanel) {
                        // splitPanel.setNavigator(_this.fileNavigatorWidget);
                        splitPanel.initDiffPanel(widget1, widget2, diffUri);

                        _this.splitPanelManager.doCustomOpen(widget1, splitPanel, diffUri, wop, diffViewWidget, title);

                    });
                    delay(300).then(() => {
                        let additions: CompositeTreeNode[] = [];
                        let deletions: CompositeTreeNode[] = [];
                        widget1.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison);

                            widget1.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                console.log("additions for tree", diffAction.additionsTree);

                                additions = diffAction.additionsTree as CompositeTreeNode[];
                            });
                            widget1.glspActionDispatcher.dispatch(new CenterAction([]));

                        });
                        widget2.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison);

                            widget2.glspActionDispatcher.dispatch(diffAction);
                            delay(300).then(() => {
                                console.log("deltions for tree", diffAction.deletionsTree);
                                deletions = diffAction.deletionsTree as CompositeTreeNode[];
                            });
                            widget2.glspActionDispatcher.dispatch(new CenterAction([]));
                        });
                        delay(400).then(() => {
                            diffViewWidget.setChanges(additions, deletions);
                        });

                    });


                } else if (this.baseComparisonFile && this.firstComparisonFile) {
                    console.log("base file", this.baseComparisonFile.path.toString());
                    console.log("first file", this.firstComparisonFile.path.toString());
                    const secondComparisonFile = UriSelection.getUri(this.selectionService.selection);
                    console.log("second file", secondComparisonFile!.path.toString());
                    // tslint:disable-next-line: max-line-length
                    const comparison = await this.comparisonService.getThreeWayComparisonResult(this.baseComparisonFile.path.toString(), this.firstComparisonFile.path.toString(), secondComparisonFile!.path.toString());
                    console.log("3 way comparison result", comparison);
                    this.messageService.info(JSON.stringify(comparison));

                    const widgetOptions: WidgetOptions = { mode: 'split-right' };
                    const wop: WidgetOpenerOptions = { widgetOptions: widgetOptions };

                    // open first file
                    const options: DiagramWidgetOptions = { uri: this.firstComparisonFile.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    const firstWidget = await this.diffMergeDiagManager.createWidget(options);
                    // open base
                    const optionsBase: DiagramWidgetOptions = { uri: this.baseComparisonFile.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    const baseWidget = await this.diffMergeDiagManager.createWidget(optionsBase);

                    // open second file
                    const options2: DiagramWidgetOptions = { uri: secondComparisonFile!.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    const secondWidget = await this.diffMergeDiagManager.createWidget(options2);

                    const _this = this;
                    const diffUri: URI = DiffUris.encode(DiffUris.encode(this.firstComparisonFile, this.baseComparisonFile), secondComparisonFile!);
                    const title = "diff:[" + this.firstComparisonFile!.path.base + "," + this.baseComparisonFile.path.base + "," + secondComparisonFile!.path.base + "]";
                    const diffViewWidget = await this.diffViewService.createWidget();

                    await this.splitPanelManager.createSplitPanel(options2).then(function (splitPanel: DiffSplitPanel) {
                        splitPanel.initThreewayDiffPanel(firstWidget, baseWidget, secondWidget, diffUri);
                        // splitPanel.setNavigator(_this.fileNavigatorWidget);
                        _this.splitPanelManager.doCustomOpen(firstWidget, splitPanel, diffUri, wop, diffViewWidget, title);

                    });

                    delay(300).then(() => {
                        firstWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            const diffAction = new ApplyDiffAction(comparison);
                            firstWidget.glspActionDispatcher.dispatch(diffAction);
                            firstWidget.glspActionDispatcher.dispatch(new CenterAction([]));

                        });
                        baseWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            baseWidget.glspActionDispatcher.dispatch(new ApplyDiffAction(comparison));
                            baseWidget.glspActionDispatcher.dispatch(new CenterAction([]));
                        });
                        secondWidget.glspActionDispatcher.onceModelInitialized().then(function () {
                            secondWidget.glspActionDispatcher.dispatch(new ApplyDiffAction(comparison));
                            secondWidget.glspActionDispatcher.dispatch(new CenterAction([]));
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
            label: 'EMF Select for comparison'
        });
        menus.registerMenuAction(NavigatorContextMenu.COMPARE, {
            commandId: ComparisonSelectBaseExtensionCommand.id,
            label: 'EMF Select Base for comparison'
        });
    }

}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
