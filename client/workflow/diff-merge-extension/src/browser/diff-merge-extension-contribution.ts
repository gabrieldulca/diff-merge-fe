import { WorkflowDiagramManager } from "@eclipse-glsp-examples/workflow-theia/lib/browser/diagram/workflow-diagram-manager";
import { WorkflowLanguage } from "@eclipse-glsp-examples/workflow-theia/lib/common/workflow-language";
import { SelectionService, UriSelection } from "@theia/core";
import { AbstractViewContribution, ApplicationShell, WidgetOpenerOptions } from "@theia/core/lib/browser";
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
import { DiagramManagerProvider, DiagramWidget, DiagramWidgetOptions } from "sprotty-theia";

import { ComparisonService } from "../common";
import { DiffMergeDiagManager } from "./diff-merge-diag-manager";
import { DiffMergeFeWidget } from "./diff-merge-fe-widget";
import { SplitPanelManager } from "./split-panel-manager";
import { DiffPanel } from "./test-split-panel";

import WidgetOptions = ApplicationShell.WidgetOptions;

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
export class DiffMergeExtensionCommandContribution extends AbstractViewContribution<DiffMergeFeWidget> implements CommandContribution {

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
        @inject(ComparisonService) protected readonly comparisonService: ComparisonService,
        @inject(NavigatorDiff) protected readonly navigatorDiff: NavigatorDiff,
        @inject(SelectionService) protected readonly selectionService: SelectionService,
        @multiInject(DiagramManagerProvider) protected diagramManagerProviders: DiagramManagerProvider[]
    ) {
        super({
            widgetId: DiffMergeFeWidget.ID,
            widgetName: DiffMergeFeWidget.LABEL,
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

                    await this.splitPanelManager.createSplitPanel(options2).then(function (splitPanel: DiffPanel) {
                        splitPanel.initDiffPanel(widget1, widget2);
                        _this.splitPanelManager.doCustomOpen(widget1, splitPanel, wop);

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

                    const _this = this;

                    const widgetOptions: WidgetOptions = { mode: 'split-right' };
                    const wop: WidgetOpenerOptions = { widgetOptions: widgetOptions };

                    const options: DiagramWidgetOptions = { uri: this.firstComparisonFile.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    await this.workflowDiagramManager.createWidget(options).then(function (widget: DiagramWidget) { _this.workflowDiagramManager.doOpen(widget); });
                    const optionsBase: DiagramWidgetOptions = { uri: this.baseComparisonFile.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    await this.workflowDiagramManager.createWidget(optionsBase).then(function (widget: DiagramWidget) {
                        _this.workflowDiagramManager.doOpen(widget, wop);
                    });
                    const options2: DiagramWidgetOptions = { uri: secondComparisonFile!.path.toString(), diagramType: WorkflowLanguage.DiagramType, iconClass: "fa fa-project-diagram", label: WorkflowLanguage.Label + " Editor" };
                    await this.workflowDiagramManager.createWidget(options2).then(function (widget: DiagramWidget) {
                        _this.workflowDiagramManager.doOpen(widget, wop);
                        console.log("diagramConfigurationRegistry", widget.diContainer);
                        console.log("diagramConfigurationRegistry", widget.connector);
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
